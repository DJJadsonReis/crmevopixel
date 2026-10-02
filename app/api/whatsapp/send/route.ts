export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      phone,
      text,
      leadId,
      mediaUrl,
      mediaType,
      customUrl,
      customApiKey,
      customInstance,
    } = body;

    if (!phone || !text) {
      return NextResponse.json(
        { success: false, message: 'Telefone e texto da mensagem são obrigatórios.' },
        { status: 400 }
      );
    }

    // Limpa o número de telefone (apenas dígitos, garantindo DDI 55)
    let cleanPhone = phone.toString().replace(/\D/g, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }

    const evolutionUrl = (customUrl || process.env.NEXT_PUBLIC_EVOLUTION_URL || 'https://api-evolution-api.1h7ium.easypanel.host').replace(/\/+$/, '');
    const evolutionApiKey = (customApiKey || process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11').trim();
    const evolutionInstance = (customInstance || process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'rafaelgomescosta_653ded30').trim();

    // Se temos URL e instância, tenta enviar via Evolution API real
    let sentReal = false;
    let evolutionResponse: any = null;

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
          console.warn(`Evolution API HTTP ${evoRes.status}:`, errText);
        }
      } catch (evoErr: any) {
        console.warn('Erro ao conectar na Evolution API:', evoErr?.message);
      }
    }

    const messageId = evolutionResponse?.key?.id || `msg-${Date.now()}`;
    const timestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      messageId,
      timestamp,
      phone: cleanPhone,
      text,
      sentViaEvolutionApi: sentReal,
      info: sentReal
        ? 'Mensagem transmitida diretamente via Evolution API'
        : 'Mensagem registrada no fluxo do CRM (modo offline / simulação ativa)',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Falha interna ao processar envio.' },
      { status: 500 }
    );
  }
}
