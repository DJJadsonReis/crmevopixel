'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Lead,
  AutomationTask,
  TaskActionType,
  TaskAudienceFilter,
  TaskBatchConfig,
  Priority,
} from '@/types/database';
import { taskEngine, FilterResult } from '@/lib/services/task-engine';
import {
  X,
  Sparkles,
  Send,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Calendar,
  Layers,
  HelpCircle,
  ShieldCheck,
  Check,
  Filter,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { Button } from '@/components/ui/Button';

interface AutomationDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onSaveTask: (task: AutomationTask) => void;
  taskToEdit?: AutomationTask | null;
}

export function AutomationDrawerModal({
  isOpen,
  onClose,
  leads,
  onSaveTask,
  taskToEdit,
}: AutomationDrawerModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Etapa 1: Tipo & Dados Básicos
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskActionType>('whatsapp_message');
  const [priority, setPriority] = useState<Priority>('alta');
  const [autoExecuteByAi, setAutoExecuteByAi] = useState(true);

  // Etapa 2: Filtros de Audiência & Seleção Manual
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasWhatsappOnly, setHasWhatsappOnly] = useState(true);
  const [hasWebsiteFilter, setHasWebsiteFilter] = useState<'all' | 'with_site' | 'no_site' | 'broken'>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Etapa 3: Mensagem & IA
  const [isAiPersonalized, setIsAiPersonalized] = useState(true);
  const [messageTemplate, setMessageTemplate] = useState(
    'Olá {{nome}}, tudo bem? Notei que a {{empresa}} atua em {{cidade}} e identifiquei uma excelente oportunidade de captação de clientes para seu segmento. Podemos alinhar em 3 minutos?'
  );
  const [copyObjective, setCopyObjective] = useState<
    'prospeccao' | 'followup' | 'apresentacao' | 'reativacao' | 'agendamento'
  >('prospeccao');
  const [copyTone, setCopyTone] = useState<'consultivo' | 'direto' | 'profissional' | 'cordial'>('consultivo');
  const [copyCta, setCopyCta] = useState<'responder' | 'marcar_reuniao' | 'solicitar_analise' | 'whatsapp'>('responder');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<string | null>(null);

  // Etapa 4: Configuração de Lotes & Janela
  const [batchSize, setBatchSize] = useState(20);
  const [batchIntervalMinutes, setBatchIntervalMinutes] = useState(10);
  const [minMessageIntervalSeconds, setMinMessageIntervalSeconds] = useState(15);
  const [maxMessageIntervalSeconds, setMaxMessageIntervalSeconds] = useState(45);
  const [startTimeWindow, setStartTimeWindow] = useState('09:00');
  const [endTimeWindow, setEndTimeWindow] = useState('18:00');
  const [allowWeekends, setAllowWeekends] = useState(false);
  const [startImmediately, setStartImmediately] = useState(true);
  const [scheduledFor, setScheduledFor] = useState('');

  // Preenche dados quando estiver no modo Edição
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setTaskType(taskToEdit.task_type);
      setPriority(taskToEdit.priority);
      setAutoExecuteByAi(taskToEdit.auto_execute_by_ai);
      if (taskToEdit.audience_filter) {
        setSelectedCities(taskToEdit.audience_filter.cities || []);
        setSelectedSegments(taskToEdit.audience_filter.segments || []);
        setSelectedStatuses(taskToEdit.audience_filter.statuses || []);
        setSelectedTags(taskToEdit.audience_filter.tags || []);
        setHasWhatsappOnly(taskToEdit.audience_filter.has_whatsapp ?? true);
        setHasWebsiteFilter(
          taskToEdit.audience_filter.has_website === true
            ? 'with_site'
            : taskToEdit.audience_filter.has_website === false
            ? 'no_site'
            : taskToEdit.audience_filter.broken_website
            ? 'broken'
            : 'all'
        );
        setMinScore(taskToEdit.audience_filter.min_score || 0);
      }
      setSelectedLeadIds(taskToEdit.selected_lead_ids || []);
      if (taskToEdit.message_template) setMessageTemplate(taskToEdit.message_template);
      setIsAiPersonalized(Boolean(taskToEdit.is_ai_personalized));
      if (taskToEdit.ai_copy_config) {
        setCopyObjective(taskToEdit.ai_copy_config.objective as any);
        setCopyTone(taskToEdit.ai_copy_config.tone as any);
        setCopyCta(taskToEdit.ai_copy_config.cta);
      }
      if (taskToEdit.batch_config) {
        setBatchSize(taskToEdit.batch_config.batch_size);
        setBatchIntervalMinutes(taskToEdit.batch_config.batch_interval_minutes);
        setMinMessageIntervalSeconds(taskToEdit.batch_config.min_message_interval_seconds);
        setMaxMessageIntervalSeconds(taskToEdit.batch_config.max_message_interval_seconds);
        setStartTimeWindow(taskToEdit.batch_config.start_time_window);
        setEndTimeWindow(taskToEdit.batch_config.end_time_window);
        setAllowWeekends(taskToEdit.batch_config.allow_weekends);
      }
      setStartImmediately(Boolean(taskToEdit.start_immediately));
      if (taskToEdit.scheduled_for) setScheduledFor(taskToEdit.scheduled_for);
    } else {
      setTitle('');
      setSelectedLeadIds([]);
    }
  }, [taskToEdit, isOpen]);

  // Extrai listas únicas de cidades, segmentos e tags da base
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.city && set.add(l.city));
    return Array.from(set).sort();
  }, [leads]);

  const availableSegments = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.segment && set.add(l.segment));
    return Array.from(set).sort();
  }, [leads]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => (l.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [leads]);

  // Cálculo da audiência em tempo real
  const audienceFilter: TaskAudienceFilter = useMemo(
    () => ({
      cities: selectedCities.length > 0 ? selectedCities : undefined,
      segments: selectedSegments.length > 0 ? selectedSegments : undefined,
      statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      has_whatsapp: hasWhatsappOnly ? true : undefined,
      has_website: hasWebsiteFilter === 'with_site' ? true : hasWebsiteFilter === 'no_site' ? false : undefined,
      broken_website: hasWebsiteFilter === 'broken' ? true : undefined,
      min_score: minScore > 0 ? minScore : undefined,
      search_query: searchQuery.trim() || undefined,
    }),
    [
      selectedCities,
      selectedSegments,
      selectedStatuses,
      selectedTags,
      hasWhatsappOnly,
      hasWebsiteFilter,
      minScore,
      searchQuery,
    ]
  );

  const audienceResult: FilterResult = useMemo(() => {
    return taskEngine.filterAudience(leads, audienceFilter);
  }, [leads, audienceFilter]);

  // Inicializa selectedLeadIds na primeira filtragem se for nova tarefa
  useEffect(() => {
    if (!taskToEdit && selectedLeadIds.length === 0 && audienceResult.eligibleLeads.length > 0) {
      setSelectedLeadIds(audienceResult.eligibleLeads.map((l) => l.id));
    }
  }, [audienceResult.eligibleLeads, taskToEdit]);

  // Leads filtrados para exibição na tabela paginada
  const tableFilteredLeads = useMemo(() => {
    if (!tableSearch.trim()) return audienceResult.eligibleLeads;
    const q = tableSearch.toLowerCase().trim();
    return audienceResult.eligibleLeads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.company_name.toLowerCase().includes(q) ||
        (l.city || '').toLowerCase().includes(q) ||
        (l.segment || '').toLowerCase().includes(q) ||
        (l.whatsapp || '').includes(q)
    );
  }, [audienceResult.eligibleLeads, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(tableFilteredLeads.length / pageSize));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tableFilteredLeads.slice(start, start + pageSize);
  }, [tableFilteredLeads, currentPage, pageSize]);

  const isPageAllSelected =
    paginatedLeads.length > 0 && paginatedLeads.every((l) => selectedLeadIds.includes(l.id));

  const toggleSelectPage = () => {
    if (isPageAllSelected) {
      setSelectedLeadIds((prev) => prev.filter((id) => !paginatedLeads.some((l) => l.id === id)));
    } else {
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...paginatedLeads.map((l) => l.id)])));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Audiência efetiva considerando a seleção manual
  const effectiveSelectedLeads = useMemo(() => {
    if (selectedLeadIds.length > 0) {
      return leads.filter((l) => selectedLeadIds.includes(l.id));
    }
    return audienceResult.eligibleLeads;
  }, [leads, selectedLeadIds, audienceResult.eligibleLeads]);

  const activeAudienceResult = useMemo(() => {
    return taskEngine.filterAudience(effectiveSelectedLeads, audienceFilter);
  }, [effectiveSelectedLeads, audienceFilter]);

  // Lead para prévia ao vivo
  const previewLead = activeAudienceResult.eligibleLeads[0] || leads[0] || null;

  const previewCopy = useMemo(() => {
    if (!previewLead) return 'Nenhum lead disponível para prévia.';
    if (isAiPersonalized) {
      return taskEngine.generatePersonalizedCopy(previewLead, {
        ai_copy_config: { objective: copyObjective, tone: copyTone, cta: copyCta },
      });
    }
    return taskEngine.substituteVariables(messageTemplate, previewLead);
  }, [previewLead, isAiPersonalized, messageTemplate, copyObjective, copyTone, copyCta]);

  const handleTestSend = async () => {
    if (!testPhoneNumber.trim()) return;
    setIsSendingTest(true);
    setTestSendResult(null);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhoneNumber,
          text: `[TESTE DE AUTOMAÇÃO]:\n${previewCopy}`,
          leadId: previewLead?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSendResult('Mensagem de teste disparada com sucesso via WhatsApp!');
      } else {
        setTestSendResult(`Erro no envio: ${data.message}`);
      }
    } catch (err: any) {
      setTestSendResult(`Falha na requisição: ${err?.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleConfirmTask = () => {
    if (!title.trim()) return;

    const leadsForDispatches = selectedLeadIds.length > 0 ? selectedLeadIds : audienceResult.eligibleLeads.map((l) => l.id);
    const summary = activeAudienceResult.summary;

    const newTask: AutomationTask = {
      id: taskToEdit ? taskToEdit.id : crypto.randomUUID(),
      title: title.trim(),
      task_type: taskType,
      status: taskToEdit?.status && taskToEdit.status !== 'completed' ? taskToEdit.status : (startImmediately ? 'running' : 'scheduled'),
      priority,
      assigned_to: 'agente_ia',
      auto_execute_by_ai: autoExecuteByAi,
      audience_filter: audienceFilter,
      selected_lead_ids: leadsForDispatches,
      audience_summary: summary,
      message_template: isAiPersonalized ? undefined : messageTemplate,
      is_ai_personalized: isAiPersonalized,
      ai_copy_config: {
        objective: copyObjective,
        tone: copyTone,
        cta: copyCta,
      },
      scheduled_for: startImmediately ? undefined : scheduledFor || new Date().toISOString(),
      start_immediately: startImmediately,
      batch_config: {
        batch_size: batchSize,
        batch_interval_minutes: batchIntervalMinutes,
        min_message_interval_seconds: minMessageIntervalSeconds,
        max_message_interval_seconds: maxMessageIntervalSeconds,
        start_time_window: startTimeWindow,
        end_time_window: endTimeWindow,
        allow_weekends: allowWeekends,
        timezone: 'America/Sao_Paulo',
      },
      progress: taskToEdit?.progress || {
        total: summary.eligible,
        eligible: summary.eligible,
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0,
        failed: 0,
        opt_outs: 0,
        current_batch_index: 0,
        total_batches: Math.ceil(summary.eligible / batchSize),
      },
      execution_logs: taskToEdit?.execution_logs || [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          message: `Campanha criada com ${summary.eligible} destinatários elegíveis. Lotes de ${batchSize} contatos.`,
          type: 'info',
        },
      ],
      created_at: taskToEdit ? taskToEdit.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSaveTask(newTask);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl h-full bg-evo-deep border-l border-evo-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 bg-evo-card border-b border-evo-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-evo-accent/15 border border-evo-accent/30 flex items-center justify-center text-evo-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-evo-text font-heading">
                Central de Automação & Tarefas em Lote
              </h2>
              <p className="text-xs text-evo-muted font-mono">
                Etapa {currentStep} de 5: {
                  currentStep === 1 ? 'Tipo de Ação' :
                  currentStep === 2 ? 'Seleção Segura de Audiência' :
                  currentStep === 3 ? 'Compositor de Mensagem & IA' :
                  currentStep === 4 ? 'Lotes & Janela Operacional' : 'Revisão & Ativação'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-evo-muted hover:text-evo-text hover:bg-evo-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Tabs */}
        <div className="flex items-center justify-between border-b border-evo-border bg-evo-surface/30 px-6 py-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
          {[
            { step: 1, label: '1. Ação' },
            { step: 2, label: '2. Audiência' },
            { step: 3, label: '3. Mensagem' },
            { step: 4, label: '4. Lotes' },
            { step: 5, label: '5. Revisão' },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => setCurrentStep(item.step as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentStep === item.step
                  ? 'bg-evo-accent text-[#07100F] font-bold shadow-sm'
                  : currentStep > item.step
                  ? 'text-evo-accent hover:bg-evo-surface'
                  : 'text-evo-disabled hover:text-evo-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* ETAPA 1: TIPO DE AÇÃO & DADOS BÁSICOS */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-evo-muted uppercase tracking-wider mb-2">
                  Título da Automação *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Campanha de Reativação Contabilidade Curitiba WhatsApp"
                  className="w-full px-4 py-2.5 bg-evo-card border border-evo-border rounded-xl text-sm text-evo-text placeholder-evo-muted focus:outline-none focus:border-evo-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-evo-muted uppercase tracking-wider mb-3">
                  Selecione o Tipo de Ação Operacional
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'whatsapp_message',
                      title: 'Disparo WhatsApp em Lote',
                      desc: 'Envio de mensagem direta com proteção anti-bloqueio e intervalo inteligente.',
                      icon: <WhatsAppIcon className="w-5 h-5 text-emerald-400" />,
                    },
                    {
                      id: 'followup',
                      title: 'Follow-up Inteligente',
                      desc: 'Reaquecimento autônomo de leads sem resposta após 24h ou 48h.',
                      icon: <Clock className="w-5 h-5 text-blue-400" />,
                    },
                    {
                      id: 'campaign',
                      title: 'Campanha de Prospecção Ativa',
                      desc: 'Abordagem fria personalizada em escala baseada no nicho do lead.',
                      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
                    },
                    {
                      id: 'cross_reference',
                      title: 'Cruzamento de Dados em Massa',
                      desc: 'Audita sites, DNS, PageSpeed v5 e gera diagnóstico para todos os leads.',
                      icon: <Layers className="w-5 h-5 text-purple-400" />,
                    },
                    {
                      id: 'pipeline_move',
                      title: 'Movimentação em Pipeline',
                      desc: 'Atualiza o estágio comercial de leads qualificados de forma automatizada.',
                      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setTaskType(item.id as any)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        taskType === item.id
                          ? 'bg-evo-accent/10 border-evo-accent shadow-sm'
                          : 'bg-evo-card border-evo-border hover:bg-evo-surface'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {item.icon}
                        <h4 className="text-sm font-semibold text-evo-text font-heading">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-evo-muted leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-evo-card border border-evo-border rounded-xl text-xs text-evo-text focus:outline-none focus:border-evo-accent"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="autoExecuteByAi"
                    checked={autoExecuteByAi}
                    onChange={(e) => setAutoExecuteByAi(e.target.checked)}
                    className="w-4 h-4 accent-evo-accent rounded"
                  />
                  <label htmlFor="autoExecuteByAi" className="text-xs text-evo-text cursor-pointer">
                    Executar pelo <strong>Agente IA Autônomo</strong>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 2: SELEÇÃO SEGURA DE AUDIÊNCIA */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Painel do Resumo de Audiência em Tempo Real */}
              <div className="p-4 rounded-2xl bg-evo-card border border-evo-border shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-evo-text uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Resumo da Audiência em Tempo Real
                  </h4>
                  <span className="text-xs font-bold text-evo-accent font-mono">
                    {audienceResult.summary.eligible} Elegíveis
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-2">
                  <div className="p-2 rounded-xl bg-evo-surface border border-evo-border">
                    <div className="text-xs text-evo-muted">Total</div>
                    <div className="text-sm font-bold text-evo-text">{audienceResult.summary.total_selected}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-xs text-emerald-400">WhatsApp</div>
                    <div className="text-sm font-bold text-emerald-400">{audienceResult.summary.valid_whatsapp}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="text-xs text-red-400">Sem Whats</div>
                    <div className="text-sm font-bold text-red-400">{audienceResult.summary.invalid_whatsapp}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="text-xs text-amber-400">Suprimidos</div>
                    <div className="text-sm font-bold text-amber-400">{audienceResult.summary.suppressed}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="text-xs text-blue-400">Duplicados</div>
                    <div className="text-sm font-bold text-blue-400">{audienceResult.summary.duplicates}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50">
                    <div className="text-xs text-emerald-300 font-bold">Disparos</div>
                    <div className="text-sm font-bold text-emerald-300">{audienceResult.summary.eligible}</div>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Filtro por Cidades */}
                <div>
                  <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
                    Cidades ({availableCities.length})
                  </label>
                  <select
                    multiple
                    value={selectedCities}
                    onChange={(e) =>
                      setSelectedCities(Array.from(e.target.selectedOptions, (opt) => opt.value))
                    }
                    className="w-full h-24 p-2 bg-evo-card border border-evo-border rounded-xl text-xs text-evo-text focus:outline-none focus:border-evo-accent"
                  >
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-evo-muted mt-0.5 block">
                    Segure Ctrl para selecionar múltiplas cidades
                  </span>
                </div>

                {/* Filtro por Segmentos */}
                <div>
                  <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
                    Segmentos / Nichos ({availableSegments.length})
                  </label>
                  <select
                    multiple
                    value={selectedSegments}
                    onChange={(e) =>
                      setSelectedSegments(Array.from(e.target.selectedOptions, (opt) => opt.value))
                    }
                    className="w-full h-24 p-2 bg-evo-card border border-evo-border rounded-xl text-xs text-evo-text focus:outline-none focus:border-evo-accent"
                  >
                    {availableSegments.map((seg) => (
                      <option key={seg} value={seg}>
                        {seg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Presença Web & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
                    Saúde do Site / Presença Web
                  </label>
                  <select
                    value={hasWebsiteFilter}
                    onChange={(e) => setHasWebsiteFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-evo-card border border-evo-border rounded-xl text-xs text-evo-text focus:outline-none focus:border-evo-accent"
                  >
                    <option value="all">Todos os Leads</option>
                    <option value="with_site">Possuem Website</option>
                    <option value="no_site">Sem Website (Oportunidade Criação)</option>
                    <option value="broken">Sites Lentos / Fora do Ar (Oportunidade Manutenção)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
                    Score Mínimo (Qualificação)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full accent-evo-accent"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-evo-muted">
                    <span>Mínimo: {minScore} pts</span>
                    <span>100 pts</span>
                  </div>
                </div>
              </div>

              {/* Post-it / Tags */}
              {availableTags.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-evo-muted uppercase mb-1.5">
                    Filtrar por Post-it / Etiquetas
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTags(selectedTags.filter((t) => t !== tag));
                            } else {
                              setSelectedTags([...selectedTags, tag]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-[#111b21] font-bold shadow-sm'
                              : 'bg-evo-card text-evo-muted border border-evo-border hover:text-evo-text'
                          }`}
                        >
                          🏷️ {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tabela Interativa de Seleção Manual de Leads */}
              <div className="p-4 rounded-2xl bg-evo-card border border-evo-border shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-evo-border">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-evo-accent" />
                    <span className="text-xs font-bold text-evo-text uppercase tracking-wider font-mono">
                      Seleção Manual de Leads ({tableFilteredLeads.length})
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-evo-accent/15 text-evo-accent border border-evo-accent/30">
                      {selectedLeadIds.length} selecionados
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedLeadIds(audienceResult.eligibleLeads.map((l) => l.id))}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-evo-surface hover:bg-evo-surface2 text-evo-accent border border-evo-accent/30 transition-colors"
                    >
                      Selecionar Todos do Filtro ({audienceResult.eligibleLeads.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLeadIds([])}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-evo-surface hover:bg-evo-surface2 text-evo-muted hover:text-red-400 border border-evo-border transition-colors"
                    >
                      Limpar Seleção
                    </button>
                  </div>
                </div>

                {/* Campo de Busca Rápida na Tabela */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filtrar por nome, empresa, cidade ou whatsapp..."
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-evo-surface border border-evo-border text-xs text-evo-text placeholder-[#65706A] focus:outline-none focus:border-evo-accent font-mono"
                  />
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto rounded-xl border border-evo-border">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-evo-surface text-[10px] font-mono text-evo-muted border-b border-evo-border">
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isPageAllSelected}
                            onChange={toggleSelectPage}
                            className="w-3.5 h-3.5 accent-evo-accent cursor-pointer"
                            title="Selecionar / Desmarcar todos desta página"
                          />
                        </th>
                        <th className="py-2.5 px-3 font-semibold">Empresa / Contato</th>
                        <th className="py-2.5 px-3 font-semibold">WhatsApp</th>
                        <th className="py-2.5 px-3 font-semibold">Cidade / Nicho</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-evo-border/50">
                      {paginatedLeads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-xs text-evo-muted">
                            Nenhum lead encontrado com os filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        paginatedLeads.map((lead) => {
                          const isSelected = selectedLeadIds.includes(lead.id);
                          return (
                            <tr
                              key={lead.id}
                              onClick={() => toggleSelectLead(lead.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-evo-accent/10 hover:bg-evo-accent/15' : 'hover:bg-evo-surface/60'
                              }`}
                            >
                              <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectLead(lead.id)}
                                  className="w-3.5 h-3.5 accent-evo-accent cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-evo-text truncate max-w-[180px]">
                                  {lead.company_name}
                                </div>
                                <div className="text-[10px] text-evo-muted truncate max-w-[180px]">
                                  {lead.name}
                                </div>
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-evo-support">
                                {lead.whatsapp || lead.phone || '—'}
                              </td>
                              <td className="py-2 px-3">
                                <div className="text-evo-text text-[11px]">{lead.city || 'São Paulo, SP'}</div>
                                <div className="text-[10px] text-evo-muted truncate max-w-[140px]">{lead.segment}</div>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    lead.score >= 80
                                      ? 'text-evo-accent bg-evo-accent/15'
                                      : lead.score >= 60
                                      ? 'text-evo-support bg-evo-support/15'
                                      : 'text-evo-muted bg-evo-surface'
                                  }`}
                                >
                                  {lead.score}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginação da Tabela de Seleção */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-evo-muted pt-1">
                    <span>
                      Página {currentPage} de {totalPages} ({tableFilteredLeads.length} leads)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2 py-0.5 rounded bg-evo-surface border border-evo-border disabled:opacity-40 text-xs hover:text-evo-text"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2 py-0.5 rounded bg-evo-surface border border-evo-border disabled:opacity-40 text-xs hover:text-evo-text"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 3: COMPOSITOR DE MENSAGEM & IA */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Alternância: Modo Mensagem Única vs Personalização IA */}
              <div className="flex items-center gap-3 p-1 rounded-xl bg-evo-card border border-evo-border">
                <button
                  type="button"
                  onClick={() => setIsAiPersonalized(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isAiPersonalized
                      ? 'bg-evo-accent text-[#07100F] shadow-sm'
                      : 'text-evo-muted hover:text-evo-text'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Personalização IA Individual (Recomendado)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAiPersonalized(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    !isAiPersonalized
                      ? 'bg-evo-accent text-[#07100F] shadow-sm'
                      : 'text-evo-muted hover:text-evo-text'
                  }`}
                >
                  <span>Mensagem Única com Tags</span>
                </button>
              </div>

              {isAiPersonalized ? (
                <div className="space-y-4 p-4 rounded-xl bg-evo-surface/30 border border-evo-border">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-evo-muted font-semibold mb-1">Objetivo</label>
                      <select
                        value={copyObjective}
                        onChange={(e) => setCopyObjective(e.target.value as any)}
                        className="w-full px-3 py-2 bg-evo-card border border-evo-border rounded-xl text-evo-text"
                      >
                        <option value="prospeccao">Prospecção Fria</option>
                        <option value="followup">Follow-up Acompanhamento</option>
                        <option value="apresentacao">Apresentação da Empresa</option>
                        <option value="reativacao">Reativação de Contato</option>
                        <option value="agendamento">Agendamento de Demonstração</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-evo-muted font-semibold mb-1">Tom de Voz</label>
                      <select
                        value={copyTone}
                        onChange={(e) => setCopyTone(e.target.value as any)}
                        className="w-full px-3 py-2 bg-evo-card border border-evo-border rounded-xl text-evo-text"
                      >
                        <option value="consultivo">Consultivo & Parceiro</option>
                        <option value="direto">Direto ao Ponto</option>
                        <option value="profissional">Profissional Formal</option>
                        <option value="cordial">Cordial & Simpático</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-evo-muted font-semibold mb-1">Chamada p/ Ação (CTA)</label>
                      <select
                        value={copyCta}
                        onChange={(e) => setCopyCta(e.target.value as any)}
                        className="w-full px-3 py-2 bg-evo-card border border-evo-border rounded-xl text-evo-text"
                      >
                        <option value="responder">Pergunta de Resposta Direta</option>
                        <option value="marcar_reuniao">Convidar para Chamada 5min</option>
                        <option value="solicitar_analise">Oferecer Diagnóstico PDF</option>
                        <option value="whatsapp">Pedir Retorno WhatsApp</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-evo-muted">
                    ✨ O Agente analisará individualmente o site, a saúde técnica, os ganchos do cruzamento de dados e os serviços recomendados de cada lead para compor o texto.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-evo-muted uppercase">
                    Template com Variáveis
                  </label>
                  <textarea
                    rows={4}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="w-full p-3 bg-evo-card border border-evo-border rounded-xl text-xs text-evo-text focus:outline-none focus:border-evo-accent leading-relaxed"
                  />
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="text-evo-muted mr-1 font-mono">Variáveis disponíveis:</span>
                    {['{{nome}}', '{{empresa}}', '{{cidade}}', '{{segmento}}', '{{site}}', '{{diagnostico}}', '{{oportunidade}}'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setMessageTemplate((prev) => prev + ` ${tag}`)}
                        className="px-2 py-0.5 rounded bg-evo-surface text-evo-accent border border-evo-border font-mono hover:bg-evo-accent/10"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prévia ao Vivo de um Lead */}
              <div className="p-4 rounded-xl bg-[#111b21] border border-[#202c33] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#8696a0] font-mono">
                    Prévia ao Vivo ({previewLead?.company_name || 'Exemplo'})
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">WhatsApp Web Preview</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#005c4b] text-[#e9edef] text-xs leading-relaxed whitespace-pre-wrap shadow-md">
                  {previewCopy}
                </div>
              </div>

              {/* Disparo de Teste Autorizado */}
              <div className="p-4 rounded-xl bg-evo-card border border-evo-border space-y-3">
                <h4 className="text-xs font-semibold text-evo-text uppercase font-mono">
                  Disparo de Teste (Validação Prévia)
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Seu número WhatsApp (ex: 47999999999)"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-evo-surface border border-evo-border rounded-xl text-xs text-evo-text focus:outline-none focus:border-evo-accent"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleTestSend}
                    disabled={isSendingTest || !testPhoneNumber.trim()}
                    className="gap-1.5 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingTest ? 'Enviando...' : 'Enviar Teste'}</span>
                  </Button>
                </div>
                {testSendResult && (
                  <p className="text-xs text-emerald-400 font-mono">{testSendResult}</p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 4: LOTES & JANELA OPERACIONAL */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
                    Tamanho do Lote (por rodada)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-evo-card border border-evo-border rounded-xl text-xs text-evo-text"
                  />
                  <span className="text-[10px] text-evo-muted mt-0.5 block">
                    Recomendado: 15 a 25 mensagens por lote
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
                    Pausa entre Lotes (minutos)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    value={batchIntervalMinutes}
                    onChange={(e) => setBatchIntervalMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-evo-card border border-evo-border rounded-xl text-xs text-evo-text"
                  />
                </div>
              </div>

              {/* Intervalo entre Mensagens (Random Delay) */}
              <div className="p-4 rounded-xl bg-evo-card border border-evo-border space-y-3">
                <h4 className="text-xs font-semibold text-evo-text uppercase font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Proteção Anti-Bloqueio WhatsApp
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-evo-muted block mb-1">Intervalo Mínimo (seg)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={minMessageIntervalSeconds}
                      onChange={(e) => setMinMessageIntervalSeconds(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-evo-surface border border-evo-border rounded-lg text-xs text-evo-text"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-evo-muted block mb-1">Intervalo Máximo (seg)</label>
                    <input
                      type="number"
                      min="15"
                      max="120"
                      value={maxMessageIntervalSeconds}
                      onChange={(e) => setMaxMessageIntervalSeconds(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-evo-surface border border-evo-border rounded-lg text-xs text-evo-text"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-evo-muted">
                  O sistema varia aleatoriamente o tempo entre cada disparo para simular digitação humana real.
                </p>
              </div>

              {/* Janela Operacional de Horário */}
              <div className="p-4 rounded-xl bg-evo-card border border-evo-border space-y-3">
                <h4 className="text-xs font-semibold text-evo-text uppercase font-mono flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" /> Janela Operacional Permitida
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-evo-muted block mb-1">Horário de Início</label>
                    <input
                      type="time"
                      value={startTimeWindow}
                      onChange={(e) => setStartTimeWindow(e.target.value)}
                      className="w-full px-3 py-1.5 bg-evo-surface border border-evo-border rounded-lg text-xs text-evo-text"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-evo-muted block mb-1">Horário de Fim</label>
                    <input
                      type="time"
                      value={endTimeWindow}
                      onChange={(e) => setEndTimeWindow(e.target.value)}
                      className="w-full px-3 py-1.5 bg-evo-surface border border-evo-border rounded-lg text-xs text-evo-text"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="allowWeekends"
                    checked={allowWeekends}
                    onChange={(e) => setAllowWeekends(e.target.checked)}
                    className="accent-evo-accent"
                  />
                  <label htmlFor="allowWeekends" className="text-xs text-evo-muted cursor-pointer">
                    Permitir disparos aos sábados e domingos
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 5: REVISÃO & ATIVAÇÃO */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-evo-card border border-evo-border space-y-4">
                <h3 className="text-base font-semibold text-evo-text font-heading flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Resumo da Configuração da Automação
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs divide-y sm:divide-y-0 sm:divide-x divide-evo-border">
                  <div className="space-y-2 pr-2">
                    <div>
                      <span className="text-evo-muted">Campanha:</span>
                      <p className="font-semibold text-evo-text">{title || 'Sem título'}</p>
                    </div>
                    <div>
                      <span className="text-evo-muted">Tipo de Ação:</span>
                      <p className="font-semibold text-evo-text">{taskType}</p>
                    </div>
                    <div>
                      <span className="text-evo-muted">Modo de Copy:</span>
                      <p className="font-semibold text-evo-accent">
                        {isAiPersonalized ? 'Personalização IA Autônoma' : 'Template Fixo com Tags'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 sm:pl-4 pt-2 sm:pt-0">
                    <div>
                      <span className="text-evo-muted">Destinatários Elegíveis:</span>
                      <p className="text-base font-bold text-emerald-400 font-mono">
                        {audienceResult.summary.eligible} leads
                      </p>
                    </div>
                    <div>
                      <span className="text-evo-muted">Configuração de Lotes:</span>
                      <p className="font-semibold text-evo-text">
                        {batchSize} msgs/lote • {batchIntervalMinutes}m intervalo • {startTimeWindow} às {endTimeWindow}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-evo-surface border border-evo-border">
                <input
                  type="checkbox"
                  id="startImmediately"
                  checked={startImmediately}
                  onChange={(e) => setStartImmediately(e.target.checked)}
                  className="w-4 h-4 accent-evo-accent rounded"
                />
                <label htmlFor="startImmediately" className="text-xs text-evo-text cursor-pointer">
                  <strong>Iniciar execução do primeiro lote imediatamente</strong> após salvar
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Navigation */}
        <div className="p-4 bg-evo-card border-t border-evo-border flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (currentStep > 1) setCurrentStep((s) => (s - 1) as any);
              else onClose();
            }}
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (currentStep === 1 && !title.trim()) {
                    alert('Por favor, informe o título da automação.');
                    return;
                  }
                  setCurrentStep((s) => (s + 1) as any);
                }}
              >
                Avançar
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5"
                onClick={handleConfirmTask}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ativar Automação</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
