export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { executeCrossReferencePipeline } from '@/lib/services/enrichment-service';
import { Lead } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { lead, forceRefresh, customPageSpeedKey } = body;

    if (!lead || !lead.id) {
      return NextResponse.json(
        { success: false, message: 'Objeto de lead inválido ou sem ID fornecido.' },
        { status: 400 }
      );
    }

    // Executa a pipeline unificada de Cruzar Dados
    const result = await executeCrossReferencePipeline(lead as Lead, {
      forceRefresh: Boolean(forceRefresh),
      customPageSpeedKey: customPageSpeedKey ? String(customPageSpeedKey).trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      lead: result.lead,
      summary: result.enrichmentData.company_summary,
      technicalAudit: result.technicalAudit,
      pageSpeedReport: result.pageSpeedReport,
      funnel: result.funnel,
      score: result.lead.score,
    });
  } catch (err: any) {
    console.error('Erro na rota de Cruzar Dados (/api/enrichment/cross-reference):', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Erro interno ao processar a auditoria e cruzamento de dados.',
      },
      { status: 500 }
    );
  }
}
