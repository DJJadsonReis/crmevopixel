'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { crmService } from '@/lib/services/crm-service';
import { useCrmSync } from '@/lib/hooks/useCrmSync';
import { crmBrain } from '@/lib/ai/crm-brain';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Target,
  ArrowUpRight,
  Sparkles,
  Zap,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Building2,
  RefreshCw,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export default function OportunidadesPage() {
  useCrmSync();
  const [filterMinProb, setFilterMinProb] = useState<number>(0);
  const [isSyncingAi, setIsSyncingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const opportunities = crmService.getOpportunities();
  const leads = crmService.getLeads();

  // Função para o Agente IA varrer os leads e sincronizar novas oportunidades
  const handleAiScanOpportunities = () => {
    setIsSyncingAi(true);
    let countNew = 0;

    leads.forEach((lead) => {
      const opp = crmService.syncLeadToOpportunity(lead);
      if (opp) countNew++;
    });

    setTimeout(() => {
      setIsSyncingAi(false);
      setAiMessage(`Varredura do Agente IA concluída: ${opportunities.length} oportunidades mapeadas no radar.`);
      setTimeout(() => setAiMessage(null), 5000);
    }, 600);
  };

  const filteredOpps = opportunities.filter((o) => (o.probability || 0) >= filterMinProb);

  const totalValue = opportunities.reduce((acc, o) => acc + (o.estimated_value || 0), 0);
  const highProbabilityOpps = opportunities.filter((o) => (o.probability || 0) >= 70);
  const avgProbability = opportunities.length > 0
    ? Math.round(opportunities.reduce((acc, o) => acc + (o.probability || 0), 0) / opportunities.length)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-evo-support uppercase tracking-wider mb-1">
            <Target className="w-3.5 h-3.5 text-evo-accent" />
            Deals Multisserviço & Inteligência Comercial
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-evo-text font-heading">
            Oportunidades Comerciais
          </h1>
          <p className="text-xs text-evo-muted mt-1">
            Mapeamento cognitivo conectado ao Agente IA: probabilidade de fechamento, escopos negociados e canais de abordagem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 text-xs border-evo-accent/30 text-evo-accent hover:bg-evo-accent/10"
            onClick={handleAiScanOpportunities}
            disabled={isSyncingAi}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSyncingAi ? 'animate-spin' : ''}`} />
            <span>{isSyncingAi ? 'Varrendo Leads...' : 'Sincronizar com Agente IA'}</span>
          </Button>

          <Link href="/pipeline">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs">
              <span>Pipeline Kanban</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#07100F]" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Banner de Status IA */}
      {aiMessage && (
        <div className="p-3.5 rounded-xl bg-evo-accent/10 border border-evo-accent/30 text-xs text-evo-accent flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{aiMessage}</span>
          </div>
          <button onClick={() => setAiMessage(null)} className="text-evo-muted hover:text-evo-accent">×</button>
        </div>
      )}

      {/* Grid de Resumo Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-evo-card border border-evo-border">
          <span className="text-[11px] text-evo-muted font-heading uppercase tracking-wider">
            Total Mapeado em Oportunidades
          </span>
          <div className="text-2xl font-bold font-mono text-evo-accent mt-1">
            R$ {totalValue.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-evo-support">
            {opportunities.length} deals catalogados
          </span>
        </div>

        <div className="p-4 rounded-xl bg-evo-card border border-evo-border">
          <span className="text-[11px] text-evo-muted font-heading uppercase tracking-wider">
            Fechamento Iminente / Alto Grau (≥70%)
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {highProbabilityOpps.length}
          </div>
          <span className="text-[10px] text-evo-support">
            R$ {highProbabilityOpps.reduce((acc, o) => acc + (o.estimated_value || 0), 0).toLocaleString('pt-BR')} em negociação avançada
          </span>
        </div>

        <div className="p-4 rounded-xl bg-evo-card border border-evo-border">
          <span className="text-[11px] text-evo-muted font-heading uppercase tracking-wider">
            Probabilidade Média do Pipeline
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {avgProbability}%
          </div>
          <span className="text-[10px] text-evo-support">
            Índice ponderado pelo Agente IA
          </span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex items-center justify-between gap-3 bg-evo-card border border-evo-border p-2 rounded-xl text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-evo-muted text-[11px] font-mono px-2">Filtrar Probabilidade:</span>
          {[
            { label: 'Todas', value: 0 },
            { label: '≥ 50% (Morno+)', value: 50 },
            { label: '≥ 70% (Alta Chance 🔥)', value: 70 },
            { label: '100% (Fechado 🚀)', value: 100 },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterMinProb(btn.value)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                filterMinProb === btn.value
                  ? 'bg-evo-surface2 text-evo-accent font-semibold border border-evo-support/30'
                  : 'text-evo-muted hover:text-evo-text'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-mono text-evo-support pr-2">
          {filteredOpps.length} exibidas
        </span>
      </div>

      {/* Lista de Oportunidades com IA Brain Integration */}
      <div className="space-y-4">
        {filteredOpps.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-evo-card border border-evo-border">
            <Target className="w-8 h-8 text-evo-support mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-evo-text">Nenhuma oportunidade com este critério</p>
            <p className="text-xs text-evo-muted mt-1">
              Clique em &quot;Sincronizar com Agente IA&quot; para puxar leads em negociação e calcular chances de fechamento.
            </p>
          </div>
        ) : (
          filteredOpps.map((opp) => {
            const prob = opp.probability || 30;
            const probColor =
              prob >= 80 ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' :
              prob >= 70 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
              prob >= 50 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
              'text-sky-400 bg-sky-500/10 border-sky-500/30';

            return (
              <div
                key={opp.id}
                className="p-5 sm:p-6 rounded-2xl bg-evo-card border border-evo-border hover:border-evo-border-hover transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-evo-text font-heading flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-evo-support" />
                      {opp.company_name}
                    </h3>
                    <Badge temperature={opp.temperature} className="text-[10px]">
                      Score {opp.score}
                    </Badge>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-evo-surface text-evo-support border border-evo-border">
                      Estágio: {opp.stage_slug.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${probColor}`}>
                      🎯 {prob}% chance de fechamento
                    </span>
                  </div>

                  <p className="text-xs text-evo-muted font-medium truncate">{opp.title}</p>

                  {/* Barra de Progresso de Probabilidade */}
                  <div className="w-full max-w-md bg-evo-deep rounded-full h-1.5 overflow-hidden border border-[rgba(218,241,222,0.06)]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        prob >= 80 ? 'bg-purple-400' :
                        prob >= 70 ? 'bg-amber-400' :
                        prob >= 50 ? 'bg-emerald-400' :
                        'bg-sky-400'
                      }`}
                      style={{ width: `${prob}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-evo-disabled">
                    <span>Serviços: {opp.services.join(' + ')}</span>
                    {opp.last_interaction && <span>• Última interação: {opp.last_interaction}</span>}
                  </div>

                  {opp.approach_strategy && (
                    <div className="p-2.5 rounded-lg bg-evo-deep/70 border border-[rgba(218,241,222,0.04)] text-xs text-evo-muted italic flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-evo-accent shrink-0 mt-0.5" />
                      <span>Estratégia IA: {opp.approach_strategy}</span>
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-evo-border/50">
                  <div className="text-left md:text-right">
                    <div className="text-xl font-bold font-mono text-evo-accent">
                      R$ {opp.estimated_value.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-[11px] text-evo-support font-mono">
                      Ticket Estimado
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/chat?leadId=${opp.lead_id}`}>
                      <Button variant="secondary" size="sm" className="text-xs h-8 px-2.5 gap-1.5 text-evo-accent hover:bg-evo-accent/10">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat WhatsApp</span>
                      </Button>
                    </Link>

                    <Link href={`/leads/${opp.lead_id}`}>
                      <Button variant="ghost" size="sm" className="text-xs h-8 px-2.5 text-evo-muted hover:text-evo-text">
                        <span>Ver Lead</span>
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
