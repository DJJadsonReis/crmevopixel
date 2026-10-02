export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/supabase/db-service';
import { normalizeWhatsAppNumber, sanitizeOutboundCustomerMessage } from '@/lib/utils/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      phone,
      text: rawText,
      leadId,
      conversationId: incomingConvId,
      idempotencyKey,
      mediaUrl,
      mediaType,
      customUrl,
      customApiKey,
      customInstance,
    } = body;

    if (!phone || !rawText) {
      return NextResponse.json(
        { success: false, message: 'Telefone e texto da mensagem são obrigatórios.' },
        { status: 400 }
      );
    }

    // Normaliza número de telefone (garante DDI 55, elimina duplicações 5555)
    const cleanPhone = normalizeWhatsAppNumber(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Número de WhatsApp inválido fornecido.' },
        { status: 400 }
      );
    }

    // Sanitiza contra termos proibidos para cliente externo
    const text = sanitizeOutboundCustomerMessage(rawText);

    const evolutionUrl = (customUrl || process.env.NEXT_PUBLIC_EVOLUTION_URL || 'https://api-evolution-api.1h7ium.easypanel.host').replace(/\/+$/, '');
    const evolutionApiKey = (customApiKey || process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11').trim();
    const evolutionInstance = (customInstance || process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'rafaelgomescosta_653ded30').trim();

    // Envio via Evolution API
    let sentReal = false;
    let evolutionResponse: any = null;
    let providerError: string | null = null;

    if (evolutionUrl && evolutionInstance) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const targetEndpoint = mediaUrl
          ? `${evolutionUrl}/message/sendMedia/${evolutionInstance}`
          : `${evolutionUrl}/message/sendText/${evolutionInstance}`;

        const payload = mediaUrl
          ? {
              number: cleanPhone,
              mediaMessage: {
                mediatype: mediaType || 'image',
                caption: text,
                media: mediaUrl,
              },
            }
          : {
              number: cleanPhone,
              text: text,
              textMessage: {
                text: text,
              },
            };

        const evoRes = await fetch(targetEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(evolutionApiKey ? { apikey: evolutionApiKey } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (evoRes.ok) {
          sentReal = true;
          evolutionResponse = await evoRes.json().catch(() => ({}));
        } else {
          const errText = await evoRes.text().catch(() => '');
          providerError = `Evolution API HTTP ${evoRes.status}: ${errText}`;
          console.warn(providerError);
        }
      } catch (evoErr: any) {
        providerError = evoErr?.message || 'Erro de rede ao conectar na Evolution API';
        console.warn('Erro ao conectar na Evolution API:', providerError);
      }
    }

    const messageId = evolutionResponse?.key?.id || `msg-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const finalIdempotencyKey = idempotencyKey || `send_${cleanPhone}_${Date.now()}`;

    // Persistência em Banco Supabase
    let activeConversationId = incomingConvId;

    try {
      if (!activeConversationId) {
        const existingConv = leadId
          ? await dbService.getConversationByLeadId(leadId)
          : await dbService.getConversationByPhone(cleanPhone);

        if (existingConv) {
          activeConversationId = existingConv.id;
        } else {
          const createdConv = await dbService.saveConversation({
            lead_id: leadId,
            external_id: cleanPhone,
            channel: 'whatsapp',
            conversation_mode: 'AI',
            archived: false,
            status: 'aberta',
            last_message_at: timestamp,
            last_message_text: text,
            last_message_direction: 'enviada',
          });
          if (createdConv) {
            activeConversationId = createdConv.id;
          }
        }
      }

      await dbService.saveMessage({
        id: messageId,
        lead_id: leadId,
        conversation_id: activeConversationId,
        channel: 'whatsapp',
        sent_text: text,
        direction: 'enviada',
        sent_at: timestamp,
        source: 'manual',
        status: sentReal ? 'entregue' : (providerError ? 'falhou' : 'pendente'),
        idempotency_key: finalIdempotencyKey,
        provider_message_id: messageId,
        media_url: mediaUrl,
        media_type: mediaType,
        error_message: providerError || undefined,
      });
    } catch (dbErr) {
      console.warn('Não foi possível persistir mensagem no Supabase:', dbErr);
    }

    return NextResponse.json({
      success: sentReal || !providerError,
      messageId,
      timestamp,
      phone: cleanPhone,
      text,
      conversationId: activeConversationId,
      sentViaEvolutionApi: sentReal,
      error: providerError,
      info: sentReal
        ? 'Mensagem transmitida diretamente via Evolution API'
        : (providerError ? `Falha no envio: ${providerError}` : 'Mensagem registrada no fluxo do CRM'),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Falha interna ao processar envio.' },
      { status: 500 }
    );
  }
}
