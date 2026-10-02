'use client';

import React, { useState } from 'react';
import { CommercialFunnelStep, Lead } from '@/types/database';
import {
  Copy,
  Check,
  Send,
  Sparkles,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

interface PersonalizedFunnelSectionProps {
  lead: Lead;
  onOpenWhatsAppWithText: (text: string) => void;
  onGenerateFunnel: () => void;
  isGenerating?: boolean;
}

export function PersonalizedFunnelSection({
  lead,
  onOpenWhatsAppWithText,
  onGenerateFunnel,
  isGenerating,
}: PersonalizedFunnelSectionProps) {
  const [copiedStepOrder, setCopiedStepOrder] = useState<number | null>(null);

  const funnel = lead.commercial_funnel || [];

  const handleCopy = (text: string, order: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedStepOrder(order);
    setTimeout(() => setCopiedStepOrder(null), 2000);
  };

  if (funnel.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-evo-card border border-evo-border space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-evo-surface border border-evo-border flex items-center justify-center mx-auto text-evo-support">
          <Sparkles className="w-7 h-7 text-evo-accent" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-semibold text-evo-text font-heading">
            Funil Comercial Personalizado Não Gerado
          </h3>
          <p className="text-xs text-evo-muted">
            Execute o Cruzamento de Dados para diagnosticar o site e presença digital de {lead.company_name} e gerar automaticamente a régua completa de 10 a 12 etapas de abordagem consultiva.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onGenerateFunnel}
          disabled={isGenerating}
          className="gap-2 text-xs"
        >
          <Sparkles className="w-4 h-4 text-[#07100F]" />
          <span>{isGenerating ? 'Diagnosticando e Criando Funil...' : 'Gerar Funil de 12 Etapas Agora'}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Funil */}
      <div className="p-6 rounded-2xl bg-evo-card border border-evo-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-evo-support/15 text-evo-support font-semibold">
              Régua Comercial Sob Medida • 10 a 12 Etapas
            </span>
            <span className="text-xs font-mono text-evo-muted">
              {funnel.length} etapas estratégicas
            </span>
          </div>
          <h3 className="text-lg font-semibold text-evo-text font-heading mt-1">
            Funil de Abordagem Consultiva — {lead.company_name}
          </h3>
          <p className="text-xs text-evo-muted mt-0.5">
            Mensagens calibradas para os gaps técnicos identificados no diagnóstico, evitando spam e maximizando conversão no WhatsApp.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onGenerateFunnel}
          disabled={isGenerating}
          className="gap-1.5 text-xs text-evo-support hover:text-evo-accent shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Regenerar Funil</span>
        </Button>
      </div>

      {/* Grid de Etapas */}
      <div className="space-y-4">
        {funnel.map((step) => {
          const isCopied = copiedStepOrder === step.step_order;

          return (
            <div
              key={step.step_order}
              className="p-5 rounded-2xl bg-evo-card border border-evo-border hover:border-evo-support/40 transition-all space-y-3 relative group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="w-7 h-7 rounded-xl bg-evo-surface border border-evo-border flex items-center justify-center text-xs font-mono font-bold text-evo-support">
                    {String(step.step_order).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-semibold text-evo-text font-heading">
                    {step.phase}
                  </span>
                  {step.title && (
                    <span className="text-xs text-evo-muted">
                      • {step.title}
                    </span>
                  )}
                  {step.wait_hours_or_days && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      Aguardar: {step.wait_hours_or_days}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopy(step.message_template, step.step_order)}
                    className="text-xs gap-1.5 py-1.5"
                    title="Copiar texto da mensagem"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-evo-muted" />
                        <span>Copiar</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenWhatsAppWithText(step.message_template)}
                    className="text-xs gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    title="Abrir no WhatsApp Inbox pronto para enviar"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                    <span>Disparar</span>
                  </Button>
                </div>
              </div>

              {/* Objetivo Tático */}
              {step.objective && (
                <div className="text-[11px] text-evo-support font-medium flex items-center gap-1.5 bg-evo-surface/60 px-3 py-1.5 rounded-lg border border-evo-border">
                  <span className="text-evo-disabled font-mono uppercase text-[10px]">Objetivo:</span>
                  <span>{step.objective}</span>
                </div>
              )}

              {/* Caixa de Texto do Modelo */}
              <div className="p-3.5 rounded-xl bg-evo-surface border border-evo-border text-xs text-evo-text whitespace-pre-wrap leading-relaxed font-sans">
                {step.message_template}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
