'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  X,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { crmService } from '@/lib/services/crm-service';
import { Lead, MessageLog } from '@/types/database';

export function IncomingReplyToaster() {
  const router = useRouter();
  const [repliedLeads, setRepliedLeads] = useState<
    Array<{
      lead: Lead;
      lastMessage: MessageLog;
      unreadCount: number;
    }>
  >([]);
  const [isHovered, setIsHovered] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const lastKnownCountRef = useRef(0);

  const checkReplies = () => {
    const leads = crmService.getLeads();
    const results: Array<{
      lead: Lead;
      lastMessage: MessageLog;
      unreadCount: number;
    }> = [];

    leads.forEach((l) => {
      const logs = crmService.getMessageLogs(l.id);
      const incoming = logs.filter((m) => m.direction === 'recebida');
      if (incoming.length > 0) {
        // Pega a mensagem recebida mais recente
        const latest = incoming[0];
        results.push({
          lead: l,
          lastMessage: latest,
          unreadCount: incoming.length,
        });
      }
    });

    // Toca som se houver novas mensagens recebidas
    const totalIncoming = results.reduce((acc, r) => acc + r.unreadCount, 0);
    if (totalIncoming > lastKnownCountRef.current && lastKnownCountRef.current > 0) {
      playChime();
    }
    lastKnownCountRef.current = totalIncoming;

    setRepliedLeads(results);
  };

  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  useEffect(() => {
    checkReplies();
    const unsub = crmService.subscribe(checkReplies);
    const interval = setInterval(checkReplies, 15000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const activeReplies = repliedLeads.filter((r) => !dismissedIds.includes(r.lead.id));

  if (activeReplies.length === 0) return null;

  const totalCount = activeReplies.length;
  const topReply = activeReplies[0];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed right-4 bottom-6 z-50 transition-all duration-300 select-none"
    >
      {/* Visual Retraído / Pill Lateral quando não há hover */}
      {!isHovered ? (
        <div
          onClick={() => setIsHovered(true)}
          className="cursor-pointer group flex items-center gap-3 bg-[#111b21] hover:bg-[#202c33] border border-[#00a884]/40 hover:border-[#00a884] p-3 rounded-2xl shadow-2xl shadow-black/80 animate-in slide-in-from-right-4 duration-300 max-w-sm"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#00a884]/20 border border-[#00a884]/60 flex items-center justify-center text-[#00a884]">
              <WhatsAppIcon className="w-5 h-5 fill-current animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#00a884] text-[10px] font-bold text-[#111b21] font-mono shadow-md">
              {totalCount}
            </span>
          </div>

          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-[#00a884] font-semibold">
                Lead Respondeu
              </span>
              <span className="text-[9px] text-[#8696a0] font-mono">
                {totalCount > 1 ? `+${totalCount - 1} outros` : 'agora'}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-[#e9edef] truncate">
              {topReply.lead.company_name}
            </h4>
            <p className="text-[11px] text-[#8696a0] truncate mt-0.5 max-w-[200px]">
              "{topReply.lastMessage.sent_text}"
            </p>
          </div>

          <span className="text-[10px] font-mono text-[#8696a0] group-hover:text-white shrink-0 pl-1">
            Passar mouse →
          </span>
        </div>
      ) : (
        /* Visual Expandido com a fila completa de todos os leads que responderam */
        <div className="w-84 sm:w-96 rounded-2xl bg-[#111b21] border border-[#00a884]/60 shadow-2xl shadow-black/90 overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header da Fila */}
          <div className="p-3.5 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
                <WhatsAppIcon className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#e9edef] font-heading flex items-center gap-1.5">
                  Respostas de Leads ({totalCount})
                </h4>
                <span className="text-[10px] text-[#8696a0]">
                  Passe o mouse ou clique no balão para responder
                </span>
              </div>
            </div>

            <button
              onClick={() => setDismissedIds(activeReplies.map((r) => r.lead.id))}
              className="text-[10px] text-[#8696a0] hover:text-[#e9edef] font-mono hover:underline"
            >
              Dispensar todos
            </button>
          </div>

          {/* Fila Rolável de Balões */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[#202c33] p-1.5 space-y-1.5">
            {activeReplies.map(({ lead, lastMessage, unreadCount }) => (
              <div
                key={lead.id}
                onClick={() => {
                  router.push(`/chat?leadId=${lead.id}`);
                  setIsHovered(false);
                }}
                className="p-3 rounded-xl bg-[#202c33]/70 hover:bg-[#2a3942] border border-[#2a3942] hover:border-[#00a884]/60 transition-all cursor-pointer group flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#111b21] border border-[#2a3942] flex items-center justify-center font-bold text-[11px] text-[#00a884] shrink-0">
                      {lead.company_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-[#e9edef] group-hover:text-[#00a884] transition-colors truncate">
                        {lead.company_name}
                      </h5>
                      <span className="text-[10px] text-[#8696a0] truncate block">
                        {lead.name} • {lead.city}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.2 rounded-full bg-[#00a884] text-[#111b21] text-[9px] font-mono font-bold">
                      {unreadCount} {unreadCount === 1 ? 'msg' : 'msgs'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissedIds((prev) => [...prev, lead.id]);
                      }}
                      className="text-[#8696a0] hover:text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Dispensar este alerta"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Balãozinho com o começo da resposta do cliente */}
                <div className="p-2 rounded-lg bg-[#111b21] border border-[#2a3942] text-[11px] text-[#d1d7db] leading-relaxed line-clamp-2 italic">
                  "{lastMessage.sent_text}"
                </div>

                {/* Rodapé com botão de responder */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] font-mono text-[#8696a0]">
                    {new Date(lastMessage.sent_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00a884] group-hover:translate-x-0.5 transition-transform">
                    <span>Responder no Chat</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé Geral */}
          <div className="p-2.5 bg-[#202c33]/50 border-t border-[#2a3942] text-center">
            <button
              onClick={() => {
                router.push('/chat');
                setIsHovered(false);
              }}
              className="text-[11px] font-medium text-[#00a884] hover:underline"
            >
              Abrir Painel Completo do Chat WhatsApp →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
