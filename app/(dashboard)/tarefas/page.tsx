'use client';

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { crmService } from '@/lib/services/crm-service';
import { dbService } from '@/lib/supabase/db-service';
import { useCrmSync } from '@/lib/hooks/useCrmSync';
import { Priority, TaskItem, AutomationTask, Lead } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { AutomationDrawerModal } from '@/components/automation/AutomationDrawerModal';
import { AutomationCampaignCard } from '@/components/automation/AutomationCampaignCard';
import { AutomationExecutionLogsModal } from '@/components/automation/AutomationExecutionLogsModal';
import {
  CheckSquare,
  Plus,
  Calendar,
  Kanban,
  List,
  CheckCircle2,
  Clock,
  Bot,
  User,
  Sparkles,
  Zap,
  Play,
  Layers,
  Send,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

export type TarefasTabType =
  | 'TODAS'
  | 'RASCUNHOS'
  | 'AGENDADAS'
  | 'EM_EXECUCAO'
  | 'PAUSADAS'
  | 'CONCLUIDAS'
  | 'COM_ERRO'
  | 'CANCELADAS'
  | 'ROTINAS';

export default function TarefasPage() {
  useCrmSync();
  const [leads, setLeads] = useState<Lead[]>(() => crmService.getLeads());
  const [tasks, setTasks] = useState<TaskItem[]>(() => crmService.getTasks());
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([]);
  const [activeTab, setActiveTab] = useState<TarefasTabType>('TODAS');
  const [editingAutomationTask, setEditingAutomationTask] = useState<AutomationTask | null>(null);
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista');
  const [filterAssignee, setFilterAssignee] = useState<'todos' | 'agente_ia' | 'operador'>('todos');

  // Modals
  const [isAutomationDrawerOpen, setIsAutomationDrawerOpen] = useState(false);
  const [isOperationalModalOpen, setIsOperationalModalOpen] = useState(false);
  const [selectedTaskForLogs, setSelectedTaskForLogs] = useState<AutomationTask | null>(null);
  const [isGeneratingAiTasks, setIsGeneratingAiTasks] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form operational task
  const [newTitle, setNewTitle] = useState('');
  const [newRelated, setNewRelated] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('alta');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newAssignedTo, setNewAssignedTo] = useState<'operador' | 'agente_ia' | 'ambos'>('agente_ia');
  const [newAutoExecute, setNewAutoExecute] = useState(true);

  // Sincroniza dados
  const loadAutomationTasks = async () => {
    try {
      const dbTasks = await dbService.getAutomationTasks();
      if (dbTasks && dbTasks.length > 0) {
        setAutomationTasks(dbTasks);
      } else {
        const saved = localStorage.getItem('crm_automation_tasks');
        if (saved) {
          setAutomationTasks(JSON.parse(saved));
        }
      }
    } catch {
      const saved = localStorage.getItem('crm_automation_tasks');
      if (saved) setAutomationTasks(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadAutomationTasks();
    const unsub = crmService.subscribe(() => {
      setLeads([...crmService.getLeads()]);
      setTasks([...crmService.getTasks()]);
    });
    return unsub;
  }, []);

  const handleUpdateSingleTask = (updatedTask: AutomationTask) => {
    setAutomationTasks((prev) => {
      const next = prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
      try {
        localStorage.setItem('crm_automation_tasks', JSON.stringify(next));
      } catch (e) {
        console.warn('Erro ao salvar no localStorage:', e);
      }
      return next;
    });
  };

  // In-flight guard para evitar disparos concorrentes para a mesma tarefa
  const inFlightTasksRef = React.useRef<Set<string>>(new Set());

  // Loop de Execução Automática de Lotes para Tarefas RUNNING
  useEffect(() => {
    const runningTasks = automationTasks.filter((t) => t.status === 'running');
    if (runningTasks.length === 0) return;

    const interval = setInterval(async () => {
      for (const t of runningTasks) {
        // Se a tarefa já está executando uma requisição em paralelo, aguarda
        if (inFlightTasksRef.current.has(t.id)) continue;

        // Se a tarefa está em pausa programada entre lotes (next_batch_at), respeita o tempo
        if (t.progress?.next_batch_at) {
          const nextTime = new Date(t.progress.next_batch_at).getTime();
          if (Date.now() < nextTime) {
            continue; // Aguarda o fim do intervalo configurado
          }
        }

        inFlightTasksRef.current.add(t.id);

        try {
          const res = await fetch('/api/tasks/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: t.id, action: 'resume', taskData: t, leads }),
          });
          if (res.ok) {
            const data = await res.json().catch(() => null);

            // Sincroniza mensagens disparadas diretamente no Inbox e no crmService
            if (data?.dispatchedMessages && Array.isArray(data.dispatchedMessages)) {
              data.dispatchedMessages.forEach((msg: any) => {
                crmService.addMessageLog(msg);
              });
            }

            if (data?.task) {
              handleUpdateSingleTask(data.task);
            } else {
              loadAutomationTasks();
            }
          }
        } catch (err) {
          console.error('Erro no loop de lote da automação:', err);
        } finally {
          inFlightTasksRef.current.delete(t.id);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [automationTasks, leads]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveAutomationTask = async (task: AutomationTask) => {
    const exists = automationTasks.some((t) => t.id === task.id);
    const updated = exists
      ? automationTasks.map((t) => (t.id === task.id ? task : t))
      : [task, ...automationTasks];

    setAutomationTasks(updated);
    try {
      localStorage.setItem('crm_automation_tasks', JSON.stringify(updated));
      await dbService.saveAutomationTask(task);

      if (task.start_immediately && task.status === 'running') {
        fetch('/api/tasks/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.id, action: 'start', taskData: task, leads, force: true }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.dispatchedMessages && Array.isArray(data.dispatchedMessages)) {
              data.dispatchedMessages.forEach((msg: any) => {
                crmService.addMessageLog(msg);
              });
            }
            if (data?.task) {
              handleUpdateSingleTask(data.task);
            } else {
              loadAutomationTasks();
            }
          })
          .catch(() => loadAutomationTasks());
      }
    } catch (e) {
      console.warn('Erro ao salvar tarefa no Supabase:', e);
    }
    setEditingAutomationTask(null);
    showToast(`Automação "${task.title}" salva com sucesso!`);
  };

  const handleEditAutomationTask = (task: AutomationTask) => {
    setEditingAutomationTask(task);
    setIsAutomationDrawerOpen(true);
  };

  const handleDeleteAutomationTask = async (taskId: string) => {
    const updated = automationTasks.filter((t) => t.id !== taskId);
    setAutomationTasks(updated);
    localStorage.setItem('crm_automation_tasks', JSON.stringify(updated));
    showToast('Automação excluída com sucesso.');
  };

  const handleDuplicateAutomationTask = (task: AutomationTask) => {
    const duplicated: AutomationTask = {
      ...task,
      id: crypto.randomUUID(),
      title: `${task.title} (Cópia)`,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress: {
        total: task.progress?.total || 0,
        eligible: task.progress?.eligible || 0,
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0,
        failed: 0,
        opt_outs: 0,
        current_batch_index: 0,
        total_batches: task.progress?.total_batches || 1,
      },
      execution_logs: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          message: `Campanha duplicada a partir de "${task.title}".`,
          type: 'info',
        },
      ],
    };
    handleSaveAutomationTask(duplicated);
  };

  const handleCreateOperationalTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    crmService.addTask({
      title: newTitle.trim(),
      related_to: newRelated.trim() || 'Operação Comercial',
      start_date: newStartDate,
      due_date: newDueDate,
      start_time: newStartTime,
      end_time: newEndTime,
      status: 'pendente',
      priority: newPriority,
      assigned_to: newAssignedTo,
      auto_execute: newAutoExecute,
    });

    setTasks([...crmService.getTasks()]);
    setNewTitle('');
    setNewRelated('');
    setIsOperationalModalOpen(false);
    showToast('Tarefa operacional criada com sucesso!');
  };

  const handleToggleTask = (id: string) => {
    crmService.toggleTaskStatus(id);
    setTasks([...crmService.getTasks()]);
  };

  // Gerar Tarefas Autônomas via Agente IA
  const handleGenerateAiTasks = () => {
    setIsGeneratingAiTasks(true);
    const today = new Date().toISOString().split('T')[0];

    const generated: Omit<TaskItem, 'id'>[] = [
      {
        title: '🤖 Follow-up Autônomo WhatsApp (Leads Sem Resposta >24h)',
        related_to: 'Radar de Prospecção Ativa',
        start_date: today,
        due_date: today,
        start_time: '10:00',
        end_time: '10:30',
        status: 'pendente',
        priority: 'alta',
        assigned_to: 'agente_ia',
        auto_execute: true,
        execution_notes: 'Disparo de gatilho leve de acompanhamento para reaquecer conversas paradas.',
      },
      {
        title: '🔍 Auditoria Técnica de Sites & PageSpeed v5 em Lote',
        related_to: 'Inteligência Comercial',
        start_date: today,
        due_date: today,
        start_time: '11:00',
        end_time: '11:45',
        status: 'pendente',
        priority: 'alta',
        assigned_to: 'agente_ia',
        auto_execute: true,
        execution_notes: 'Varredura automática para identificar sites fora do ar e gerar ganchos comerciais.',
      },
      {
        title: '💼 Revisão de Oportunidades Quentes do Funil Comercial',
        related_to: 'Fechamento de Contratos',
        start_date: today,
        due_date: today,
        start_time: '14:00',
        end_time: '14:30',
        status: 'pendente',
        priority: 'alta',
        assigned_to: 'ambos',
        auto_execute: false,
        execution_notes: 'Alinhar propostas enviadas que aguardam retorno de decisores.',
      },
    ];

    generated.forEach((gt) => crmService.addTask(gt));
    setTasks([...crmService.getTasks()]);
    setIsGeneratingAiTasks(false);
    showToast('3 Tarefas estratégicas geradas pelo Agente IA!');
  };

  // Métricas Consolidadas
  const totalAutomationTasks = automationTasks.length;
  const runningAutomations = automationTasks.filter((t) => t.status === 'running').length;
  const totalDispatchesSent = automationTasks.reduce((acc, t) => acc + (t.progress?.sent || 0), 0);
  const totalDispatchesFailed = automationTasks.reduce((acc, t) => acc + (t.progress?.failed || 0), 0);
  const deliveryRate = totalDispatchesSent + totalDispatchesFailed > 0
    ? Math.round((totalDispatchesSent / (totalDispatchesSent + totalDispatchesFailed)) * 100)
    : 100;

  // Filtragem de Automações por Aba
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAutomations = automationTasks.filter((task) => {
    if (activeTab === 'TODAS') return true;
    if (activeTab === 'RASCUNHOS') return task.status === 'draft';
    if (activeTab === 'AGENDADAS') return task.status === 'scheduled';
    if (activeTab === 'EM_EXECUCAO') return task.status === 'running';
    if (activeTab === 'PAUSADAS') return task.status === 'paused';
    if (activeTab === 'CONCLUIDAS') return task.status === 'completed';
    if (activeTab === 'COM_ERRO') return task.status === 'failed' || (task.progress && task.progress.failed > 0);
    if (activeTab === 'CANCELADAS') return task.status === 'canceled';
    return true;
  });

  const filteredOperationalTasks = tasks.filter((t) => {
    if (filterAssignee === 'agente_ia') return t.assigned_to === 'agente_ia';
    if (filterAssignee === 'operador') return t.assigned_to === 'operador';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-evo-accent/15 text-evo-accent border border-evo-accent/30 font-mono">
              CENTRAL OPERACIONAL DE AUTOMAÇÕES
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-evo-text font-heading mt-1">
            Tarefas & Automações em Lote
          </h1>
          <p className="text-xs text-evo-muted mt-1">
            Orquestre campanhas em massa no WhatsApp, disparos por lote, follow-ups inteligentes, cruzamentos e rotinas da EVO PIXEL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 text-xs border-evo-accent/30 text-evo-accent hover:bg-evo-accent/10"
            onClick={handleGenerateAiTasks}
            disabled={isGeneratingAiTasks}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAiTasks ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAiTasks ? 'Gerando...' : 'Sugerir Tarefas com IA'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setIsOperationalModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tarefa Operacional</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => setIsAutomationDrawerOpen(true)}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>+ Nova Automação em Lote</span>
          </Button>
        </div>
      </div>

      {/* Toast Notificação */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-evo-accent/10 border border-evo-accent/30 text-xs text-evo-accent flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-evo-muted">
            <span>Automações Ativas</span>
            <Layers className="w-4 h-4 text-evo-accent" />
          </div>
          <div className="text-2xl font-bold text-evo-text font-mono">
            {runningAutomations}
            <span className="text-xs text-evo-muted font-normal ml-1">/ {totalAutomationTasks}</span>
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-evo-muted">
            <span>Disparos Realizados</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {totalDispatchesSent}
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-evo-muted">
            <span>Taxa de Entrega</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {deliveryRate}%
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-evo-muted">
            <span>Rotinas Operacionais</span>
            <CheckSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {tasks.filter((t) => t.status === 'pendente').length}
          </div>
        </Card>
      </div>

      {/* Abas da Central Operacional */}
      <div className="flex items-center justify-between border-b border-evo-border pb-1 overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1">
          {[
            { id: 'TODAS', label: 'Todas 🌐' },
            { id: 'RASCUNHOS', label: 'Rascunhos 📝' },
            { id: 'AGENDADAS', label: 'Agendadas 📅' },
            { id: 'EM_EXECUCAO', label: 'Em Execução 🚀' },
            { id: 'PAUSADAS', label: 'Pausadas ⏸️' },
            { id: 'CONCLUIDAS', label: 'Concluídas ✅' },
            { id: 'COM_ERRO', label: 'Com Erro ⚠️' },
            { id: 'CANCELADAS', label: 'Canceladas ⛔' },
            { id: 'ROTINAS', label: 'Rotinas & Checklist 📋' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TarefasTabType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-evo-accent text-[#07100F] font-bold shadow-sm'
                  : 'text-evo-muted hover:text-evo-text hover:bg-evo-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'ROTINAS' && (
          <div className="inline-flex p-1 rounded-xl bg-evo-card border border-evo-border shrink-0">
            <button
              onClick={() => setViewMode('lista')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'lista' ? 'bg-evo-surface text-evo-text' : 'text-evo-disabled'
              }`}
              title="Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-evo-surface text-evo-text' : 'text-evo-disabled'
              }`}
              title="Kanban"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab !== 'ROTINAS' ? (
        <div className="space-y-4">
          {filteredAutomations.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-evo-surface border border-evo-border flex items-center justify-center text-evo-accent mx-auto">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <h3 className="text-base font-semibold text-evo-text font-heading">
                Nenhuma automação encontrada nesta categoria
              </h3>
              <p className="text-xs text-evo-muted max-w-sm mx-auto">
                Configure um novo lote de disparos no WhatsApp com inteligência comercial, follow-up ou auditoria técnica.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="gap-2 text-xs mx-auto mt-2"
                onClick={() => setIsAutomationDrawerOpen(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Criar Automação em Lote</span>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAutomations.map((task) => (
                <AutomationCampaignCard
                  key={task.id}
                  task={task}
                  leads={leads}
                  onUpdateTask={handleUpdateSingleTask}
                  onRefresh={loadAutomationTasks}
                  onViewLogs={(t) => setSelectedTaskForLogs(t)}
                  onEdit={handleEditAutomationTask}
                  onDelete={handleDeleteAutomationTask}
                  onDuplicate={handleDuplicateAutomationTask}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Aba de Rotinas & Checklist Operacional */
        <div className="space-y-4">
          {/* Filtros de Responsável */}
          <div className="flex items-center justify-between gap-3 bg-evo-card border border-evo-border p-2 rounded-xl text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-evo-muted text-[11px] font-mono px-2">Responsável:</span>
              {[
                { label: 'Todas as Tarefas', value: 'todos' },
                { label: '🤖 Agente IA Autônomo', value: 'agente_ia' },
                { label: '👤 Operador Manual', value: 'operador' },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilterAssignee(btn.value as any)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                    filterAssignee === btn.value
                      ? 'bg-evo-surface2 text-evo-accent font-semibold border border-evo-support/30'
                      : 'text-evo-muted hover:text-evo-text'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-evo-support pr-2">
              {filteredOperationalTasks.length} rotinas cadastradas
            </span>
          </div>

          {viewMode === 'lista' ? (
            <Card className="p-4 space-y-2">
              {filteredOperationalTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-evo-muted">
                  Nenhuma rotina cadastrada.
                </div>
              ) : (
                filteredOperationalTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-evo-surface/30 border border-evo-border hover:border-evo-accent/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(t.id)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                          t.status === 'concluida'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-evo-border hover:border-evo-accent'
                        }`}
                      >
                        {t.status === 'concluida' && <CheckSquare className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            t.status === 'concluida'
                              ? 'line-through text-evo-muted'
                              : 'text-evo-text'
                          }`}
                        >
                          {t.title}
                        </h4>
                        <div className="text-[11px] text-evo-muted flex items-center gap-2 mt-0.5">
                          <span>{t.related_to}</span>
                          <span>•</span>
                          <span>
                            {t.start_date} {t.start_time} - {t.end_time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-evo-surface border border-evo-border text-evo-muted">
                        {t.assigned_to === 'agente_ia' ? '🤖 Agente IA' : '👤 Operador'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </Card>
          ) : (
            /* Visualização Kanban de Rotinas */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-evo-muted uppercase tracking-wider font-mono">
                  Pendentes ({filteredOperationalTasks.filter((t) => t.status === 'pendente').length})
                </h4>
                <div className="space-y-2">
                  {filteredOperationalTasks
                    .filter((t) => t.status === 'pendente')
                    .map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-evo-surface border border-evo-border space-y-1.5"
                      >
                        <h5 className="text-xs font-semibold text-evo-text">{t.title}</h5>
                        <div className="flex items-center justify-between text-[10px] font-mono text-evo-muted">
                          <span>{t.related_to}</span>
                          <button
                            onClick={() => handleToggleTask(t.id)}
                            className="text-xs text-evo-accent hover:underline"
                          >
                            Concluir
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  Concluídas ({filteredOperationalTasks.filter((t) => t.status === 'concluida').length})
                </h4>
                <div className="space-y-2">
                  {filteredOperationalTasks
                    .filter((t) => t.status === 'concluida')
                    .map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-evo-surface/40 border border-evo-border space-y-1.5 opacity-70"
                      >
                        <h5 className="text-xs font-semibold text-evo-muted line-through">{t.title}</h5>
                        <div className="flex items-center justify-between text-[10px] font-mono text-evo-muted">
                          <span>{t.related_to}</span>
                          <button
                            onClick={() => handleToggleTask(t.id)}
                            className="text-xs text-evo-muted hover:underline"
                          >
                            Reabrir
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Drawer de Criação de Automação & Tarefas em Lote */}
      <AutomationDrawerModal
        isOpen={isAutomationDrawerOpen}
        onClose={() => {
          setIsAutomationDrawerOpen(false);
          setEditingAutomationTask(null);
        }}
        leads={leads}
        taskToEdit={editingAutomationTask}
        onSaveTask={handleSaveAutomationTask}
      />

      {/* Modal de Tarefa Operacional Simples */}
      <Modal
        isOpen={isOperationalModalOpen}
        onClose={() => setIsOperationalModalOpen(false)}
        title="Nova Tarefa Operacional"
      >
        <form onSubmit={handleCreateOperationalTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
              Título da Tarefa *
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Fazer follow-up com cliente"
              className="w-full px-3 py-2 bg-evo-surface border border-evo-border rounded-xl text-xs text-evo-text focus:outline-none focus:border-evo-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
              Vinculado a
            </label>
            <input
              type="text"
              value={newRelated}
              onChange={(e) => setNewRelated(e.target.value)}
              placeholder="Ex: Proposta Clínica Odonto"
              className="w-full px-3 py-2 bg-evo-surface border border-evo-border rounded-xl text-xs text-evo-text focus:outline-none focus:border-evo-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
                Data
              </label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-evo-surface border border-evo-border rounded-xl text-xs text-evo-text"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-evo-muted uppercase mb-1">
                Prioridade
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-evo-surface border border-evo-border rounded-xl text-xs text-evo-text"
              >
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOperationalModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Criar Tarefa
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Logs de Execução */}
      <AutomationExecutionLogsModal
        task={selectedTaskForLogs}
        onClose={() => setSelectedTaskForLogs(null)}
      />
    </div>
  );
}
