export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isConfigured = Boolean(url && anonKey && !url.includes('placeholder') && !url.includes('seu-projeto'));

  let connected = false;
  let connectionMessage = '';

  if (isConfigured) {
    try {
      // Teste de ping na API REST do Supabase
      const testRes = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        signal: AbortSignal.timeout(4000),
      });

      if (testRes.ok || testRes.status === 200 || testRes.status === 404) {
        connected = true;
        connectionMessage = 'Conexão ativa com o Supabase';
      } else {
        connectionMessage = `Supabase retornou status HTTP ${testRes.status}`;
      }
    } catch (err: any) {
      connectionMessage = `Falha ao alcançar o servidor do Supabase: ${err?.message || 'Timeout'}`;
    }
  } else {
    connectionMessage = 'Supabase não configurado';
  }

  return NextResponse.json({
    isConfigured,
    connected,
    url: isConfigured ? url : '',
    hasAnonKey: Boolean(anonKey),
    message: connectionMessage,
  });
}

export async function POST(request: Request) {
  return NextResponse.json(
    { success: false, error: 'A gravação de configurações via interface está desativada em produção. Configure via variáveis de ambiente.' },
    { status: 403 }
  );
}
