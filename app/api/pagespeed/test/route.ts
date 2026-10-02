export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { pageSpeedService } from '@/lib/services/pagespeed-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey } = body;

    const result = await pageSpeedService.testConnection(apiKey);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Erro na rota de teste do PageSpeed (/api/pagespeed/test):', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Erro interno ao testar conexão com o Google PageSpeed.',
        status: 500,
      },
      { status: 500 }
    );
  }
}
