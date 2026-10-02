'use client';

import React, { useState } from 'react';
import { AutomationTask, Lead } from '@/types/database';
import {
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Edit,
  Copy,
  Trash2,
  Search,
  Loader2,
} from 'lucide-react';

interface AutomationCampaignCardProps {
  task: AutomationTask;
  leads?: Lead[];
  onRefresh: () => void;
  onUpdateTask?: (updatedTask: AutomationTask) => void;
  onViewLogs: (task: AutomationTask) => void;
  onEdit?: (task: AutomationTask) => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (task: AutomationTask) => void;
}

export function AutomationCampaignCard({
  task,
  leads = [],
  onRefresh,
  onUpdateTask,
  onViewLogs,
  onEdit,
  onDelete,
  onDuplicate,
}: AutomationCampaignCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const progress = task.progress || {
    total: 0,
    eligible: 0,
    sent: 0,
    failed: 0,
    replied: 0,
    current_batch_index: 0,
    total_batches: 0,
  };

  const total = progress.total || 1;
  const percentage = Math.min(100, Math.round(((progress.sent + progress.failed) / total) * 100));

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'cancel' | 'force_start', force = false) => {
    setIsLoading(true);
    setActionFeedback(
      action === 'pause'
        ? 'Pausando...'
        : action === 'cancel'
        ? 'Cancelando...'
        : 'Iniciando disparo...'
    );

    // 1. Optimistic Update Imediato no Cliente (atualiza UI e localStorage na hora)
    let nextStatus = task.status;
    let logMessage = '';

    if (action === 'pause') {
      nextStatus = 'paused';
      logMessage = 'Tarefa pausada manualmente pelo operador.';
    } else if (action === 'start' || action === 'resume' || action === 'force_start') {
      nextStatus = 'running';
      logMessage = force ? 'Disparo imediato disparado pelo operador.' : 'Tarefa colocada em execução.';
    } else if (action === 'cancel') {
      nextStatus = 'canceled';
      logMessage = 'Tarefa cancelada pelo operador.';
    }

    const optimisticTask: AutomationTask = {
      ...task,
      status: nextStatus,
      execution_logs: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          message: logMessage,
          type: action === 'pause' ? 'warning' : action === 'cancel' ? 'error' : 'info',
        },
        ...(task.execution_logs || []),
      ],
      updated_at: new Date().toISOString(),
    };

    if (onUpdateTask) {
      onUpdateTask(optimisticTask);
    }

    try {
      const res = await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          action,
          taskData: optimisticTask,
          leads: leads || [],
          force: force || action === 'start' || action === 'force_start',
        }),
      });

      const data = await res.json().catch(() => null);

      if (data && data.task && onUpdateTask) {
        onUpdateTask(data.task);
      } else {
        onRefresh();
      }
    } catch (err) {
      console.error('Erro na ação da automação:', err);
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionFeedback(null), 2500);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            EM EXECUÇÃO
          </span>
        );
      case 'paused':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm">
            <Pause className="w-2.5 h-2.5" />
            PAUSADO
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-2.5 h-2.5" />
            CONCLUÍDO
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1 shadow-sm">
            <Clock className="w-2.5 h-2.5" />
            AGENDADO
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1 shadow-sm">
            <AlertTriangle className="w-2.5 h-2.5" />
            COM ERRO
          </span>
        );
      case 'canceled':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1 shadow-sm">
            <XCircle className="w-2.5 h-2.5" />
            CANCELADO
          </span>
        );
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-evo-card border border-evo-border shadow-sm hover:border-evo-accent/40 transition-all flex flex-col justify-between space-y-4 relative">
      {/* Feedback Toast Overlay */}
      {actionFeedback && (
        <div className="absolute top-2 right-4 px-2.5 py-1 rounded-lg bg-evo-accent/20 border border-evo-accent/40 text-evo-accent text-[11px] font-mono animate-in fade-in flex items-center gap-1 z-10">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(task.status)}
            <span className="text-[10px] font-mono text-evo-muted px-2 py-0.5 rounded bg-evo-surface border border-evo-border">
              {task.task_type}
            </span>
            {task.is_ai_personalized && (
              <span className="text-[10px] font-mono text-evo-accent px-1.5 py-0.2 rounded bg-evo-accent/10 border border-evo-accent/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> IA Copy
              </span>
            )}
            {task.priority && (
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                  task.priority === 'alta'
                    ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}
              >
                {task.priority}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-evo-text font-heading truncate">
            {task.title}
          </h3>
        </div>

        <div className="text-right shrink-0">
          <span className="text-sm font-mono font-bold text-evo-accent">
            {percentage}%
          </span>
          <div className="text-[11px] font-mono text-evo-muted">
            Lote {progress.current_batch_index || 0}/{progress.total_batches || 1}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-evo-surface rounded-full overflow-hidden border border-evo-border">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-evo-accent transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-evo-muted">
          <span className="font-semibold text-evo-text">{progress.sent} enviados</span>
          {progress.failed > 0 && (
            <span className="text-red-400">{progress.failed} falhas</span>
          )}
          <span>{progress.total || task.selected_lead_ids?.length || 0} total</span>
        </div>
      </div>

      {/* Metadata & Controls */}
      <div className="pt-3 border-t border-evo-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-evo-muted font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-evo-accent" />
            {task.batch_config?.start_time_window || '09:00'} - {task.batch_config?.end_time_window || '19:30'}
          </span>
          <span>•</span>
          <span>{task.batch_config?.batch_size || 10} / lote</span>
          <span>•</span>
          <span>{task.selected_lead_ids?.length || progress.total} leads</span>
        </div>

        {/* Toolbar de Ações */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* BOTÃO PRINCIPAL: INICIAR AGORA (VERDE COM PLAY) */}
          {task.status !== 'completed' && task.status !== 'canceled' && (
            <button
              type="button"
              onClick={() => handleAction('start', true)}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#07100F] font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all disabled:opacity-60"
              title="Iniciar envio imediatamente agora (burlar espera e disparar lote) (▶)"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>
                {isLoading
                  ? 'Disparando...'
                  : task.status === 'running'
                  ? 'Iniciar Agora (▶)'
                  : 'Iniciar Agora'}
              </span>
            </button>
          )}

          {/* Se a tarefa já foi concluída, permitir reiniciar */}
          {task.status === 'completed' && (
            <button
              type="button"
              onClick={() => handleAction('start', true)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Reiniciar Campanha (🔄)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          )}

          {/* BOTÃO PAUSAR (⏸) — VISÍVEL QUANDO EM EXECUÇÃO */}
          {task.status === 'running' && (
            <button
              type="button"
              onClick={() => handleAction('pause')}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/40 flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95"
              title="Pausar Envio da Campanha (⏸)"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pausar</span>
            </button>
          )}

          {/* Ver Detalhes (🔍) */}
          <button
            type="button"
            onClick={() => onViewLogs(task)}
            className="p-1.5 rounded-lg text-evo-muted hover:text-evo-text hover:bg-evo-surface transition-colors"
            title="Ver Detalhes & Logs de Execução (🔍)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Editar (✏) */}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-evo-muted hover:text-evo-text hover:bg-evo-surface transition-colors"
              title="Editar Tarefa de Automação (✏)"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicar (📋) */}
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(task)}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-evo-muted hover:text-evo-text hover:bg-evo-surface transition-colors"
              title="Duplicar Campanha (📋)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Cancelar Envio (⛔) */}
          {task.status !== 'completed' && task.status !== 'canceled' && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Deseja cancelar o envio da campanha "${task.title}"?`)) {
                  handleAction('cancel');
                }
              }}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-evo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Cancelar Envio (⛔)"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Excluir (🗑) */}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Deseja realmente excluir a automação "${task.title}"?`)) {
                  onDelete(task.id);
                }
              }}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-evo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Excluir Automação (🗑)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
