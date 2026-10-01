'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { crmService } from '@/lib/services/crm-service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import {
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Check,
  Pause,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { openWhatsApp } from '@/lib/utils/whatsapp';

export default function FollowUpsPage() {
  const [followUpsList, setFollowUpsList] = useState(() => crmService.getFollowUps());
  const [activeTab, setActiveTab] = useState<'hoje' | 'atrasado' | 'proximo' | 'automatico'>('hoje');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleIntervene = (id: string) => {
    setFollowUpsList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_automated: false } : f))
    );
    setFeedbackMsg('Automação pausada para intervenção manual!');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleComplete = (id: string) => {
    setFollowUpsList((prev) => prev.filter((f) => f.id !== id));
    setFeedbackMsg('Follow-up marcado como concluído com sucesso!');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const filteredItems = followUpsList.filter((item) => {
    if (activeTab === 'automatico') return item.is_automated;
    return item.type === activeTab;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-evo-support uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            Central de Contatos & Reengajamento
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-evo-text font-heading">
            Central de Follow-ups
          </h1>
          <p className="text-xs text-evo-muted mt-1">
            Contatos manuais e réguas automáticas disparadas pelo n8n baseadas no prazo da etapa do nicho.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/prospeccao/mensagens">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Zap className="w-3.5 h-3.5 text-evo-support" />
              <span>Ver Réguas Automáticas</span>
            </Button>
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Abas da Central: Hoje, Atrasados, Próximos, Automáticos (IA/n8n) (Seção 36) */}
      <Tabs
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        items={[
          { id: 'hoje', label: 'Hoje', count: followUpsList.filter((f) => f.type === 'hoje').length },
          { id: 'atrasado', label: 'Atrasados', count: followUpsList.filter((f) => f.type === 'atrasado').length },
          { id: 'proximo', label: 'Próximos', count: followUpsList.filter((f) => f.type === 'proximo').length },
          { id: 'automatico', label: 'Automáticos (IA/n8n)', count: followUpsList.filter((f) => f.is_automated).length },
        ]}
      />

      {/* Lista de Follow-ups */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-evo-card border border-evo-border hover:border-evo-border-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-evo-text font-heading">
                  {item.company_name}
                </span>
                <span className="text-xs text-evo-muted">• {item.contact_name}</span>
                {item.is_automated ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-evo-accent/10 text-evo-accent border border-evo-accent/20">
                    Regra n8n Ativa
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-evo-surface text-evo-support">
                    Manual
                  </span>
                )}
              </div>

              <p className="text-xs text-evo-muted leading-relaxed">
                Contexto: <span className="text-evo-text">{item.context}</span>
              </p>

              <div className="flex items-center gap-2 text-[11px] text-evo-disabled">
                <span>Prazo: {item.due_date}</span>
                <span>•</span>
                <span>Próxima ação: {item.next_action}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openWhatsApp('11999999999', `Olá ${item.contact_name}! Estou fazendo o follow-up sobre ${item.context}.`)}
                className="p-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] transition-all"
                title="Chamar no WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
              </button>

              {item.is_automated ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs h-8 px-3 text-evo-accent gap-1"
                  onClick={() => handleIntervene(item.id)}
                  title="Pausar régua automática e assumir manualmente"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Intervir Manualmente</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs h-8 px-3 gap-1"
                  onClick={() => handleComplete(item.id)}
                  title="Concluir follow-up"
                >
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Marcar Feito</span>
                </Button>
              )}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="p-12 text-center text-xs text-evo-muted bg-evo-card/40 rounded-2xl border border-evo-border">
            Nenhum follow-up pendente nesta visualização.
          </div>
        )}
      </div>
    </div>
  );
}
