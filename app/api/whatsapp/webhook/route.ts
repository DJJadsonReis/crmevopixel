export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/supabase/db-service';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'CRMEvo WhatsApp Webhook (Evolution API)',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const event = body.event || body.type;

    // Se for evento de conexão ou ping, responde 200 imediatamente
    if (event === 'connection.update' || event === 'qrcode.updated') {
      return NextResponse.json({ success: true, event, received: true });
    }

    // Processa eventos de mensagem (Evolution API envia messages.upsert)
    const data = body.data || body;
    const key = data.key || (Array.isArray(data) && data[0]?.key);

    if (!key) {
      return NextResponse.json({ success: true, message: 'Evento ignorado (sem chave de mensagem)' });
    }

    // Se a mensagem foi enviada pelo próprio número do CRM (fromMe: true), não reprocessa como resposta do lead
    if (key.fromMe) {
      return NextResponse.json({ success: true, message: 'Mensagem enviada pelo operador ignorada no webhook' });
    }

    const remoteJid = key.remoteJid || '';
    if (!remoteJid || remoteJid.includes('@g.us')) {
      // Ignora mensagens de grupos de WhatsApp
      return NextResponse.json({ success: true, message: 'Mensagem de grupo ignorada' });
    }

    // Extrai número limpo do JID
    const rawNumber = remoteJid.replace(/@.*$/, '').replace(/:\d+$/, '').replace(/\D/g, '');
    let cleanPhone = rawNumber;
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }

    const messageObj = data.message || (Array.isArray(data) && data[0]?.message) || {};
    const text =
      messageObj.conversation ||
      messageObj.extendedTextMessage?.text ||
      messageObj.imageMessage?.caption ||
      messageObj.videoMessage?.caption ||
      messageObj.documentMessage?.caption ||
      messageObj.buttonsResponseMessage?.selectedDisplayText ||
      messageObj.templateButtonReplyMessage?.selectedId ||
      messageObj.listResponseMessage?.title ||
      '';

    if (!text.trim()) {
      return NextResponse.json({ success: true, message: 'Mensagem sem conteúdo textual processável' });
    }

    const providerMessageId = key.id || `wh_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 1. Localiza o Lead no banco de dados pelo telefone
    const leads = (await dbService.getLeads()) || [];
    const lead = leads.find((l) => {
      const p = (l.whatsapp || l.phone || '').replace(/\D/g, '');
      if (!p) return false;
      return (
        cleanPhone === p ||
        cleanPhone.endsWith(p) ||
        p.endsWith(cleanPhone) ||
        cleanPhone.slice(-8) === p.slice(-8)
      );
    });

    const leadId = lead?.id;

    // 2. Busca ou cria a Conversa no Supabase
    let conversation = leadId
      ? await dbService.getConversationByLeadId(leadId)
      : await dbService.getConversationByPhone(cleanPhone);

    if (!conversation) {
      conversation = await dbService.saveConversation({
        lead_id: leadId,
        external_id: cleanPhone,
        channel: 'whatsapp',
        conversation_mode: lead?.conversation_mode || 'AI',
        archived: false,
        status: 'aberta',
        last_message_at: timestamp,
        last_message_text: text,
        last_message_direction: 'recebida',
        unread_count: 1,
      });
    } else {
      // Reativa / Desarqvuiva conversa e incrementa contador de não lidas
      await dbService.saveConversation({
        id: conversation.id,
        lead_id: leadId || conversation.lead_id,
        external_id: cleanPhone,
        archived: false,
        unread_count: (conversation.unread_count || 0) + 1,
        last_message_at: timestamp,
        last_message_text: text,
        last_message_direction: 'recebida',
      });
    }

    const conversationId = conversation?.id;

    // 3. Persiste a mensagem recebida no Supabase com chave de idempotência
    await dbService.saveMessage({
      id: providerMessageId,
      lead_id: leadId,
      conversation_id: conversationId,
      channel: 'whatsapp',
      sent_text: text,
      direction: 'recebida',
      sent_at: timestamp,
      source: 'automatica_n8n',
      status: 'entregue',
      idempotency_key: `in_${providerMessageId}`,
      provider_message_id: providerMessageId,
    });

    // 4. Se o lead respondeu, cancela envios automáticos e sequências de prospecção pendentes
    if (leadId && lead) {
      const currentProgress = lead.sequence_progress;
      if (currentProgress && currentProgress.status !== 'respondido') {
        const updatedProgress = {
          ...currentProgress,
          status: 'respondido' as const,
          responded_at: timestamp,
        };
        await dbService.updateLead(leadId, {
          sequence_progress: updatedProgress,
          status: 'em_conversa',
          last_contact_at: timestamp,
          conversation_archived: false,
          unread_messages_count: (lead.unread_messages_count || 0) + 1,
        });
      } else {
        await dbService.updateLead(leadId, {
          status: 'em_conversa',
          last_contact_at: timestamp,
          conversation_archived: false,
          unread_messages_count: (lead.unread_messages_count || 0) + 1,
        });
      }
    }

    // 5. Avaliação do modo da conversa (AI vs HUMAN)
    const effectiveMode = conversation?.conversation_mode || lead?.conversation_mode || 'AI';

    if (effectiveMode === 'HUMAN') {
      // OPERADOR HUMANO ASSUMIU: A IA NÃO DEVE RESPONDER AUTOMATICAMENTE
      return NextResponse.json({
        success: true,
        message: 'Mensagem recebida e registrada. Atendimento sob controle HUMANO (IA silenciada).',
        conversationId,
        leadId,
      });
    }

    if (effectiveMode === 'PAUSED') {
      return NextResponse.json({
        success: true,
        message: 'Mensagem recebida. Conversa em modo PAUSADO.',
        conversationId,
        leadId,
      });
    }

    // 6. Modo 'AI': Geração e Envio de Resposta Autônoma
    try {
      // Obtém o System Prompt configurado
      const prompts = (await dbService.getAiPrompts()) || [];
      const activePrompt = prompts.find((p) => p.is_default) || prompts[0];

      // Busca resposta pré-calculada ou gera resposta inteligente
      const contactFirstName = (lead?.name || '').split(' ')[0] || 'Tudo bem?';
      const company = lead?.company_name || 'sua empresa';
      const lowerText = text.toLowerCase();

      let autoReplyText = '';

      if (lowerText.includes('preço') || lowerText.includes('quanto') || lowerText.includes('valor')) {
        autoReplyText = `Olá ${contactFirstName}! O investimento varia conforme o escopo que a *${company}* precisa, mas temos formatos acessíveis com retorno rápido. Posso te ligar 3 minutinhos para te apresentar os planos?`;
      } else if (lowerText.includes('como funciona') || lowerText.includes('o que é') || lowerText.includes('detalhe')) {
        autoReplyText = `Funciona de forma direta, ${contactFirstName}: reestruturamos a presença digital da *${company}*, aumentamos a atração no Google e ativamos atendimento automatizado. Qual melhor dia para uma demonstração rápida de 5 minutos?`;
      } else if (lowerText.includes('sim') || lowerText.includes('tenho interesse') || lowerText.includes('pode')) {
        autoReplyText = `Excelente, ${contactFirstName}! Qual o melhor horário para conversarmos hoje: no início da tarde ou no fim do dia?`;
      } else {
        autoReplyText = `Obrigado pelo retorno, ${contactFirstName}! Fico à disposição da *${company}*. Gostaria de agendar uma breve apresentação para ver na prática?`;
      }

      // Dispara envio automático usando o endpoint de envio
      const evolutionUrl = (process.env.NEXT_PUBLIC_EVOLUTION_URL || 'https://api-evolution-api.1h7ium.easypanel.host').replace(/\/+$/, '');
      const evolutionApiKey = (process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11').trim();
      const evolutionInstance = (process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'rafaelgomescosta_653ded30').trim();

      if (evolutionUrl && evolutionInstance && autoReplyText) {
        // Envio direto via Evolution API
        const sendEndpoint = `${evolutionUrl}/message/sendText/${evolutionInstance}`;
        const autoSendRes = await fetch(sendEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(evolutionApiKey ? { apikey: evolutionApiKey } : {}),
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: autoReplyText,
            textMessage: { text: autoReplyText },
          }),
        });

        if (autoSendRes.ok) {
          const sentJson = await autoSendRes.json().catch(() => ({}));
          const outId = sentJson?.key?.id || `ai_${Date.now()}`;
          const outTime = new Date().toISOString();

          await dbService.saveMessage({
            id: outId,
            lead_id: leadId,
            conversation_id: conversationId,
            channel: 'whatsapp',
            sent_text: autoReplyText,
            direction: 'enviada',
            sent_at: outTime,
            source: 'automatica_n8n',
            status: 'entregue',
            idempotency_key: `out_ai_${outId}`,
            provider_message_id: outId,
          });
        }
      }
    } catch (aiErr) {
      console.warn('Erro ao disparar resposta automática da IA:', aiErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem processada e salva com sucesso.',
      conversationId,
      leadId,
    });
  } catch (err: any) {
    console.error('Webhook exception:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Falha ao processar webhook' },
      { status: 500 }
    );
  }
}
