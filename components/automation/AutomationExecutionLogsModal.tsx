'use client';

import React from 'react';
import { AutomationTask } from '@/types/database';
import { X, FileText, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface AutomationExecutionLogsModalProps {
  task: AutomationTask | null;
  onClose: () => void;
}

export function AutomationExecutionLogsModal({
  task,
  onClose,
}: AutomationExecutionLogsModalProps) {
  if (!task) return null;

  const logs = task.execution_logs || [];

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-evo-deep border border-evo-border rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-evo-card border-b border-evo-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-evo-accent" />
            <div>
              <h3 className="text-sm font-semibold text-evo-text font-heading">
                Logs de Execução da Automação
              </h3>
              <p className="text-xs text-evo-muted font-mono truncate max-w-md">
                {task.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-evo-muted hover:text-evo-text hover:bg-evo-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-evo-muted">
              Nenhum log de execução registrado ainda para esta tarefa.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-evo-card border border-evo-border flex items-start gap-2.5"
              >
                {getLogIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-evo-muted">
                    <span>
                      {new Date(log.timestamp).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    {log.lead_name && (
                      <span className="text-evo-text font-semibold truncate">
                        {log.lead_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-evo-text mt-0.5 leading-relaxed break-words">
                    {log.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-evo-card border-t border-evo-border flex items-center justify-between text-xs text-evo-muted">
          <span>{logs.length} eventos registrados</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-evo-surface border border-evo-border text-evo-text hover:bg-evo-surface2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
