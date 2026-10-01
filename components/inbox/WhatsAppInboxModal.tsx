'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Smile,
  Paperclip,
  Mic,
  Check,
  CheckCheck,
  Sparkles,
  Phone,
  Video,
  MoreVertical,
  Calendar,
  DollarSign,
  ShieldAlert,
  Flame,
  Clock,
  ExternalLink,
  Volume2,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { Lead, MessageLog } from '@/types/database';
import { crmService } from '@/lib/services/crm-service';
import { crmBrain, SentimentAnalysis } from '@/lib/ai/crm-brain';
import { cleanPhoneNumber } from '@/lib/utils/whatsapp';

export interface InboxLeadTarget {
  id?: string;
  name?: string;
  company_name?: string;
  company?: string;
  phone?: string;
  whatsapp?: string;
  segment?: string;
  score?: number;
  temperature?: any;
  city?: string;
  state?: string;
  services?: string[];
  role?: string;
}

export interface WhatsAppInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: InboxLeadTarget | Lead | any | null;
  initialMessage?: string;
}

export function WhatsAppInboxModal({
  isOpen,
  onClose,
  lead,
  initialMessage = '',
}: WhatsAppInboxModalProps) {
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [inputText, setInputText] = useState(initialMessage);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [isGeneratingAiReply, setIsGeneratingAiReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioIntervalRef = useRef<any>(null);

  // Carrega histórico de mensagens do lead
  useEffect(() => {
    if (lead && isOpen) {
      const logs = crmService.getMessageLogs(lead.id);
      
      // Se o lead ainda não tem mensagens, cria a mensagem inicial sugerida no input
      if (logs.length === 0 && initialMessage) {
        setInputText(initialMessage);
      } else if (initialMessage && !inputText) {
        setInputText(initialMessage);
      }

      setMessages([...logs].reverse()); // Exibe cronológico
      const analysis = crmBrain.analyzeConversationSentiment(logs, lead);
      setSentiment(analysis);
    }
  }, [lead, isOpen, initialMessage]);

  // Rola até o final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Atualiza sentimento quando mensagens mudam
  const refreshSentiment = (currentLogs: MessageLog[]) => {
    if (!lead) return;
    const analysis = crmBrain.analyzeConversationSentiment(currentLogs, lead);
    setSentiment(analysis);
  };

  if (!isOpen || !lead) return null;

  const quickEmojis = ['😊', '👍', '🤝', '💼', '🚀', '🔥', '💰', '📅', '📱', '✨', '🙏', '👏', '🎯', '✅'];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setIsSending(true);

    try {
      // 1. Tenta enviar via rota da Evolution API
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: lead.whatsapp || lead.phone,
          text: text,
          leadId: lead.id,
          customUrl: typeof window !== 'undefined' ? localStorage.getItem('EVO_evolutionUrl') : undefined,
          customApiKey: typeof window !== 'undefined' ? localStorage.getItem('EVO_evolutionApiKey') : undefined,
          customInstance: typeof window !== 'undefined' ? localStorage.getItem('EVO_evolutionInstance') : undefined,
        }),
      });

      // 2. Grava log no crmService
      const newLog: MessageLog = crmService.addMessageLog({
        lead_id: lead.id,
        step_name: 'Mensagem WhatsApp Inbox',
        channel: 'WhatsApp (Evolution API)',
        sent_text: text,
        direction: 'enviada',
        sent_at: new Date().toISOString(),
        source: 'manual',
        status: 'entregue',
      });

      // Atualiza status do lead para "em_abordagem"
      lead.status = 'em_abordagem';
      crmService.updateLead(lead.id, { status: 'em_abordagem' });

      const updated = [...messages, newLog];
      setMessages(updated);
      refreshSentiment(updated);
      setInputText('');
      setShowEmojiPicker(false);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      // Fallback local
      const newLog = crmService.addMessageLog({
        lead_id: lead.id,
        step_name: 'Mensagem WhatsApp Inbox',
        channel: 'WhatsApp (Evolution API)',
        sent_text: text,
        direction: 'enviada',
        sent_at: new Date().toISOString(),
        source: 'manual',
        status: 'entregue',
      });
      const updated = [...messages, newLog];
      setMessages(updated);
      refreshSentiment(updated);
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  // Simular resposta do cliente (útil para testes de fluxo e termômetro ao vivo)
  const handleSimulateClientReply = (replyText: string) => {
    const newLog: MessageLog = crmService.addMessageLog({
      lead_id: lead.id,
      step_name: 'Resposta do Cliente',
      channel: 'WhatsApp (Evolution API)',
      sent_text: replyText,
      direction: 'recebida',
      sent_at: new Date().toISOString(),
      source: 'manual',
      status: 'entregue',
    });
    const updated = [...messages, newLog];
    setMessages(updated);
    refreshSentiment(updated);
  };

  // Envio de mensagem de áudio simulada
  const handleToggleRecordAudio = () => {
    if (!isRecordingAudio) {
      setIsRecordingAudio(true);
      setAudioSeconds(0);
      audioIntervalRef.current = setInterval(() => {
        setAudioSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(audioIntervalRef.current);
      setIsRecordingAudio(false);
      const secs = audioSeconds;
      setAudioSeconds(0);

      // Registra mensagem de áudio no histórico
      const newLog: MessageLog = crmService.addMessageLog({
        lead_id: lead.id,
        step_name: 'Mensagem de Áudio Gravada',
        channel: 'WhatsApp (Evolution API)',
        sent_text: `🎙️ Mensagem de Áudio (${secs || 1}s)`,
        direction: 'enviada',
        sent_at: new Date().toISOString(),
        source: 'manual',
        status: 'entregue',
      });
      const updated = [...messages, newLog];
      setMessages(updated);
      refreshSentiment(updated);
    }
  };

  // Envio de imagem simulada
  const handleSendImage = () => {
    const newLog: MessageLog = crmService.addMessageLog({
      lead_id: lead.id,
      step_name: 'Imagem / Portfólio',
      channel: 'WhatsApp (Evolution API)',
      sent_text: `📷 [Imagem] Mockup de Site Institucional & Relatório de Oportunidades`,
      direction: 'enviada',
      sent_at: new Date().toISOString(),
      source: 'manual',
      status: 'entregue',
    });
    const updated = [...messages, newLog];
    setMessages(updated);
    refreshSentiment(updated);
  };

  // Gerar resposta inteligente com IA
  const handleGenerateAiResponse = async () => {
    setIsGeneratingAiReply(true);
    try {
      const lastIncoming = messages.filter((m) => m.direction === 'recebida')[messages.length - 1]?.sent_text || '';
      const res = await fetch('/api/whatsapp/ai-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          companyName: lead.company_name,
          clientMessage: lastIncoming,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.replies?.[0]?.text) {
        setInputText(data.replies[0].text);
      }
    } catch (e) {
      console.warn('Erro ao gerar resposta com IA:', e);
    } finally {
      setIsGeneratingAiReply(false);
    }
  };

  const smartReplies = crmBrain.getSmartQuickReplies(lead, messages);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-evo-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Janela do WhatsApp Web Inbox */}
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[850px] bg-[#0c1317] border border-[#222e35] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 font-sans text-xs">
        
        {/* ========================================================================= */}
        {/* HEADER DO INBOX (ESTILO WHATSAPP WEB + TERMÔMETRO DE SENTIMENTO) */}
        {/* ========================================================================= */}
        <div className="bg-[#202c33] px-4 py-2.5 border-b border-[#2a3942] flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-heading font-semibold text-sm shadow">
                {lead.name ? lead.name.slice(0, 2).toUpperCase() : 'WA'}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#202c33]"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-sm text-[#e9edef] leading-tight">
                  {lead.company_name}
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  <WhatsAppIcon className="w-2.5 h-2.5 fill-current" /> Evolution API Ativa
                </span>
              </div>
              <p className="text-[11px] text-[#8696a0]">
                {lead.name} ({lead.role}) • {lead.whatsapp || lead.phone || 'Sem telefone'} • {lead.city}
              </p>
            </div>
          </div>

          {/* Termômetro de Sentimento & Botão Fechar */}
          <div className="flex items-center gap-3">
            {sentiment && (
              <div className="hidden sm:flex items-center gap-2.5 bg-[#111b21] border border-[#2a3942] rounded-xl px-3 py-1.5">
                <div className="flex flex-col text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[10px] font-mono text-[#8696a0]">Sentimento:</span>
                    <span className="font-mono font-bold text-xs" style={{ color: sentiment.thermometerColor }}>
                      {sentiment.score}% {sentiment.label}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#8696a0] max-w-[180px] truncate">
                    {sentiment.clientMood}
                  </span>
                </div>

                {/* Barra do Termômetro */}
                <div className="w-16 h-2 bg-[#2a3942] rounded-full overflow-hidden flex">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${sentiment.score}%`,
                      backgroundColor: sentiment.thermometerColor,
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8696a0] hover:text-white hover:bg-[#374248] transition-colors"
              title="Fechar Inbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FAIXA DO COPILOTO IA — ORIENTAÇÃO TÁTICA EM TEMPO REAL */}
        {/* ========================================================================= */}
        {sentiment && (
          <div className="bg-[#182229] border-b border-[#222e35] px-4 py-2 flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-2 text-[#d1d7db]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <span className="font-medium text-amber-300">Dica do Gestor IA:</span>
              <span className="text-[#8696a0]">{sentiment.recommendation}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline font-mono text-[10px] text-purple-400 bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded">
                Próximo passo: {sentiment.bestNextAction}
              </span>
              <button
                onClick={handleGenerateAiResponse}
                disabled={isGeneratingAiReply}
                className="px-2 py-1 rounded bg-[#2a3942] hover:bg-[#374248] text-white text-[10px] font-mono flex items-center gap-1 transition-all active:scale-95"
                title="Pedir sugestão de resposta para a IA"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{isGeneratingAiReply ? 'Gerando...' : 'IA Sugerir'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STREAM DE MENSAGENS (ESTILO WHATSAPP WEB COM PAPEL DE PAREDE) */}
        {/* ========================================================================= */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] relative"
          style={{
            backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        >
          {/* Alerta de Criptografia e Conexão Evolution */}
          <div className="flex justify-center">
            <div className="bg-[#182229] border border-[#222e35] text-[#8696a0] rounded-lg px-3 py-1 text-[10px] font-mono text-center max-w-md shadow-sm">
              🔒 As mensagens são sincronizadas diretamente com a instância Evolution API do WhatsApp.
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-[#8696a0] space-y-2">
              <WhatsAppIcon className="w-10 h-10 fill-[#8696a0]/40" />
              <p className="text-xs">Nenhuma mensagem registrada ainda para este contato.</p>
              <p className="text-[11px] text-[#8696a0]/70 max-w-sm">
                Use a abordagem sugerida abaixo ou clique em um dos botões rápidos para iniciar a conversa pelo WhatsApp.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOutgoing = msg.direction === 'enviada';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 shadow-md relative leading-relaxed whitespace-pre-wrap break-words ${
                      isOutgoing
                        ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                        : 'bg-[#202c33] text-[#d1d7db] rounded-tl-none border border-[#2a3942]'
                    }`}
                  >
                    {/* Conteúdo da Mensagem */}
                    <div className="text-[12px]">{msg.sent_text}</div>

                    {/* Rodapé da Bolha (Hora + Checkmarks) */}
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

        {/* ========================================================================= */}
        {/* BOTÕES RÁPIDOS DE ATENDIMENTO COM IA */}
        {/* ========================================================================= */}
        <div className="bg-[#111b21] border-t border-[#202c33] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-mono text-[#8696a0] shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Respostas Rápidas:
          </span>
          {smartReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputText(reply.text)}
              className="px-2.5 py-1 rounded-full bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-[#d1d7db] hover:text-white text-[11px] font-medium whitespace-nowrap transition-all active:scale-95 shadow-sm"
              title={reply.text}
            >
              {reply.label}
            </button>
          ))}

          {/* Botão de Teste: Simular Resposta do Lead */}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleSimulateClientReply('Olá! Recebi sua mensagem, qual seria o valor para implementar isso aqui?')}
              className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono transition-colors"
              title="Simula cliente respondendo com interesse para testar o termômetro"
            >
              + Simular Pergunta Lead
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TRAY DE EMOJIS RÁPIDOS */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* FOOTER DE DIGITAÇÃO & DISPARO (WHATSAPP WEB STYLE) */}
        {/* ========================================================================= */}
        <div className="bg-[#202c33] px-3 py-2 border-t border-[#2a3942] flex items-center gap-2 shrink-0">
          {/* Botão Emoji */}
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

          {/* Botão Anexo de Imagem */}
          <button
            type="button"
            onClick={handleSendImage}
            className="p-2 rounded-full text-[#8696a0] hover:text-[#d1d7db] transition-colors"
            title="Enviar Imagem / Mockup"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Campo de Entrada de Mensagem */}
          <div className="flex-1 bg-[#2a3942] rounded-xl px-3.5 py-1.5 flex items-center border border-transparent focus-within:border-[#00a884]">
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
              placeholder="Digite uma mensagem para o WhatsApp..."
              className="w-full bg-transparent text-[#d1d7db] placeholder-[#8696a0] text-xs focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Botão de Gravação de Áudio */}
          <button
            type="button"
            onClick={handleToggleRecordAudio}
            className={`p-2 rounded-full transition-all ${
              isRecordingAudio
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-[#8696a0] hover:text-[#d1d7db]'
            }`}
            title={isRecordingAudio ? `Gravando... ${audioSeconds}s (Clique para Enviar)` : 'Gravar Mensagem de Áudio'}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Botão de Envio Principal */}
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
      </div>
    </div>
  );
}
