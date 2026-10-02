export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/supabase/db-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phone, leadId, customUrl, customApiKey, customInstance } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Telefone do lead é obrigatório para sincronizar.' },
        { status: 400 }
      );
    }

    const evolutionUrl = (
      customUrl ||
      process.env.NEXT_PUBLIC_EVOLUTION_URL ||
      'https://api-evolution-api.1h7ium.easypanel.host'
    ).replace(/\/+$/, '');

    const evolutionApiKey = (
      customApiKey ||
      process.env.NEXT_PUBLIC_EVOLUTION_API_KEY ||
      '429683C4C977415CAAFCCE10F7D57E11'
    ).trim();

    const evolutionInstance = (
      customInstance ||
      process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE ||
      'rafaelgomescosta_653ded30'
    ).trim();

    // Limpa telefone
    let cleanPhone = phone.toString().replace(/\D/g, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }

    // Variantes possíveis para o número brasileiro (com ou sem o nono dígito)
    const phoneVariants: string[] = [cleanPhone];
    if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
      // Ex: 5547999999999 -> 554799999999
      const without9 = cleanPhone.slice(0, 4) + cleanPhone.slice(5);
      phoneVariants.push(without9);
    } else if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
      // Ex: 55479999999 -> 554799999999
      const with9 = cleanPhone.slice(0, 4) + '9' + cleanPhone.slice(4);
      phoneVariants.push(with9);
    }

    const allRecords: any[] = [];
    const seenIds = new Set<string>();

    const fetchForVariant = async (targetPhone: string) => {
      const endpoints = [
        // 1. Query by remoteJid
        {
          url: `${evolutionUrl}/chat/findMessages/${evolutionInstance}`,
          body: {
            where: {
              key: {
                remoteJid: `${targetPhone}@s.whatsapp.net`,
              },
            },
            limit: 50,
          },
        },
        // 2. Query by remoteJidAlt (LID mode)
        {
          url: `${evolutionUrl}/chat/findMessages/${evolutionInstance}`,
          body: {
            where: {
              key: {
                remoteJidAlt: `${targetPhone}@s.whatsapp.net`,
              },
            },
            limit: 50,
          },
        },
      ];

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep.url, {
            method: 'POST',
            headers: {
              apikey: evolutionApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(ep.body),
          });

          if (res.ok) {
            const data = await res.json();
            const recs = data.messages?.records || (Array.isArray(data) ? data : []);
            for (const r of recs) {
              const msgId = r.key?.id || r.id;
              if (msgId && !seenIds.has(msgId)) {
                seenIds.add(msgId);
                allRecords.push(r);
              }
            }
          }
        } catch {
          // ignore individual timeout
        }
      }
    };

    // Executa buscas em paralelo para todas as variantes
    await Promise.all(phoneVariants.map((p) => fetchForVariant(p)));

    // Converte os registros brutos da Evolution API para o formato MessageLog do CRM EVO
    const formattedMessages = allRecords.map((r) => {
      const key = r.key || {};
      const fromMe = Boolean(key.fromMe);
      const msg = r.message || {};

      let text =
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.fileName ||
        '';

      if (!text) {
        if (msg.audioMessage) {
          text = `🎙️ Mensagem de áudio (${msg.audioMessage.seconds || ''}s)`;
        } else if (msg.imageMessage) {
          text = '📷 [Imagem]';
        } else if (msg.documentMessage) {
          text = `📄 [Documento] ${msg.documentMessage.fileName || 'Arquivo'}`;
        } else if (msg.stickerMessage) {
          text = '✨ [Figurinha / Sticker]';
        } else if (msg.contactMessage) {
          text = `👤 [Contato] ${msg.contactMessage.displayName || ''}`;
        } else {
          text = r.messageType ? `[Mensagem: ${r.messageType}]` : '[Mensagem WhatsApp]';
        }
      }

      let timestamp = new Date().toISOString();
      if (r.messageTimestamp) {
        const tsNum = typeof r.messageTimestamp === 'number' ? r.messageTimestamp : Number(r.messageTimestamp);
        timestamp = new Date(tsNum > 10000000000 ? tsNum : tsNum * 1000).toISOString();
      }

      return {
        id: key.id || r.id || `evo-${Date.now()}-${Math.random()}`,
        lead_id: leadId || cleanPhone,
        phone: cleanPhone,
        sender_name: fromMe ? 'Você (EVO PIXEL)' : r.pushName || 'Cliente',
        step_name: fromMe ? 'Mensagem Enviada' : 'Mensagem Recebida',
        channel: 'WhatsApp (Evolution API)',
        sent_text: text,
        direction: fromMe ? 'enviada' : 'recebida',
        sent_at: timestamp,
        source: 'manual',
        status: fromMe ? (r.status === 'READ' ? 'lida' : 'entregue') : 'entregue',
      };
    });

    // Ordena do mais antigo para o mais recente (ordem cronológica)
    formattedMessages.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());

    // Persistência automática no Supabase para garantir histórico eterno
    try {
      const dbMessages = (await dbService.getMessages(undefined, leadId)) || [];
      const dbIds = new Set(dbMessages.map((m) => m.id || m.provider_message_id));

      let conv = leadId ? await dbService.getConversationByLeadId(leadId) : null;
      if (!conv) {
        conv = await dbService.getConversationByPhone(cleanPhone);
      }

      if (!conv && leadId) {
        conv = await dbService.saveConversation({
          lead_id: leadId,
          external_id: cleanPhone,
          channel: 'whatsapp',
          conversation_mode: 'AI',
          archived: false,
          status: 'aberta',
        });
      }

      for (const m of formattedMessages) {
        if (!dbIds.has(m.id)) {
          await dbService.saveMessage({
            id: m.id,
            lead_id: leadId,
            conversation_id: conv?.id,
            channel: 'whatsapp',
            sent_text: m.sent_text,
            direction: (m.direction === 'recebida' ? 'recebida' : 'enviada') as 'enviada' | 'recebida',
            sent_at: m.sent_at,
            source: (m.source === 'automatica_n8n' ? 'automatica_n8n' : 'manual') as 'automatica_n8n' | 'manual',
            status: (m.status || 'entregue') as 'entregue' | 'lida' | 'falhou' | 'pendente',
            idempotency_key: `sync_${m.id}`,
            provider_message_id: m.id,
          });
        }
      }
    } catch (saveErr) {
      console.warn('Erro ao salvar mensagens sincronizadas no Supabase:', saveErr);
    }

    return NextResponse.json({
      success: true,
      count: formattedMessages.length,
      messages: formattedMessages,
      instance: evolutionInstance,
      phoneQueried: cleanPhone,
    });
  } catch (err: any) {
    console.error('Erro na sincronização Evolution API:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Erro ao sincronizar mensagens' },
      { status: 500 }
    );
  }
}
