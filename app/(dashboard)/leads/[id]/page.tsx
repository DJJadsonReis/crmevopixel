'use client';

export const runtime = 'edge';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { crmService } from '@/lib/services/crm-service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import {
  ChevronLeft,
  Flame,
  MessageSquare,
  Clock,
  Target,
  FileText,
  Sparkles,
  Zap,
  Pause,
  Play,
  FastForward,
  CheckCircle2,
  Calendar,
  Send,
  Building2,
  Phone,
  Mail,
  Globe,
  Info,
  Layers,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { openWhatsApp, cleanPhoneNumber } from '@/lib/utils/whatsapp';
import { GenerateMessageModal, TargetEntity } from '@/components/modals/GenerateMessageModal';
import { useCrmSync } from '@/lib/hooks/useCrmSync';

export default function LeadProfilePage() {
  useCrmSync();
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const lead = crmService.getLeadById(leadId);

  const [activeTab, setActiveTab] = useState<'sequencia' | 'visao' | 'ia' | 'conversas'>('sequencia');
  const [sequenceStatus, setSequenceStatus] = useState(lead?.sequence_progress?.status || 'aguardando_envio');
  const [isApproachModalOpen, setIsApproachModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [approachMessage, setApproachMessage] = useState('');

  if (!lead) {
    return (
      <div className="p-12 text-center text-xs text-evo-muted">
        Lead não encontrado.{' '}
        <Link href="/leads" className="text-evo-support underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const [logs, setLogs] = useState<any[]>(() => crmService.getMessageLogs(lead.id));

  const handleAdvanceSequence = () => {
    crmService.advanceLeadSequence(lead.id);
    setSequenceStatus('enviado');
    setLogs([...crmService.getMessageLogs(lead.id)]);
    alert('Próxima etapa da sequência disparada para o n8n com sucesso!');
  };

  const handlePauseSequence = () => {
    crmService.pauseLeadSequence(lead.id, 'Pausado manualmente pelo usuário');
    setSequenceStatus('pausado');
  };

  const openApproachModal = () => {
    const defaultText = `Olá ${lead.name}, tudo bem? Notei que a ${lead.company_name} tem excelente reputação em ${lead.city}, mas o canal de atendimento no WhatsApp ainda não possui qualificação automática dos clientes...`;
    setApproachMessage(defaultText);
    setIsApproachModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Voltar */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-evo-muted hover:text-evo-text transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar para Leads</span>
        </Link>

        <span className="text-[11px] font-mono text-evo-disabled">ID: {lead.id}</span>
      </div>

      {/* Header do Lead (Seção 16) */}
      <div className="p-6 rounded-2xl bg-evo-card border border-evo-border shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-evo-text font-heading">
                {lead.company_name}
              </h1>
              <Badge temperature={lead.temperature}>
                {lead.temperature === 'quente' && '🔥 Quente'}
                {lead.temperature === 'morno' && '● Morno'}
                {lead.temperature === 'frio' && '○ Frio'}
              </Badge>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-evo-surface text-evo-support border border-evo-border">
                Score IA: {lead.score}/100
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-evo-muted">
              <span className="font-medium text-evo-text">{lead.name} ({lead.role})</span>
              <span>•</span>
              <span className="font-mono text-evo-support">Nicho: {lead.segment}</span>
              <span>•</span>
              <span>{lead.city}, {lead.state}</span>
              {lead.whatsapp && (
                <>
                  <span>•</span>
                  <span>WhatsApp: {lead.whatsapp}</span>
                </>
              )}
            </div>
          </div>

          {/* Ações Principais (WhatsApp Direto, Gerar Mensagem, Follow-up, Proposta) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chamar no WhatsApp */}
            <button
              onClick={() => {
                if (!lead.whatsapp || !cleanPhoneNumber(lead.whatsapp)) {
                  alert(`O lead "${lead.company_name}" não possui WhatsApp válido cadastrado.`);
                  return;
                }
                openWhatsApp(lead.whatsapp);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-heading font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Abrir WhatsApp Web / App"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
              <span>WhatsApp</span>
            </button>

            {/* Gerar Mensagem (Anexo 1) */}
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-evo-surface hover:bg-evo-surface2 border border-evo-border text-evo-support hover:text-evo-accent text-xs font-heading font-medium flex items-center gap-1.5 transition-all active:scale-95"
              title="Gerar Mensagem Personalizada de Abordagem"
            >
              <Sparkles className="w-3.5 h-3.5 text-evo-accent" />
              <span>Gerar Mensagem</span>
            </button>

            <Link href="/follow-ups">
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs py-2">
                <Clock className="w-3.5 h-3.5 text-evo-support" />
                <span>Follow-up</span>
              </Button>
            </Link>
            <Link href="/propostas">
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs py-2">
                <FileText className="w-3.5 h-3.5 text-evo-support" />
                <span>Criar Proposta</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Próxima Melhor Ação (Seção 13) */}
      <div className="bg-evo-card border border-evo-support/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-evo-surface2 border border-evo-support/40 flex items-center justify-center shrink-0 mt-0.5">
            <Compass className="w-4 h-4 text-evo-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-evo-support uppercase tracking-wider font-semibold">
                PRÓXIMA MELHOR AÇÃO RECOMENDADA
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-evo-surface text-evo-accent border border-evo-border">
                IA Analítica
              </span>
            </div>
            <div className="text-sm font-semibold text-evo-text font-heading mt-0.5">
              {lead.temperature === 'quente'
                ? 'Enviar proposta comercial formalizada com foco em ROI'
                : 'Disparar abordagem consultiva com diagnóstico do site'}
            </div>
            <p className="text-xs text-evo-muted mt-0.5">
              <span className="text-evo-disabled font-mono">Motivo:</span> Lead com Score {lead.score}/100 e demanda detectada em {lead.services.join(', ')}.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Link href="/propostas">
            <Button variant="primary" size="sm" className="text-xs gap-1.5">
              <span>Gerar Proposta</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#07100F]" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Navegação em Painéis */}
      <Tabs
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        items={[
          { id: 'sequencia', label: 'Sequência de Prospecção (n8n)' },
          { id: 'visao', label: 'Visão Geral & Informações' },
          { id: 'ia', label: 'Inteligência IA & ICP' },
          { id: 'conversas', label: 'Conversas & Timeline', count: logs.length },
        ]}
      />

      {/* Conteúdo das Abas */}
      {activeTab === 'sequencia' && (
        <div className="space-y-6">
          {/* Painel da Sequência de Prospecção de Nicho (Seção 18.1 & 18.2) */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono text-evo-support uppercase tracking-wider">
                  Automação Operacional via n8n
                </span>
                <h3 className="text-base font-medium text-evo-text font-heading mt-0.5">
                  Sequência do Nicho: {lead.segment}
                </h3>
                <p className="text-xs text-evo-muted mt-1">
                  Disparos e réguas de reengajamento cadastradas no Banco de Mensagens executadas via Evolution API.
                </p>
              </div>

              {/* Controles Manuais da Automação */}
              <div className="flex items-center gap-2">
                {sequenceStatus === 'pausado' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 text-xs text-evo-support"
                    onClick={() => setSequenceStatus('aguardando_resposta')}
                  >
                    <Play className="w-3.5 h-3.5 text-evo-support" />
                    <span>Reativar Sequência</span>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handlePauseSequence}
                  >
                    <Pause className="w-3.5 h-3.5 text-evo-muted" />
                    <span>Pausar</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-evo-accent hover:border-evo-accent/30"
                  onClick={handleAdvanceSequence}
                >
                  <FastForward className="w-3.5 h-3.5 text-evo-accent" />
                  <span>Disparar Próxima Etapa</span>
                </Button>
              </div>
            </div>

            {/* Linha do Tempo da Sequência */}
            <div className="space-y-4">
              {/* Etapa 1: Abertura */}
              <div className="p-4 rounded-xl bg-evo-surface/60 border border-evo-border flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-evo-surface2 border border-evo-support/30 flex items-center justify-center shrink-0 text-evo-support">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-evo-text">
                      Etapa 1 — Abertura Consultiva
                    </span>
                    <span className="text-[11px] font-mono text-evo-support">
                      Enviada há 2 dias • Lida
                    </span>
                  </div>
                  <p className="text-xs text-evo-muted mt-1.5 italic bg-evo-deep/40 p-2.5 rounded-lg border border-[rgba(218,241,222,0.04)]">
                    &ldquo;Olá {lead.name}, tudo bem? Notei que a {lead.company_name} tem forte atuação em {lead.city}, mas ao pesquisar encontramos um gargalo na velocidade de retorno do WhatsApp...&rdquo;
                  </p>
                </div>
              </div>

              {/* Etapa 2: Follow-up 1 */}
              <div className="p-4 rounded-xl bg-evo-card border border-[rgba(241,249,161,0.2)] flex items-start gap-4 shadow-[0_0_20px_rgba(241,249,161,0.04)]">
                <div className="w-8 h-8 rounded-full bg-evo-accent/15 border border-evo-accent/40 flex items-center justify-center shrink-0 text-evo-accent">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-evo-accent">
                        Etapa 2 — Follow-up 1 (Próximo disparo)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-evo-accent/10 text-evo-accent">
                        Agendado
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-evo-muted">
                      Disparo automático hoje às 16:30 via n8n
                    </span>
                  </div>
                  <p className="text-xs text-evo-text mt-1.5 italic bg-evo-deep/50 p-2.5 rounded-lg border border-evo-border">
                    &ldquo;{lead.name}, passando rápido: semana passada estruturamos um fluxo que reduziu 65% das dúvidas repetitivas para outro escritório do mesmo segmento. Faz sentido mostrar em 3 minutos?&rdquo;
                  </p>
                </div>
              </div>

              {/* Etapa 3: Follow-up 2 */}
              <div className="p-4 rounded-xl bg-evo-deep/40 border border-[rgba(218,241,222,0.04)] flex items-start gap-4 opacity-60">
                <div className="w-8 h-8 rounded-full bg-evo-surface border border-evo-border flex items-center justify-center shrink-0 text-evo-disabled">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-evo-muted">
                      Etapa 3 — Follow-up 2 (Diagnóstico Direto)
                    </span>
                    <span className="text-[11px] font-mono text-evo-disabled">
                      Aguardará 3 dias após a etapa 2
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'visao' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <CardTitle>Dados Cadastrais & Empresa</CardTitle>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[rgba(218,241,222,0.04)]">
                <span className="text-evo-muted">Empresa</span>
                <span className="text-evo-text font-medium">{lead.company_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[rgba(218,241,222,0.04)]">
                <span className="text-evo-muted">Contato Principal</span>
                <span className="text-evo-text font-medium">{lead.name} ({lead.role})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[rgba(218,241,222,0.04)]">
                <span className="text-evo-muted">Segmento / Nicho</span>
                <span className="text-evo-support font-mono">{lead.segment}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[rgba(218,241,222,0.04)]">
                <span className="text-evo-muted">Localização</span>
                <span className="text-evo-text">{lead.city} - {lead.state}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[rgba(218,241,222,0.04)]">
                <span className="text-evo-muted">Website</span>
                <span className="text-evo-support">{lead.website || 'Não informado'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <CardTitle>Oportunidades & Serviços Recomendados</CardTitle>
            <div className="space-y-3">
              {lead.services.map((service, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-evo-surface border border-evo-border flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-evo-text">{service}</span>
                  <span className="text-[11px] font-mono text-evo-support">Alta Oportunidade</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'ia' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-evo-border pb-4">
            <span className="text-[10px] font-mono text-evo-accent uppercase tracking-wider">
              Evo Intelligence — Análise Estratégica
            </span>
            <h3 className="text-lg font-medium text-evo-text font-heading mt-1">
              Diferenciação Estrita: Dado vs Inferência vs Recomendação
            </h3>
          </div>

          {/* DADO (Fato verificado) */}
          <div className="p-4 rounded-xl bg-evo-deep border-l-2 border-evo-support border-y border-r border-evo-border">
            <div className="text-[11px] font-mono text-evo-support uppercase font-semibold mb-2">
              [DADO] — Fatos Verificados
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-evo-text">
              {lead.ai_analysis?.data_points.map((dp, i) => (
                <li key={i}>{dp}</li>
              ))}
            </ul>
          </div>

          {/* INFERÊNCIA (Dedução analítica) */}
          <div className="p-4 rounded-xl bg-evo-deep border-l-2 border-[#9BA6A0] border-y border-r border-evo-border">
            <div className="text-[11px] font-mono text-evo-muted uppercase font-semibold mb-2">
              [INFERÊNCIA] — Deduções e Hipóteses
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-evo-muted">
              {lead.ai_analysis?.inferences.map((inf, i) => (
                <li key={i}>{inf}</li>
              ))}
            </ul>
          </div>

          {/* RECOMENDAÇÃO (Ação prática sugerida) */}
          <div className="p-4 rounded-xl bg-evo-deep border-l-2 border-evo-accent border-y border-r border-evo-border">
            <div className="text-[11px] font-mono text-evo-accent uppercase font-semibold mb-2">
              [RECOMENDAÇÃO] — Plano de Ação Comercial
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-evo-text">
              {lead.ai_analysis?.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {activeTab === 'conversas' && (
        <Card className="p-6 space-y-4">
          <CardTitle>Histórico de Mensagens & Webhooks</CardTitle>
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-evo-surface/70 border border-evo-border text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-evo-support">{log.channel}</span>
                  <span className="text-evo-disabled font-mono">
                    {new Date(log.sent_at).toLocaleString('pt-BR')} • {log.status}
                  </span>
                </div>
                <p className="text-evo-text leading-relaxed">{log.sent_text}</p>
                <div className="text-[10px] text-evo-disabled font-mono pt-1">
                  Origem: {log.source} ({log.direction})
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal Motor de Abordagem (Seção 21) */}
      <Modal
        isOpen={isApproachModalOpen}
        onClose={() => setIsApproachModalOpen(false)}
        title="Motor de Abordagem Inteligente"
        subtitle="Mensagem consultiva e direta formulada para este lead, com suporte à sequência do nicho."
      >
        <div className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-evo-muted font-medium">Texto da Abordagem</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px] text-evo-support hover:text-evo-accent"
                onClick={() => {
                  setApproachMessage(
                    `Olá ${lead.name}, acompanhei o posicionamento da ${lead.company_name} em ${lead.city}. Desenvolvemos soluções com ganho imediato de eficiência para o segmento de ${lead.segment}. Gostaria de um diagnóstico rápido?`
                  );
                }}
              >
                Usar sequência do nicho
              </Button>
            </div>
            <textarea
              rows={5}
              value={approachMessage}
              onChange={(e) => setApproachMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none font-sans leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              className="text-[11px]"
              onClick={() =>
                setApproachMessage((prev) => prev.slice(0, Math.floor(prev.length * 0.75)))
              }
            >
              Mais curta
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-[11px]"
              onClick={() =>
                setApproachMessage((prev) => prev.replace('Desenvolvemos', 'Criamos'))
              }
            >
              Mais casual
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-[11px]"
              onClick={() => {
                navigator.clipboard?.writeText(approachMessage);
                alert('Mensagem copiada para a área de transferência!');
              }}
            >
              Copiar
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-evo-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsApproachModalOpen(false)}
            >
              Fechar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                crmService.addMessageLog({
                  lead_id: lead.id,
                  step_name: 'Abordagem Manual Personalizada',
                  channel: 'WhatsApp (Evolution API)',
                  sent_text: approachMessage,
                  direction: 'enviada',
                  sent_at: new Date().toISOString(),
                  source: 'manual',
                  status: 'entregue',
                });
                setLogs([...crmService.getMessageLogs(lead.id)]);
                lead.status = 'em_abordagem';
                alert('Abordagem enviada para o canal via n8n!');
                setIsApproachModalOpen(false);
              }}
            >
              Disparar pelo WhatsApp
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Gerador de Mensagens (Anexo 1) */}
      <GenerateMessageModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        target={{
          id: lead.id,
          name: lead.name,
          company_name: lead.company_name,
          phone: lead.whatsapp,
          whatsapp: lead.whatsapp,
          segment: lead.segment,
          city: lead.city,
          state: lead.state,
          services: lead.services,
          role: lead.role,
        }}
      />
    </div>
  );
}
