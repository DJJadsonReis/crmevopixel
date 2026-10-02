'use client';

import React from 'react';
import { Lead } from '@/types/database';
import { calculateEvidenceBasedScore, ScoreExplanation } from '@/lib/ai/qualification';
import { Modal } from '@/components/ui/Modal';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Award,
  TrendingUp,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export function ScoreBreakdownModal({ isOpen, onClose, lead }: ScoreBreakdownModalProps) {
  if (!lead) return null;

  const scoreExplanation: ScoreExplanation = calculateEvidenceBasedScore({
    name: lead.name,
    company_name: lead.company_name,
    phone: lead.phone || lead.whatsapp,
    whatsapp: lead.whatsapp || lead.phone,
    email: lead.email,
    segment: lead.segment,
    city: lead.city,
    state: lead.state,
    website: lead.website,
    instagram: lead.instagram,
    google_business: lead.google_business,
    technical_audit: lead.technical_audit,
    status: lead.status,
    tags: lead.tags,
    sequence_progress: lead.sequence_progress,
  });

  const { total, temperature, pillars } = scoreExplanation;

  const getPillarColor = (points: number, max: number) => {
    const ratio = points / max;
    if (ratio >= 0.7) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (ratio >= 0.4) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  const getPillarProgressBg = (points: number, max: number) => {
    const ratio = points / max;
    if (ratio >= 0.7) return 'bg-emerald-500';
    if (ratio >= 0.4) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Auditoria & Explicação do Score (${total}/100)`}
      subtitle={`Decomposição técnica e baseada em evidências para ${lead.company_name}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Top Highlight Card */}
        <div className="p-4 rounded-2xl bg-evo-surface border border-evo-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-evo-card border border-evo-border flex flex-col items-center justify-center font-mono">
              <span className="text-2xl font-bold text-evo-accent">{total}</span>
              <span className="text-[9px] text-evo-muted uppercase">/ 100</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-evo-text font-heading">
                  {lead.company_name}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    temperature === 'quente'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : temperature === 'morno'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  {temperature}
                </span>
              </div>
              <p className="text-xs text-evo-muted mt-0.5">
                {lead.segment} • {lead.city || 'São Paulo, SP'}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-evo-border sm:pl-4">
            <div className="text-[11px] font-mono text-evo-muted">Status Atual</div>
            <div className="text-xs font-bold text-evo-text uppercase tracking-wider font-mono">
              {lead.status.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* 5 Pilares de Pontuação */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-bold text-evo-muted uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Award className="w-4 h-4 text-evo-accent" /> Decomposição dos 5 Pilares Estratégicos
          </h4>

          {Object.entries(pillars).map(([key, pillar]) => {
            const percentage = Math.round((pillar.points / pillar.maxPoints) * 100);
            return (
              <div
                key={key}
                className="p-3.5 rounded-xl bg-evo-card border border-evo-border space-y-2.5 hover:border-evo-accent/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-evo-text font-heading">
                      {pillar.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getPillarColor(
                        pillar.points,
                        pillar.maxPoints
                      )}`}
                    >
                      {pillar.points} / {pillar.maxPoints} pts
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-evo-muted">
                    {percentage}%
                  </span>
                </div>

                {/* Barra de progresso */}
                <div className="w-full h-1.5 bg-evo-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getPillarProgressBg(
                      pillar.points,
                      pillar.maxPoints
                    )}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Fatores que contribuíram */}
                <div className="pt-1 space-y-1">
                  {pillar.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] font-mono text-evo-muted"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {factor.positive ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="truncate">{factor.label}</span>
                      </span>
                      <span
                        className={`font-bold shrink-0 ml-2 ${
                          factor.positive ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {factor.positive ? `+${factor.points}` : `${factor.points}`} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo da Abordagem Recomendada */}
        <div className="p-3.5 rounded-xl bg-evo-accent/10 border border-evo-accent/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-evo-accent font-heading">
            <Sparkles className="w-4 h-4" /> Recomendação Comercial Sugerida
          </div>
          <p className="text-xs text-evo-text leading-relaxed">
            {lead.ai_analysis?.recommendations?.[0] ||
              `Abordar o decisor no WhatsApp apresentando solução direta para ${lead.services?.[0] || 'Websites & Presença Digital'}.`}
          </p>
        </div>

        {/* Botão Fechar */}
        <div className="flex justify-end pt-2 border-t border-evo-border">
          <Button variant="secondary" onClick={onClose} className="text-xs">
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
