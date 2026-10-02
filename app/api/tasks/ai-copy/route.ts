export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/supabase/db-service';
import { taskEngine } from '@/lib/services/task-engine';
import { Lead } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      leadId,
      leadData,
      objective,
      tone,
      cta,
      template,
      isAiPersonalized,
      customInstructions,
    } = body;

    let lead: Lead | null = leadData || null;
    if (!lead && leadId) {
      const leads = (await dbService.getLeads()) || [];
      lead = leads.find((l) => l.id === leadId) || null;
    }

    if (!lead) {
      return NextResponse.json(
        { success: false, message: 'Lead não informado para gerar copy' },
        { status: 400 }
      );
    }

    // Se temos template fixo e não é modo IA total
    if (template && !isAiPersonalized) {
      const substituted = taskEngine.substituteVariables(template, lead);
      return NextResponse.json({
        success: true,
        text: substituted,
        mode: 'template_variables',
      });
    }

    // Modo IA Personalizada
    const generated = taskEngine.generatePersonalizedCopy(lead, {
      ai_copy_config: {
        objective: objective || 'prospeccao',
        tone: tone || 'consultivo',
        cta: cta || 'responder',
        custom_instructions: customInstructions,
      },
    });

    return NextResponse.json({
      success: true,
      text: generated,
      mode: 'ai_personalized',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Erro ao gerar copy da automação' },
      { status: 500 }
    );
  }
}
