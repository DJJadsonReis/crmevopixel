'use client';

import React from 'react';
import Link from 'next/link';
import { crmService } from '@/lib/services/crm-service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Target,
  Plus,
  ArrowUpRight,
  Zap,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function OportunidadesPage() {
  const opportunities = crmService.getOpportunities();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-evo-support uppercase tracking-wider mb-1">
            <Target className="w-3.5 h-3.5" />
            Deals Multisserviço & Probabilidade
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-evo-text font-heading">
            Oportunidades Comerciais
          </h1>
          <p className="text-xs text-evo-muted mt-1">
            Mapeamento de escopos com valores estimados, probabilidade de fechamento e canais recomendados.
          </p>
        </div>

        <Link href="/pipeline">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <span>Visualizar em Pipeline Kanban</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-evo-support" />
          </Button>
        </Link>
      </div>

      {/* Lista de Oportunidades */}
      <div className="space-y-4">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="p-6 rounded-2xl bg-evo-card border border-evo-border hover:border-evo-border-hover transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-evo-text font-heading">
                  {opp.company_name}
                </h3>
                <Badge temperature={opp.temperature} className="text-[10px]">
                  Score {opp.score}
                </Badge>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-evo-surface text-evo-support">
                  Estágio: {opp.stage_slug.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-evo-muted font-medium">{opp.title}</p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-evo-disabled">
                <span>Serviços: {opp.services.join(' + ')}</span>
                {opp.last_interaction && <span>• Última interação: {opp.last_interaction}</span>}
              </div>

              {opp.approach_strategy && (
                <div className="p-2.5 rounded-lg bg-evo-deep/60 border border-[rgba(218,241,222,0.04)] text-xs text-evo-muted italic">
                  Estratégia: {opp.approach_strategy}
                </div>
              )}
            </div>

            <div className="text-right shrink-0 space-y-2">
              <div className="text-xl font-bold font-mono text-evo-accent">
                R$ {opp.estimated_value.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-evo-support font-mono">
                {opp.probability}% probabilidade
              </div>
              <Link href={`/leads/${opp.lead_id}`}>
                <Button variant="secondary" size="sm" className="text-xs h-7 px-3 mt-1">
                  Abrir Lead
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
