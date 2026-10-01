'use client';

import React, { useState } from 'react';
import { crmService } from '@/lib/services/crm-service';
import { useCrmSync } from '@/lib/hooks/useCrmSync';
import { Priority, TaskItem } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
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
} from 'lucide-react';

export default function TarefasPage() {
  useCrmSync();
  const [tasks, setTasks] = useState<TaskItem[]>(() => crmService.getTasks());
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista');
  const [filterAssignee, setFilterAssignee] = useState<'todos' | 'agente_ia' | 'operador'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingAiTasks, setIsGeneratingAiTasks] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newRelated, setNewRelated] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('alta');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newAssignedTo, setNewAssignedTo] = useState<'operador' | 'agente_ia' | 'ambos'>('agente_ia');
  const [newAutoExecute, setNewAutoExecute] = useState(true);

  const handleToggleTask = (id: string) => {
    crmService.toggleTaskStatus(id);
    setTasks([...crmService.getTasks()]);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    crmService.addTask({
      title: newTitle.trim(),
      related_to: newRelated.trim() || 'Operação EVO PIXEL',
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
    setIsModalOpen(false);
    showToast('Tarefa criada com sucesso!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Gerar Tarefas Autônomas via Agente IA
  const handleGenerateAiTasks = () => {
    setIsGeneratingAiTasks(true);
    const leads = crmService.getLeads();
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
        title: '🤖 Auditoria de Termômetro de Sentimento & Objeções',
        related_to: 'Inteligência Comercial EVO',
        start_date: today,
        due_date: today,
        start_time: '14:00',
        end_time: '14:45',
        status: 'pendente',
        priority: 'media',
        assigned_to: 'agente_ia',
        auto_execute: true,
        execution_notes: 'Reclassificação de temperatura e atualização de probabilidade de fechamento das oportunidades.',
      },
    ];

    generated.forEach((taskData) => {
      crmService.addTask(taskData);
    });

    setTimeout(() => {
      setTasks([...crmService.getTasks()]);
      setIsGeneratingAiTasks(false);
      showToast('2 Tarefas autônomas geradas pelo Agente IA!');
    }, 600);
  };

  // Executar tarefa pelo agente
  const handleExecuteTaskWithAi = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    crmService.toggleTaskStatus(taskId);
    setTasks([...crmService.getTasks()]);
    showToast('⚡ Tarefa executada com sucesso pelo Agente IA!');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterAssignee === 'todos') return true;
    if (filterAssignee === 'agente_ia') return t.assigned_to === 'agente_ia' || t.assigned_to === 'ambos';
    if (filterAssignee === 'operador') return t.assigned_to === 'operador' || !t.assigned_to;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-evo-support uppercase tracking-wider mb-1">
            <CheckSquare className="w-3.5 h-3.5 text-evo-accent" />
            Produtividade & Operação Conectada ao Agente IA
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-evo-text font-heading">
            Tarefas & Entregas Autônomas
          </h1>
          <p className="text-xs text-evo-muted mt-1">
            Gestão de atividades com agendamento de data/hora de início e fim, execução autônoma pelo Agente IA e rotinas comerciais.
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
            <span>{isGeneratingAiTasks ? 'Analisando...' : 'Gerar Tarefas via Agente IA'}</span>
          </Button>

          {/* Alternar Visualização */}
          <div className="inline-flex p-1 rounded-xl bg-evo-card border border-evo-border">
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

          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 text-[#07100F]" />
            <span>Nova Tarefa</span>
          </Button>
        </div>
      </div>

      {/* Toast Notificação */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-evo-accent/10 border border-evo-accent/30 text-xs text-evo-accent flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filtros de Atribuição */}
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
          {filteredTasks.length} tarefas encontradas
        </span>
      </div>

      {/* Lista de Tarefas */}
      {viewMode === 'lista' && (
        <Card className="p-6 space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-evo-surface border border-evo-border flex items-center justify-center text-evo-support mx-auto mb-3">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-evo-text font-heading">
                Nenhuma tarefa pendente
              </h4>
              <p className="text-xs text-evo-muted max-w-sm mx-auto mt-1 mb-4">
                Sua fila está limpa. Crie uma nova tarefa ou use o Agente IA para gerar rotinas autônomas.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs mx-auto"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 text-[#07100F]" />
                <span>Criar Primeira Tarefa</span>
              </Button>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === 'concluida';
              const isAi = task.assigned_to === 'agente_ia' || task.assigned_to === 'ambos';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-evo-surface/40 border-evo-border/40 opacity-70'
                      : isAi
                      ? 'bg-evo-surface border-evo-accent/20 hover:border-evo-accent/40'
                      : 'bg-evo-surface border-evo-border hover:border-evo-border-hover'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer mt-0.5 sm:mt-0 ${
                        isDone
                          ? 'bg-evo-support border-evo-support text-[#07100F]'
                          : 'border-[rgba(218,241,222,0.2)] hover:border-evo-accent'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-xs font-semibold font-heading transition-all ${
                            isDone ? 'line-through text-evo-disabled' : 'text-evo-text'
                          }`}
                        >
                          {task.title}
                        </h4>

                        {isAi && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            Agente IA
                          </span>
                        )}

                        {task.auto_execute && !isDone && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ⚡ Auto-Executável
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-evo-muted mt-1">
                        <span>Vinculado a: <strong className="text-evo-support">{task.related_to}</strong></span>
                        {(task.start_time || task.end_time) && (
                          <span className="text-evo-disabled flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.start_time || '--:--'} às {task.end_time || '--:--'}
                          </span>
                        )}
                        {task.execution_notes && (
                          <span className="text-evo-support/80 italic">• {task.execution_notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0 self-end sm:self-center">
                    <span className="font-mono text-[11px] text-evo-disabled">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        task.priority === 'alta'
                          ? 'bg-[rgba(241,249,161,0.1)] text-evo-accent'
                          : 'bg-evo-surface2 text-evo-support'
                      }`}
                    >
                      {task.priority}
                    </span>

                    {isAi && !isDone && (
                      <button
                        onClick={(e) => handleExecuteTaskWithAi(task.id, e)}
                        className="px-2 py-1 rounded bg-evo-accent/10 border border-evo-accent/30 text-evo-accent hover:bg-evo-accent hover:text-[#07100F] font-mono text-[10px] flex items-center gap-1 transition-all"
                        title="Executar tarefa imediatamente com o Agente IA"
                      >
                        <Play className="w-3 h-3" />
                        Executar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </Card>
      )}

      {/* Kanban de Tarefas */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: 'pendente', label: 'Pendente' },
            { key: 'em_andamento', label: 'Em Andamento' },
            { key: 'concluida', label: 'Concluída' },
          ].map((col) => {
            const colTasks = filteredTasks.filter((t) =>
              col.key === 'concluida' ? t.status === 'concluida' : t.status !== 'concluida'
            );

            return (
              <div
                key={col.key}
                className="p-4 rounded-2xl bg-evo-card border border-evo-border space-y-3 min-h-[300px]"
              >
                <div className="text-xs font-semibold text-evo-text font-heading pb-2 border-b border-evo-border flex justify-between items-center">
                  <span>{col.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-evo-surface text-evo-muted">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className="p-3.5 rounded-xl bg-evo-surface border border-evo-border hover:border-evo-border-hover text-xs space-y-1.5 cursor-pointer"
                    >
                      <div className="font-medium text-evo-text flex items-center justify-between">
                        <span>{task.title}</span>
                        {task.assigned_to === 'agente_ia' && (
                          <Bot className="w-3 h-3 text-purple-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-evo-support">{task.related_to}</div>
                      {task.start_time && (
                        <div className="text-[9px] font-mono text-evo-disabled">
                          {task.start_time} - {task.end_time}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova Tarefa com Campos Avançados de Horário e Agente IA */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Nova Tarefa & Rotina"
        subtitle="Agende horários de início e fim e conecte ao Agente IA para execução autônoma."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block text-evo-muted mb-1 font-medium">Título da Atividade *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Disparar follow-up de proposta ou auditar métricas"
              className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-evo-accent"
            />
          </div>

          <div>
            <label className="block text-evo-muted mb-1 font-medium">Vinculado a (Projeto / Cliente / Lead)</label>
            <input
              type="text"
              value={newRelated}
              onChange={(e) => setNewRelated(e.target.value)}
              placeholder="Ex: Taciano Advocacia / Operação EVO PIXEL"
              className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-evo-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Responsável</label>
              <select
                value={newAssignedTo}
                onChange={(e) => setNewAssignedTo(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none"
              >
                <option value="agente_ia">🤖 Agente Autônomo IA</option>
                <option value="operador">👤 Operador Manual</option>
                <option value="ambos">⚡ Ambos (Co-piloto)</option>
              </select>
            </div>
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Prioridade</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none"
              >
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          {/* Data Início e Fim */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Data de Início</label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Data de Conclusão (Prazo)</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none"
              />
            </div>
          </div>

          {/* Horário Início e Fim */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Horário de Início</label>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Horário de Término</label>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none"
              />
            </div>
          </div>

          {/* Checkbox Agente Autônomo */}
          <label className="flex items-center gap-2 p-3 rounded-xl bg-evo-surface2/60 border border-evo-border cursor-pointer">
            <input
              type="checkbox"
              checked={newAutoExecute}
              onChange={(e) => setNewAutoExecute(e.target.checked)}
              className="rounded accent-evo-accent w-4 h-4"
            />
            <div className="text-[11px]">
              <span className="font-semibold text-evo-text block">Permitir execução autônoma pelo Agente IA</span>
              <span className="text-evo-muted">O agente executará a rotina ou disparará alerta prioritário no horário agendado.</span>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-evo-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Salvar Tarefa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
