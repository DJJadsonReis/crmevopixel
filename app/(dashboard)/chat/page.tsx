'use client';

export const runtime = 'edge';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MessageSquare,
  Sparkles,
  Send,
  Smile,
  Mic,
  Paperclip,
  Check,
  CheckCheck,
  Phone,
  Video,
  ExternalLink,
  Flame,
  ArrowUpRight,
  Filter,
  User,
  Building2,
  Calendar,
  DollarSign,
  Tag,
  Clock,
  RefreshCw,
  Archive,
  ArchiveRestore,
  Bot,
  UserCheck,
  PanelRightClose,
  PanelRightOpen,
  Globe,
  AlertTriangle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { crmService } from '@/lib/services/crm-service';
import { useCrmSync } from '@/lib/hooks/useCrmSync';
import { Lead, MessageLog, ConversationMode } from '@/types/database';
import { crmBrain, SentimentAnalysis } from '@/lib/ai/crm-brain';
import { cleanPhoneNumber, formatWhatsAppNumber } from '@/lib/utils/whatsapp';

function WhatsAppChatContent() {
  useCrmSync();
  const searchParams = useSearchParams();
  const initialLeadId = searchParams.get('leadId');
  const initialFilterParam = searchParams.get('filter');
  const defaultFilter =
    initialFilterParam === 'respostas' || initialFilterParam === 'nao_lidas'
      ? 'nao_lidas'
      : 'todos';

  const [leads, setLeads] = useState<Lead[]>(() => crmService.getLeads());
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'nao_lidas' | 'quentes' | 'negociacao' | 'arquivadas'>(defaultFilter);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioIntervalRef = useRef<any>(null);

  // Sincroniza lista de leads
  useEffect(() => {
    const unsub = crmService.subscribe(() => {
      setLeads([...crmService.getLeads()]);
    });
    return unsub;
  }, []);

  // Sincroniza alteração no query param filter
  useEffect(() => {
    const f = searchParams.get('filter');
    if (f === 'respostas' || f === 'nao_lidas') {
      setFilterType('nao_lidas');
    }
  }, [searchParams]);

  // Se nenhum lead selecionado e houver leads, seleciona o primeiro
  useEffect(() => {
    if (!selectedLeadId && leads.length > 0) {
      if (initialLeadId && leads.some((l) => l.id === initialLeadId)) {
        setSelectedLeadId(initialLeadId);
      } else {
        const firstActive = leads.find((l) => !l.conversation_archived) || leads[0];
        setSelectedLeadId(firstActive.id);
      }
    }
  }, [leads, selectedLeadId, initialLeadId]);

  // Limpa contador de não lidas quando uma conversa está ativa
  useEffect(() => {
    if (!selectedLeadId) return;
    const current = leads.find((l) => l.id === selectedLeadId);
    if (current && (current.unread_messages_count || 0) > 0) {
      crmService.updateLead(selectedLeadId, { unread_messages_count: 0 });
    }
  }, [selectedLeadId, leads]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0] || null;

  // Sincronização de mensagens com backend e Evolution API
  const handleSyncConversation = async (silent = false) => {
    if (!selectedLead) return;
    const phone = selectedLead.whatsapp || selectedLead.phone;
    if (!phone) return;
    if (!silent) setIsSyncing(true);
    try {
      await crmService.syncWhatsAppMessages(selectedLead.id, phone);
      // Se tiver mensagens não lidas, marca como lidas ao abrir a conversa
      if (selectedLead.unread_messages_count && selectedLead.unread_messages_count > 0) {
        crmService.updateLead(selectedLead.id, { unread_messages_count: 0 });
      }
    } catch (err) {
      console.warn('Erro ao sincronizar mensagens:', err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Sincroniza conversa automaticamente ao abrir ou trocar de lead
  useEffect(() => {
    if (selectedLead?.id) {
      handleSyncConversation(true);
    }
  }, [selectedLead?.id]);

  // Polling silencioso a cada 10 segundos
  useEffect(() => {
    if (!selectedLead?.id) return;
    const interval = setInterval(() => {
      handleSyncConversation(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedLead?.id, selectedLead?.whatsapp, selectedLead?.phone]);

  // Carrega mensagens do lead selecionado
  const activeMessages = selectedLead
    ? [...crmService.getMessageLogs(selectedLead.id, selectedLead.whatsapp || selectedLead.phone)].reverse()
    : [];

  const sentiment: SentimentAnalysis | null = selectedLead
    ? crmBrain.analyzeConversationSentiment(activeMessages, selectedLead)
    : null;

  // Rola até o final ao trocar lead ou enviar mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLeadId, activeMessages.length]);

  // Timer de áudio
  useEffect(() => {
    if (isRecordingAudio) {
      setAudioSeconds(0);
      audioIntervalRef.current = setInterval(() => {
        setAudioSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isRecordingAudio]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedLead || isSending) return;

    setIsSending(true);

    try {
      // Envia via API Evolution com persistência garantida
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedLead.whatsapp || selectedLead.phone,
          text: text,
          leadId: selectedLead.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const msgId = data?.messageId;

      // Grava no crmService
      crmService.addMessageLog({
        id: msgId,
        lead_id: selectedLead.id,
        phone: selectedLead.whatsapp || selectedLead.phone,
        sender_name: 'Você',
        step_name: 'Chat WhatsApp Web',
        channel: 'WhatsApp (Evolution API)',
        sent_text: text,
        direction: 'enviada',
        sent_at: new Date().toISOString(),
        source: 'manual',
        status: data?.sentViaEvolutionApi ? 'entregue' : (data?.error ? 'falhou' : 'entregue'),
        provider_message_id: msgId,
      });

      // Atualiza status do lead se estava novo
      if (selectedLead.status === 'novo') {
        crmService.updateLead(selectedLead.id, { status: 'em_abordagem' });
      }

      setInputText('');
      setShowEmojiPicker(false);
      setTimeout(() => handleSyncConversation(true), 1200);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      crmService.addMessageLog({
        lead_id: selectedLead.id,
        phone: selectedLead.whatsapp || selectedLead.phone,
        sender_name: 'Você',
        step_name: 'Chat WhatsApp Web',
        channel: 'WhatsApp (Evolution API)',
        sent_text: text,
        direction: 'enviada',
        sent_at: new Date().toISOString(),
        source: 'manual',
        status: 'entregue',
      });
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleMode = (newMode: ConversationMode) => {
    if (!selectedLead) return;
    crmService.updateLead(selectedLead.id, { conversation_mode: newMode });
  };

  const handleToggleArchive = () => {
    if (!selectedLead) return;
    const isCurrentlyArchived = Boolean(selectedLead.conversation_archived);
    crmService.updateLead(selectedLead.id, {
      conversation_archived: !isCurrentlyArchived,
    });
  };

  const handleAddTag = (tag: string) => {
    if (!selectedLead) return;
    const currentTags = selectedLead.tags || [];
    if (currentTags.includes(tag)) {
      crmService.updateLead(selectedLead.id, {
        tags: currentTags.filter((t) => t !== tag),
      });
    } else {
      crmService.updateLead(selectedLead.id, {
        tags: [...currentTags, tag],
      });
    }
  };

  const handleSimulateClientReply = (replyText: string) => {
    if (!selectedLead) return;
    crmService.addMessageLog({
      lead_id: selectedLead.id,
      step_name: 'Resposta do Cliente',
      channel: 'WhatsApp (Evolution API)',
      sent_text: replyText,
      direction: 'recebida',
      sent_at: new Date().toISOString(),
      source: 'manual',
      status: 'entregue',
    });
    crmService.updateLead(selectedLead.id, {
      status: 'em_conversa',
      conversation_archived: false,
      unread_messages_count: (selectedLead.unread_messages_count || 0) + 1,
    });
  };

  const handleSendVoiceNote = () => {
    if (!selectedLead) return;
    setIsRecordingAudio(false);
    crmService.addMessageLog({
      lead_id: selectedLead.id,
      step_name: 'Áudio WhatsApp',
      channel: 'WhatsApp (Evolution API)',
      sent_text: `🎙️ Mensagem de voz gravada (${audioSeconds}s)`,
      direction: 'enviada',
      sent_at: new Date().toISOString(),
      source: 'manual',
      status: 'entregue',
    });
  };

  // Ordenação estrita: conversas com última mensagem/interação mais recente no topo (last_contact_at / last_message_at DESC)
  const getLeadLastInteraction = (l: Lead) => {
    const logs = crmService.getMessageLogs(l.id, l.whatsapp || l.phone);
    const lastLog = logs[0];
    const logTime = lastLog ? new Date(lastLog.sent_at).getTime() : 0;
    const leadContactTime = l.last_contact_at ? new Date(l.last_contact_at).getTime() : 0;
    const createdTime = l.created_at ? new Date(l.created_at).getTime() : 0;
    return Math.max(logTime, leadContactTime, createdTime);
  };

  // Filtra e ordena lista de contatos
  const filteredLeads = leads
    .filter((l) => {
      const matchesSearch =
        l.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.segment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.city || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filtro de arquivados
      if (filterType === 'arquivadas') {
        return Boolean(l.conversation_archived);
      }

      // Se não está na aba arquivadas, esconde os arquivados
      if (l.conversation_archived) return false;

      const logs = crmService.getMessageLogs(l.id, l.whatsapp || l.phone);
      const unreadCount = l.unread_messages_count || logs.filter((m) => m.direction === 'recebida').length;

      if (filterType === 'nao_lidas') return unreadCount > 0;
      if (filterType === 'quentes') return l.temperature === 'quente';
      if (filterType === 'negociacao') {
        return (
          l.status === 'em_abordagem' ||
          l.status === 'em_conversa' ||
          (l.tags && l.tags.includes('Em Negociação'))
        );
      }

      return true;
    })
    .sort((a, b) => getLeadLastInteraction(b) - getLeadLastInteraction(a));

  const quickEmojis = ['😊', '👍', '🤝', '💼', '🚀', '🔥', '💰', '📅', '📱', '✨', '🙏', '👏', '🎯', '✅'];
  const smartReplies = selectedLead ? crmBrain.getSmartQuickReplies(selectedLead, activeMessages) : [];
  const currentMode: ConversationMode = selectedLead?.conversation_mode || 'AI';

  return (
    <div className="h-full flex flex-col rounded-2xl border border-[#202c33] bg-[#111b21] overflow-hidden shadow-2xl">
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* PAINEL 1: LISTA DE CONTATOS / CONVERSAS */}
        {/* ========================================================================= */}
        <div className="w-80 md:w-88 lg:w-96 border-r border-[#202c33] bg-[#111b21] flex flex-col shrink-0">
          {/* Header da Coluna */}
          <div className="p-3.5 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884]">
                <WhatsAppIcon className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#e9edef] font-heading">
                  Inbox WhatsApp
                </h2>
                <span className="text-[10px] text-[#8696a0] font-mono">
                  {leads.length} leads sincronizados
                </span>
              </div>
            </div>

            <Link
              href="/leads"
              className="text-[11px] font-mono text-[#00a884] hover:underline flex items-center gap-1"
              title="Gerenciar Leads"
            >
              + Leads
            </Link>
          </div>

          {/* Campo de Busca */}
          <div className="p-2.5 bg-[#111b21] border-b border-[#202c33]">
            <div className="relative flex items-center bg-[#202c33] rounded-xl px-3 py-1.5 border border-transparent focus-within:border-[#00a884]">
              <Search className="w-3.5 h-3.5 text-[#8696a0] mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversa ou empresa..."
                className="w-full bg-transparent text-xs text-[#d1d7db] placeholder-[#8696a0] focus:outline-none"
              />
            </div>

            {/* Filtros Rápidos */}
            <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'todos', label: 'Todas' },
                { id: 'nao_lidas', label: 'Respostas 💬' },
                { id: 'quentes', label: 'Quentes 🔥' },
                { id: 'negociacao', label: 'Negociação 💼' },
                { id: 'arquivadas', label: 'Arquivadas 📦' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${
                    filterType === tab.id
                      ? 'bg-[#00a884] text-[#111b21] font-bold shadow-sm'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-[#d1d7db]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Rolável de Contatos */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]">
            {filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8696a0] space-y-2">
                <MessageSquare className="w-8 h-8 text-[#8696a0]/40 mx-auto" />
                <p>Nenhuma conversa encontrada neste filtro.</p>
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const logs = crmService.getMessageLogs(lead.id, lead.whatsapp || lead.phone);
                const lastLog = logs[0];
                const unreadCount = lead.unread_messages_count || 0;
                const isSelected = lead.id === selectedLeadId;
                const mode = lead.conversation_mode || 'AI';

                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      setSelectedLeadId(lead.id);
                      if (lead.unread_messages_count && lead.unread_messages_count > 0) {
                        crmService.updateLead(lead.id, { unread_messages_count: 0 });
                      }
                    }}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
                      isSelected
                        ? 'bg-[#2a3942]'
                        : 'hover:bg-[#202c33]/80 bg-[#111b21]'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-[#202c33] border border-[#2a3942] flex items-center justify-center font-bold text-xs text-[#00a884] shadow-sm">
                        {lead.company_name.substring(0, 2).toUpperCase()}
                      </div>
                      {lead.temperature === 'quente' && (
                        <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">
                          🔥
                        </span>
                      )}
                      {mode === 'HUMAN' && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 border border-[#111b21]" title="Controle Humano" />
                      )}
                    </div>

                    {/* Informações da Conversa */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-semibold text-[#e9edef] truncate">
                          {lead.company_name}
                        </h4>
                        <span className="text-[10px] text-[#8696a0] font-mono shrink-0">
                          {lastLog
                            ? new Date(lastLog.sent_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#8696a0] truncate mt-0.5">
                        {lead.name} • {lead.city}
                      </div>

                      {/* Snippet da Última Mensagem */}
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <p className="text-[11px] text-[#8696a0] truncate flex items-center gap-1">
                          {lastLog ? (
                            <>
                              {lastLog.direction === 'enviada' ? (
                                <CheckCheck className="w-3 h-3 text-[#53bdeb] shrink-0" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] shrink-0" />
                              )}
                              <span className="text-[#00a884] font-medium shrink-0">
                                {lastLog.direction === 'recebida'
                                  ? 'Cliente: '
                                  : lastLog.source === 'automatica_n8n'
                                  ? 'IA: '
                                  : 'Você: '}
                              </span>
                              <span className="truncate">{lastLog.sent_text}</span>
                            </>
                          ) : (
                            <span className="italic text-[#8696a0]/70">Sem mensagens ainda</span>
                          )}
                        </p>

                        {/* Badge de Mensagens Não Lidas */}
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#00a884] text-[#111b21] font-bold text-[9px] font-mono shrink-0 shadow-sm animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Tags / Post-its do Lead */}
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {lead.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium"
                            >
                              🏷️ {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PAINEL 2: CHAT CENTRAL */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col bg-[#0b141a] overflow-hidden min-w-0">
          {selectedLead ? (
            <>
              {/* Header do Chat Ativo */}
              <div className="px-4 py-2.5 bg-[#202c33] border-b border-[#2a3942] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#111b21] border border-[#2a3942] flex items-center justify-center font-bold text-xs text-[#00a884] shadow-sm shrink-0">
                    {selectedLead.company_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#e9edef] font-heading truncate">
                        {selectedLead.company_name}
                      </h3>
                      {selectedLead.whatsapp && (
                        <a
                          href={`https://wa.me/${cleanPhoneNumber(selectedLead.whatsapp)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-[#00a884] hover:underline shrink-0"
                        >
                          {selectedLead.whatsapp}
                        </a>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8696a0] flex items-center gap-1.5 truncate">
                      <span>{selectedLead.name}</span>
                      <span>•</span>
                      <span>{selectedLead.segment}</span>
                      <span>•</span>
                      <span>{selectedLead.city}/{selectedLead.state}</span>
                    </div>
                  </div>
                </div>

                {/* Controles de Modo IA vs Humano & Arquivamento */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Pill do Modo */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      currentMode === 'AI'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : currentMode === 'HUMAN'
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {currentMode === 'AI' ? (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        <span>Agente IA Ativo</span>
                      </>
                    ) : currentMode === 'HUMAN' ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Atendimento Humano</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pausado</span>
                      </>
                    )}
                  </span>

                  {/* Botão de Alternância de Atendimento */}
                  {currentMode === 'AI' ? (
                    <button
                      type="button"
                      onClick={() => handleToggleMode('HUMAN')}
                      className="px-2.5 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      title="Assumir conversa manualmente e pausar respostas autônomas da IA"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Assumir Atendimento</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleMode('AI')}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      title="Devolver atendimento para o Agente IA autônomo"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Devolver ao Agente</span>
                    </button>
                  )}

                  {/* Botão Arquivar / Desarquivar */}
                  <button
                    type="button"
                    onClick={handleToggleArchive}
                    className="p-1.5 rounded-xl bg-[#2a3942] hover:bg-[#32424b] text-[#8696a0] hover:text-[#d1d7db] transition-colors"
                    title={selectedLead.conversation_archived ? 'Desarquivar Conversa' : 'Arquivar Conversa'}
                  >
                    {selectedLead.conversation_archived ? (
                      <ArchiveRestore className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </button>

                  {/* Sincronização Evolution API */}
                  <button
                    type="button"
                    onClick={() => handleSyncConversation(false)}
                    disabled={isSyncing}
                    className="p-1.5 rounded-xl bg-[#2a3942] hover:bg-[#32424b] text-[#00a884] hover:text-[#00c99e] transition-colors disabled:opacity-50"
                    title="Sincronizar mensagens agora"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>

                  {/* Toggle Painel Contexto */}
                  <button
                    type="button"
                    onClick={() => setShowContextPanel(!showContextPanel)}
                    className="p-1.5 rounded-xl bg-[#2a3942] hover:bg-[#32424b] text-[#8696a0] hover:text-[#d1d7db] transition-colors"
                    title={showContextPanel ? 'Ocultar Contexto do Lead' : 'Ver Contexto do Lead'}
                  >
                    {showContextPanel ? (
                      <PanelRightClose className="w-4 h-4" />
                    ) : (
                      <PanelRightOpen className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Faixa com Orientação Estratégica do Agente IA */}
              {sentiment && (
                <div className="bg-[#111b21] border-b border-[#202c33] px-4 py-2 flex items-center justify-between text-xs text-[#8696a0]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-semibold shrink-0">
                      Copilot IA
                    </span>
                    <span className="truncate text-[#d1d7db]">
                      <strong className="text-white">Dica Comercial:</strong> {sentiment.tacticalAdvice}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400 shrink-0 hidden sm:inline">
                    Próximo passo: {sentiment.bestNextAction}
                  </span>
                </div>
              )}

              {/* Área de Mensagens (Estilo WhatsApp Web) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-opacity-95 relative">
                {activeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[#8696a0] space-y-3">
                    <div className="w-14 h-14 rounded-full bg-[#202c33] flex items-center justify-center text-[#00a884]">
                      <WhatsAppIcon className="w-7 h-7 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Nenhuma mensagem registrada</h4>
                      <p className="text-xs text-[#8696a0] mt-1 max-w-sm">
                        Use a caixa abaixo ou clique em uma das respostas rápidas para iniciar o atendimento no WhatsApp de {selectedLead.company_name}.
                      </p>
                    </div>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isOutgoing = msg.direction === 'enviada';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md relative leading-relaxed whitespace-pre-wrap break-words ${
                            isOutgoing
                              ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                              : 'bg-[#202c33] text-[#d1d7db] rounded-tl-none border border-[#2a3942]'
                          }`}
                        >
                          <div className="text-xs">{msg.sent_text}</div>

                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#8696a0]">
                            <span>
                              {new Date(msg.sent_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOutgoing && (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Botões Rápidos de IA & Simulação */}
              <div className="bg-[#111b21] border-t border-[#202c33] px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-mono text-[#8696a0] shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Respostas Rápidas IA:
                </span>
                {smartReplies.map((reply, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInputText(reply.text)}
                    className="px-2.5 py-1 rounded-full bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-[#d1d7db] hover:text-white text-[11px] font-medium whitespace-nowrap transition-all active:scale-95"
                    title={reply.text}
                  >
                    {reply.label}
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleSimulateClientReply(
                        'Olá! Vi a proposta de vocês sobre o site e a automação. Qual seria o investimento aproximado para o nosso escritório?'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono transition-colors"
                    title="Simula resposta de lead para testar o termômetro, fila de notificações e desativação de automação"
                  >
                    + Simular Resposta Lead
                  </button>
                </div>
              </div>

              {/* Tray de Emojis Rápidos */}
              {showEmojiPicker && (
                <div className="bg-[#202c33] border-t border-[#2a3942] px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 animate-in slide-in-from-bottom-2 duration-150">
                  <span className="text-[10px] font-mono text-[#8696a0]">Emojis:</span>
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setInputText((prev) => prev + emoji)}
                      className="text-base hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Rodapé de Digitação e Disparo */}
              <div className="bg-[#202c33] px-4 py-2.5 border-t border-[#2a3942] flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-full transition-colors ${
                    showEmojiPicker ? 'text-[#00a884] bg-[#2a3942]' : 'text-[#8696a0] hover:text-[#d1d7db]'
                  }`}
                  title="Inserir Emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <div className="flex-1 bg-[#2a3942] rounded-xl px-3.5 py-2 flex items-center border border-transparent focus-within:border-[#00a884]">
                  <textarea
                    rows={Math.min(4, Math.max(1, inputText.split('\n').length))}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Enviar mensagem no WhatsApp de ${selectedLead.company_name}...`}
                    className="w-full bg-transparent text-[#d1d7db] placeholder-[#8696a0] text-xs focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="button"
                  onClick={isRecordingAudio ? handleSendVoiceNote : () => setIsRecordingAudio(true)}
                  className={`p-2 rounded-full transition-all ${
                    isRecordingAudio
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-[#8696a0] hover:text-[#d1d7db]'
                  }`}
                  title={isRecordingAudio ? `Gravando... ${audioSeconds}s (Clique para Enviar)` : 'Gravar Mensagem de Áudio'}
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isSending}
                  className={`p-2.5 rounded-full transition-all ${
                    inputText.trim() && !isSending
                      ? 'bg-[#00a884] hover:bg-[#008f6f] text-white shadow-md active:scale-95'
                      : 'text-[#8696a0] opacity-40 cursor-not-allowed'
                  }`}
                  title="Enviar pelo WhatsApp (Evolution API)"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 fill-current" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8696a0] space-y-3">
              <WhatsAppIcon className="w-16 h-16 fill-[#8696a0]/30" />
              <h3 className="text-base font-semibold text-white">Nenhum contato selecionado</h3>
              <p className="text-xs text-[#8696a0] max-w-sm">
                Selecione uma empresa na lista lateral para abrir o chat completo e disparar abordagens.
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PAINEL 3: CONTEXTO DO LEAD (COMERCIAL & TÉCNICO) */}
        {/* ========================================================================= */}
        {showContextPanel && selectedLead && (
          <div className="w-80 lg:w-96 border-l border-[#202c33] bg-[#111b21] flex flex-col shrink-0 overflow-y-auto p-4 space-y-5 animate-in slide-in-from-right-4 duration-200">
            {/* Header do Painel de Contexto */}
            <div className="flex items-center justify-between pb-3 border-b border-[#202c33]">
              <div>
                <h3 className="text-xs font-semibold text-[#e9edef] uppercase tracking-wider font-mono">
                  Contexto Comercial
                </h3>
                <span className="text-[10px] text-[#8696a0]">
                  Dados e diagnóstico de inteligência
                </span>
              </div>
              <Link
                href={`/leads/${selectedLead.id}`}
                className="text-xs text-[#00a884] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Ver Lead</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Score & Temperatura */}
            <div className="p-3.5 rounded-xl bg-[#202c33]/60 border border-[#2a3942] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8696a0]">Score Geral:</span>
                <span className="text-sm font-bold text-[#00a884] font-mono">
                  {selectedLead.score}/100
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#111b21] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00a884]"
                  style={{ width: `${selectedLead.score}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-[#8696a0]">Status do Lead:</span>
                <span className="font-semibold text-white uppercase">{selectedLead.status}</span>
              </div>
            </div>

            {/* Presença Digital & Saúde do Site */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-[#8696a0] uppercase font-mono flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00a884]" /> Presença Digital
              </h4>
              <div className="p-3 rounded-xl bg-[#202c33]/40 border border-[#2a3942] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8696a0]">Website:</span>
                  {selectedLead.website ? (
                    <a
                      href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#00a884] hover:underline truncate max-w-[150px] inline-flex items-center gap-1"
                    >
                      {selectedLead.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-red-400 font-medium">Sem Site</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8696a0]">Saúde do Site:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    selectedLead.site_health_status === 'ONLINE_OK'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : selectedLead.site_health_status === 'OFFLINE' || selectedLead.site_health_status === 'NO_WEBSITE'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {selectedLead.site_health_status || 'Não auditado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnóstico Comercial EVO IA */}
            {selectedLead.enrichment_data?.diagnosis && selectedLead.enrichment_data.diagnosis.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-amber-400 uppercase font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Diagnóstico Crítico
                </h4>
                <div className="space-y-1.5">
                  {selectedLead.enrichment_data.diagnosis.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[#d1d7db]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Oportunidades & Serviços Recomendados */}
            {selectedLead.enrichment_data?.opportunities && selectedLead.enrichment_data.opportunities.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-[#00a884] uppercase font-mono flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Oportunidades Identificadas
                </h4>
                <div className="space-y-1.5">
                  {selectedLead.enrichment_data.opportunities.slice(0, 2).map((op, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#00a884]/10 border border-[#00a884]/20 text-xs text-[#d1d7db]"
                    >
                      {op}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post-it / Tags Rápidas */}
            <div className="space-y-2 pt-2 border-t border-[#202c33]">
              <h4 className="text-[11px] font-semibold text-[#8696a0] uppercase font-mono flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Etiquetas Rápidas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['Em Negociação', 'Proposta Enviada', 'Aguardando Retorno', 'Fechado', 'Sem Interesse'].map((tag) => {
                  const isTagged = (selectedLead.tags || []).includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        isTagged
                          ? 'bg-amber-500 text-[#111b21] font-bold shadow-sm'
                          : 'bg-[#202c33] text-[#8696a0] hover:text-[#d1d7db] border border-[#2a3942]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WhatsAppChatPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center text-xs text-evo-muted font-mono">
          Carregando Chat WhatsApp...
        </div>
      }
    >
      <WhatsAppChatContent />
    </React.Suspense>
  );
}
