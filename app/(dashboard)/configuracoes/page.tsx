'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Settings,
  MessageSquare,
  Workflow,
  Database,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  Copy,
  ExternalLink,
  RefreshCw,
  Server,
  Layers,
  Bot,
  Cpu,
  Terminal,
  Check,
  Eye,
  EyeOff,
  Save,
  Globe,
  Zap,
  Trash2,
} from 'lucide-react';
import { aiProvider, AIProviderConfig } from '@/lib/ai/ai-provider';
import { updateClientConfig } from '@/lib/supabase/client';
import { crmService } from '@/lib/services/crm-service';

export default function ConfiguracoesPage() {
  const [evolutionUrl, setEvolutionUrl] = useState('https://api-evolution-api.1h7ium.easypanel.host');
  const [evolutionApiKey, setEvolutionApiKey] = useState('');
  const [evolutionInstance, setEvolutionInstance] = useState('evocrm-prod');
  const [evoStatus, setEvoStatus] = useState<'idle' | 'loading' | 'online' | 'offline'>('idle');
  const [evoQrCode, setEvoQrCode] = useState<string | null>(null);
  const [evoStatusMsg, setEvoStatusMsg] = useState('');

  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('https://n8n.evopixel.com.br/webhook/crm-events');

  const handleConnectEvolution = async () => {
    if (!evolutionUrl || !evolutionApiKey || !evolutionInstance) {
      setEvoStatusMsg('Preencha URL, API Key e Instância.');
      return;
    }
    setEvoStatus('loading');
    setEvoQrCode(null);
    setEvoStatusMsg('');

    try {
      const baseUrl = evolutionUrl.replace(/\/+$/, '');
      const headers = { 'apikey': evolutionApiKey };

      // Consultar estado da conexão
      const stateRes = await fetch(`${baseUrl}/instance/connectionState/${evolutionInstance}`, { headers });
      if (!stateRes.ok) {
        if (stateRes.status === 404) {
          setEvoStatus('offline');
          setEvoStatusMsg('Instância não encontrada. Crie-a no painel da Evolution primeiro.');
          return;
        }
        throw new Error('Erro ao consultar status da instância.');
      }
      
      const stateData = await stateRes.json();
      const state = stateData?.instance?.state || stateData?.state || stateData?.instance?.stateConnection;

      if (state === 'open') {
        setEvoStatus('online');
        setEvoStatusMsg('WhatsApp Conectado e Online!');
        return;
      }

      // Se não estiver conectado, puxar QR Code
      const connectRes = await fetch(`${baseUrl}/instance/connect/${evolutionInstance}`, { headers });
      if (!connectRes.ok) throw new Error('Erro ao gerar QR Code.');
      
      const connectData = await connectRes.json();
      if (connectData.base64) {
        setEvoStatus('offline');
        setEvoQrCode(connectData.base64);
        setEvoStatusMsg('Leia o QR Code com seu WhatsApp para conectar.');
      } else {
        setEvoStatus('offline');
        setEvoStatusMsg('Falha ao obter QR Code da API.');
      }

    } catch (err: any) {
      setEvoStatus('offline');
      setEvoStatusMsg(err.message || 'Erro de conexão com a Evolution API.');
    }
  };

  // Nichos State
  const [niches, setNiches] = useState(() => crmService.getNiches());
  const [newNicheName, setNewNicheName] = useState('');

  const handleAddNiche = () => {
    if (!newNicheName.trim()) return;
    crmService.addNiche({ name: newNicheName, description: '', status: 'ativo' });
    setNiches([...crmService.getNiches()]);
    setNewNicheName('');
  };

  const handleDeleteNiche = (id: string) => {
    if (confirm('Tem certeza que deseja remover este nicho?')) {
      crmService.deleteNiche(id);
      setNiches([...crmService.getNiches()]);
    }
  };

  // Supabase State
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedVPSCommand, setCopiedVPSCommand] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  const [supabaseFeedback, setSupabaseFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(aiProvider.getConfig());
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);

  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiResult, setGeminiResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingClaude, setIsTestingClaude] = useState(false);
  const [claudeResult, setClaudeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
  const [openAIResult, setOpenAIResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingOpenRouter, setIsTestingOpenRouter] = useState(false);
  const [openRouterResult, setOpenRouterResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const checkSupabaseStatus = async () => {
    setIsCheckingSupabase(true);
    try {
      const res = await fetch('/api/supabase-status');
      const data = await res.json();
      setSupabaseStatus(data);
      if (data.url && !supabaseUrl) {
        setSupabaseUrl(data.url);
      }
    } catch {
      setSupabaseStatus({ status: 'error', message: 'Erro ao conectar à API local.' });
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  const loadSupabaseConfig = async () => {
    try {
      const res = await fetch('/api/supabase/config');
      const data = await res.json();
      if (data.url) setSupabaseUrl(data.url);
    } catch {}
  };

  const handleSaveSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setSupabaseFeedback({ success: false, message: 'Preencha a URL do projeto e a Chave Anon.' });
      return;
    }
    setIsSavingSupabase(true);
    setSupabaseFeedback(null);
    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: supabaseUrl, anonKey: supabaseAnonKey }),
      });
      const data = await res.json();
      if (data.success) {
        setSupabaseFeedback({ success: true, message: 'Supabase conectado e salvo com sucesso!' });
        updateClientConfig(supabaseUrl, supabaseAnonKey);
        crmService.initFromSupabase(true);
        checkSupabaseStatus();
      } else {
        setSupabaseFeedback({ success: false, message: data.error || 'Erro ao conectar ao Supabase.' });
      }
    } catch (err: any) {
      setSupabaseFeedback({ success: false, message: err?.message || 'Falha na requisição.' });
    } finally {
      setIsSavingSupabase(false);
    }
  };

  useEffect(() => {
    checkSupabaseStatus();
    loadSupabaseConfig();
    setAiConfig(aiProvider.loadConfig());
  }, []);

  const handleSaveAiConfig = () => {
    aiProvider.saveConfig(aiConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiResult(null);
    try {
      const res = await aiProvider.testGemini(aiConfig.gemini.apiKey, aiConfig.gemini.model);
      setGeminiResult(res);
      if (res.success) {
        setAiConfig((prev) => ({
          ...prev,
          gemini: { ...prev.gemini, enabled: true },
        }));
        aiProvider.saveConfig({
          gemini: { ...aiConfig.gemini, enabled: true },
        });
      }
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleTestClaude = async () => {
    setIsTestingClaude(true);
    setClaudeResult(null);
    try {
      const res = await aiProvider.testClaude(aiConfig.claude.apiKey, aiConfig.claude.model);
      setClaudeResult(res);
      if (res.success) {
        setAiConfig((prev) => ({
          ...prev,
          claude: { ...prev.claude, enabled: true },
        }));
        aiProvider.saveConfig({
          claude: { ...aiConfig.claude, enabled: true },
        });
      }
    } finally {
      setIsTestingClaude(false);
    }
  };

  const handleTestOpenAI = async () => {
    setIsTestingOpenAI(true);
    setOpenAIResult(null);
    try {
      const res = await aiProvider.testOpenAI(aiConfig.openai.apiKey, aiConfig.openai.model);
      setOpenAIResult(res);
      if (res.success) {
        setAiConfig((prev) => ({
          ...prev,
          openai: { ...prev.openai, enabled: true },
        }));
        aiProvider.saveConfig({
          openai: { ...aiConfig.openai, enabled: true },
        });
      }
    } finally {
      setIsTestingOpenAI(false);
    }
  };

  const handleTestOpenRouter = async () => {
    setIsTestingOpenRouter(true);
    setOpenRouterResult(null);
    try {
      const res = await aiProvider.testOpenRouter(aiConfig.openrouter.apiKey, aiConfig.openrouter.model);
      setOpenRouterResult(res);
      if (res.success) {
        setAiConfig((prev) => ({
          ...prev,
          openrouter: { ...prev.openrouter, enabled: true },
        }));
        aiProvider.saveConfig({
          openrouter: { ...aiConfig.openrouter, enabled: true },
        });
      }
    } finally {
      setIsTestingOpenRouter(false);
    }
  };

  const TABLES_LIST = [
    { name: 'users', desc: 'Usuários, perfis e permissões' },
    { name: 'companies', desc: 'Empresas clientes e alvos' },
    { name: 'contacts', desc: 'Contatos e decisores' },
    { name: 'services', desc: 'Catálogo de serviços e preços' },
    { name: 'niches', desc: 'Nichos de atuação estratégica' },
    { name: 'message_sequences', desc: 'Sequências de prospecção n8n' },
    { name: 'message_sequence_steps', desc: 'Etapas de mensagem (Abertura, Follow-ups)' },
    { name: 'leads', desc: 'Leads qualificados e scores' },
    { name: 'lead_services', desc: 'Serviços identificados no lead' },
    { name: 'lead_sequence_progress', desc: 'Progresso da régua de mensagens' },
    { name: 'message_logs', desc: 'Histórico de envios e respostas' },
    { name: 'pipeline_stages', desc: '8 estágios do funil Kanban' },
    { name: 'opportunities', desc: 'Oportunidades e valores potenciais' },
    { name: 'clients', desc: 'Clientes 360 e LTV' },
    { name: 'proposals', desc: 'Propostas comerciais multisserviço' },
    { name: 'contracts', desc: 'Contratos e assinaturas' },
    { name: 'projects', desc: 'Projetos e checklists operacionais' },
    { name: 'historical_projects', desc: 'Histórico desde a fundação' },
    { name: 'tasks', desc: 'Tarefas e entregas' },
    { name: 'follow_ups', desc: 'Follow-ups manuais e automáticos' },
    { name: 'financial_transactions', desc: 'Transações (Contratado vs Recebido vs Pendente)' },
    { name: 'conversations', desc: 'Conversas por canal' },
    { name: 'messages', desc: 'Mensagens trocadas' },
    { name: 'business_context', desc: 'Contexto operacional da EVO PIXEL para IA' },
    { name: 'commercial_goals', desc: 'Metas comerciais periódicas' },
    { name: 'prospects', desc: 'Base de prospecção pura com ICP Score' },
    { name: 'conversation_summaries', desc: 'Resumos estruturados para IA' },
    { name: 'ai_commands', desc: 'Histórico de comandos do Evo Assistant' },
    { name: 'ai_action_logs', desc: 'Auditoria de mutações feitas por IA' },
    { name: 'ai_feedback', desc: 'Feedback e aprendizado contínuo' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--evo-border)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-evo-support uppercase tracking-wider mb-1">
            <Settings className="w-3.5 h-3.5" />
            Infraestrutura & Integrações
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--evo-text)] font-heading">
            Configurações do Sistema
          </h1>
          <p className="text-xs text-[var(--evo-muted)] mt-1">
            Conexão com Banco de Dados Supabase (PostgreSQL), VPS Hostinger, APIs de Inteligência Artificial (Claude & Gemini), WhatsApp e n8n.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-evo-surface2 text-[#DAF1DE] border border-evo-support/40 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-evo-accent" />
            <span>Configurações salvas e ativas!</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          SEÇÃO 1: MOTORES DE INTELIGÊNCIA ARTIFICIAL (CLAUDE & GEMINI)
          ========================================================================= */}
      <Card className="p-6 space-y-6 border border-[var(--evo-border)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--evo-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-evo-accent">
              <Sparkles className="w-5 h-5 text-evo-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">
                  Provedores de Inteligência Artificial (Claude & Gemini)
                </h3>
                <Badge variant={aiConfig.activeProvider === 'simulation' ? 'frio' : 'quente'}>
                  {aiConfig.activeProvider === 'gemini'
                    ? 'Google Gemini Ativo'
                    : aiConfig.activeProvider === 'claude'
                    ? 'Anthropic Claude Ativo'
                    : aiConfig.activeProvider === 'openai'
                    ? 'OpenAI Ativo'
                    : aiConfig.activeProvider === 'openrouter'
                    ? 'OpenRouter Ativo'
                    : 'Modo Simulação'}
                </Badge>
              </div>
              <span className="text-[11px] text-[var(--evo-muted)]">
                Conecte chaves oficiais para alimentar o Evo Assistant, análises de leads e automações de prospecção.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleSaveAiConfig}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Chaves de IA</span>
            </Button>
          </div>
        </div>

        {/* Seleção do Motor Ativo */}
        <div className="space-y-2">
          <label className="text-xs font-heading font-semibold text-[var(--evo-text)]">
            Selecione o Motor Ativo para o Evo Assistant & Pipeline
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Opção Gemini */}
            <button
              type="button"
              onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'gemini' }))}
              className={`p-3 rounded-xl border text-left transition-all ${
                aiConfig.activeProvider === 'gemini'
                  ? 'bg-evo-surface border-evo-accent shadow-sm'
                  : 'bg-[var(--evo-surface)] border-[var(--evo-border)] hover:border-[var(--evo-border-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[var(--evo-text)]">
                  <Cpu className="w-4 h-4 text-evo-support" />
                  Google Gemini
                </div>
                {aiConfig.activeProvider === 'gemini' && (
                  <span className="w-2 h-2 rounded-full bg-evo-accent" />
                )}
              </div>
              <p className="text-[10px] text-[var(--evo-muted)]">
                Gemini 2.5 Flash & 1.5 Pro.
              </p>
            </button>

            {/* Opção Claude */}
            <button
              type="button"
              onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'claude' }))}
              className={`p-3 rounded-xl border text-left transition-all ${
                aiConfig.activeProvider === 'claude'
                  ? 'bg-evo-surface border-evo-accent shadow-sm'
                  : 'bg-[var(--evo-surface)] border-[var(--evo-border)] hover:border-[var(--evo-border-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[var(--evo-text)]">
                  <Bot className="w-4 h-4 text-evo-accent" />
                  Anthropic Claude
                </div>
                {aiConfig.activeProvider === 'claude' && (
                  <span className="w-2 h-2 rounded-full bg-evo-accent" />
                )}
              </div>
              <p className="text-[10px] text-[var(--evo-muted)]">
                Claude 3.7 & 3.5. Precisão analítica superior.
              </p>
            </button>

            {/* Opção OpenAI */}
            <button
              type="button"
              onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'openai' }))}
              className={`p-3 rounded-xl border text-left transition-all ${
                aiConfig.activeProvider === 'openai'
                  ? 'bg-evo-surface border-evo-accent shadow-sm'
                  : 'bg-[var(--evo-surface)] border-[var(--evo-border)] hover:border-[var(--evo-border-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[var(--evo-text)]">
                  <Terminal className="w-4 h-4 text-evo-support" />
                  OpenAI
                </div>
                {aiConfig.activeProvider === 'openai' && (
                  <span className="w-2 h-2 rounded-full bg-evo-accent" />
                )}
              </div>
              <p className="text-[10px] text-[var(--evo-muted)]">
                GPT-4o & GPT-4o-mini.
              </p>
            </button>

            {/* Opção OpenRouter */}
            <button
              type="button"
              onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'openrouter' }))}
              className={`p-3 rounded-xl border text-left transition-all ${
                aiConfig.activeProvider === 'openrouter'
                  ? 'bg-evo-surface border-evo-accent shadow-sm'
                  : 'bg-[var(--evo-surface)] border-[var(--evo-border)] hover:border-[var(--evo-border-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[var(--evo-text)]">
                  <Globe className="w-4 h-4 text-evo-support" />
                  OpenRouter
                </div>
                {aiConfig.activeProvider === 'openrouter' && (
                  <span className="w-2 h-2 rounded-full bg-evo-accent" />
                )}
              </div>
              <p className="text-[10px] text-[var(--evo-muted)]">
                Acesso a milhares de LLMs diferentes.
              </p>
            </button>

            {/* Opção Simulação Offline */}
            <button
              type="button"
              onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'simulation' }))}
              className={`p-3 rounded-xl border text-left transition-all ${
                aiConfig.activeProvider === 'simulation'
                  ? 'bg-evo-surface border-evo-accent shadow-sm'
                  : 'bg-[var(--evo-surface)] border-[var(--evo-border)] hover:border-[var(--evo-border-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[var(--evo-text)]">
                  <Zap className="w-4 h-4 text-evo-support" />
                  Simulação Local
                </div>
                {aiConfig.activeProvider === 'simulation' && (
                  <span className="w-2 h-2 rounded-full bg-evo-accent" />
                )}
              </div>
              <p className="text-[10px] text-[var(--evo-muted)]">
                Motor nativo. Sem custo de tokens.
              </p>
            </button>
          </div>
        </div>

        {/* Formulários de Configuração das APIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Card Google Gemini */}
          <div className="p-4 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--evo-border)] pb-2.5">
              <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[var(--evo-text)]">
                <Cpu className="w-4 h-4 text-evo-support" />
                Google Gemini API
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-evo-support hover:underline flex items-center gap-1"
              >
                Gerar Chave no AI Studio <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--evo-muted)] mb-1 font-medium">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={aiConfig.gemini.apiKey}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      gemini: { ...prev.gemini, apiKey: e.target.value },
                    }))
                  }
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-[var(--evo-card)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2.5 top-2.5 text-[var(--evo-muted)] hover:text-[var(--evo-text)]"
                >
                  {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--evo-muted)] mb-1 font-medium">
                Modelo do Gemini
              </label>
              <input
                type="text"
                list="gemini-models"
                value={aiConfig.gemini.model}
                onChange={(e) =>
                  setAiConfig({
                    ...aiConfig,
                    gemini: { ...aiConfig.gemini, model: e.target.value },
                  })
                }
                placeholder="Ex: gemini-3.6-flash"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-card)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none text-xs"
              />
              <datalist id="gemini-models">
                <option value="gemini-3.6-flash">gemini-3.6-flash (Recomendado)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (Último)</option>
                <option value="gemini-flash-latest">gemini-flash-latest (Automático)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash (Estável)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash (Legado)</option>
                <option value="gemini-1.0-pro">gemini-1.0-pro (Legado Antigo)</option>
              </datalist>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleTestGemini}
                disabled={isTestingGemini || !aiConfig.gemini.apiKey}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingGemini ? 'animate-spin' : ''}`} />
                <span>Testar Conexão Gemini</span>
              </Button>

              {geminiResult && (
                <span
                  className={`text-[11px] font-medium ${
                    geminiResult.success ? 'text-evo-support' : 'text-amber-500'
                  }`}
                >
                  {geminiResult.success ? '✓ Conexão Estabelecida' : '✕ Erro na Validação'}
                </span>
              )}
            </div>

            {geminiResult && (
              <div
                className={`p-2.5 rounded-lg text-[10px] leading-relaxed border ${
                  geminiResult.success
                    ? 'bg-evo-surface text-[#DAF1DE] border-evo-support/30'
                    : 'bg-red-950/20 text-red-300 border-red-800/30'
                }`}
              >
                <strong>Resposta:</strong> {geminiResult.message}
              </div>
            )}
          </div>

          {/* Card Anthropic Claude */}
          <div className="p-4 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--evo-border)] pb-2.5">
              <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[var(--evo-text)]">
                <Bot className="w-4 h-4 text-evo-accent" />
                Anthropic Claude API
              </div>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-evo-support hover:underline flex items-center gap-1"
              >
                Obter Chave no Console Anthropic <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--evo-muted)] mb-1 font-medium">
                Claude API Key
              </label>
              <div className="relative">
                <input
                  type={showClaudeKey ? 'text' : 'password'}
                  placeholder="sk-ant-api03-..."
                  value={aiConfig.claude.apiKey}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      claude: { ...prev.claude, apiKey: e.target.value },
                    }))
                  }
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-[var(--evo-card)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                  className="absolute right-2.5 top-2.5 text-[var(--evo-muted)] hover:text-[var(--evo-text)]"
                >
                  {showClaudeKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--evo-muted)] mb-1 font-medium">
                Modelo do Claude
              </label>
              <input
                type="text"
                list="claude-models"
                value={aiConfig.claude.model}
                onChange={(e) =>
                  setAiConfig((prev) => ({
                    ...prev,
                    claude: { ...prev.claude, model: e.target.value },
                  }))
                }
                placeholder="Ex: claude-3-7-sonnet-20250219"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-card)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none text-xs"
              />
              <datalist id="claude-models">
                <option value="claude-3-7-sonnet-20250219">claude-3-7-sonnet-20250219 (Estado da Arte)</option>
                <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022 (Equilibrado)</option>
                <option value="claude-3-5-haiku-20241022">claude-3-5-haiku-20241022 (Ultrarrápido)</option>
              </datalist>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleTestClaude}
                disabled={isTestingClaude || !aiConfig.claude.apiKey}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingClaude ? 'animate-spin' : ''}`} />
                <span>Testar Conexão Claude</span>
              </Button>

              {claudeResult && (
                <span
                  className={`text-[11px] font-medium ${
                    claudeResult.success ? 'text-evo-support' : 'text-amber-500'
                  }`}
                >
                  {claudeResult.success ? '✓ Conexão Estabelecida' : '✕ Erro na Validação'}
                </span>
              )}
            </div>

            {claudeResult && (
              <div
                className={`p-2.5 rounded-lg text-[10px] leading-relaxed border ${
                  claudeResult.success
                    ? 'bg-evo-surface text-[#DAF1DE] border-evo-support/30'
                    : 'bg-red-950/20 text-red-300 border-red-800/30'
                }`}
              >
                <strong>Resposta:</strong> {claudeResult.message}
              </div>
            )}
          </div>
          {/* Card OpenAI */}
          <div className="p-4 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--evo-border)] pb-2.5">
              <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[var(--evo-text)]">
                <Terminal className="w-4 h-4 text-evo-support" />
                OpenAI API
              </div>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-[10px] text-evo-support hover:underline flex items-center gap-1">
                Obter Chave <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--evo-muted)] mb-1 font-medium">OpenAI API Key</label>
              <div className="relative">
                <input
                  type={showOpenAIKey ? 'text' : 'password'}
                  placeholder="sk-proj-..."
                  value={aiConfig.openai.apiKey}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, openai: { ...prev.openai, apiKey: e.target.value } }))}
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-[var(--evo-card)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
                />
                <button type="button" onClick={() => setShowOpenAIKey(!showOpenAIKey)} className="absolute right-2.5 top-2.5 text-[var(--evo-muted)] hover:text-[var(--evo-text)]">
                  {showOpenAIKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--evo-muted)] mb-1 font-medium">Modelo da OpenAI</label>
              <input
                type="text"
                list="openai-models"
                value={aiConfig.openai.model}
                onChange={(e) => setAiConfig((prev) => ({ ...prev, openai: { ...prev.openai, model: e.target.value } }))}
                placeholder="Ex: gpt-4o"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-card)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none text-xs"
              />
              <datalist id="openai-models">
                <option value="gpt-4o">gpt-4o (Melhor / Mais Caro)</option>
                <option value="gpt-4o-mini">gpt-4o-mini (Rápido / Mais Barato)</option>
                <option value="o1">o1 (Raciocínio Complexo / Caro)</option>
                <option value="o3-mini">o3-mini (Raciocínio Rápido / Bom Custo-Benefício)</option>
              </datalist>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button variant="secondary" size="sm" className="text-xs gap-1.5" onClick={handleTestOpenAI} disabled={isTestingOpenAI || !aiConfig.openai.apiKey}>
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingOpenAI ? 'animate-spin' : ''}`} />
                <span>Testar Conexão</span>
              </Button>
              {openAIResult && <span className={`text-[11px] font-medium ${openAIResult.success ? 'text-evo-support' : 'text-amber-500'}`}>{openAIResult.success ? '✓' : '✕'}</span>}
            </div>
            {openAIResult && <div className={`p-2.5 rounded-lg text-[10px] leading-relaxed border ${openAIResult.success ? 'bg-evo-surface text-[#DAF1DE] border-evo-support/30' : 'bg-red-950/20 text-red-300 border-red-800/30'}`}><strong>Resposta:</strong> {openAIResult.message}</div>}
          </div>

          {/* Card OpenRouter */}
          <div className="p-4 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--evo-border)] pb-2.5">
              <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[var(--evo-text)]">
                <Globe className="w-4 h-4 text-evo-support" />
                OpenRouter API
              </div>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[10px] text-evo-support hover:underline flex items-center gap-1">
                Obter Chave <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--evo-muted)] mb-1 font-medium">OpenRouter API Key</label>
              <div className="relative">
                <input
                  type={showOpenRouterKey ? 'text' : 'password'}
                  placeholder="sk-or-v1-..."
                  value={aiConfig.openrouter.apiKey}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, openrouter: { ...prev.openrouter, apiKey: e.target.value } }))}
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-[var(--evo-card)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
                />
                <button type="button" onClick={() => setShowOpenRouterKey(!showOpenRouterKey)} className="absolute right-2.5 top-2.5 text-[var(--evo-muted)] hover:text-[var(--evo-text)]">
                  {showOpenRouterKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--evo-muted)] mb-1 font-medium">Modelo do OpenRouter</label>
              <input
                type="text"
                list="openrouter-models"
                value={aiConfig.openrouter.model}
                onChange={(e) => setAiConfig((prev) => ({ ...prev, openrouter: { ...prev.openrouter, model: e.target.value } }))}
                placeholder="Ex: openai/gpt-4o"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-card)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none text-xs"
              />
              <datalist id="openrouter-models">
                <option value="openai/gpt-4o">openai/gpt-4o (Melhor / Mais Caro)</option>
                <option value="anthropic/claude-3-7-sonnet">anthropic/claude-3-7-sonnet (Alta Precisão / Mais Caro)</option>
                <option value="google/gemini-2.5-flash">google/gemini-2.5-flash (Rápido / Muito Barato)</option>
                <option value="deepseek/deepseek-r1">deepseek/deepseek-r1 (Raciocínio Forte / Baixo Custo)</option>
                <option value="meta-llama/llama-3.3-70b-instruct">meta-llama/llama-3.3-70b-instruct (Open Source / Bom Custo-Benefício)</option>
              </datalist>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button variant="secondary" size="sm" className="text-xs gap-1.5" onClick={handleTestOpenRouter} disabled={isTestingOpenRouter || !aiConfig.openrouter.apiKey}>
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingOpenRouter ? 'animate-spin' : ''}`} />
                <span>Testar Conexão</span>
              </Button>
              {openRouterResult && <span className={`text-[11px] font-medium ${openRouterResult.success ? 'text-evo-support' : 'text-amber-500'}`}>{openRouterResult.success ? '✓' : '✕'}</span>}
            </div>
            {openRouterResult && <div className={`p-2.5 rounded-lg text-[10px] leading-relaxed border ${openRouterResult.success ? 'bg-evo-surface text-[#DAF1DE] border-evo-support/30' : 'bg-red-950/20 text-red-300 border-red-800/30'}`}><strong>Resposta:</strong> {openRouterResult.message}</div>}
          </div>
        </div>
      </Card>


      {/* =========================================================================
          SEÇÃO 3: WHATSAPP (EVOLUTION API) & N8N
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp / Evolution API */}
        <Card className="p-6 space-y-4 border border-[var(--evo-border)]">
          <div className="flex items-start justify-between border-b border-[var(--evo-border)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-evo-support">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">
                  WhatsApp (Evolution API)
                </h3>
                <span className="text-[11px] text-[var(--evo-muted)]">
                  Canal de envio para o Banco de Mensagens e régua de prospecção
                </span>
              </div>
            </div>
            {evoStatus === 'online' && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#DAF1DE] text-green-900 border border-green-800/20 font-mono">
                Conectado
              </span>
            )}
            {evoStatus === 'offline' && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-red-950/20 text-red-400 border border-red-900/30 font-mono">
                Desconectado
              </span>
            )}
            {evoStatus === 'idle' && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-evo-surface2 text-evo-support font-mono">
                Offline
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[var(--evo-muted)] mb-1 font-medium">Evolution API URL</label>
              <input
                type="text"
                value={evolutionUrl}
                onChange={(e) => setEvolutionUrl(e.target.value)}
                placeholder="https://api-evolution..."
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[var(--evo-muted)] mb-1 font-medium">Global API Key</label>
              <input
                type="password"
                value={evolutionApiKey}
                onChange={(e) => setEvolutionApiKey(e.target.value)}
                placeholder="Colar API Key..."
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[var(--evo-muted)] mb-1 font-medium">Nome da Instância</label>
              <input
                type="text"
                value={evolutionInstance}
                onChange={(e) => setEvolutionInstance(e.target.value)}
                placeholder="Ex: evocrm-prod"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
              />
            </div>

            <div className="pt-2 flex flex-col gap-3 border-t border-[var(--evo-border)] mt-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-[10px] text-[var(--evo-muted)] flex-1">
                  {evoStatusMsg && <span className={evoStatus === 'online' ? 'text-evo-support' : 'text-amber-500'}>{evoStatusMsg}</span>}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs h-7 gap-1.5"
                  onClick={handleConnectEvolution}
                  disabled={evoStatus === 'loading'}
                >
                  {evoStatus === 'loading' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
                  Testar / Conectar
                </Button>
              </div>

              {evoQrCode && evoStatus === 'offline' && (
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border-2 border-evo-support/30 mt-2">
                  <img src={evoQrCode} alt="QR Code WhatsApp" className="w-48 h-48 object-contain rounded-lg" />
                  <p className="text-gray-500 text-[10px] mt-2 font-medium">Abra o WhatsApp e leia o QR Code</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Integração n8n */}
        <Card className="p-6 space-y-4 border border-[var(--evo-border)]">
          <div className="flex items-start justify-between border-b border-[var(--evo-border)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-evo-accent">
                <Workflow className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">
                  Orquestrador de Fluxos (n8n)
                </h3>
                <span className="text-[11px] text-[var(--evo-muted)]">
                  Gatilhos de prospecção, régua de follow-up e movimentação de pipeline
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-evo-surface2 text-evo-support font-mono">
              Pronto
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[var(--evo-muted)] mb-1 font-medium">Webhook Endpoint URL</label>
              <input
                type="text"
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-xs text-[var(--evo-muted)] leading-relaxed">
              O EVO PIXEL emite payloads contendo o lead, nicho, etapa da sequência e texto pronto com variáveis resolvidas para execução automática no n8n.
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                className="text-xs"
                onClick={() => alert('Configurações salvas com sucesso!')}
              >
                Salvar Configurações
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* =========================================================================
          SEÇÃO 4: CONFIGURAÇÕES DE NEGÓCIO (NICHOS E SERVIÇOS)
          ========================================================================= */}
      <Card className="p-6 space-y-4 border border-[var(--evo-border)]">
        <div className="flex items-start justify-between border-b border-[var(--evo-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-evo-support">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">
                Nichos de Atuação
              </h3>
              <span className="text-[11px] text-[var(--evo-muted)]">
                Gerencie os segmentos/nichos para classificação de clientes e prospecção
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newNicheName}
              onChange={(e) => setNewNicheName(e.target.value)}
              placeholder="Nome do Novo Nicho"
              className="flex-1 px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none text-xs"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddNiche(); }}
            />
            <Button variant="primary" size="sm" onClick={handleAddNiche} className="text-xs shrink-0">
              Adicionar Nicho
            </Button>
          </div>

          <div className="space-y-2">
            {niches.map((niche) => (
              <div key={niche.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)]">
                <span className="text-xs text-[var(--evo-text)] font-medium">{niche.name}</span>
                <button
                  onClick={() => handleDeleteNiche(niche.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {niches.length === 0 && (
              <div className="text-xs text-[var(--evo-muted)] text-center py-4">Nenhum nicho cadastrado.</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
