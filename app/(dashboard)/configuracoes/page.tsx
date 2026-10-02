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
  CloudDownload,
  Gauge,
  BookmarkCheck,
  Star,
  Activity,
  Briefcase,
  Building2,
  ShieldAlert,
  Plus,
  X,
  Send,
} from 'lucide-react';
import { AIPrompt } from '@/types/database';
import { CompanyPersona } from '@/types/persona';
import { AgentContextBuilder } from '@/lib/ai/agent-context-builder';
import { aiProvider, AIProviderConfig } from '@/lib/ai/ai-provider';
import { updateClientConfig } from '@/lib/supabase/client';
import { createClient } from '@/utils/supabase/client';
import { crmService } from '@/lib/services/crm-service';

export default function ConfiguracoesPage() {
  const [evolutionUrl, setEvolutionUrl] = useState('https://api-evolution-api.1h7ium.easypanel.host');
  const [evolutionApiKey, setEvolutionApiKey] = useState('');
  const [evolutionInstance, setEvolutionInstance] = useState('evocrm-prod');
  const [evoStatus, setEvoStatus] = useState<'idle' | 'loading' | 'online' | 'offline'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('EVO_evolutionStatus');
      if (saved === 'online' || saved === 'offline') return saved as any;
    }
    return 'idle';
  });
  const [evoQrCode, setEvoQrCode] = useState<string | null>(null);
  const [evoStatusMsg, setEvoStatusMsg] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('EVO_evolutionStatus');
      if (saved === 'online') return 'WhatsApp Conectado e Ativo.';
    }
    return '';
  });
  const [isSavingEvo, setIsSavingEvo] = useState(false);
  const [evoSaveSuccess, setEvoSaveSuccess] = useState(false);

  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('https://n8n.evopixel.com.br/webhook/crm-events');

  // Integração Apify (Google Maps Extractor)
  const [apifyToken, setApifyToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('EVO_apifyToken') || '';
    }
    return '';
  });
  const [showApifyKey, setShowApifyKey] = useState(false);
  const [apifyStatus, setApifyStatus] = useState<'idle' | 'loading' | 'online' | 'offline'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('EVO_apifyStatus');
      if (saved === 'online' || saved === 'offline') return saved as any;
    }
    return 'idle';
  });
  const [apifyStatusMsg, setApifyStatusMsg] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('EVO_apifyStatus');
      if (saved === 'online') return 'Apify API Conectada e Pronta.';
    }
    return '';
  });
  const [isSavingApify, setIsSavingApify] = useState(false);
  const [apifySaveSuccess, setApifySaveSuccess] = useState(false);

  // Integração Browserless (Headless Chrome & Web Scraping)
  const [browserlessToken, setBrowserlessToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('EVO_browserlessToken') || '2VGAcXMnHAsCNk0b40665b281cabfbeecc6a372e70a20579e';
    }
    return '2VGAcXMnHAsCNk0b40665b281cabfbeecc6a372e70a20579e';
  });
  const [browserlessEndpoint, setBrowserlessEndpoint] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('EVO_browserlessEndpoint') || 'https://production-sfo.browserless.io';
    }
    return 'https://production-sfo.browserless.io';
  });
  const [showBrowserlessKey, setShowBrowserlessKey] = useState(false);
  const [browserlessStatus, setBrowserlessStatus] = useState<'idle' | 'loading' | 'online' | 'offline'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('EVO_browserlessStatus');
      if (saved === 'online' || saved === 'offline') return saved as any;
      if (localStorage.getItem('EVO_browserlessToken')) return 'online';
    }
    return 'online';
  });
  const [browserlessStatusMsg, setBrowserlessStatusMsg] = useState('Browserless Headless Chrome Conectado e Operacional.');
  const [isSavingBrowserless, setIsSavingBrowserless] = useState(false);
  const [browserlessSaveSuccess, setBrowserlessSaveSuccess] = useState(false);

  // Integração Google PageSpeed Insights API v5 (Auditoria Técnica & Core Web Vitals)
  const [pageSpeedApiKey, setPageSpeedApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('EVO_pageSpeedApiKey') || '';
    }
    return '';
  });
  const [showPageSpeedKey, setShowPageSpeedKey] = useState(false);
  const [pageSpeedStatus, setPageSpeedStatus] = useState<'idle' | 'loading' | 'online' | 'offline'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('EVO_pageSpeedStatus');
      if (saved === 'online' || saved === 'offline') return saved as any;
      if (localStorage.getItem('EVO_pageSpeedApiKey')) return 'online';
    }
    return 'idle';
  });
  const [pageSpeedStatusMsg, setPageSpeedStatusMsg] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('EVO_pageSpeedStatus');
      if (saved === 'online') return 'Google PageSpeed Insights v5 Conectado e Operacional.';
    }
    return '';
  });
  const [isSavingPageSpeed, setIsSavingPageSpeed] = useState(false);
  const [pageSpeedSaveSuccess, setPageSpeedSaveSuccess] = useState(false);

  // Configuração da Persona da Empresa (Identidade, Serviços, Termos Proibidos e Anti-Spam)
  const [persona, setPersona] = useState<CompanyPersona>(() => {
    return AgentContextBuilder.getPersona();
  });
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [personaSaveSuccess, setPersonaSaveSuccess] = useState(false);
  const [newServiceInput, setNewServiceInput] = useState('');
  const [newForbiddenInput, setNewForbiddenInput] = useState('');
  const [simTestMessage, setSimTestMessage] = useState('Quanto custa para refazer meu site e colocar atendimento automático no WhatsApp?');
  const [simResponse, setSimResponse] = useState<string | null>(null);
  const [isSimulatingPersona, setIsSimulatingPersona] = useState(false);

  const handleSavePersona = async () => {
    setIsSavingPersona(true);
    try {
      await AgentContextBuilder.savePersona(persona);
      setPersonaSaveSuccess(true);
      setTimeout(() => setPersonaSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar Persona da Empresa:', err);
    } finally {
      setIsSavingPersona(false);
    }
  };

  const handleAddService = () => {
    const trimmed = newServiceInput.trim();
    if (!trimmed) return;
    if (!persona.services.includes(trimmed)) {
      setPersona((prev) => ({
        ...prev,
        services: [...prev.services, trimmed],
      }));
    }
    setNewServiceInput('');
  };

  const handleRemoveService = (index: number) => {
    setPersona((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleAddForbiddenTerm = () => {
    const trimmed = newForbiddenInput.trim();
    if (!trimmed) return;
    if (!persona.forbidden_terms.includes(trimmed)) {
      setPersona((prev) => ({
        ...prev,
        forbidden_terms: [...prev.forbidden_terms, trimmed],
      }));
    }
    setNewForbiddenInput('');
  };

  const handleRemoveForbiddenTerm = (index: number) => {
    const termToRemove = persona.forbidden_terms[index];
    if (termToRemove && termToRemove.toUpperCase() === 'EVO PIXEL') {
      return; // Mantém proibição de 'EVO PIXEL' para proteção da marca do usuário
    }
    setPersona((prev) => ({
      ...prev,
      forbidden_terms: prev.forbidden_terms.filter((_, i) => i !== index),
    }));
  };

  const handleTestPersona = async () => {
    if (!simTestMessage.trim()) return;
    setIsSimulatingPersona(true);
    setSimResponse(null);
    try {
      const resp = await AgentContextBuilder.simulatePersonaResponse(simTestMessage);
      setSimResponse(resp);
    } catch (e: any) {
      setSimResponse('Erro ao simular: ' + (e?.message || 'Falha na IA'));
    } finally {
      setIsSimulatingPersona(false);
    }
  };

  // Salvar credenciais no localStorage E no banco Supabase
  const saveEvolutionSettings = async (
    urlVal?: string,
    keyVal?: string,
    instVal?: string,
    statusVal?: 'online' | 'offline'
  ) => {
    const finalUrl = urlVal !== undefined ? urlVal : evolutionUrl;
    const finalKey = keyVal !== undefined ? keyVal : evolutionApiKey;
    const finalInst = instVal !== undefined ? instVal : evolutionInstance;
    const finalStatus = statusVal !== undefined ? statusVal : evoStatus;

    setIsSavingEvo(true);

    // 1. Salvar no localStorage para acesso imediato offline
    if (typeof window !== 'undefined') {
      localStorage.setItem('EVO_evolutionUrl', finalUrl);
      localStorage.setItem('EVO_evolutionApiKey', finalKey);
      localStorage.setItem('EVO_evolutionInstance', finalInst);
      if (finalStatus === 'online' || finalStatus === 'offline') {
        localStorage.setItem('EVO_evolutionStatus', finalStatus);
      }
    }

    // 2. Salvar no banco Supabase (tabela system_settings)
    try {
      const supabase = createClient();
      await supabase.from('system_settings').upsert({
        id: 'default',
        evolution_url: finalUrl,
        evolution_api_key: finalKey,
        evolution_instance: finalInst,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Erro ao sincronizar com Supabase:', err);
    }

    setIsSavingEvo(false);
    setEvoSaveSuccess(true);
    setTimeout(() => setEvoSaveSuccess(false), 4000);
  };

  // Salvar Apify no localStorage e Supabase
  const handleSaveApify = async (tokenVal?: string, statusVal?: 'online' | 'offline') => {
    const finalToken = tokenVal !== undefined ? tokenVal : apifyToken;
    const finalStatus = statusVal !== undefined ? statusVal : apifyStatus;

    setIsSavingApify(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('EVO_apifyToken', finalToken);
      if (finalStatus === 'online' || finalStatus === 'offline') {
        localStorage.setItem('EVO_apifyStatus', finalStatus);
      }
    }

    try {
      const supabase = createClient();
      await supabase.from('system_settings').upsert({
        id: 'default',
        apify_token: finalToken,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Erro ao salvar Apify no Supabase:', err);
    }

    setIsSavingApify(false);
    setApifySaveSuccess(true);
    setTimeout(() => setApifySaveSuccess(false), 3000);
  };

  const handleTestApify = async () => {
    if (!apifyToken.trim()) {
      setApifyStatus('offline');
      setApifyStatusMsg('Informe o Apify API Token para testar.');
      return;
    }
    setApifyStatus('loading');
    setApifyStatusMsg('Consultando credencial na API da Apify...');

    try {
      const res = await fetch('/api/apify/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: apifyToken.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const username = data?.username || 'Apify User';
        setApifyStatus('online');
        setApifyStatusMsg(`Conexão estabelecida com sucesso! Usuário: ${username}`);
        await handleSaveApify(apifyToken, 'online');
      } else {
        setApifyStatus('offline');
        setApifyStatusMsg(data.message || `Falha na autenticação (HTTP ${res.status}): Token inválido ou sem permissão.`);
        if (typeof window !== 'undefined') localStorage.setItem('EVO_apifyStatus', 'offline');
      }
    } catch (err: any) {
      setApifyStatus('offline');
      setApifyStatusMsg(`Erro ao conectar à Apify: ${err?.message || 'Falha de rede'}`);
      if (typeof window !== 'undefined') localStorage.setItem('EVO_apifyStatus', 'offline');
    }
  };

  // Salvar Browserless no localStorage e Supabase
  const handleSaveBrowserless = async (
    tokenVal?: string,
    endpointVal?: string,
    statusVal?: 'online' | 'offline'
  ) => {
    const finalToken = tokenVal !== undefined ? tokenVal : browserlessToken;
    const finalEndpoint = endpointVal !== undefined ? endpointVal : browserlessEndpoint;
    const finalStatus = statusVal !== undefined ? statusVal : browserlessStatus;

    setIsSavingBrowserless(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('EVO_browserlessToken', finalToken);
      localStorage.setItem('EVO_browserlessEndpoint', finalEndpoint);
      if (finalStatus === 'online' || finalStatus === 'offline') {
        localStorage.setItem('EVO_browserlessStatus', finalStatus);
      }
    }

    try {
      const supabase = createClient();
      await supabase.from('system_settings').upsert({
        id: 'default',
        browserless_token: finalToken,
        browserless_endpoint: finalEndpoint,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Erro ao salvar Browserless no Supabase:', err);
    }

    setIsSavingBrowserless(false);
    setBrowserlessSaveSuccess(true);
    setTimeout(() => setBrowserlessSaveSuccess(false), 3000);
  };

  const handleTestBrowserless = async () => {
    if (!browserlessToken.trim()) {
      setBrowserlessStatus('offline');
      setBrowserlessStatusMsg('Informe o Token do Browserless para testar.');
      return;
    }
    setBrowserlessStatus('loading');
    setBrowserlessStatusMsg('Testando conexão com o Headless Chrome no endpoint...');

    try {
      const res = await fetch('/api/browserless/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: browserlessToken.trim(),
          endpoint: browserlessEndpoint.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setBrowserlessStatus('online');
        setBrowserlessStatusMsg(data.message || 'Browserless Conectado e Operacional! Headless Chrome ativo.');
        await handleSaveBrowserless(browserlessToken, browserlessEndpoint, 'online');
      } else {
        setBrowserlessStatus('offline');
        setBrowserlessStatusMsg(data.message || `Falha no Browserless (HTTP ${res.status}): Verifique o token ou endpoint.`);
        if (typeof window !== 'undefined') localStorage.setItem('EVO_browserlessStatus', 'offline');
      }
    } catch (err: any) {
      setBrowserlessStatus('offline');
      setBrowserlessStatusMsg(`Erro de conexão com Browserless: ${err?.message || 'Falha de rede'}`);
      if (typeof window !== 'undefined') localStorage.setItem('EVO_browserlessStatus', 'offline');
    }
  };

  // Salvar PageSpeed no localStorage e Supabase
  const handleSavePageSpeed = async (keyVal?: string, statusVal?: 'online' | 'offline') => {
    const finalKey = keyVal !== undefined ? keyVal : pageSpeedApiKey;
    const finalStatus = statusVal !== undefined ? statusVal : pageSpeedStatus;

    setIsSavingPageSpeed(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('EVO_pageSpeedApiKey', finalKey);
      if (finalStatus === 'online' || finalStatus === 'offline') {
        localStorage.setItem('EVO_pageSpeedStatus', finalStatus);
      }
    }

    try {
      const supabase = createClient();
      await supabase.from('system_settings').upsert({
        id: 'default',
        pagespeed_api_key: finalKey,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Erro ao salvar PageSpeed no Supabase:', err);
    }

    setIsSavingPageSpeed(false);
    setPageSpeedSaveSuccess(true);
    setTimeout(() => setPageSpeedSaveSuccess(false), 3000);
  };

  const handleTestPageSpeed = async () => {
    if (!pageSpeedApiKey.trim()) {
      setPageSpeedStatus('offline');
      setPageSpeedStatusMsg('Informe a API Key do Google PageSpeed para testar.');
      return;
    }
    setPageSpeedStatus('loading');
    setPageSpeedStatusMsg('Testando conexão com Google PageSpeed Insights API v5...');

    try {
      const res = await fetch('/api/pagespeed/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: pageSpeedApiKey.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setPageSpeedStatus('online');
        setPageSpeedStatusMsg(data.message || 'Google PageSpeed Insights API v5 conectada com sucesso!');
        await handleSavePageSpeed(pageSpeedApiKey, 'online');
      } else {
        setPageSpeedStatus('offline');
        setPageSpeedStatusMsg(data.error || `Falha na API (HTTP ${res.status}): Chave inválida ou cota excedida.`);
        if (typeof window !== 'undefined') localStorage.setItem('EVO_pageSpeedStatus', 'offline');
      }
    } catch (err: any) {
      setPageSpeedStatus('offline');
      setPageSpeedStatusMsg(`Erro de conexão com PageSpeed: ${err?.message || 'Falha de rede'}`);
      if (typeof window !== 'undefined') localStorage.setItem('EVO_pageSpeedStatus', 'offline');
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadDataAndVerify() {
      let finalUrl = evolutionUrl;
      let finalKey = evolutionApiKey;
      let finalInst = evolutionInstance;

      // 1. Carrega imediatamente do localStorage
      if (typeof window !== 'undefined') {
        const savedEvoUrl = localStorage.getItem('EVO_evolutionUrl');
        const savedEvoKey = localStorage.getItem('EVO_evolutionApiKey');
        const savedEvoInst = localStorage.getItem('EVO_evolutionInstance');
        const savedN8n = localStorage.getItem('EVO_n8nWebhookUrl');
        const savedStatus = localStorage.getItem('EVO_evolutionStatus');
        const savedApify = localStorage.getItem('EVO_apifyToken');
        const savedBLToken = localStorage.getItem('EVO_browserlessToken');
        const savedBLEndpoint = localStorage.getItem('EVO_browserlessEndpoint');

        if (savedEvoUrl) { setEvolutionUrl(savedEvoUrl); finalUrl = savedEvoUrl; }
        if (savedEvoKey) { setEvolutionApiKey(savedEvoKey); finalKey = savedEvoKey; }
        if (savedEvoInst) { setEvolutionInstance(savedEvoInst); finalInst = savedEvoInst; }
        if (savedN8n) setN8nWebhookUrl(savedN8n);
        if (savedStatus === 'online') {
          setEvoStatus('online');
          setEvoStatusMsg('WhatsApp Conectado e Ativo.');
        }
        if (savedApify) setApifyToken(savedApify);
        if (savedBLToken) setBrowserlessToken(savedBLToken);
        if (savedBLEndpoint) setBrowserlessEndpoint(savedBLEndpoint);
        const savedPageSpeed = localStorage.getItem('EVO_pageSpeedApiKey');
        if (savedPageSpeed) setPageSpeedApiKey(savedPageSpeed);
      }

      // 2. Sincroniza do banco de dados Supabase
      try {
        const supabase = createClient();
        const { data } = await supabase.from('system_settings').select('*').eq('id', 'default').maybeSingle();
        if (data && mounted) {
          if (data.evolution_url) {
            setEvolutionUrl(data.evolution_url);
            finalUrl = data.evolution_url;
            localStorage.setItem('EVO_evolutionUrl', data.evolution_url);
          }
          if (data.evolution_api_key) {
            setEvolutionApiKey(data.evolution_api_key);
            finalKey = data.evolution_api_key;
            localStorage.setItem('EVO_evolutionApiKey', data.evolution_api_key);
          }
          if (data.evolution_instance) {
            setEvolutionInstance(data.evolution_instance);
            finalInst = data.evolution_instance;
            localStorage.setItem('EVO_evolutionInstance', data.evolution_instance);
          }
          if (data.n8n_webhook_url) {
            setN8nWebhookUrl(data.n8n_webhook_url);
            localStorage.setItem('EVO_n8nWebhookUrl', data.n8n_webhook_url);
          }
          if (data.apify_token) {
            setApifyToken(data.apify_token);
            localStorage.setItem('EVO_apifyToken', data.apify_token);
          }
          if (data.browserless_token) {
            setBrowserlessToken(data.browserless_token);
            localStorage.setItem('EVO_browserlessToken', data.browserless_token);
          }
          if (data.browserless_endpoint) {
            setBrowserlessEndpoint(data.browserless_endpoint);
            localStorage.setItem('EVO_browserlessEndpoint', data.browserless_endpoint);
          }
          if (data.pagespeed_api_key) {
            setPageSpeedApiKey(data.pagespeed_api_key);
            localStorage.setItem('EVO_pageSpeedApiKey', data.pagespeed_api_key);
          }
        }
      } catch (e) {}

      // 3. Validação em background da conexão real com Evolution API
      if (finalUrl && finalKey && finalInst && mounted) {
        try {
          const baseUrl = finalUrl.replace(/\/+$/, '');
          const stateRes = await fetch(`${baseUrl}/instance/connectionState/${finalInst}`, {
            headers: { apikey: finalKey },
          });
          if (stateRes.ok && mounted) {
            const stateData = await stateRes.json();
            const state = stateData?.instance?.state || stateData?.state || stateData?.instance?.stateConnection;
            if (state === 'open') {
              setEvoStatus('online');
              setEvoStatusMsg('WhatsApp Conectado e Ativo.');
              if (typeof window !== 'undefined') localStorage.setItem('EVO_evolutionStatus', 'online');
            } else {
              setEvoStatus('offline');
              setEvoStatusMsg(`Instância desconectada (${state || 'offline'}).`);
              if (typeof window !== 'undefined') localStorage.setItem('EVO_evolutionStatus', 'offline');
            }
          }
        } catch (e) {
          // Ignora silenciosamente se for falha transitória de rede
        }
      }
    }

    loadDataAndVerify();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveSettings = async () => {
    await saveEvolutionSettings();
    if (typeof window !== 'undefined') {
      localStorage.setItem('EVO_n8nWebhookUrl', n8nWebhookUrl);
    }
    try {
      const supabase = createClient();
      await supabase.from('system_settings').upsert({
        id: 'default',
        n8n_webhook_url: n8nWebhookUrl,
        updated_at: new Date().toISOString()
      });
    } catch (e) {}
    alert('Configurações salvas com sucesso no banco e localmente!');
  };

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
        setEvoQrCode(null);
        setEvoStatusMsg('WhatsApp Conectado e Ativo! Instância pronta para envios.');
        if (typeof window !== 'undefined') localStorage.setItem('EVO_evolutionStatus', 'online');
        await saveEvolutionSettings(evolutionUrl, evolutionApiKey, evolutionInstance, 'online');
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
        if (typeof window !== 'undefined') localStorage.setItem('EVO_evolutionStatus', 'offline');
        await saveEvolutionSettings(evolutionUrl, evolutionApiKey, evolutionInstance, 'offline');
      } else {
        setEvoStatus('offline');
        setEvoStatusMsg('Falha ao obter QR Code da API.');
        if (typeof window !== 'undefined') localStorage.setItem('EVO_evolutionStatus', 'offline');
      }

    } catch (err: any) {
      setEvoStatus('offline');
      setEvoStatusMsg(err.message || 'Erro de conexão com a Evolution API.');
      if (typeof window !== 'undefined') localStorage.setItem('EVO_evolutionStatus', 'offline');
    }
  };

  // Nichos State
  const [niches, setNiches] = useState(() => crmService.getNiches());
  const [newNicheName, setNewNicheName] = useState('');

  useEffect(() => {
    const unsub = crmService.subscribe(() => {
      setNiches([...crmService.getNiches()]);
    });
    return unsub;
  }, []);

  const handleAddNiche = () => {
    if (!newNicheName.trim()) return;
    crmService.addNiche({ name: newNicheName.trim(), description: '', status: 'ativo' });
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
  const [promptSaveSuccess, setPromptSaveSuccess] = useState(false);
  const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);
  const [promptsList, setPromptsList] = useState<AIPrompt[]>(() => crmService.getAiPromptsSync());
  const [selectedPromptId, setSelectedPromptId] = useState<string>(() => crmService.getDefaultAiPrompt()?.id || 'prompt-default-atendimento');
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [defaultPromptSuccess, setDefaultPromptSuccess] = useState(false);

  useEffect(() => {
    async function loadPrompts() {
      const list = await crmService.getAiPrompts();
      setPromptsList(list);
      const def = crmService.getDefaultAiPrompt();
      if (def?.id) {
        setSelectedPromptId(def.id);
      }
    }
    loadPrompts();

    const unsub = crmService.subscribe(() => {
      setPromptsList([...crmService.getAiPromptsSync()]);
    });
    return unsub;
  }, []);

  const handleSelectPrompt = (promptId: string) => {
    setSelectedPromptId(promptId);
    const found = promptsList.find((p) => p.id === promptId);
    if (found && found.prompt) {
      setAiConfig((prev) => ({ ...prev, systemPrompt: found.prompt }));
    }
  };

  const handleSaveSystemPrompt = async () => {
    aiProvider.saveConfig(aiConfig);
    const current = promptsList.find((p) => p.id === selectedPromptId);
    await crmService.saveAiPrompt({
      id: selectedPromptId,
      name: current?.name || 'System Prompt — EVO PIXEL',
      description: current?.description || 'Diretriz mestre operacional de IA',
      prompt: aiConfig.systemPrompt,
      prompt_type: current?.prompt_type || 'atendimento',
      is_default: current?.is_default ?? true,
    });
    setPromptsList([...crmService.getAiPromptsSync()]);

    try {
      const supabase = createClient();
      await supabase.from('system_settings').upsert({
        id: 'default',
        ai_system_prompt: aiConfig.systemPrompt,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error saving prompt to supabase:', e);
    }
    setPromptSaveSuccess(true);
    setTimeout(() => setPromptSaveSuccess(false), 3000);
  };

  const handleSetDefaultPrompt = async () => {
    setIsSettingDefault(true);
    await crmService.setDefaultAiPrompt(selectedPromptId);
    aiProvider.saveConfig({ ...aiConfig, systemPrompt: aiConfig.systemPrompt });
    setPromptsList([...crmService.getAiPromptsSync()]);
    setIsSettingDefault(false);
    setDefaultPromptSuccess(true);
    setTimeout(() => setDefaultPromptSuccess(false), 3000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard?.writeText(aiConfig.systemPrompt || '');
    setIsCopiedPrompt(true);
    setTimeout(() => setIsCopiedPrompt(false), 2000);
  };

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
          SEÇÃO 2.2: PERSONA DA EMPRESA & IDENTIDADE OPERACIONAL
          ========================================================================= */}
      <Card className="p-6 space-y-6 border border-evo-border bg-gradient-to-b from-evo-card via-evo-surface/30 to-evo-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-evo-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-evo-text font-heading">
                  Persona da Empresa & Identidade Comercial
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                  Anti-Spam & Tom de Voz
                </span>
              </div>
              <p className="text-xs text-evo-muted mt-0.5">
                Define o nome da sua empresa, remetente, serviços, termos estritamente proibidos para clientes e regras de transbordo humano.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-sm"
              onClick={handleSavePersona}
              disabled={isSavingPersona}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{personaSaveSuccess ? '✓ Persona Salva com Sucesso!' : 'Salvar Persona da Empresa'}</span>
            </Button>
          </div>
        </div>

        {/* Formulário Principal da Persona */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-evo-muted mb-1 font-medium">
              Nome Oficial da sua Empresa / Agência
            </label>
            <input
              type="text"
              value={persona.company_name}
              onChange={(e) => setPersona({ ...persona, company_name: e.target.value })}
              placeholder="Ex: Minha Agência Digital"
              className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-emerald-500 text-xs font-medium"
            />
            <p className="text-[10px] text-evo-muted mt-1">
              Substituirá qualquer menção genérica nas mensagens e apresentações aos leads.
            </p>
          </div>

          <div>
            <label className="block text-[11px] text-evo-muted mb-1 font-medium">
              Slogan / Posicionamento no Mercado
            </label>
            <input
              type="text"
              value={persona.slogan}
              onChange={(e) => setPersona({ ...persona, slogan: e.target.value })}
              placeholder="Ex: Especialistas em Presença Digital & Automação Comercial"
              className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] text-evo-muted mb-1 font-medium">
              Segmento / Nicho de Atuação
            </label>
            <input
              type="text"
              value={persona.segment}
              onChange={(e) => setPersona({ ...persona, segment: e.target.value })}
              placeholder="Ex: Assessoria de Crescimento, Sites e Automação de Vendas"
              className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-evo-muted mb-1 font-medium">
                Tom de Voz do Atendimento
              </label>
              <select
                value={persona.tone_of_voice}
                onChange={(e) => setPersona({ ...persona, tone_of_voice: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-emerald-500 text-xs capitalize"
              >
                <option value="consultivo">Consultivo & Estratégico (Recomendado)</option>
                <option value="formal">Formal & Corporativo</option>
                <option value="amigavel">Amigável & Próximo</option>
                <option value="direto">Direto & Comercial</option>
                <option value="energico">Enérgico & Persuasivo</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-evo-muted mb-1 font-medium">
                Nome do Remetente / Atendente
              </label>
              <input
                type="text"
                value={persona.sender_name || ''}
                onChange={(e) => setPersona({ ...persona, sender_name: e.target.value })}
                placeholder="Ex: Rafael Costa"
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* CTA Padrão e Template de Apresentação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-evo-muted font-medium">
                Template de Apresentação WhatsApp
              </label>
              <span className="text-[10px] text-evo-muted font-mono">
                Variáveis: {'{contato}'}, {'{empresa_nome}'}, {'{empresa_alvo}'}, {'{cidade}'}, {'{remetente}'}
              </span>
            </div>
            <textarea
              rows={3}
              value={persona.presentation_template}
              onChange={(e) => setPersona({ ...persona, presentation_template: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-emerald-500 text-xs font-mono resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[11px] text-evo-muted mb-1 font-medium">
              Chamada para Ação (CTA) Padrão
            </label>
            <textarea
              rows={3}
              value={persona.standard_cta}
              onChange={(e) => setPersona({ ...persona, standard_cta: e.target.value })}
              placeholder="Ex: Você teria 5 minutinhos esta semana para avaliarmos essa oportunidade sem compromisso?"
              className="w-full p-2.5 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-emerald-500 text-xs resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Regras de Transbordo Humano */}
        <div>
          <label className="block text-[11px] text-evo-muted mb-1 font-medium">
            Regras de Transbordo Humano (Quando a IA deve pausar e chamar um operador)
          </label>
          <textarea
            rows={2}
            value={persona.human_handover_rules}
            onChange={(e) => setPersona({ ...persona, human_handover_rules: e.target.value })}
            placeholder="Ex: Transferir imediatamente caso o lead solicite falar com atendente, negociar desconto ou após 3 objeções."
            className="w-full p-2.5 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-emerald-500 text-xs resize-none leading-relaxed"
          />
        </div>

        {/* Seção de Tags: Serviços e Termos Proibidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Serviços Oferecidos */}
          <div className="p-4 rounded-xl bg-evo-surface border border-evo-border space-y-3">
            <div className="flex items-center justify-between border-b border-evo-border pb-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-evo-text">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>Serviços Oferecidos</span>
              </div>
              <span className="text-[10px] text-evo-muted font-mono">{persona.services.length} ativos</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newServiceInput}
                onChange={(e) => setNewServiceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
                placeholder="Ex: Tráfego Pago & Google Ads"
                className="flex-1 px-3 py-1.5 rounded-lg bg-evo-card border border-evo-border text-evo-text text-xs focus:outline-none focus:border-emerald-500"
              />
              <Button
                variant="secondary"
                size="sm"
                className="text-xs gap-1 px-2.5 py-1.5"
                onClick={handleAddService}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[48px] max-h-[140px] overflow-y-auto p-1">
              {persona.services.map((srv, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                >
                  <span>{srv}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(idx)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Termos Estritamente Proibidos */}
          <div className="p-4 rounded-xl bg-evo-surface border border-evo-border space-y-3">
            <div className="flex items-center justify-between border-b border-evo-border pb-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-evo-text">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Termos Proibidos (Anti-Spam & Blindagem)</span>
              </div>
              <span className="text-[10px] text-amber-400/90 font-mono">Filtro Ativo</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newForbiddenInput}
                onChange={(e) => setNewForbiddenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddForbiddenTerm())}
                placeholder="Ex: imperdível, pirata, 100% garantido"
                className="flex-1 px-3 py-1.5 rounded-lg bg-evo-card border border-evo-border text-evo-text text-xs focus:outline-none focus:border-amber-500"
              />
              <Button
                variant="secondary"
                size="sm"
                className="text-xs gap-1 px-2.5 py-1.5"
                onClick={handleAddForbiddenTerm}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[48px] max-h-[140px] overflow-y-auto p-1">
              {/* Termo Obrigatório Permanente */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-red-500/15 text-red-300 border border-red-500/30 font-semibold" title="Termo reservado interno — bloqueado de envio aos leads">
                <span>🚫 EVO PIXEL</span>
                <span className="text-[9px] uppercase px-1 rounded bg-red-500/20 text-red-400 font-mono">Protegido</span>
              </span>

              {persona.forbidden_terms.filter((t) => t.toUpperCase() !== 'EVO PIXEL').map((term, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-300 border border-amber-500/25"
                >
                  <span>{term}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveForbiddenTerm(persona.forbidden_terms.indexOf(term))}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Simulador Interativo de Atendimento com a Persona */}
        <div className="p-4 rounded-xl bg-evo-deep border border-evo-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-evo-text">
                Simulador Interativo da Persona
              </span>
            </div>
            <span className="text-[10px] text-evo-muted font-mono">
              Valida tom de voz e sanitização de termos em tempo real
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={simTestMessage}
              onChange={(e) => setSimTestMessage(e.target.value)}
              placeholder="Digite uma mensagem que um lead enviaria..."
              className="flex-1 px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text text-xs focus:outline-none focus:border-emerald-500"
            />
            <Button
              variant="secondary"
              size="sm"
              className="text-xs gap-1.5 bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30 font-medium px-4 py-2"
              onClick={handleTestPersona}
              disabled={isSimulatingPersona || !simTestMessage.trim()}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingPersona ? 'animate-spin' : ''}`} />
              <span>{isSimulatingPersona ? 'Gerando com IA...' : 'Testar Resposta da IA'}</span>
            </Button>
          </div>

          {simResponse && (
            <div className="mt-3 p-3.5 rounded-xl bg-evo-surface border border-emerald-500/25 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resposta do Agente Comercial ({persona.company_name}):
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Tom: {persona.tone_of_voice} • 0 termos proibidos
                </span>
              </div>
              <p className="text-xs text-evo-text leading-relaxed whitespace-pre-wrap bg-evo-card p-3 rounded-lg border border-evo-border">
                {simResponse}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* =========================================================================
          SEÇÃO 2.5: SYSTEM PROMPT & DIRETRIZES DO CÉREBRO DE IA
          ========================================================================= */}
      <Card className="p-6 space-y-5 border border-evo-border bg-gradient-to-b from-evo-card via-evo-surface/30 to-evo-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-evo-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-evo-text font-heading">
                  System Prompt do Agente & Cérebro Operacional de IA
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/30">
                  Diretriz Mestre
                </span>
              </div>
              <p className="text-xs text-evo-muted mt-0.5">
                Define a postura comercial, metodologia de qualificação e regras de resposta do assistente em todo o CRM.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleCopyPrompt}
            >
              {isCopiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Prompt</span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-xs gap-1.5 border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
              onClick={handleSetDefaultPrompt}
              disabled={isSettingDefault}
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>{defaultPromptSuccess ? 'Definido como Padrão!' : 'Definir como Padrão'}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              onClick={handleSaveSystemPrompt}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Diretrizes IA</span>
            </Button>
          </div>
        </div>

        {/* Catálogo de Prompts Cadastrados */}
        {promptsList.length > 0 && (
          <div className="p-3 rounded-xl bg-evo-deep border border-evo-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-evo-text flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                Catálogo de Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {promptsList.map((p) => {
                  const isSelected = selectedPromptId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPrompt(p.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-500/25 border-purple-500 text-purple-200 font-semibold shadow-sm'
                          : 'bg-evo-surface border-evo-border text-evo-muted hover:text-evo-text hover:border-evo-support/40'
                      }`}
                    >
                      {p.is_default && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      <span>{p.name}</span>
                      {p.is_default && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                          Padrão
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="text-[10px] text-evo-muted font-mono">
              Selecione para carregar ou definir como padrão
            </span>
          </div>
        )}

        {/* Explicação Didática da Arquitetura do Prompt */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-evo-deep border-l-2 border-emerald-500 border-y border-r border-evo-border">
            <div className="text-[11px] font-mono text-emerald-400 font-semibold uppercase flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              1. [DADO] Fato Verificado
            </div>
            <p className="text-evo-muted text-[11px] leading-relaxed">
              Instrui a IA a nunca inventar fatos ou números. A IA se limita estritamente ao que foi extraído via Apify, Google Maps ou digitado.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-evo-deep border-l-2 border-blue-400 border-y border-r border-evo-border">
            <div className="text-[11px] font-mono text-blue-400 font-semibold uppercase flex items-center gap-1.5 mb-1">
              <Cpu className="w-3.5 h-3.5" />
              2. [INFERÊNCIA] Dedução Estratégica
            </div>
            <p className="text-evo-muted text-[11px] leading-relaxed">
              O cérebro deduz gargalos operacionais (falta de automação de WhatsApp, demora em responder leads, presença online defasada).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-evo-deep border-l-2 border-amber-400 border-y border-r border-evo-border">
            <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              3. [RECOMENDAÇÃO] Plano de Ação
            </div>
            <p className="text-evo-muted text-[11px] leading-relaxed">
              Cria as copys ideais para o WhatsApp, quebra de objeções, sugestões para o termômetro de interesse e propostas consultivas.
            </p>
          </div>
        </div>

        {/* Presets Rápidos */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-evo-text flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              Presets Rápidos de Postura Comercial:
            </span>
            <span className="text-[10px] text-evo-muted font-mono">
              Clique para carregar no editor
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setAiConfig({
                  ...aiConfig,
                  systemPrompt: `Você é o Evo Assistant, o motor de inteligência analítica e operacional da EVO PIXEL.\nSua postura é editorial, executiva, precisa, sem enrolação e focada em resultados comerciais.\nVocê analisa dados do EVO PIXEL (leads, clientes, prospects, propostas, pipeline, financeiro) e ajuda na tomada de decisão.\nDiferencie sempre fatos verificados [DADO], deduções inteligentes [INFERÊNCIA] e recomendações práticas [RECOMENDAÇÃO].`,
                })
              }
              className="text-[11px] px-2.5 py-1 rounded-lg bg-evo-surface border border-evo-border text-evo-text hover:border-evo-support transition-colors"
            >
              💼 Padrão Consultivo & Executivo (Oficial)
            </button>

            <button
              type="button"
              onClick={() =>
                setAiConfig({
                  ...aiConfig,
                  systemPrompt: `Você é o Closer de Elite da EVO PIXEL, focado em alta conversão e quebra imediata de objeções via WhatsApp.\nSua linguagem é direta, persuasiva, focada na dor do cliente (perda de vendas por demora no atendimento).\nEm todas as respostas ou copys, use gatilhos de urgência e prova social para conduzir o lead ao agendamento de uma demonstração de 15 minutos.\nNunca utilize jargões técnicos excessivos. Foque em lucro, tempo economizado e autoridade de mercado.`,
                })
              }
              className="text-[11px] px-2.5 py-1 rounded-lg bg-evo-surface border border-evo-border text-evo-text hover:border-evo-support transition-colors"
            >
              🔥 Closer de Alta Conversão (Vendas Rápidas)
            </button>

            <button
              type="button"
              onClick={() =>
                setAiConfig({
                  ...aiConfig,
                  systemPrompt: `Você é o Especialista Sênior em Expansão Comercial para Escritórios de Advocacia Aduaneira e Comércio Exterior da EVO PIXEL.\nCompreenda a fundo os desafios de escritórios de Direito Aduaneiro: liberação de cargas, fiscalização da Receita Federal, demurrage e triagem de importadores.\nSuas abordagens devem ser sóbrias, altamente técnicas, transmitindo autoridade jurídica irrefutável e oferecendo soluções de automação e captação de clientes corporativos no comex.`,
                })
              }
              className="text-[11px] px-2.5 py-1 rounded-lg bg-evo-surface border border-evo-border text-evo-text hover:border-evo-support transition-colors"
            >
              ⚖️ Especialista em Direito Aduaneiro & Comex
            </button>
          </div>
        </div>

        {/* Textarea do System Prompt */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <label className="font-semibold text-evo-text">
              Instrução Mestre (Prompt do Sistema):
            </label>
            <span className="font-mono text-evo-muted">
              {aiConfig.systemPrompt?.length || 0} caracteres
            </span>
          </div>
          <textarea
            rows={7}
            value={aiConfig.systemPrompt || ''}
            onChange={(e) => setAiConfig({ ...aiConfig, systemPrompt: e.target.value })}
            className="w-full bg-evo-deep border border-evo-border rounded-xl p-3.5 text-xs text-evo-text font-mono leading-relaxed focus:outline-none focus:border-purple-400 transition-colors resize-y"
            placeholder="Digite as instruções e diretrizes mestres que guiarão toda a IA do CRM..."
          />
        </div>

        {promptSaveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              <strong>System Prompt salvo com sucesso!</strong> Todas as abordagens, respostas automáticas do WhatsApp Inbox e análises de leads agora utilizam estas novas diretrizes.
            </span>
          </div>
        )}
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
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-medium flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ativo / Conectado
              </span>
            )}
            {evoStatus === 'offline' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 font-mono font-medium flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Desconectado
              </span>
            )}
            {evoStatus === 'loading' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono font-medium flex items-center gap-1.5">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Verificando...
              </span>
            )}
            {evoStatus === 'idle' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-evo-surface2 text-evo-support font-mono">
                Aguardando Teste
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs h-8 gap-1.5"
                    onClick={handleConnectEvolution}
                    disabled={evoStatus === 'loading'}
                  >
                    {evoStatus === 'loading' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
                    Testar / Conectar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs h-8 gap-1.5 bg-evo-accent text-black font-semibold hover:bg-evo-accent/90"
                    onClick={() => saveEvolutionSettings()}
                    disabled={isSavingEvo}
                  >
                    {evoSaveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {evoSaveSuccess ? 'Salvo!' : 'Salvar Conexão'}
                  </Button>
                </div>
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
                onClick={handleSaveSettings}
              >
                Salvar Configurações
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* =========================================================================
          SEÇÃO: PROSPECÇÃO ATIVA, AUDITORIA TÉCNICA & SCRAPING (PAGESPEED, APIFY & BROWSERLESS)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Google PageSpeed Insights API v5 */}
        <Card className="p-6 space-y-4 border border-[var(--evo-border)]">
          <div className="flex items-start justify-between border-b border-[var(--evo-border)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-amber-400">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">
                  Google PageSpeed v5
                </h3>
                <span className="text-[11px] text-[var(--evo-muted)]">
                  Auditoria técnica, Lighthouse e Core Web Vitals (CrUX)
                </span>
              </div>
            </div>
            {pageSpeedStatus === 'online' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-medium flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ativo / Conectado
              </span>
            )}
            {pageSpeedStatus === 'offline' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 font-mono font-medium flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Desconectado
              </span>
            )}
            {pageSpeedStatus === 'loading' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono font-medium flex items-center gap-1.5">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Verificando...
              </span>
            )}
            {pageSpeedStatus === 'idle' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-evo-surface2 text-evo-support font-mono">
                Não configurado
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[var(--evo-muted)] font-medium">PageSpeed API Key</label>
                <a
                  href="https://developers.google.com/speed/docs/insights/v5/get-started"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  Obter Chave <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPageSpeedKey ? 'text' : 'password'}
                  value={pageSpeedApiKey}
                  onChange={(e) => setPageSpeedApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPageSpeedKey(!showPageSpeedKey)}
                  className="absolute right-2.5 top-2.5 text-[var(--evo-muted)] hover:text-[var(--evo-text)]"
                >
                  {showPageSpeedKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[11px] text-[var(--evo-muted)] leading-relaxed">
              Alimenta o botão <strong>Cruzar Dados</strong> com auditoria real de Core Web Vitals (LCP, INP, CLS), métricas de laboratório e notas Lighthouse Mobile & Desktop.
            </div>

            <div className="pt-2 flex flex-col gap-3 border-t border-[var(--evo-border)] mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-[var(--evo-muted)] flex-1">
                  {pageSpeedStatusMsg && (
                    <span className={pageSpeedStatus === 'online' ? 'text-evo-support' : 'text-amber-500'}>
                      {pageSpeedStatusMsg}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs h-8 gap-1.5"
                    onClick={handleTestPageSpeed}
                    disabled={pageSpeedStatus === 'loading' || !pageSpeedApiKey.trim()}
                  >
                    {pageSpeedStatus === 'loading' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Testar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs h-8 gap-1.5 bg-amber-600 text-white font-semibold hover:bg-amber-500"
                    onClick={() => handleSavePageSpeed()}
                    disabled={isSavingPageSpeed}
                  >
                    {pageSpeedSaveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {pageSpeedSaveSuccess ? 'Salvo!' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Card Apify */}
        <Card className="p-6 space-y-4 border border-[var(--evo-border)]">
          <div className="flex items-start justify-between border-b border-[var(--evo-border)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-blue-400">
                <CloudDownload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">
                  Apify (Google Maps Extractor)
                </h3>
                <span className="text-[11px] text-[var(--evo-muted)]">
                  Captação automatizada de contatos no Google Maps por bairros e nicho
                </span>
              </div>
            </div>
            {apifyStatus === 'online' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-medium flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ativo / Conectado
              </span>
            )}
            {apifyStatus === 'offline' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 font-mono font-medium flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Desconectado
              </span>
            )}
            {apifyStatus === 'loading' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono font-medium flex items-center gap-1.5">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Verificando...
              </span>
            )}
            {apifyStatus === 'idle' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-evo-surface2 text-evo-support font-mono">
                Não configurado
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[var(--evo-muted)] font-medium">Apify API Token</label>
                <a
                  href="https://console.apify.com/account/integrations"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                >
                  Obter Token Apify <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showApifyKey ? 'text' : 'password'}
                  value={apifyToken}
                  onChange={(e) => setApifyToken(e.target.value)}
                  placeholder="apify_api_..."
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setShowApifyKey(!showApifyKey)}
                  className="absolute right-2.5 top-2.5 text-[var(--evo-muted)] hover:text-[var(--evo-text)]"
                >
                  {showApifyKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[11px] text-[var(--evo-muted)] leading-relaxed">
              O token salvo aqui é carregado automaticamente no botão <strong>Captar via Apify + IA</strong> da aba Leads, sem necessidade de digitação manual a cada extração.
            </div>

            <div className="pt-2 flex flex-col gap-3 border-t border-[var(--evo-border)] mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-[var(--evo-muted)] flex-1">
                  {apifyStatusMsg && (
                    <span className={apifyStatus === 'online' ? 'text-evo-support' : 'text-amber-500'}>
                      {apifyStatusMsg}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs h-8 gap-1.5"
                    onClick={handleTestApify}
                    disabled={apifyStatus === 'loading' || !apifyToken.trim()}
                  >
                    {apifyStatus === 'loading' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Testar Conexão
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs h-8 gap-1.5 bg-blue-600 text-white font-semibold hover:bg-blue-500"
                    onClick={() => handleSaveApify()}
                    disabled={isSavingApify}
                  >
                    {apifySaveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {apifySaveSuccess ? 'Salvo!' : 'Salvar Token'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Card Browserless */}
        <Card className="p-6 space-y-4 border border-[var(--evo-border)]">
          <div className="flex items-start justify-between border-b border-[var(--evo-border)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-evo-surface border border-[var(--evo-border)] flex items-center justify-center text-purple-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--evo-text)] font-heading">
                  Browserless (Headless Chrome & IA)
                </h3>
                <span className="text-[11px] text-[var(--evo-muted)]">
                  Nuvem Headless Chrome para automações web, scraping de portais e extração
                </span>
              </div>
            </div>
            {browserlessStatus === 'online' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/30 font-mono font-medium flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Ativo / Operacional
              </span>
            )}
            {browserlessStatus === 'offline' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 font-mono font-medium flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Desconectado
              </span>
            )}
            {browserlessStatus === 'loading' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono font-medium flex items-center gap-1.5">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Verificando...
              </span>
            )}
            {browserlessStatus === 'idle' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] bg-evo-surface2 text-evo-support font-mono">
                Aguardando Teste
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[var(--evo-muted)] font-medium">Browserless API Token</label>
                <a
                  href="https://cloud.browserless.io"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                >
                  Dashboard Browserless <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showBrowserlessKey ? 'text' : 'password'}
                  value={browserlessToken}
                  onChange={(e) => setBrowserlessToken(e.target.value)}
                  placeholder="2VGAcXMnH..."
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setShowBrowserlessKey(!showBrowserlessKey)}
                  className="absolute right-2.5 top-2.5 text-[var(--evo-muted)] hover:text-[var(--evo-text)]"
                >
                  {showBrowserlessKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[var(--evo-muted)] mb-1 font-medium">Endpoint Host</label>
              <input
                type="text"
                value={browserlessEndpoint}
                onChange={(e) => setBrowserlessEndpoint(e.target.value)}
                placeholder="https://production-sfo.browserless.io"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none font-mono text-[11px]"
              />
            </div>

            <div className="p-3 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[11px] text-[var(--evo-muted)] leading-relaxed">
              Permite raspagem direta via Chromium em nuvem gerenciada no botão <strong>Captar via Browserless + IA</strong> em Leads, integrando busca de dados reais e qualificação instantânea com IA.
            </div>

            <div className="pt-2 flex flex-col gap-3 border-t border-[var(--evo-border)] mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-[var(--evo-muted)] flex-1">
                  {browserlessStatusMsg && (
                    <span className={browserlessStatus === 'online' ? 'text-evo-support' : 'text-amber-500'}>
                      {browserlessStatusMsg}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs h-8 gap-1.5"
                    onClick={handleTestBrowserless}
                    disabled={browserlessStatus === 'loading' || !browserlessToken.trim()}
                  >
                    {browserlessStatus === 'loading' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Testar Conexão
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs h-8 gap-1.5 bg-purple-600 text-white font-semibold hover:bg-purple-500"
                    onClick={() => handleSaveBrowserless()}
                    disabled={isSavingBrowserless}
                  >
                    {browserlessSaveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {browserlessSaveSuccess ? 'Salvo!' : 'Salvar Credencial'}
                  </Button>
                </div>
              </div>
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
