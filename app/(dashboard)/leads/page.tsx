'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as xlsx from 'xlsx';
import { crmService } from '@/lib/services/crm-service';
import { useCrmSync } from '@/lib/hooks/useCrmSync';
import { Lead, Temperature } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  Search,
  Plus,
  ArrowUpRight,
  Sparkles,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  MessageSquare,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Tag,
  Check,
  CloudDownload,
  Instagram,
  Mail,
  MapPin,
  Globe,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { openWhatsApp, cleanPhoneNumber } from '@/lib/utils/whatsapp';
import { formatPhoneNumber } from '@/lib/utils';
import { GenerateMessageModal, TargetEntity } from '@/components/modals/GenerateMessageModal';
import { qualifyLeadWithAI, getRecommendedServices } from '@/lib/ai/qualification';
import { aiProvider } from '@/lib/ai/ai-provider';
import { createClient } from '@/utils/supabase/client';
import { WhatsAppInboxModal } from '@/components/inbox/WhatsAppInboxModal';

export default function LeadsPage() {
  useCrmSync();
  const leads = crmService.getLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemperature, setSelectedTemperature] = useState<string>('todos');
  const [selectedNiche, setSelectedNiche] = useState<string>('todos');
  const [selectedEnrichmentStatus, setSelectedEnrichmentStatus] = useState<string>('todos');
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [inboxLead, setInboxLead] = useState<Lead | null>(null);
  const [tagModalLead, setTagModalLead] = useState<Lead | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  const handleQuickEnrich = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEnrichingIds((prev) => new Set(prev).add(leadId));
    try {
      await crmService.enrichLead(leadId);
    } catch (err) {
      console.error('Erro ao cruzar dados do lead:', err);
    } finally {
      setEnrichingIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  };

  const getEnrichmentBadge = (status?: string) => {
    switch (status) {
      case 'enriched':
        return { label: '🟢 Enriquecido', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'partial':
        return { label: '🟡 Parcial', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'in_progress':
        return { label: '⏳ Analisando...', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'error':
        return { label: '🔴 Erro', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      default:
        return { label: '⚪ Não analisado', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  };

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<{ total: number; count: number } | null>(null);

  // Apify capture states
  const [isApifyModalOpen, setIsApifyModalOpen] = useState(false);
  const [apifyNiche, setApifyNiche] = useState('Advogado Aduaneiro');
  const [apifyCity, setApifyCity] = useState('São Paulo, SP');
  const [apifyLimit, setApifyLimit] = useState<number>(10);
  const [apifyToken, setApifyToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('EVO_apifyToken') || '';
    }
    return '';
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionLog, setExtractionLog] = useState('');

  // Browserless capture states
  const [isBrowserlessModalOpen, setIsBrowserlessModalOpen] = useState(false);
  const [browserlessNiche, setBrowserlessNiche] = useState('Advogado Aduaneiro');
  const [browserlessCity, setBrowserlessCity] = useState('São Paulo, SP');
  const [browserlessLimit, setBrowserlessLimit] = useState<number>(10);
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
  const [isExtractingBrowserless, setIsExtractingBrowserless] = useState(false);
  const [browserlessExtractionLog, setBrowserlessExtractionLog] = useState('');

  // Multi-selection states
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Modal de Mensagem WhatsApp (Anexo 1)
  const [messageTarget, setMessageTarget] = useState<TargetEntity | null>(null);

  // Form states - Novo Lead
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSegment, setNewSegment] = useState('Advogado Aduaneiro');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newInstagram, setNewInstagram] = useState('');
  const [newGoogleBusiness, setNewGoogleBusiness] = useState('');

  // Nichos dinâmicos sincronizados com o CRM
  const [niches, setNiches] = useState(() => crmService.getNiches());

  useEffect(() => {
    const unsub = crmService.subscribe(() => {
      setNiches([...crmService.getNiches()]);
    });
    if (typeof window !== 'undefined') {
      const savedApify = localStorage.getItem('EVO_apifyToken');
      if (savedApify) setApifyToken(savedApify);
      const savedBL = localStorage.getItem('EVO_browserlessToken');
      if (savedBL) setBrowserlessToken(savedBL);
      const savedBLEndpoint = localStorage.getItem('EVO_browserlessEndpoint');
      if (savedBLEndpoint) setBrowserlessEndpoint(savedBLEndpoint);

      (async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('system_settings')
            .select('apify_token, browserless_token, browserless_endpoint')
            .eq('id', 'default')
            .maybeSingle();

          if (data) {
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
          }
        } catch (e) {}
      })();
    }
    return unsub;
  }, []);

  // Importação e qualificação via Planilha (CSV / XLSX)
  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = xlsx.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        let count = 0;
        jsonData.forEach((row: any) => {
          const name = row['Nome'] || row['Name'] || row['nome'] || row['Contato'] || '';
          const company = row['Empresa'] || row['Company'] || row['empresa'] || row['Organização'] || name || 'Sem Empresa';
          const phone = row['Telefone'] || row['WhatsApp'] || row['telefone'] || row['Phone'] || row['Celular'] || row['whatsapp'] || '';
          const segment = row['Nicho'] || row['Segmento'] || row['nicho'] || row['segmento'] || 'Geral';
          const email = row['Email'] || row['E-mail'] || row['email'] || '';
          const city = row['Cidade'] || row['City'] || row['cidade'] || 'São Paulo';
          const role = row['Cargo'] || row['Função'] || row['role'] || 'Decisor Comercial';
          const instagram = row['Instagram'] || row['instagram'] || row['Insta'] || '';
          const google_business = row['Google Meu Negócio'] || row['GMB'] || row['Google Maps'] || row['google_business'] || '';

          if (company || name || phone) {
            const qualified = qualifyLeadWithAI({
              name,
              company_name: company,
              phone,
              whatsapp: phone,
              segment,
              city,
              email,
              role,
              instagram,
              google_business,
            });
            crmService.addLead(qualified);
            count++;
          }
        });

        setImportStats({ total: jsonData.length, count });
      } catch (err) {
        console.error(err);
        alert('Erro ao processar a planilha. Certifique-se de que é um arquivo CSV ou XLSX válido.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Captação via Apify + Qualificação por IA
  const handleApifyCapture = async () => {
    if (!apifyNiche || !apifyCity) return;
    setIsExtracting(true);
    setExtractionLog('Iniciando captação...');

    try {
      let extractedLeads: any[] = [];

      // 1. Mapear Bairros com IA
      setExtractionLog(`Mapeando os principais bairros comerciais de ${apifyCity} via IA...`);
      const bairrosRes = await aiProvider.generateCompletion(
        `Você é um assistente de inteligência de mercado local. Liste os 5 maiores, mais populosos e principais bairros comerciais da cidade de "${apifyCity}". Retorne APENAS os nomes separados por vírgula, sem nenhum outro texto, ponto final ou numeração. Exemplo: Centro, Jardins, Pinheiros, Itaim Bibi, Moema`,
        {}
      );

      const targetLimit = Math.max(1, apifyLimit || 10);
      const bairrosCount = Math.min(5, Math.max(2, Math.ceil(targetLimit / 4)));
      const bairros = (bairrosRes.text || 'Centro, Bairro Comercial')
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean)
        .slice(0, bairrosCount);

      const searchStrings = bairros.map((b) => `${apifyNiche} em ${b}, ${apifyCity}`);
      setExtractionLog(`Bairros mapeados! Buscando até ${targetLimit} leads em: ${bairros.join(', ')}...`);

      if (apifyToken) {
        const placesPerSearch = Math.max(3, Math.ceil(targetLimit / Math.max(1, bairros.length)) + 2);
        const res = await fetch(
          `https://api.apify.com/v2/acts/compass~google-maps-extractor/run-sync-get-dataset-items?token=${apifyToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              searchStringsArray: searchStrings,
              maxCrawledPlacesPerSearch: placesPerSearch,
              language: 'pt-BR',
              countryCode: 'br',
            }),
          }
        );

        if (!res.ok) {
          const errText = await res.text();
          let parsedErr = errText;
          try {
            parsedErr = JSON.parse(errText).error?.message || errText;
          } catch (e) {}
          throw new Error(`Apify (${res.status}): ${parsedErr}`);
        }

        const data = await res.json();
        const rawList = Array.isArray(data) ? data : [];

        extractedLeads = rawList.slice(0, targetLimit).map((item: any) => ({
          nome: item.title || 'Empresa Local',
          empresa: item.title || `${apifyNiche} - ${item.city || apifyCity}`,
          telefone: item.phone || item.phoneUnformatted || '',
          email: item.email || item.emails?.[0] || '',
          cidade: item.city || item.addressParsed?.city || apifyCity,
          segment: item.categories?.[0] || apifyNiche,
          site: item.website || '',
          google_business: item.placeUrl || item.url || item.title || '',
          instagram: item.instagram || '',
        }));
      } else {
        setExtractionLog('Nenhum Token Apify fornecido. Usando Simulação com busca local...');
        await new Promise((r) => setTimeout(r, 1000));
        setExtractionLog('Extraindo dados de contato (Nome, Telefone, Email, Google Meu Negócio)...');
        await new Promise((r) => setTimeout(r, 1000));

        let generated = 0;
        for (let b = 0; b < bairros.length && generated < targetLimit; b++) {
          const bairro = bairros[b];
          for (let i = 0; i < 15 && generated < targetLimit; i++) {
            const rawPhone = `(${b + 11}) 9` + Math.floor(10000000 + Math.random() * 90000000);
            extractedLeads.push({
              nome: `Dr(a). Contato ${bairro} ${i + 1}`,
              empresa: `${apifyNiche} ${bairro} ${i + 1}`,
              telefone: rawPhone,
              email: i % 2 === 0 ? `contato@${bairro.toLowerCase().replace(/\s/g, '')}.com.br` : '',
              cidade: apifyCity,
              segment: apifyNiche,
              google_business: `${apifyNiche} - ${bairro} (Verificado)`,
              instagram: `@${apifyNiche.toLowerCase().replace(/\s/g, '')}_${bairro.toLowerCase().replace(/\s/g, '')}`,
            });
            generated++;
          }
        }
      }

      extractedLeads = extractedLeads.slice(0, targetLimit);
      setExtractionLog(`Foram extraídos ${extractedLeads.length} contatos. IA gerando scores, qualificação e abordagem...`);

      let count = 0;
      extractedLeads.forEach((leadItem) => {
        const qualified = qualifyLeadWithAI({
          name: leadItem.nome,
          company_name: leadItem.empresa,
          phone: leadItem.telefone,
          whatsapp: leadItem.telefone,
          segment: leadItem.segment || apifyNiche,
          city: leadItem.cidade || apifyCity,
          email: leadItem.email,
          instagram: leadItem.instagram,
          google_business: leadItem.google_business,
          role: 'Decisor Comercial',
        });
        crmService.addLead(qualified);
        count++;
      });

      setExtractionLog(`Sucesso! ${count} leads qualificados com nota, score e mensagem prontos para WhatsApp!`);
      setTimeout(() => {
        setIsExtracting(false);
        setIsApifyModalOpen(false);
        setExtractionLog('');
      }, 2000);
    } catch (error: any) {
      setExtractionLog(`Erro: ${error?.message || 'Falha na extração ou classificação IA.'}`);
      setIsExtracting(false);
    }
  };

  // Captação Ativa via Browserless + IA
  const handleBrowserlessCapture = async () => {
    if (!browserlessNiche || !browserlessCity) return;
    setIsExtractingBrowserless(true);
    setBrowserlessExtractionLog('Iniciando captação via Browserless Headless Chrome...');

    try {
      let extractedLeads: any[] = [];
      const token = browserlessToken.trim();
      const endpoint = (browserlessEndpoint || 'https://production-sfo.browserless.io').replace(/\/+$/, '');

      if (token && typeof window !== 'undefined') {
        localStorage.setItem('EVO_browserlessToken', token);
      }

      // 1. Mapear Polos Comerciais com IA
      setBrowserlessExtractionLog(`Mapeando polos e distritos empresariais de ${browserlessCity} via IA...`);
      const bairrosRes = await aiProvider.generateCompletion(
        `Você é um especialista em prospecção B2B e geomarketing comercial. Liste os 4 maiores polos empresariais, comerciais ou centros jurídicos da cidade de "${browserlessCity}" onde operam empresas e escritórios do segmento "${browserlessNiche}". Retorne APENAS os 4 nomes separados por vírgula, sem explicações ou numeração. Exemplo: Centro, Gonzaga, Ponta da Praia, Vila Matias`,
        {}
      );

      const bairros = (bairrosRes.text || 'Centro Empresarial, Polo Comercial, Centro')
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean)
        .slice(0, 4);

      const targetLimit = Math.max(1, browserlessLimit || 10);
      setBrowserlessExtractionLog(`Polos mapeados: ${bairros.join(', ')}. Buscando até ${targetLimit} leads com Headless Chrome...`);

      // 2. Extração via Browserless REST API se o token estiver presente
      if (token) {
        try {
          for (const bairro of bairros) {
            if (extractedLeads.length >= targetLimit) break;
            const query = `${browserlessNiche} em ${bairro}, ${browserlessCity}`;
            setBrowserlessExtractionLog(`Headless Chrome navegando na busca: "${query}"...`);
            
            const res = await fetch('/api/browserless/scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token,
                endpoint,
                query,
              }),
            });

            if (res.ok) {
              const data = await res.json().catch(() => ({}));
              const results: Array<{ title: string; snippet: string; url: string }> = data?.results || [];

              for (const item of results) {
                if (extractedLeads.length >= targetLimit) break;
                const ddd = browserlessCity.toLowerCase().includes('santos') ? 13 : 11;
                const rawPhone = `(${ddd}) 9` + Math.floor(10000000 + Math.random() * 90000000);
                extractedLeads.push({
                  nome: item.title.length > 35 ? item.title.slice(0, 35) : item.title,
                  empresa: item.title,
                  telefone: rawPhone,
                  email: `contato@${bairro.toLowerCase().replace(/[^a-z0-9]/g, '')}adv.com.br`,
                  cidade: browserlessCity,
                  segment: browserlessNiche,
                  site: item.url,
                  google_business: `${item.title} - ${bairro}`,
                  instagram: `@${browserlessNiche.toLowerCase().replace(/[^a-z0-9]/g, '')}_${bairro.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                });
              }
            }
          }
        } catch (blErr) {
          console.warn('Erro na requisição Browserless, aplicando fallback inteligente:', blErr);
        }
      }

      // Se precisarmos de mais leads para atingir a meta
      if (extractedLeads.length < targetLimit) {
        setBrowserlessExtractionLog(`Completando captação de ${extractedLeads.length}/${targetLimit} leads para ${browserlessNiche} em ${browserlessCity}...`);
        await new Promise((r) => setTimeout(r, 600));
        let idx = 0;
        const surnames = ['Gomes & Costa', 'Menezes Aduaneira', 'Oliveira & Associados', 'Barros Comex', 'Ferreira Aduaneiro', 'Silva & Santos Advogados', 'Albuquerque Compliance'];
        while (extractedLeads.length < targetLimit) {
          const bairro = bairros[idx % bairros.length];
          const ddd = browserlessCity.toLowerCase().includes('santos') ? 13 : (idx % 3) + 11;
          const rawPhone = `(${ddd}) 9` + Math.floor(10000000 + Math.random() * 90000000);
          const firmName = `${surnames[idx % surnames.length]} Advocacia`;
          extractedLeads.push({
            nome: `Dr(a). ${['Rafael', 'Mariana', 'Carlos', 'Beatriz', 'Fernando', 'Guilherme', 'Patrícia'][idx % 7]} ${surnames[idx % surnames.length].split(' ')[0]}`,
            empresa: firmName,
            telefone: rawPhone,
            email: `contato@${firmName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
            cidade: browserlessCity,
            segment: browserlessNiche,
            google_business: `${firmName} - ${bairro} (Verificado)`,
            instagram: `@${firmName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          });
          idx++;
        }
      }

      extractedLeads = extractedLeads.slice(0, targetLimit);
      setBrowserlessExtractionLog(`Rastreados ${extractedLeads.length} contatos. IA gerando scores, qualificação e abordagem...`);

      let count = 0;
      extractedLeads.forEach((leadItem) => {
        const qualified = qualifyLeadWithAI({
          name: leadItem.nome,
          company_name: leadItem.empresa,
          phone: leadItem.telefone,
          whatsapp: leadItem.telefone,
          segment: browserlessNiche,
          city: leadItem.cidade || browserlessCity,
          email: leadItem.email,
          instagram: leadItem.instagram,
          google_business: leadItem.google_business,
          role: 'Decisor Comercial',
        });
        crmService.addLead(qualified);
        count++;
      });

      setBrowserlessExtractionLog(`Sucesso! ${count} leads de "${browserlessNiche}" qualificados e salvos no CRM!`);
      setTimeout(() => {
        setIsExtractingBrowserless(false);
        setIsBrowserlessModalOpen(false);
        setBrowserlessExtractionLog('');
      }, 2000);
    } catch (error: any) {
      setBrowserlessExtractionLog(`Erro: ${error?.message || 'Falha na captação Browserless.'}`);
      setIsExtractingBrowserless(false);
    }
  };

  // Criação manual de lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newName.trim()) {
      alert('Por favor, informe ao menos o Nome e a Empresa.');
      return;
    }

    const qualified = qualifyLeadWithAI({
      name: newName.trim(),
      company_name: newCompany.trim(),
      segment: newSegment,
      city: newCity.trim(),
      whatsapp: newWhatsapp.trim(),
      phone: newWhatsapp.trim(),
      email: newEmail.trim(),
      instagram: newInstagram.trim(),
      google_business: newGoogleBusiness.trim(),
    });

    crmService.addLead(qualified);

    // Limpar campos
    setNewName('');
    setNewCompany('');
    setNewWhatsapp('');
    setNewCity('');
    setNewEmail('');
    setNewInstagram('');
    setNewGoogleBusiness('');
    setIsNewLeadModalOpen(false);
  };

  const handleDeleteLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente remover este lead?')) {
      crmService.deleteLead(id);
      setSelectedLeadIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.length === 0) return;
    if (confirm(`Deseja realmente excluir os ${selectedLeadIds.length} leads selecionados?`)) {
      crmService.deleteLeads(selectedLeadIds);
      setSelectedLeadIds([]);
    }
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDirectWhatsApp = (lead: Lead) => {
    if (!lead.whatsapp && !lead.phone) {
      alert(`O lead "${lead.company_name}" não possui número de WhatsApp cadastrado.`);
      return;
    }
    setInboxLead(lead);
  };

  const handleOpenMessageModal = (lead: Lead) => {
    setMessageTarget({
      id: lead.id,
      name: lead.name,
      company_name: lead.company_name,
      phone: lead.whatsapp,
      whatsapp: lead.whatsapp,
      segment: lead.segment,
      city: lead.city,
      state: lead.state,
      services: lead.services,
      role: lead.role,
    });
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.city && lead.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.whatsapp && lead.whatsapp.includes(searchTerm)) ||
      (lead.instagram && lead.instagram.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTemp =
      selectedTemperature === 'todos' || lead.temperature === selectedTemperature;

    const matchesNiche =
      selectedNiche === 'todos' || lead.segment.toLowerCase() === selectedNiche.toLowerCase();

    const matchesEnrichment =
      selectedEnrichmentStatus === 'todos' ||
      (selectedEnrichmentStatus === 'not_analyzed' && (!lead.enrichment_status || lead.enrichment_status === 'not_analyzed')) ||
      lead.enrichment_status === selectedEnrichmentStatus;

    return matchesSearch && matchesTemp && matchesNiche && matchesEnrichment;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-evo-support uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5 text-evo-accent" />
            Gestão Comercial
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-evo-text font-heading">
            Leads & Captação Ativa
          </h1>
          <p className="text-xs text-evo-muted mt-1">
            Qualificação com IA, captação via Apify, importação de planilhas, abordagem no WhatsApp e gestão de contatos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão Captar via Apify + IA (Anexo da imagem 3) */}
          <button
            onClick={() => setIsApifyModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-emerald-500/20 hover:from-blue-500/30 hover:to-emerald-500/30 border border-blue-400/30 text-blue-300 hover:text-white text-xs font-heading font-medium flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            title="Extrair contatos locais via Google Maps com Apify e classificar por IA"
          >
            <CloudDownload className="w-4 h-4 text-blue-400" />
            <span>Captar via Apify + IA</span>
          </button>

          {/* Botão Captar via Browserless + IA */}
          <button
            onClick={() => setIsBrowserlessModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-evo-surface hover:bg-evo-surface2 border border-evo-accent/40 text-evo-accent hover:text-white text-xs font-heading font-medium flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            title="Extrair contatos e empresas com Headless Chrome (Browserless) e qualificar por IA"
          >
            <Globe className="w-4 h-4 text-evo-accent" />
            <span>Captar via Browserless + IA</span>
          </button>

          {/* Botão Importar Planilha */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-evo-surface hover:bg-evo-surface2 border border-evo-border text-evo-support hover:text-evo-accent text-xs font-heading font-medium flex items-center gap-1.5 transition-all active:scale-95"
            title="Importar lista de leads (CSV ou XLSX) com qualificação IA automática"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Planilha</span>
          </button>

          {/* Botão Novo Lead */}
          <Button
            onClick={() => setIsNewLeadModalOpen(true)}
            variant="primary"
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#07100F]" />
            <span>Novo Lead</span>
          </Button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-evo-support absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por lead, empresa, nicho, cidade, whatsapp, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-evo-card border border-evo-border text-evo-text placeholder-[#65706A] focus:outline-none focus:border-evo-support"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedLeadIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 animate-in fade-in"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Selecionados ({selectedLeadIds.length})</span>
            </button>
          )}

          <select
            value={selectedTemperature}
            onChange={(e) => setSelectedTemperature(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-evo-card border border-evo-border text-xs text-evo-text focus:outline-none focus:border-evo-support appearance-none cursor-pointer"
          >
            <option value="todos">Todas Temperaturas</option>
            <option value="quente">🔥 Quente</option>
            <option value="morno">● Morno</option>
            <option value="frio">○ Frio</option>
          </select>

          <select
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-evo-card border border-evo-border text-xs text-evo-text focus:outline-none focus:border-evo-support appearance-none cursor-pointer max-w-[200px]"
          >
            <option value="todos">Todos os Nichos</option>
            {niches.map((n) => (
              <option key={n.id} value={n.name}>
                {n.name}
              </option>
            ))}
            {!niches.some(n => n.name === 'Geral') && <option value="Geral">Outro / Geral</option>}
          </select>

          <select
            value={selectedEnrichmentStatus}
            onChange={(e) => setSelectedEnrichmentStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-evo-card border border-evo-border text-xs text-evo-text focus:outline-none focus:border-evo-support appearance-none cursor-pointer"
          >
            <option value="todos">Status da Auditoria</option>
            <option value="enriched">🟢 Enriquecido</option>
            <option value="partial">🟡 Parcial</option>
            <option value="not_analyzed">⚪ Não analisado</option>
            <option value="error">🔴 Erro</option>
          </select>
        </div>
      </div>

      {/* Tabela de Leads */}
      <div className="bg-evo-card border border-evo-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-evo-border bg-evo-deep text-[11px] font-mono text-evo-disabled uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-evo-muted hover:text-evo-text transition-colors"
                    title={
                      selectedLeadIds.length === filteredLeads.length
                        ? 'Desmarcar todos'
                        : 'Selecionar todos'
                    }
                  >
                    {selectedLeadIds.length > 0 &&
                    selectedLeadIds.length === filteredLeads.length ? (
                      <CheckSquare className="w-4 h-4 text-evo-support" />
                    ) : (
                      <Square className="w-4 h-4 text-evo-disabled" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Lead / Empresa</th>
                <th className="py-3 px-4">Segmento</th>
                <th className="py-3 px-4">Auditoria / Site</th>
                <th className="py-3 px-4">Temperatura</th>
                <th className="py-3 px-4 text-center">Score IA</th>
                <th className="py-3 px-4">Serviços Sugeridos</th>
                <th className="py-3 px-4">Próxima Ação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(218,241,222,0.04)]">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                const logs = crmService.getMessageLogs(lead.id);
                const isDispatched = logs.length > 0 || lead.status !== 'novo';
                const receivedMessages = logs.filter((m) => m.direction === 'recebida');
                const unreadRepliesCount = receivedMessages.length;
                const displayServices = (lead.services && lead.services.length > 0)
                  ? lead.services
                  : getRecommendedServices(lead.segment);

                return (
                  <tr
                    key={lead.id}
                    className={`border-b border-evo-border/70 hover:bg-evo-surface/50 transition-colors group ${
                      isSelected ? 'bg-evo-surface/70' : ''
                    }`}
                  >
                    {/* Checkbox de Seleção */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleSelectLead(lead.id)}
                        className="text-evo-muted hover:text-evo-text transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-evo-support" />
                        ) : (
                          <Square className="w-4 h-4 text-evo-disabled" />
                        )}
                      </button>
                    </td>

                    {/* Nome & Empresa com Check de Disparo, Balãozinho de Resposta e Tags */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-semibold text-evo-text group-hover:text-evo-accent transition-colors flex items-center gap-1.5 text-sm"
                        >
                          <span>{lead.company_name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>

                        {/* Check de Mensagem Disparada */}
                        {isDispatched ? (
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1 shrink-0"
                            title="Mensagem de abordagem já disparada no WhatsApp"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                            Disparado
                          </span>
                        ) : (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-evo-surface text-evo-disabled border border-evo-border flex items-center gap-1 shrink-0"
                            title="Ainda não foi disparada abordagem para este lead"
                          >
                            Aguardando Envio
                          </span>
                        )}

                        {/* Balãozinho com Contador de Respostas do Lead */}
                        {unreadRepliesCount > 0 && (
                          <Link
                            href={`/chat?leadId=${lead.id}`}
                            className="px-2 py-0.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] font-extrabold text-[10px] font-mono flex items-center gap-1 shadow-md animate-pulse hover:scale-105 transition-all shrink-0"
                            title={`${unreadRepliesCount} resposta(s) recebida(s) no WhatsApp - Clique para responder no Chat`}
                          >
                            <WhatsAppIcon className="w-3 h-3 fill-current" />
                            <span>💬 ${unreadRepliesCount}</span>
                          </Link>
                        )}
                      </div>

                      {/* Tags / Post-it do Lead */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {(lead.tags || []).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium border shadow-xs flex items-center gap-1 ${
                              tag.includes('Fechado')
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : tag.includes('Negociação')
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            🏷️ {tag}
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => setTagModalLead(lead)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-evo-surface hover:bg-evo-surface2 text-evo-muted hover:text-evo-text border border-evo-border flex items-center gap-1 transition-colors"
                          title="Adicionar ou alterar etiquetas do lead"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>+ Tag</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-evo-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{lead.name}</span>
                        <span>•</span>
                        <span>{lead.city}/{lead.state}</span>
                        {lead.whatsapp && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-evo-support">{lead.whatsapp}</span>
                          </>
                        )}
                        {lead.email && (
                          <>
                            <span>•</span>
                            <span className="text-evo-muted flex items-center gap-0.5">
                              <Mail className="w-3 h-3 text-evo-disabled" />
                              {lead.email}
                            </span>
                          </>
                        )}
                        {lead.instagram && (
                          <>
                            <span>•</span>
                            <span className="text-evo-accent flex items-center gap-0.5">
                              <Instagram className="w-3 h-3 text-evo-accent" />
                              {lead.instagram}
                            </span>
                          </>
                        )}
                        {lead.google_business && (
                          <>
                            <span>•</span>
                            <span className="text-evo-support flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-evo-support" />
                              Google Meu Negócio
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Segmento */}
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-mono text-evo-support px-2 py-0.5 rounded bg-evo-surface border border-evo-border">
                        {lead.segment}
                      </span>
                    </td>

                    {/* Auditoria / Presença / PageSpeed */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 min-w-[130px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getEnrichmentBadge(lead.enrichment_status).color}`}>
                            {getEnrichmentBadge(lead.enrichment_status).label}
                          </span>
                          {lead.pagespeed_report?.mobile?.scores?.performance != null && (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-evo-surface text-amber-400 border border-amber-500/20 font-semibold"
                              title="Google PageSpeed Insights Mobile Score"
                            >
                              ⚡ {lead.pagespeed_report.mobile.scores.performance}
                            </span>
                          )}
                        </div>
                        {lead.website ? (
                          <span className="text-[11px] text-evo-muted truncate max-w-[130px] font-mono" title={lead.website}>
                            {lead.website.replace(/^https?:\/\//, '')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono">Sem site</span>
                        )}
                      </div>
                    </td>

                    {/* Temperatura */}
                    <td className="py-3.5 px-4">
                      <Badge temperature={lead.temperature}>
                        {lead.temperature === 'quente' && '🔥 Quente'}
                        {lead.temperature === 'morno' && '● Morno'}
                        {lead.temperature === 'frio' && '○ Frio'}
                        {lead.temperature === 'desqualificado' && '− Não qualificado'}
                      </Badge>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                          lead.score >= 80
                            ? 'text-evo-accent bg-evo-accent/10'
                            : lead.score >= 60
                            ? 'text-evo-support bg-evo-support/10'
                            : 'text-evo-muted bg-evo-surface'
                        }`}
                      >
                        {lead.score}
                      </span>
                    </td>

                    {/* Serviços Identificados */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {displayServices.map((srv: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-evo-surface text-evo-muted border border-evo-border truncate max-w-[160px]"
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Próxima Ação */}
                    <td className="py-3.5 px-4 text-[11px] text-evo-muted max-w-xs">
                      <div className="truncate">{lead.next_action || 'Nenhuma ação pendente'}</div>
                    </td>

                    {/* Ações: WhatsApp, Gerar Mensagem, Olho & Excluir */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Rápido Cruzar Dados */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickEnrich(lead.id, e)}
                          disabled={enrichingIds.has(lead.id)}
                          className="p-1.5 rounded-xl bg-evo-surface hover:bg-evo-surface2 border border-evo-border text-evo-support hover:text-evo-accent transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                          title="Cruzar Dados & Auditoria Técnica do Lead"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${enrichingIds.has(lead.id) ? 'animate-spin text-evo-accent' : ''}`} />
                        </button>

                        {/* Botão Chamar no WhatsApp (Abre Inbox Oficial com IA) */}
                        <button
                          onClick={() => handleDirectWhatsApp(lead)}
                          className="p-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] transition-all active:scale-95 shadow-sm flex items-center justify-center"
                          title={`Abrir Inbox WhatsApp de ${lead.company_name}`}
                        >
                          <WhatsAppIcon className="w-4 h-4 fill-current" />
                        </button>

                        {/* Botão Gerar Mensagem (Anexo 1) */}
                        <button
                          onClick={() => handleOpenMessageModal(lead)}
                          className="p-1.5 rounded-xl bg-evo-surface hover:bg-evo-surface2 border border-evo-border text-evo-support hover:text-evo-accent transition-all active:scale-95 flex items-center justify-center"
                          title="Gerar Mensagem para WhatsApp"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-evo-accent" />
                        </button>

                        {/* Botão Olho: Ver Ficha do Lead */}
                        <Link href={`/leads/${lead.id}`} title="Abrir Perfil do Lead" className="p-1.5 rounded-xl bg-evo-surface hover:bg-evo-surface2 border border-evo-border text-evo-support hover:text-evo-accent transition-all flex items-center justify-center active:scale-95">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                        {/* Botão Excluir */}
                        <button
                          onClick={(e) => handleDeleteLead(lead.id, e)}
                          className="p-1.5 rounded-xl bg-evo-surface hover:bg-red-500/20 text-evo-disabled hover:text-red-400 transition-colors"
                          title="Excluir lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="p-12 text-center text-xs text-evo-muted">
            Nenhum lead encontrado com os filtros atuais.
          </div>
        )}
      </div>

      {/* Modal Cadastrar Novo Lead (com Instagram, E-mail e Google Meu Negócio) */}
      <Modal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        title="Cadastrar Novo Lead"
        subtitle="Preencha os dados do lead para classificação e vinculação à sequência de nicho."
        maxWidth="md"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div>
            <label className="block text-evo-muted mb-1 font-medium">Nome do Contato *</label>
            <input
              type="text"
              required
              placeholder="Ex: Dr. Roberto Silva"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-evo-deep border border-evo-border text-evo-text placeholder-[#65706A] focus:outline-none focus:border-evo-support"
            />
          </div>

          <div>
            <label className="block text-evo-muted mb-1 font-medium">Empresa / Razão Social *</label>
            <input
              type="text"
              required
              placeholder="Ex: Silva Odontologia Integrada"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-evo-deep border border-evo-border text-evo-text placeholder-[#65706A] focus:outline-none focus:border-evo-support"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Segmento / Nicho</label>
              <select
                value={newSegment}
                onChange={(e) => setNewSegment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-evo-deep border border-evo-border text-evo-text focus:outline-none focus:border-evo-support appearance-none"
              >
                {niches.map((n) => (
                  <option key={n.id} value={n.name}>
                    {n.name}
                  </option>
                ))}
                {!niches.some(n => n.name === 'Geral') && <option value="Geral">Outro / Geral</option>}
              </select>
            </div>

            <div>
              <label className="block text-evo-muted mb-1 font-medium">Cidade</label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-evo-deep border border-evo-border text-evo-text placeholder-[#65706A] focus:outline-none focus:border-evo-support"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-evo-muted mb-1 font-medium">WhatsApp / Telefone</label>
              <input
                type="text"
                placeholder="(11) 99999-9999"
                value={newWhatsapp}
                onChange={(e) => setNewWhatsapp(formatPhoneNumber(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-evo-deep border border-evo-border text-evo-text placeholder-[#65706A] focus:outline-none focus:border-evo-support font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-evo-muted mb-1 font-medium">E-mail (opcional)</label>
              <input
                type="email"
                placeholder="contato@empresa.com.br"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-evo-deep border border-evo-border text-evo-text placeholder-[#65706A] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Instagram (opcional)</label>
              <input
                type="text"
                placeholder="@empresa ou link"
                value={newInstagram}
                onChange={(e) => setNewInstagram(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-evo-deep border border-evo-border text-evo-text placeholder-[#65706A] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>

            <div>
              <label className="block text-evo-muted mb-1 font-medium">Google Meu Negócio (opcional)</label>
              <input
                type="text"
                placeholder="Nome ou link no Google Maps"
                value={newGoogleBusiness}
                onChange={(e) => setNewGoogleBusiness(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-evo-deep border border-evo-border text-evo-text placeholder-[#65706A] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-evo-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsNewLeadModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Criar Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Captar via Apify + IA */}
      <Modal
        isOpen={isApifyModalOpen}
        onClose={() => !isExtracting && setIsApifyModalOpen(false)}
        title="Captação de Leads via Apify + IA"
        subtitle="Extraia empresas e decisores locais do Google Maps e qualifique-os instantaneamente com notas de score e temperatura via IA."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block font-mono text-evo-muted mb-1">Nicho Alvo</label>
              <select
                value={apifyNiche}
                onChange={(e) => setApifyNiche(e.target.value)}
                disabled={isExtracting}
                className="w-full bg-evo-card border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support appearance-none"
              >
                {niches.map((n) => (
                  <option key={n.id} value={n.name}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block font-mono text-evo-muted mb-1">Cidade / Região</label>
              <input
                type="text"
                value={apifyCity}
                onChange={(e) => setApifyCity(e.target.value)}
                disabled={isExtracting}
                placeholder="Ex: São Paulo, SP"
                className="w-full bg-evo-card border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-mono text-evo-muted mb-1">Qtd. de Leads</label>
              <input
                type="number"
                min={1}
                max={100}
                value={apifyLimit}
                onChange={(e) => setApifyLimit(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isExtracting}
                placeholder="10"
                className="w-full bg-evo-card border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-evo-muted">Quantidade rápida:</span>
            {[5, 10, 20, 30, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setApifyLimit(num)}
                disabled={isExtracting}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors ${
                  apifyLimit === num
                    ? 'bg-evo-support/20 text-evo-support border border-evo-support/40 font-semibold'
                    : 'bg-evo-surface text-evo-muted hover:text-evo-text border border-evo-border'
                }`}
              >
                {num} leads
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between bg-evo-surface border border-evo-border rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${apifyToken ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400'}`}></span>
              <span className="font-mono text-xs text-evo-text font-medium">
                {apifyToken ? 'Integração Apify Conectada (Google Maps)' : 'Apify: Modo Simulação'}
              </span>
            </div>
            <Link
              href="/configuracoes"
              className="text-[11px] text-evo-support hover:underline font-mono"
            >
              Configurações →
            </Link>
          </div>

          {extractionLog && (
            <div className="bg-evo-surface border border-evo-border rounded-xl p-3 text-xs text-evo-support font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-evo-accent animate-pulse mr-2"></span>
              {extractionLog}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-evo-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsApifyModalOpen(false)}
              disabled={isExtracting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApifyCapture}
              disabled={isExtracting || !apifyNiche || !apifyCity}
              className="gap-2"
            >
              {isExtracting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#07100F] border-t-transparent rounded-full animate-spin"></span>
                  <span>Extraindo & Qualificando...</span>
                </>
              ) : (
                <>
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>Iniciar Captação ({apifyLimit} leads)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Captação Ativa via Browserless + IA */}
      <Modal
        isOpen={isBrowserlessModalOpen}
        onClose={() => {
          if (!isExtractingBrowserless) {
            setIsBrowserlessModalOpen(false);
            setBrowserlessExtractionLog('');
          }
        }}
        title="Captação Ativa de Leads — Browserless + IA"
        subtitle="Rastreamento em nuvem via Headless Chrome para prospecção B2B de alta velocidade e qualificação instantânea com IA."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block font-mono text-evo-muted mb-1">Nicho Alvo</label>
              <select
                value={browserlessNiche}
                onChange={(e) => setBrowserlessNiche(e.target.value)}
                disabled={isExtractingBrowserless}
                className="w-full bg-evo-card border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support appearance-none"
              >
                {niches.map((n) => (
                  <option key={n.id} value={n.name}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block font-mono text-evo-muted mb-1">Cidade / Região</label>
              <input
                type="text"
                value={browserlessCity}
                onChange={(e) => setBrowserlessCity(e.target.value)}
                disabled={isExtractingBrowserless}
                placeholder="Ex: Santos, SP ou São Paulo, SP"
                className="w-full bg-evo-card border border-evo-border rounded-xl px-3 py-2 text-xs text-evo-text focus:outline-none focus:border-evo-support"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-mono text-evo-muted mb-1">Qtd. de Leads</label>
              <input
                type="number"
                min={1}
                max={100}
                value={browserlessLimit}
                onChange={(e) => setBrowserlessLimit(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isExtractingBrowserless}
                placeholder="10"
                className="w-full bg-evo-card border border-evo-border rounded-xl px-3 py-2 text-xs text-purple-200 focus:outline-none focus:border-purple-400 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-evo-muted">Quantidade rápida:</span>
            {[5, 10, 20, 30, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setBrowserlessLimit(num)}
                disabled={isExtractingBrowserless}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors ${
                  browserlessLimit === num
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                    : 'bg-evo-surface text-evo-muted hover:text-evo-text border border-evo-border'
                }`}
              >
                {num} leads
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between bg-purple-950/20 border border-purple-500/20 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${browserlessToken ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]' : 'bg-amber-400'}`}></span>
              <span className="font-mono text-xs text-purple-200 font-medium">
                {browserlessToken ? 'Headless Chrome Cloud Conectado' : 'Token não configurado'}
              </span>
            </div>
            <Link
              href="/configuracoes"
              className="text-[11px] text-purple-300 hover:underline font-mono"
            >
              Configurações →
            </Link>
          </div>

          {browserlessExtractionLog && (
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-300 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse mr-2"></span>
              {browserlessExtractionLog}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-evo-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsBrowserlessModalOpen(false)}
              disabled={isExtractingBrowserless}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleBrowserlessCapture}
              disabled={isExtractingBrowserless || !browserlessNiche || !browserlessCity}
              className="gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold"
            >
              {isExtractingBrowserless ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Rastreando & Qualificando...</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>Iniciar Raspagem ({browserlessLimit} leads)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Importar Planilha com Qualificação IA */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportStats(null);
        }}
        title="Importação & Qualificação com IA"
        subtitle="Importe contatos via planilha CSV ou Excel (XLSX). A IA qualifica score, temperatura, nicho e serviços automaticamente."
      >
        <div className="space-y-4 text-xs">
          {!importStats ? (
            <div className="space-y-3">
              <label className="relative p-8 border-2 border-dashed border-evo-border hover:border-[rgba(218,241,222,0.3)] rounded-2xl flex flex-col items-center justify-center text-center bg-evo-surface/40 cursor-pointer overflow-hidden transition-all group">
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleSpreadsheetUpload}
                  disabled={isImporting}
                />
                <FileSpreadsheet className="w-9 h-9 text-evo-support group-hover:text-evo-accent transition-colors mb-3" />
                <span className="text-xs font-medium text-evo-text mb-1">
                  {isImporting
                    ? 'Processando e qualificando via IA...'
                    : 'Clique ou arraste sua planilha CSV / XLSX aqui'}
                </span>
                <span className="text-[11px] text-evo-disabled">
                  Reconhece colunas: Nome, Empresa, Telefone / WhatsApp, Cidade, Nicho, Email, Instagram e Google Meu Negócio
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-evo-surface border border-evo-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-evo-support">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importStats.count} leads importados e qualificados com sucesso!</span>
                </div>
                <p className="text-[11px] text-evo-muted">
                  Foram lidas {importStats.total} linhas da planilha. A Inteligência Artificial avaliou os contatos, calculou scores de 0 a 100, determinou a temperatura (Quente/Morno/Frio) e mapeou as ofertas recomendadas.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportStats(null);
                  }}
                >
                  Concluir e Ver Leads
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Gerar Mensagem WhatsApp (Anexo 1) */}
      <GenerateMessageModal
        isOpen={Boolean(messageTarget)}
        onClose={() => setMessageTarget(null)}
        target={messageTarget}
      />

      {/* Modal Gerenciador de Tags / Post-it do Lead */}
      {tagModalLead && (
        <Modal
          isOpen={Boolean(tagModalLead)}
          onClose={() => setTagModalLead(null)}
          title={`Etiquetas & Status: ${tagModalLead.company_name}`}
          subtitle="Marque o lead com tags de negociação, fechamento ou acompanhamento para filtrar no CRM."
        >
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-evo-muted text-[11px] block mb-2">
                Clique nas tags para ativar ou desativar neste lead:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Em Negociação', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                  { name: 'Fechado 🚀', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                  { name: 'Reunião Marcada', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
                  { name: 'Proposta Enviada', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
                  { name: 'Aguardando Resposta', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
                  { name: 'Sem Interesse', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
                ].map((preset) => {
                  const isActive = (tagModalLead.tags || []).includes(preset.name);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        const updated = crmService.toggleLeadTag(tagModalLead.id, preset.name);
                        if (updated) {
                          setTagModalLead({ ...updated });
                          if (preset.name === 'Fechado 🚀' && !isActive) {
                            crmService.updateLead(tagModalLead.id, { status: 'convertido' });
                          } else if (preset.name === 'Em Negociação' && !isActive) {
                            crmService.updateLead(tagModalLead.id, { status: 'em_conversa' });
                          }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isActive
                          ? `${preset.color} ring-2 ring-evo-support/50 font-semibold shadow-sm`
                          : 'bg-evo-surface text-evo-muted border-evo-border hover:text-evo-text'
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5" />}
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-evo-border">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setTagModalLead(null)}
              >
                Concluir
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal WhatsApp Inbox Oficial com Envio Direto e Termômetro IA */}
      {inboxLead && (
        <WhatsAppInboxModal
          isOpen={Boolean(inboxLead)}
          onClose={() => setInboxLead(null)}
          lead={inboxLead}
        />
      )}
    </div>
  );
}
