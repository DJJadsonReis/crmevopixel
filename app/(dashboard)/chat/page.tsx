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
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { crmService } from '@/lib/services/crm-service';
import { useCrmSync } from '@/lib/hooks/useCrmSync';
import { Lead, MessageLog } from '@/types/database';
import { crmBrain, SentimentAnalysis } from '@/lib/ai/crm-brain';
import { cleanPhoneNumber, formatWhatsAppNumber } from '@/lib/utils/whatsapp';

function WhatsAppChatContent() {
  useCrmSync();
  const searchParams = useSearchParams();
  const initialLeadId = searchParams.get('leadId');

  const [leads, setLeads] = useState<Lead[]>(() => crmService.getLeads());
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'nao_lidas' | 'quentes' | 'negociacao'>('todos');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioIntervalRef = useRef<any>(null);

  // Sincroniza lista de leads
  useEffect(() => {
    const unsub = crmService.subscribe(() => {
      setLeads([...crmService.getLeads()]);
    });
    return unsub;
  }, []);

  // Se nenhum lead selecionado e houver leads, seleciona o primeiro por padrão
  useEffect(() => {
    if (!selectedLeadId && leads.length > 0) {
      if (initialLeadId && leads.some((l) => l.id === initialLeadId)) {
        setSelectedLeadId(initialLeadId);
      } else {
        setSelectedLeadId(leads[0].id);
      }
    }
  }, [leads, selectedLeadId, initialLeadId]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0] || null;

  // Sincronização manual e automática das mensagens reais da Evolution API
  const handleSyncConversation = async (silent = false) => {
    if (!selectedLead) return;
    const phone = selectedLead.whatsapp || selectedLead.phone;
    if (!phone) return;
    if (!silent) setIsSyncing(true);
    try {
      await crmService.syncWhatsAppMessages(selectedLead.id, phone);
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

  // Polling silencioso a cada 10 segundos para mensagens recebidas no WhatsApp
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

  // Timer de gravação de áudio
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
      // Envia via API Evolution
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedLead.whatsapp || selectedLead.phone,
          text: text,
          leadId: selectedLead.id,
        }),
      });

      // Grava no crmService
      crmService.addMessageLog({
        lead_id: selectedLead.id,
        step_name: 'Chat WhatsApp Web',
        channel: 'WhatsApp (Evolution API)',
        sent_text: text,
        direction: 'enviada',
        sent_at: new Date().toISOString(),
        source: 'manual',
        status: 'entregue',
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
      // Fallback local garantido
      crmService.addMessageLog({
        lead_id: selectedLead.id,
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
    crmService.updateLead(selectedLead.id, { status: 'em_conversa' });
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

  // Filtra lista de contatos
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.segment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.city || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const logs = crmService.getMessageLogs(l.id);
    const unreadCount = logs.filter((m) => m.direction === 'recebida').length;

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
  });

  const quickEmojis = ['😊', '👍', '🤝', '💼', '🚀', '🔥', '💰', '📅', '📱', '✨', '🙏', '👏', '🎯', '✅'];

  const smartReplies = selectedLead ? crmBrain.getSmartQuickReplies(selectedLead, activeMessages) : [];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col rounded-2xl border border-[#202c33] bg-[#111b21] overflow-hidden shadow-2xl">
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA: LISTA DE CONTATOS / CONVERSAS */}
        {/* ========================================================================= */}
        <div className="w-80 md:w-96 border-r border-[#202c33] bg-[#111b21] flex flex-col shrink-0">
          {/* Header da Coluna */}
          <div className="p-3.5 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884]">
                <WhatsAppIcon className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#e9edef] font-heading">
                  Chat WhatsApp
                </h2>
                <span className="text-[10px] text-[#8696a0] font-mono">
                  {leads.length} contatos no CRM
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
                <p>Nenhuma conversa encontrada com este filtro.</p>
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const logs = crmService.getMessageLogs(lead.id);
                const lastLog = logs[0];
                const receivedCount = logs.filter((m) => m.direction === 'recebida').length;
                const isSelected = lead.id === selectedLeadId;

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
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
                              {lastLog.direction === 'enviada' && (
                                <CheckCheck className="w-3 h-3 text-[#53bdeb] shrink-0" />
                              )}
                              <span className="truncate">{lastLog.sent_text}</span>
                            </>
                          ) : (
                            <span className="italic text-[#8696a0]/70">Sem mensagens ainda</span>
                          )}
                        </p>

                        {/* Badge de Mensagens do Lead */}
                        {receivedCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#00a884] text-[#111b21] font-bold text-[9px] font-mono shrink-0 shadow-sm">
                            {receivedCount}
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
        {/* COLUNA DIREITA: JANELA DO CHAT ATIVO */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col bg-[#0b141a] overflow-hidden">
          {selectedLead ? (
            <>
              {/* Header do Chat Ativo */}
              <div className="px-4 py-2.5 bg-[#202c33] border-b border-[#2a3942] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#111b21] border border-[#2a3942] flex items-center justify-center font-bold text-xs text-[#00a884] shadow-sm">
                    {selectedLead.company_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#e9edef] font-heading">
                        {selectedLead.company_name}
                      </h3>
                      {selectedLead.whatsapp && (
                        <a
                          href={`https://wa.me/${cleanPhoneNumber(selectedLead.whatsapp)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-[#00a884] hover:underline"
                        >
                          {selectedLead.whatsapp}
                        </a>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8696a0] flex items-center gap-1.5">
                      <span>{selectedLead.name}</span>
                      <span>•</span>
                      <span>{selectedLead.segment}</span>
                      <span>•</span>
                      <span>{selectedLead.city}/{selectedLead.state}</span>
                    </div>
                  </div>
                </div>

                {/* Termômetro e Ações no Topo do Chat */}
                <div className="flex items-center gap-3">
                  {sentiment && (
                    <div className="bg-[#111b21] border border-[#2a3942] px-3 py-1.5 rounded-xl flex items-center gap-2.5 text-xs">
                      <div>
                        <div className="text-[10px] text-[#8696a0] flex items-center gap-1 font-mono">
                          <span>Humor IA:</span>
                          <span className="font-semibold text-white">
                            {sentiment.temperatureEmoji} {sentiment.temperatureBadge}
                          </span>
                        </div>
                        <div className="w-24 h-1.5 bg-[#202c33] rounded-full overflow-hidden mt-1 border border-[#2a3942]">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-purple-500 transition-all"
                            style={{ width: `${sentiment.thermometerScore}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        {sentiment.thermometerScore}%
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSyncConversation(false)}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-xl bg-[#2a3942] hover:bg-[#32424b] text-[#d1d7db] text-xs font-medium flex items-center gap-1.5 transition-colors border border-transparent hover:border-[#00a884]/40 disabled:opacity-50"
                    title="Sincronizar mensagens reais do WhatsApp (Evolution API)"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#00a884] ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline font-mono text-[11px]">
                      {isSyncing ? 'Sincronizando...' : 'Sincronizar Conversa'}
                    </span>
                  </button>

                  <Link
                    href={`/leads/${selectedLead.id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#2a3942] hover:bg-[#32424b] text-[#d1d7db] text-xs font-medium flex items-center gap-1.5 transition-colors border border-transparent hover:border-[#00a884]/40"
                    title="Ver perfil completo do lead"
                  >
                    <span>Ver Perfil</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
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

              {/* Botões Rápidos de IA & Teste */}
              <div className="bg-[#111b21] border-t border-[#202c33] px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-mono text-[#8696a0] shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Respostas Rápidas:
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

                {/* Botão de Teste: Simular Resposta do Lead */}
                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleSimulateClientReply(
                        'Olá! Vi sua mensagem sobre o site e a automação. Qual seria o investimento aproximado para o nosso escritório?'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono transition-colors"
                    title="Simula cliente respondendo com interesse para testar o termômetro e notificações"
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
                Selecione uma empresa na lista lateral para abrir o chat completo, visualizar sentimentos e disparar abordagens.
              </p>
            </div>
          )}
        </div>
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
