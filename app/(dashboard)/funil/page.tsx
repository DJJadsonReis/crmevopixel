'use client';

export const runtime = 'edge';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  TrendingUp,
  Award,
  Sparkles,
  Copy,
  Check,
  Send,
  Plus,
  Flame,
  Zap,
  Target,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { funnelService, SalesCopy, FunnelStage } from '@/lib/services/funnel-service';
import { WhatsAppInboxModal } from '@/components/inbox/WhatsAppInboxModal';
import { crmService } from '@/lib/services/crm-service';

export default function FunilPage() {
  const [metrics, setMetrics] = useState(() => funnelService.getFunnelMetrics());
  const [selectedStage, setSelectedStage] = useState<FunnelStage | 'todos'>('todos');
  const [selectedNiche, setSelectedNiche] = useState<string>('todos');
  const [copies, setCopies] = useState<SalesCopy[]>(() => funnelService.getCopies());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isNewManualOpen, setIsNewManualOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [inboxMessage, setInboxMessage] = useState('');

  // AI Generator form
  const [genStage, setGenStage] = useState<FunnelStage>('primeiro_contato');
  const [genNiche, setGenNiche] = useState('Advocacia & Direito Aduaneiro');
  const [genObjective, setGenObjective] = useState('Agendar reunião de demonstração da IA');
  const [genTone, setGenTone] = useState<'consultivo' | 'direto' | 'descontraido' | 'urgente'>('consultivo');
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual copy form
  const [manualTitle, setManualTitle] = useState('');
  const [manualStage, setManualStage] = useState<FunnelStage>('primeiro_contato');
  const [manualNiche, setManualNiche] = useState('Geral');
  const [manualContent, setManualContent] = useState('');
  const [manualTriggers, setManualTriggers] = useState('Prova Social, Autoridade');

  const refreshData = () => {
    setCopies(
      funnelService.getCopies(
        selectedStage === 'todos' ? undefined : selectedStage,
        selectedNiche === 'todos' ? undefined : selectedNiche
      )
    );
    setMetrics(funnelService.getFunnelMetrics());
  };

  const handleCopyText = (copy: SalesCopy) => {
    navigator.clipboard?.writeText(copy.content || copy.text || '');
    setCopiedId(copy.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleTestInInbox = (copy: SalesCopy) => {
    setInboxMessage(copy.content || copy.text || '');
    setIsInboxOpen(true);
  };

  const handleRecordUsage = (id: string, converted: boolean) => {
    funnelService.recordCopyUsage(id, converted);
    refreshData();
  };

  const handleGenerateCopy = async () => {
    setIsGenerating(true);
    try {
      const newCopy = await funnelService.generateNewCopy(genStage, genNiche, genObjective, genTone);
      refreshData();
      setIsGeneratorOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveManualCopy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualContent) return;

    funnelService.addCopy({
      title: manualTitle,
      stage: manualStage,
      niche: manualNiche,
      content: manualContent,
      conversionRate: 0,
      sendsCount: 0,
      repliesCount: 0,
      conversionsCount: 0,
      score: 80,
      triggers: manualTriggers.split(',').map((t) => t.trim()),
    });

    setManualTitle('');
    setManualContent('');
    setIsNewManualOpen(false);
    refreshData();
  };

  const stageLabels: Record<string, string> = {
    todos: 'Todas as Etapas',
    primeiro_contato: '1. Primeiro Contato',
    quebra_objecao: '2. Quebra de Objeção',
    followup: '3. Follow-up',
    follow_up: '3. Follow-up',
    fechamento: '4. Proposta & Fechamento',
    reativacao: '5. Reativação',
  };

  const champion = copies.find((c) => c.isChampion) || copies[0];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-evo-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              Otimizador de Conversão
            </span>
            <span className="text-[10px] font-mono text-evo-muted">Cérebro Comercial EVO</span>
          </div>
          <h1 className="text-2xl font-semibold text-evo-text font-heading mt-1 flex items-center gap-2">
            Funil & Repositório de Copys de Alta Conversão
          </h1>
          <p className="text-xs text-evo-muted mt-1 max-w-2xl">
            Monitore a performance de cada abordagem no WhatsApp, descubra quais mensagens fecham mais contratos e gere novas variações usando inteligência artificial preditiva.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => setIsNewManualOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Nova Copy Manual
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold shadow-lg shadow-amber-500/20"
            onClick={() => setIsGeneratorOpen(true)}
          >
            <Sparkles className="w-4 h-4 fill-black" />
            Gerar Copy com IA
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-evo-card border-evo-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-evo-muted font-medium">Disparos Totais</span>
            <div className="p-2 rounded-lg bg-evo-surface text-evo-support">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-evo-text">{metrics.totalSends}</div>
            <p className="text-[11px] text-evo-muted mt-0.5">Mensagens enviadas via WhatsApp</p>
          </div>
        </Card>

        <Card className="p-4 bg-evo-card border-evo-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-evo-muted font-medium">Taxa de Resposta Média</span>
            <div className="p-2 rounded-lg bg-evo-surface text-blue-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-blue-400">{metrics.avgResponseRate}%</div>
            <p className="text-[11px] text-evo-muted mt-0.5">Engajamento ativo dos leads</p>
          </div>
        </Card>

        <Card className="p-4 bg-evo-card border-evo-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-evo-muted font-medium">Taxa de Fechamento</span>
            <div className="p-2 rounded-lg bg-evo-surface text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-emerald-400">{metrics.avgConversionRate}%</div>
            <p className="text-[11px] text-evo-muted mt-0.5">Conversão direta em vendas</p>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-500/10 via-evo-card to-evo-card border-amber-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Copy Campeã
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              Score {champion?.score || 95}/100
            </span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold text-evo-text truncate">{champion?.title || 'Abordagem Consultiva'}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold text-amber-400">{champion?.conversionRate || 38.5}% conv.</span>
              <span className="text-[11px] text-evo-muted">({champion?.conversionsCount || 0} fechamentos)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-evo-surface/50 p-2 rounded-xl border border-evo-border">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => {
              setSelectedStage('todos');
              setCopies(funnelService.getCopies(undefined, selectedNiche === 'todos' ? undefined : selectedNiche));
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedStage === 'todos'
                ? 'bg-evo-support text-evo-black shadow-sm font-semibold'
                : 'text-evo-muted hover:text-evo-text hover:bg-evo-surface'
            }`}
          >
            Todas ({copies.length})
          </button>
          {(['primeiro_contato', 'quebra_objecao', 'followup', 'fechamento', 'reativacao'] as FunnelStage[]).map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStage(st);
                setCopies(funnelService.getCopies(st, selectedNiche === 'todos' ? undefined : selectedNiche));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStage === st
                  ? 'bg-evo-support text-evo-black shadow-sm font-semibold'
                  : 'text-evo-muted hover:text-evo-text hover:bg-evo-surface'
              }`}
            >
              {stageLabels[st] || st}
            </button>
          ))}
        </div>

        {/* Niche Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-evo-muted" />
          <span className="text-[11px] text-evo-muted">Nicho:</span>
          <select
            value={selectedNiche}
            onChange={(e) => {
              const n = e.target.value;
              setSelectedNiche(n);
              setCopies(funnelService.getCopies(selectedStage === 'todos' ? undefined : selectedStage, n === 'todos' ? undefined : n));
            }}
            className="text-xs bg-evo-card border border-evo-border rounded-lg px-2.5 py-1 text-evo-text focus:outline-none focus:border-evo-support"
          >
            <option value="todos">Todos os Nichos</option>
            <option value="Advocacia & Direito Aduaneiro">Advocacia Aduaneira</option>
            <option value="Imobiliárias & Corretores">Imobiliárias</option>
            <option value="Clínicas & Saúde">Clínicas Médicas</option>
            <option value="Geral B2B">Geral B2B</option>
          </select>
        </div>
      </div>

      {/* Copies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {copies.map((copy) => {
          const isCamp = copy.isChampion;
          return (
            <Card
              key={copy.id}
              className={`p-5 flex flex-col justify-between transition-all ${
                isCamp
                  ? 'border-amber-500/60 bg-gradient-to-br from-amber-500/5 via-evo-card to-evo-card shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                  : 'border-evo-border bg-evo-card hover:border-evo-support/50'
              }`}
            >
              <div>
                {/* Header with Title and Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-evo-surface text-evo-support border border-evo-border uppercase">
                        {stageLabels[copy.stage]}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-evo-surface text-evo-muted border border-evo-border">
                        {copy.niche}
                      </span>
                      {isCamp && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1 border border-amber-500/30">
                          👑 CAMPEÃ DE CONVERSÃO
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-evo-text pt-1 font-heading">{copy.title}</h3>
                  </div>

                  {/* Score Pill */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-evo-text">Score IA</div>
                    <span className="text-lg font-mono font-extrabold text-amber-400">{copy.score}</span>
                    <span className="text-xs text-evo-disabled">/100</span>
                  </div>
                </div>

                {/* Performance Stats Bar */}
                <div className="grid grid-cols-4 gap-2 my-4 p-2.5 rounded-xl bg-evo-surface/70 border border-evo-border text-center">
                  <div>
                    <div className="text-[10px] text-evo-muted">Disparos</div>
                    <div className="text-xs font-mono font-bold text-evo-text">{copy.sendsCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-evo-muted">Respostas</div>
                    <div className="text-xs font-mono font-bold text-blue-400">{copy.repliesCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-evo-muted">Vendas</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">{copy.conversionsCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-evo-muted">Conversão</div>
                    <div className="text-xs font-mono font-extrabold text-amber-400">{copy.conversionRate}%</div>
                  </div>
                </div>

                {/* Mental Triggers */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(copy.triggers || copy.tags || []).map((trig: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-evo-surface text-evo-text/80 border border-evo-border flex items-center gap-1"
                    >
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      {trig}
                    </span>
                  ))}
                </div>

                {/* Copy Text Preview */}
                <div className="p-3.5 rounded-xl bg-evo-deep border border-evo-border font-sans text-xs text-evo-text leading-relaxed whitespace-pre-wrap select-text">
                  {copy.content}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-evo-border">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => handleCopyText(copy)}
                  >
                    {copiedId === copy.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </>
                    )}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 text-xs hover:border-emerald-500/50"
                    onClick={() => handleTestInInbox(copy)}
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    Enviar pelo Inbox
                  </Button>
                </div>

                {/* Quick Feedback Counters */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRecordUsage(copy.id, false)}
                    title="Registrar envio (sem fechamento ainda)"
                    className="p-1.5 rounded-lg text-evo-muted hover:text-evo-text hover:bg-evo-surface text-xs"
                  >
                    +1 Envio
                  </button>
                  <button
                    onClick={() => handleRecordUsage(copy.id, true)}
                    title="Registrar venda fechada com esta copy (+1 Conversão)"
                    className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-emerald-500/30"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    +1 Venda Fechada!
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal Gerador de Copys com IA */}
      <Modal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        title="Gerador Preditivo de Copys com IA"
        subtitle="O cérebro comercial analisa seus melhores fechamentos e gera uma abordagem de altíssima taxa de resposta."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-evo-text mb-1">
              Etapa do Funil
            </label>
            <select
              value={genStage}
              onChange={(e) => setGenStage(e.target.value as FunnelStage)}
              className="w-full bg-evo-surface border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support"
            >
              <option value="primeiro_contato">1. Primeiro Contato (Prospecção Fria)</option>
              <option value="quebra_objecao">2. Quebra de Objeção (Preço / Sem Tempo / Já tenho agência)</option>
              <option value="follow_up">3. Follow-up de Reativação</option>
              <option value="fechamento">4. Proposta & Fechamento</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-evo-text mb-1">
              Nicho Alvo
            </label>
            <input
              type="text"
              value={genNiche}
              onChange={(e) => setGenNiche(e.target.value)}
              placeholder="Ex: Advogado Aduaneiro, Imobiliária, E-commerce..."
              className="w-full bg-evo-surface border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-evo-text mb-1">
              Objetivo da Conversão
            </label>
            <input
              type="text"
              value={genObjective}
              onChange={(e) => setGenObjective(e.target.value)}
              placeholder="Ex: Agendar call de 15 minutos, Enviar link de auditoria grátis..."
              className="w-full bg-evo-surface border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-evo-text mb-1">
              Tom da Comunicação
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'consultivo', label: 'Consultivo & Especialista' },
                { id: 'direto', label: 'Ultra Direto (Executivo)' },
                { id: 'descontraido', label: 'Descontraído / WhatsApp' },
                { id: 'urgente', label: 'Urgente / Exclusividade' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setGenTone(t.id as any)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    genTone === t.id
                      ? 'bg-evo-support/15 border-evo-support text-evo-text font-semibold'
                      : 'bg-evo-surface border-evo-border text-evo-muted hover:text-evo-text'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-evo-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsGeneratorOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isGenerating}
              onClick={handleGenerateCopy}
              className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold"
            >
              {isGenerating ? (
                <>Gerando com IA comercial...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-black" />
                  Gerar e Salvar no Funil
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Nova Copy Manual */}
      <Modal
        isOpen={isNewManualOpen}
        onClose={() => setIsNewManualOpen(false)}
        title="Cadastrar Nova Copy Manual"
        subtitle="Adicione abordagens comprovadas que seu time já usa no dia a dia para medir o score."
      >
        <form onSubmit={handleSaveManualCopy} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-evo-text mb-1">
              Título / Nome da Copy
            </label>
            <input
              type="text"
              required
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Ex: Abordagem Direta com Áudio e Demonstração"
              className="w-full bg-evo-surface border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-evo-text mb-1">
                Etapa do Funil
              </label>
              <select
                value={manualStage}
                onChange={(e) => setManualStage(e.target.value as FunnelStage)}
                className="w-full bg-evo-surface border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support"
              >
                <option value="primeiro_contato">1. Primeiro Contato</option>
                <option value="quebra_objecao">2. Quebra de Objeção</option>
                <option value="follow_up">3. Follow-up</option>
                <option value="fechamento">4. Fechamento</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-evo-text mb-1">
                Nicho
              </label>
              <input
                type="text"
                value={manualNiche}
                onChange={(e) => setManualNiche(e.target.value)}
                placeholder="Ex: Advocacia, Imobiliária, Geral"
                className="w-full bg-evo-surface border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-evo-text mb-1">
              Gatilhos Mentais (separados por vírgula)
            </label>
            <input
              type="text"
              value={manualTriggers}
              onChange={(e) => setManualTriggers(e.target.value)}
              placeholder="Prova Social, Urgência, Curiosidade, Autoridade"
              className="w-full bg-evo-surface border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-evo-text mb-1">
              Texto da Mensagem (use {'{nome}'}, {'{empresa}'}, {'{cidade}'})
            </label>
            <textarea
              required
              rows={5}
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              placeholder="Olá {nome}, tudo bem? Notei que a {empresa}..."
              className="w-full bg-evo-surface border border-evo-border rounded-xl p-3 text-xs text-evo-text font-mono focus:outline-none focus:border-evo-support resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-evo-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsNewManualOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Salvar Copy no Funil
            </Button>
          </div>
        </form>
      </Modal>

      {/* WhatsApp Inbox Modal para testes */}
      <WhatsAppInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        lead={{
          id: 'test-lead-funnel',
          name: 'Lead de Demonstração',
          company_name: 'Empresa Teste',
          segment: 'Comercial B2B',
          phone: '11999998888',
          whatsapp: '11999998888',
        }}
        initialMessage={inboxMessage}
      />
    </div>
  );
}
