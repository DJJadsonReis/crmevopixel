export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.token || '').trim();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token da Apify não informado.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(token)}`, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const username = data?.data?.username || 'Usuário Apify';
      return NextResponse.json({
        success: true,
        message: `Conexão estabelecida com sucesso! Usuário: ${username}`,
        username,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `Falha na autenticação (HTTP ${res.status}): Token inválido ou sem permissão.`,
      },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao conectar à API da Apify: ${err?.message || 'Falha de comunicação'}`,
      },
      { status: 500 }
    );
  }
}
