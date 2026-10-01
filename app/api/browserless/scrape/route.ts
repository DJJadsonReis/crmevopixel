export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.token || '').trim();
    let endpoint = (body.endpoint || 'https://production-sfo.browserless.io').trim();
    const query = (body.query || '').trim();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token do Browserless não fornecido.' },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { success: false, message: 'Query de busca não fornecida.' },
        { status: 400 }
      );
    }

    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = `https://${endpoint}`;
    }
    const cleanEndpoint = endpoint.replace(/\/+$/, '');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(`${cleanEndpoint}/content?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: searchUrl }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `Browserless HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const html = await res.text();
    const titleRegex = /class="result__title"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/g;
    const snippetRegex = /class="result__snippet"[^>]*>([^<]+)/g;
    const urlRegex = /class="result__url"[^>]*>([^<]+)/g;

    const titles = Array.from(html.matchAll(titleRegex)).map((m) => m[1].trim());
    const snippets = Array.from(html.matchAll(snippetRegex)).map((m) => m[1].trim());
    const urls = Array.from(html.matchAll(urlRegex)).map((m) => m[1].trim());

    const results = titles.map((title, i) => ({
      title,
      snippet: snippets[i] || '',
      url: urls[i] ? `https://${urls[i].replace(/^https?:\/\//, '')}` : '',
    }));

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Falha na raspagem com Browserless.' },
      { status: 500 }
    );
  }
}
