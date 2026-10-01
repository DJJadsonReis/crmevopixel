'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { crmService } from '@/lib/services/crm-service';
import { MessageLog, Lead } from '@/types/database';
import { MessageSquare, X, ChevronLeft, Bell, ArrowRight, UserCheck } from 'lucide-react';

export function IncomingReplyToaster() {
  const [activeToast, setActiveToast] = useState<{
    leadId: string;
    leadName: string;
    phone?: string;
    messageText: string;
    receivedAt: string;
  } | null>(null);

  const [queuedReplies, setQueuedReplies] = useState<
    Array<{
      id: string;
      leadId: string;
      leadName: string;
      phone?: string;
      messageText: string;
      receivedAt: string;
    }>
  >([]);

  const [isDrawerHovered, setIsDrawerHovered] = useState(false);
  const knownMessageIds = useRef<Set<string>>(new Set());

  // Tocar sino suave de notificação via Web Audio API
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext bloqueado pelo navegador antes de interação
    }
  };

  useEffect(() => {
    // Carrega mensagens recebidas existentes
    const logs = crmService.getMessageLogs();
    const leads = crmService.getLeads();

    const incoming = logs.filter((m) => m.direction === 'recebida');
    incoming.forEach((m) => knownMessageIds.current.add(m.id));

    // Inicializa a fila com as últimas mensagens recebidas
    const initialQueue = incoming.slice(0, 5).map((m) => {
      const lead = leads.find((l) => l.id === m.lead_id);
      return {
        id: m.id,
        leadId: m.lead_id,
        leadName: lead?.company_name || lead?.name || m.sender_name || 'Lead do WhatsApp',
        phone: lead?.whatsapp || lead?.phone || m.phone,
        messageText: m.sent_text,
        receivedAt: m.sent_at,
      };
    });
    setQueuedReplies(initialQueue);

    // Escuta novas mensagens adicionadas ao CRM
    const unsubscribe = crmService.subscribe(() => {
      const currentLogs = crmService.getMessageLogs();
      const currentLeads = crmService.getLeads();

      const newIncoming = currentLogs.filter(
        (m) => m.direction === 'recebida' && !knownMessageIds.current.has(m.id)
      );

      if (newIncoming.length > 0) {
        newIncoming.forEach((m) => knownMessageIds.current.add(m.id));

        const latest = newIncoming[0];
        const lead = currentLeads.find((l) => l.id === latest.lead_id);
        const leadName = lead?.company_name || lead?.name || latest.sender_name || 'Lead do WhatsApp';

        const toastData = {
          id: latest.id,
          leadId: latest.lead_id,
          leadName,
          phone: lead?.whatsapp || lead?.phone || latest.phone,
          messageText: latest.sent_text,
          receivedAt: latest.sent_at,
        };

        setActiveToast(toastData);
        setQueuedReplies((prev) => [toastData, ...prev.filter((p) => p.id !== toastData.id)].slice(0, 8));
        playChime();

        // Esconde o balão principal após 8 segundos
        setTimeout(() => {
          setActiveToast((curr) => (curr?.leadId === toastData.leadId ? null : curr));
        }, 8000);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* 1. Balão Flutuante Superior/Direito de Notificação Instantânea */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-evo-deep/95 backdrop-blur-md border border-evo-accent/40 rounded-2xl shadow-2xl p-4 text-xs animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-evo-accent/15 border border-evo-accent/40 flex items-center justify-center text-evo-accent shrink-0">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-evo-accent uppercase tracking-wider block">
                  Nova Resposta no WhatsApp
                </span>
                <h4 className="font-semibold text-evo-text truncate max-w-[210px] font-heading">
                  {activeToast.leadName}
                </h4>
              </div>
            </div>

            <button
              onClick={() => setActiveToast(null)}
              className="text-evo-muted hover:text-evo-text p-1 transition-colors"
              title="Fechar notificação"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="mt-2 text-evo-text/90 line-clamp-2 bg-evo-surface/70 p-2 rounded-lg border border-[rgba(218,241,222,0.06)] italic text-[11px]">
            &ldquo;{activeToast.messageText}&rdquo;
          </p>

          <div className="mt-3 pt-2.5 border-t border-evo-border flex items-center justify-between">
            <span className="text-[10px] font-mono text-evo-disabled">
              Agora mesmo
            </span>

            <Link
              href={`/chat?leadId=${activeToast.leadId}`}
              onClick={() => setActiveToast(null)}
              className="px-2.5 py-1 rounded-lg bg-evo-accent text-[#07100F] font-semibold text-[11px] flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all shadow-sm"
            >
              <span>Responder no Chat</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Pilha Lateral Retrátil com Expansão ao Passar o Mouse (Hover) */}
      <div
        className="fixed top-1/2 -translate-y-1/2 right-0 z-[9998] transition-all duration-300 ease-out"
        onMouseEnter={() => setIsDrawerHovered(true)}
        onMouseLeave={() => setIsDrawerHovered(false)}
      >
        {/* Aba Recolhida na Lateral */}
        {!isDrawerHovered && queuedReplies.length > 0 && (
          <div className="bg-evo-deep border-l border-y border-evo-accent/40 rounded-l-2xl py-3 px-2 flex flex-col items-center gap-2 cursor-pointer shadow-xl hover:bg-evo-surface2 transition-all">
            <div className="relative">
              <Bell className="w-4 h-4 text-evo-accent animate-pulse" />
              <span className="absolute -top-1.5 -right-2 bg-evo-accent text-[#07100F] text-[9px] font-bold px-1 rounded-full">
                {queuedReplies.length}
              </span>
            </div>
            <span className="text-[9px] font-mono text-evo-support [writing-mode:vertical-rl] rotate-180 uppercase tracking-wider font-semibold">
              Respostas
            </span>
          </div>
        )}

        {/* Gaveta Expandida no Hover */}
        {isDrawerHovered && (
          <div className="w-80 bg-evo-deep/95 backdrop-blur-md border-l border-y border-evo-accent/40 rounded-l-2xl shadow-2xl p-4 text-xs space-y-3 animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-evo-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-evo-accent" />
                <span className="font-semibold text-evo-text font-heading text-xs">
                  Respostas Enfileiradas ({queuedReplies.length})
                </span>
              </div>
              <span className="text-[10px] font-mono text-evo-support">
                Passe o mouse
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {queuedReplies.length === 0 ? (
                <p className="text-center text-evo-muted text-xs py-4">
                  Nenhuma resposta aguardando atendimento.
                </p>
              ) : (
                queuedReplies.map((item) => (
                  <Link
                    key={item.id}
                    href={`/chat?leadId=${item.leadId}`}
                    className="block p-2.5 rounded-xl bg-evo-surface border border-evo-border hover:border-evo-accent/40 hover:bg-evo-surface2 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-evo-text truncate max-w-[170px] group-hover:text-evo-accent transition-colors">
                        {item.leadName}
                      </span>
                      <span className="text-[9px] font-mono text-evo-disabled">
                        {item.receivedAt ? new Date(item.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'rec'}
                      </span>
                    </div>
                    <p className="text-[11px] text-evo-muted line-clamp-1 italic">
                      &ldquo;{item.messageText}&rdquo;
                    </p>
                  </Link>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-evo-border flex justify-end">
              <Link
                href="/chat"
                className="text-[11px] font-mono text-evo-accent hover:underline flex items-center gap-1"
              >
                <span>Abrir Chat WhatsApp Completo</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
