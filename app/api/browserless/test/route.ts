export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.token || '').trim();
    let endpoint = (body.endpoint || 'https://production-sfo.browserless.io').trim();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token do Browserless não fornecido.' },
        { status: 400 }
      );
    }

    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = `https://${endpoint}`;
    }
    const cleanEndpoint = endpoint.replace(/\/+$/, '');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const testUrl = `${cleanEndpoint}/content?token=${encodeURIComponent(token)}`;
    const res = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com' }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (res.ok) {
      return NextResponse.json({
        success: true,
        message: 'Browserless Conectado e Operacional! Headless Chrome ativo.',
      });
    }

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { success: false, message: 'Token inválido ou não autorizado no Browserless (401).' },
        { status: 401 }
      );
    }

    if (res.status === 429) {
      return NextResponse.json(
        { success: false, message: 'Limite de concorrência ou requisições atingido no Browserless (429).' },
        { status: 429 }
      );
    }

    const errText = await res.text().catch(() => '');
    return NextResponse.json(
      {
        success: false,
        message: `Browserless retornou status ${res.status}: ${errText.slice(0, 100) || 'Falha na resposta'}`,
      },
      { status: res.status }
    );
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return NextResponse.json(
      {
        success: false,
        message: isTimeout
          ? 'Tempo limite de resposta excedido (12s). Verifique o endpoint do Browserless.'
          : `Erro de conexão com o servidor do Browserless: ${err?.message || 'Falha de rede'}`,
      },
      { status: 500 }
    );
  }
}
