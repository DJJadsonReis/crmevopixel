'use client';

import React, { useState } from 'react';
import { AutomationTask } from '@/types/database';
import {
  Play,
  Pause,
  RotateCcw,
  XCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Users,
  Send,
  Edit,
  Copy,
  Trash2,
  Search,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { Button } from '@/components/ui/Button';

interface AutomationCampaignCardProps {
  task: AutomationTask;
  onRefresh: () => void;
  onViewLogs: (task: AutomationTask) => void;
  onEdit?: (task: AutomationTask) => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (task: AutomationTask) => void;
}

export function AutomationCampaignCard({
  task,
  onRefresh,
  onViewLogs,
  onEdit,
  onDelete,
  onDuplicate,
}: AutomationCampaignCardProps) {
  const [isLoading, setIsLoading] = useState(false);

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

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'cancel') => {
    setIsLoading(true);
    try {
      await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, action, taskData: task }),
      });
      onRefresh();
    } catch (err) {
      console.error('Erro na ação da automação:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            EM EXECUÇÃO
          </span>
        );
      case 'paused':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Pause className="w-2.5 h-2.5" />
            PAUSADO
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            CONCLUÍDO
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            AGENDADO
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            COM ERRO
          </span>
        );
      case 'canceled':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5" />
            CANCELADO
          </span>
        );
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-evo-card border border-evo-border shadow-sm hover:border-evo-accent/40 transition-all flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
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
          <h3 className="text-sm font-semibold text-evo-text font-heading truncate">
            {task.title}
          </h3>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-mono font-bold text-evo-accent">
            {percentage}%
          </span>
          <div className="text-[10px] font-mono text-evo-muted">
            Lote {progress.current_batch_index || 0}/{progress.total_batches || 1}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2 bg-evo-surface rounded-full overflow-hidden border border-evo-border">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-evo-accent transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-evo-muted">
          <span>{progress.sent} enviados</span>
          {progress.failed > 0 && (
            <span className="text-red-400">{progress.failed} falhas</span>
          )}
          <span>{progress.total} total</span>
        </div>
      </div>

      {/* Metadata & Controls */}
      <div className="pt-3 border-t border-evo-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-xs text-evo-muted font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-evo-accent" />
            {task.batch_config.start_time_window} - {task.batch_config.end_time_window}
          </span>
          <span>•</span>
          <span>{task.batch_config.batch_size} / lote</span>
          <span>•</span>
          <span>{task.selected_lead_ids?.length || progress.total} leads</span>
        </div>

        {/* Toolbar de Ações com Tooltips Completos */}
        <div className="flex items-center gap-1">
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

          {/* Iniciar Agora (▶) */}
          {task.status === 'scheduled' && (
            <button
              type="button"
              onClick={() => handleAction('start')}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
              title="Iniciar Agora (▶)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {/* Pausar (⏸) */}
          {task.status === 'running' && (
            <button
              type="button"
              onClick={() => handleAction('pause')}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition-colors"
              title="Pausar Envio (⏸)"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Retomar (▶) */}
          {task.status === 'paused' && (
            <button
              type="button"
              onClick={() => handleAction('resume')}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
              title="Retomar Envio (▶)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
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
