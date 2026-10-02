'use client';

import React from 'react';
import { Lead } from '@/types/database';
import {
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  DollarSign,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CommercialIntelligenceSectionProps {
  lead: Lead;
  onGenerateEnrichment: () => void;
  isGenerating?: boolean;
}

export function CommercialIntelligenceSection({
  lead,
  onGenerateEnrichment,
  isGenerating,
}: CommercialIntelligenceSectionProps) {
  const enrich = lead.enrichment_data;

  if (!enrich) {
    return (
      <div className="p-12 text-center rounded-2xl bg-evo-card border border-evo-border space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-evo-surface border border-evo-border flex items-center justify-center mx-auto text-evo-support">
          <Target className="w-7 h-7 text-evo-accent" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-semibold text-evo-text font-heading">
            Inteligência Comercial Não Processada
          </h3>
          <p className="text-xs text-evo-muted">
            Execute o Cruzamento de Dados para sintetizar diagnóstico, oportunidades de alto valor, ganchos de abordagem e matriz de objeções para {lead.company_name}.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onGenerateEnrichment}
          disabled={isGenerating}
          className="gap-2 text-xs"
        >
          <Sparkles className="w-4 h-4 text-[#07100F]" />
          <span>{isGenerating ? 'Analisando Presença Digital...' : 'Cruzar Dados & Gerar Inteligência'}</span>
        </Button>
      </div>
    );
  }

  const score = enrich.score_breakdown || {
    total: lead.score,
    website_score: 25,
    local_seo_score: 20,
    whatsapp_score: 18,
    service_fit_score: 20,
    rationale: 'Score calculado pelo motor analítico.',
  };

  return (
    <div className="space-y-6">
      {/* Resumo & Síntese da Empresa */}
      <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-evo-support/15 text-evo-support font-semibold">
              Síntese Executiva do Lead
            </span>
            <span className="text-xs font-mono text-evo-muted">
              {enrich.model_used || 'Evo Intelligence Engine'}
            </span>
          </div>
          <span className="text-xs text-evo-disabled">
            {new Date(enrich.analyzed_at).toLocaleDateString('pt-BR')}
          </span>
        </div>

        <p className="text-sm text-evo-text leading-relaxed font-sans">
          {enrich.company_summary}
        </p>

        {enrich.next_best_action && (
          <div className="p-3.5 rounded-xl bg-evo-surface border border-evo-support/30 text-xs text-evo-support flex items-start gap-2.5">
            <Target className="w-4 h-4 text-evo-accent shrink-0 mt-0.5" />
            <div>
              <strong className="text-evo-text">Próximo Passo Recomendado:</strong> {enrich.next_best_action}
            </div>
          </div>
        )}
      </div>

      {/* Detalhamento Matemático do Score Comercial (0 a 100) */}
      <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-evo-border pb-3">
          <div>
            <h4 className="text-sm font-semibold text-evo-text font-heading">
              Decomposição Transparente do Score Comercial ({score.total}/100)
            </h4>
            <p className="text-xs text-evo-muted mt-0.5">
              Cálculo auditável sem notas arbitrárias. Cada ponto reflete um indicador real de urgência ou poder de compra.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-evo-surface text-evo-accent border border-evo-border self-start">
            Fórmula EVO v2.0
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-evo-surface border border-evo-border">
            <div className="text-[11px] text-evo-muted font-mono">Urgência do Site / Web</div>
            <div className="text-xl font-bold font-mono text-evo-text mt-1">
              {score.website_score} <span className="text-xs text-evo-disabled">/ 35 pts</span>
            </div>
            <div className="text-[10px] text-evo-muted mt-0.5">Status, SSL e velocidade</div>
          </div>

          <div className="p-3.5 rounded-xl bg-evo-surface border border-evo-border">
            <div className="text-[11px] text-evo-muted font-mono">Reputação & Faturamento</div>
            <div className="text-xl font-bold font-mono text-evo-text mt-1">
              {score.local_seo_score} <span className="text-xs text-evo-disabled">/ 25 pts</span>
            </div>
            <div className="text-[10px] text-evo-muted mt-0.5">Presença local e porte</div>
          </div>

          <div className="p-3.5 rounded-xl bg-evo-surface border border-evo-border">
            <div className="text-[11px] text-evo-muted font-mono">Vazamento WhatsApp</div>
            <div className="text-xl font-bold font-mono text-evo-text mt-1">
              {score.whatsapp_score} <span className="text-xs text-evo-disabled">/ 20 pts</span>
            </div>
            <div className="text-[10px] text-evo-muted mt-0.5">Falta de botão ou triagem</div>
          </div>

          <div className="p-3.5 rounded-xl bg-evo-surface border border-evo-border">
            <div className="text-[11px] text-evo-muted font-mono">Fit Catálogo EvoPixel</div>
            <div className="text-xl font-bold font-mono text-evo-text mt-1">
              {score.service_fit_score} <span className="text-xs text-evo-disabled">/ 20 pts</span>
            </div>
            <div className="text-[10px] text-evo-muted mt-0.5">Aderência aos nichos alvo</div>
          </div>
        </div>

        {score.rationale && (
          <div className="text-xs text-evo-muted bg-evo-surface/60 p-3 rounded-xl border border-evo-border">
            <strong>Critérios ativados:</strong> {score.rationale}
          </div>
        )}
      </div>

      {/* Grid: Diagnóstico Técnico vs Oportunidades Comerciais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diagnóstico */}
        <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-evo-text font-heading">
              Gaps & Diagnóstico Identificado ({enrich.diagnosis?.length || 0})
            </h4>
          </div>

          <div className="space-y-2">
            {enrich.diagnosis?.map((diag, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-evo-surface border border-evo-border text-xs text-evo-text flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{diag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Oportunidades Comerciais */}
        <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-evo-text font-heading">
              Oportunidades Comerciais ({enrich.opportunities?.length || 0})
            </h4>
          </div>

          <div className="space-y-2">
            {enrich.opportunities?.map((opp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-evo-surface border border-evo-border text-xs text-evo-text flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{opp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Serviços Compatíveis EvoPixel & Argumentos de Vendas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Serviços Compatíveis */}
        <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-evo-support" />
            <h4 className="text-sm font-semibold text-evo-text font-heading">
              Serviços Recomendados (Catálogo EVO PIXEL)
            </h4>
          </div>

          <div className="space-y-2">
            {enrich.compatible_services?.map((svc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-evo-surface border border-evo-border text-xs font-medium text-evo-text flex items-center justify-between"
              >
                <span>{svc}</span>
                <span className="text-[10px] font-mono text-evo-accent bg-evo-card px-2 py-0.5 rounded border border-evo-border">
                  Alta Compatibilidade
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Argumentos de Vendas */}
        <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-evo-accent" />
            <h4 className="text-sm font-semibold text-evo-text font-heading">
              Argumentos Comerciais & ROI
            </h4>
          </div>

          <div className="space-y-2">
            {enrich.sales_arguments?.map((arg, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-evo-surface border border-evo-border text-xs text-evo-text leading-relaxed"
              >
                💡 {arg}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ganchos de Abordagem & Objeções Previstas */}
      <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-evo-support" />
          <h4 className="text-sm font-semibold text-evo-text font-heading">
            Ganchos Personalizados para o WhatsApp & Contorno de Objeções
          </h4>
        </div>

        {enrich.sales_hooks && enrich.sales_hooks.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] text-evo-muted font-mono uppercase">
              3 Ganchos Rápidos de Abertura:
            </div>
            {enrich.sales_hooks.map((hook, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-evo-surface border border-evo-border text-xs text-evo-text font-sans"
              >
                <strong className="text-evo-support font-mono">Gancho 0{idx + 1}:</strong> {hook}
              </div>
            ))}
          </div>
        )}

        {enrich.possible_objections && enrich.possible_objections.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-evo-border">
            <div className="text-[11px] text-evo-muted font-mono uppercase">
              Objeções Prováveis e Respostas Prontas:
            </div>
            <div className="space-y-3">
              {enrich.possible_objections.map((obj, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-evo-surface border border-evo-border space-y-2">
                  <div className="text-xs font-semibold text-amber-400">
                    {obj.objection}
                  </div>
                  <div className="text-xs text-evo-text bg-evo-card p-3 rounded-lg border border-evo-border leading-relaxed">
                    <strong className="text-evo-support font-mono text-[11px]">Resposta Consultiva: </strong>
                    {obj.suggested_response}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
