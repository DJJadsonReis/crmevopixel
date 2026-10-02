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
  ChevronDown,
  RefreshCw,
  Activity,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { openWhatsApp, cleanPhoneNumber } from '@/lib/utils/whatsapp';
import { GenerateMessageModal, TargetEntity } from '@/components/modals/GenerateMessageModal';
import { useCrmSync } from '@/lib/hooks/useCrmSync';
import { WhatsAppInboxModal } from '@/components/inbox/WhatsAppInboxModal';
import { crmBrain } from '@/lib/ai/crm-brain';
import { SiteHealthSection } from '@/components/leads/SiteHealthSection';
import { PersonalizedFunnelSection } from '@/components/leads/PersonalizedFunnelSection';
import { CommercialIntelligenceSection } from '@/components/leads/CommercialIntelligenceSection';
import { EvidenceTableSection } from '@/components/leads/EvidenceTableSection';

export default function LeadProfilePage() {
  useCrmSync();
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const lead = crmService.getLeadById(leadId);

  const [activeTab, setActiveTab] = useState<
    'saude_site' | 'funil' | 'inteligencia' | 'evidencias' | 'sequencia' | 'visao' | 'conversas'
  >('saude_site');
  const [sequenceStatus, setSequenceStatus] = useState(lead?.sequence_progress?.status || 'aguardando_envio');
  const [isApproachModalOpen, setIsApproachModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [approachMessage, setApproachMessage] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichStep, setEnrichStep] = useState(0);
  const [isCrossMenuOpen, setIsCrossMenuOpen] = useState(false);

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

  const handleCrossReference = async (forceRefresh = false) => {
    if (!lead) return;
    setIsEnriching(true);
    setIsCrossMenuOpen(false);
    setEnrichStep(1);

    const timer1 = setTimeout(() => setEnrichStep(2), 1200);
    const timer2 = setTimeout(() => setEnrichStep(3), 2600);
    const timer3 = setTimeout(() => setEnrichStep(4), 4200);

    try {
      await crmService.enrichLead(lead.id, { forceRefresh });
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setEnrichStep(5);
      setTimeout(() => {
        setIsEnriching(false);
        setEnrichStep(0);
        setActiveTab('saude_site');
      }, 700);
    } catch (err) {
      console.error('Falha ao cruzar dados:', err);
      setIsEnriching(false);
      setEnrichStep(0);
    }
  };

  const getEnrichmentBadge = (status?: string) => {
    switch (status) {
      case 'enriched':
        return { label: '🟢 Enriquecido', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'partial':
        return { label: '🟡 Parcial', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'in_progress':
        return { label: '⏳ Analisando...', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
      case 'error':
        return { label: '🔴 Erro', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
      default:
        return { label: '⚪ Não analisado', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  };

  const getHealthBadge = (status?: string) => {
    switch (status) {
      case 'ONLINE_OK':
        return { label: 'Online OK', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'ONLINE_WITH_ISSUES':
        return { label: 'Com Alertas', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'CRITICAL':
        return { label: 'Crítico', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
      case 'OFFLINE':
        return { label: 'Offline', color: 'bg-red-600/20 text-red-300 border-red-500/40' };
      case 'NO_WEBSITE':
        return { label: 'Sem Site', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
      default:
        return { label: 'Não auditado', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  };

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
            <div className="flex items-center gap-3 flex-wrap">
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
              {/* Badge de Enriquecimento */}
              {(() => {
                const b = getEnrichmentBadge(lead.enrichment_status);
                return (
                  <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${b.color}`}>
                    {b.label}
                  </span>
                );
              })()}
              {/* Badge de Saúde do Site */}
              {lead.website && (
                <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${getHealthBadge(lead.site_health_status).color}`}>
                  {getHealthBadge(lead.site_health_status).label}
                </span>
              )}
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

          {/* Ações Principais (Cruzar Dados, WhatsApp Direto, Gerar Mensagem, Follow-up, Proposta) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Botão Cruzar Dados com Dropdown */}
            <div className="relative">
              <div className="inline-flex rounded-xl shadow-sm">
                <button
                  onClick={() => handleCrossReference(false)}
                  disabled={isEnriching}
                  className="px-3.5 py-2 rounded-l-xl bg-evo-accent hover:bg-evo-accent/90 text-[#07100F] text-xs font-heading font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm disabled:opacity-60"
                  title="Cruzar Dados, Auditoria Técnica Completa & Google PageSpeed v5"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin' : ''}`} />
                  <span>{isEnriching ? 'Cruzando Dados...' : 'Cruzar Dados'}</span>
                </button>
                <button
                  onClick={() => setIsCrossMenuOpen(!isCrossMenuOpen)}
                  disabled={isEnriching}
                  className="px-2 py-2 rounded-r-xl bg-evo-accent hover:bg-evo-accent/90 text-[#07100F] border-l border-black/10 transition-all disabled:opacity-60"
                  title="Opções de Auditoria"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {isCrossMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 rounded-xl bg-evo-card border border-evo-border shadow-2xl z-30 p-1.5 space-y-1 text-xs animate-in fade-in">
                  <button
                    onClick={() => handleCrossReference(true)}
                    className="w-full text-left p-2 rounded-lg hover:bg-evo-surface flex items-center gap-2 text-evo-text transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-evo-accent" />
                    <span>Forçar Recálculo Completo</span>
                  </button>
                  <button
                    onClick={() => handleCrossReference(true)}
                    className="w-full text-left p-2 rounded-lg hover:bg-evo-surface flex items-center gap-2 text-evo-text transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Reanalisar Site Direto</span>
                  </button>
                  <button
                    onClick={() => handleCrossReference(true)}
                    className="w-full text-left p-2 rounded-lg hover:bg-evo-surface flex items-center gap-2 text-evo-text transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Atualizar Google PageSpeed v5</span>
                  </button>
                </div>
              )}
            </div>

            {/* Chamar no WhatsApp */}
            <button
              onClick={() => {
                if (!lead.whatsapp || !cleanPhoneNumber(lead.whatsapp)) {
                  alert(`O lead "${lead.company_name}" não possui WhatsApp válido cadastrado.`);
                  return;
                }
                setIsInboxOpen(true);
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

      {/* Stepper Animado em Tempo Real durante Cruzar Dados */}
      {isEnriching && (
        <div className="p-4 rounded-2xl bg-evo-card border border-evo-support/40 shadow-lg animate-in fade-in space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-evo-text flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-evo-accent animate-spin" />
              Executando Pipeline de Investigação & Auditoria Técnica do Site...
            </span>
            <span className="font-mono text-evo-support text-[11px]">
              Etapa {enrichStep} de 5
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px] font-mono">
            <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${enrichStep >= 1 ? 'border-evo-support bg-evo-surface text-evo-text' : 'border-evo-border opacity-50'}`}>
              <span>{enrichStep > 1 ? '✓' : '⏳'}</span>
              <span>DNS & SSL</span>
            </div>
            <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${enrichStep >= 2 ? 'border-evo-support bg-evo-surface text-evo-text' : 'border-evo-border opacity-50'}`}>
              <span>{enrichStep > 2 ? '✓' : '⏳'}</span>
              <span>PageSpeed v5</span>
            </div>
            <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${enrichStep >= 3 ? 'border-evo-support bg-evo-surface text-evo-text' : 'border-evo-border opacity-50'}`}>
              <span>{enrichStep > 3 ? '✓' : '⏳'}</span>
              <span>Core Web Vitals</span>
            </div>
            <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${enrichStep >= 4 ? 'border-evo-support bg-evo-surface text-evo-text' : 'border-evo-border opacity-50'}`}>
              <span>{enrichStep > 4 ? '✓' : '⏳'}</span>
              <span>Diagnóstico IA</span>
            </div>
            <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${enrichStep >= 5 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-evo-border opacity-50'}`}>
              <span>{enrichStep >= 5 ? '✓' : '⏳'}</span>
              <span>Funil 12 Etapas</span>
            </div>
          </div>
        </div>
      )}

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
          {
            id: 'saude_site',
            label: 'Saúde do Site & PageSpeed',
            count:
              lead.pagespeed_report?.mobile?.scores?.performance != null
                ? Number(lead.pagespeed_report.mobile.scores.performance)
                : undefined,
          },
          { id: 'funil', label: 'Funil Personalizado (12 Etapas)', count: lead.commercial_funnel?.length || 0 },
          { id: 'inteligencia', label: 'Inteligência Comercial' },
          {
            id: 'evidencias',
            label: 'Evidências & Auditoria',
            count: lead.enrichment_data?.evidence_items?.length || 0,
          },
          { id: 'sequencia', label: 'Sequência n8n' },
          { id: 'visao', label: 'Visão Geral & Cadastro' },
          { id: 'conversas', label: 'Conversas WhatsApp', count: logs.length },
        ]}
      />

      {/* 1. Saúde do Site & PageSpeed */}
      {activeTab === 'saude_site' && (
        <SiteHealthSection
          lead={lead}
          onReanalyzeSite={() => handleCrossReference(true)}
          onReanalyzePageSpeed={() => handleCrossReference(true)}
          isAnalyzing={isEnriching}
        />
      )}

      {/* 2. Funil Personalizado de 10 a 12 etapas */}
      {activeTab === 'funil' && (
        <PersonalizedFunnelSection
          lead={lead}
          onOpenWhatsAppWithText={(text) => {
            setApproachMessage(text);
            setIsInboxOpen(true);
          }}
          onGenerateFunnel={() => handleCrossReference(true)}
          isGenerating={isEnriching}
        />
      )}

      {/* 3. Inteligência Comercial */}
      {activeTab === 'inteligencia' && (
        <CommercialIntelligenceSection
          lead={lead}
          onGenerateEnrichment={() => handleCrossReference(true)}
          isGenerating={isEnriching}
        />
      )}

      {/* 4. Evidências & Auditoria */}
      {activeTab === 'evidencias' && (
        <EvidenceTableSection lead={lead} />
      )}

      {/* Conteúdo das Abas Existentes */}
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


      {activeTab === 'conversas' && (
        <div className="space-y-4">
          {/* Banner do Agente IA & Termômetro */}
          {(() => {
            const sentiment = crmBrain.analyzeConversationSentiment(logs, lead);
            return (
              <Card className="p-4 bg-gradient-to-r from-evo-card via-evo-surface to-evo-card border-evo-support/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-evo-support/20 text-evo-support font-semibold">
                        Agente Copilot IA • Termômetro Ativo
                      </span>
                      <span className="text-xs font-semibold text-evo-text">
                        Humor do Lead: {sentiment.temperatureEmoji} {sentiment.temperatureBadge}
                      </span>
                    </div>
                    <p className="text-xs text-evo-muted">
                      <strong className="text-evo-text">Orientação Estratégica:</strong> {sentiment.tacticalAdvice}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-32 text-right">
                      <div className="text-[11px] font-mono font-bold text-evo-text">
                        {sentiment.thermometerScore}% Interesse
                      </div>
                      <div className="h-2 w-full bg-evo-surface rounded-full overflow-hidden mt-1 border border-evo-border">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full transition-all"
                          style={{ width: `${sentiment.thermometerScore}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      onClick={() => setIsInboxOpen(true)}
                    >
                      <WhatsAppIcon className="w-4 h-4 fill-white" />
                      Abrir WhatsApp Web
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })()}

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Histórico de Mensagens & Webhooks</CardTitle>
              <Button
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => setIsInboxOpen(true)}
              >
                Abrir Chat Interativo
              </Button>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-evo-muted border border-dashed border-evo-border rounded-xl">
                Nenhuma mensagem registrada ainda para este contato. Inicie a conversa pelo WhatsApp Inbox acima!
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                      log.direction === 'recebida'
                        ? 'bg-evo-card border-blue-500/20'
                        : 'bg-evo-surface/70 border-evo-border'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${log.direction === 'recebida' ? 'text-blue-400' : 'text-evo-support'}`}>
                        {log.direction === 'recebida' ? `Recebida de ${lead.name}` : log.channel}
                      </span>
                      <span className="text-evo-disabled font-mono">
                        {new Date(log.sent_at).toLocaleString('pt-BR')} • {log.status}
                      </span>
                    </div>
                    <p className="text-evo-text leading-relaxed whitespace-pre-wrap">{log.sent_text}</p>
                    <div className="text-[10px] text-evo-disabled font-mono pt-1">
                      Origem: {log.source} ({log.direction})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
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
      {/* WhatsApp Web Inbox Modal */}
      <WhatsAppInboxModal
        isOpen={isInboxOpen}
        onClose={() => {
          setIsInboxOpen(false);
          setLogs([...crmService.getMessageLogs(lead.id)]);
        }}
        lead={lead}
        initialMessage={approachMessage || undefined}
      />

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
