'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Sparkles,
  MessageSquare,
  Clock,
  Flame,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Bot,
  X,
  Volume2,
} from 'lucide-react';
import { crmBrain, ManagerAlert } from '@/lib/ai/crm-brain';

export function AutonomousManagerBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<ManagerAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadAlerts = () => {
    try {
      const generated = crmBrain.generateAutonomousAlerts();
      setAlerts(generated);
    } catch (e) {
      console.error('Error generating alerts:', e);
    }
  };

  useEffect(() => {
    loadAlerts();
    // Re-check alerts every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));
  const unreadCount = activeAlerts.length;

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const getAlertIcon = (type: ManagerAlert['type']) => {
    switch (type) {
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'opportunity':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'stalled':
        return <Clock className="w-4 h-4 text-orange-400" />;
      case 'attention':
      default:
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-evo-muted hover:text-evo-text hover:bg-evo-surface transition-all border border-transparent hover:border-evo-border"
        title="Gestor Autônomo IA - Notificações em Tempo Real"
        aria-label="Notificações do Agente IA"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-mono font-bold text-white shadow-lg shadow-rose-500/30 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-evo-card border border-evo-border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-evo-border bg-evo-surface/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-evo-text font-heading">
                    Gestor Autônomo IA
                  </h4>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    CÉREBRO ATIVO
                  </span>
                </div>
                <p className="text-[10px] text-evo-muted">
                  Monitoramento contínuo de conversas e gargalos
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => setDismissedIds(alerts.map((a) => a.id))}
                className="text-[10px] text-evo-muted hover:text-evo-text font-mono hover:underline"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Alerts List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-evo-border/50">
            {activeAlerts.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                <div className="text-xs font-medium text-evo-text">Tudo sob controle!</div>
                <p className="text-[11px] text-evo-muted">
                  Nenhum lead pendente de resposta ou esfriando no momento. O cérebro IA avisará assim que um cliente responder.
                </p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => {
                    setIsOpen(false);
                    if (alert.leadId) {
                      router.push(`/leads/${alert.leadId}`);
                    }
                  }}
                  className="p-3.5 hover:bg-evo-surface/70 transition-colors cursor-pointer flex items-start gap-3 group"
                >
                  <div className="p-2 rounded-xl bg-evo-deep border border-evo-border shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-evo-text group-hover:text-evo-support transition-colors truncate">
                        {alert.title}
                      </span>
                      <button
                        onClick={(e) => handleDismiss(alert.id, e)}
                        className="text-evo-disabled hover:text-evo-text p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Dispensar alerta"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-evo-muted line-clamp-2 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] font-mono text-evo-support bg-evo-support/10 px-1.5 py-0.5 rounded">
                        Ação: {alert.actionLabel}
                      </span>
                      <span className="text-[9px] font-mono text-evo-disabled flex items-center gap-1 group-hover:text-evo-text">
                        Abrir <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-evo-surface/40 border-t border-evo-border text-center">
            <Link
              href="/leads"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-evo-support hover:underline font-medium"
            >
              Ver todos os leads e conversas do CRM →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
