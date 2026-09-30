'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  Building2,
  FileText,
  Layers,
  Sparkles,
  X,
  Zap,
  HelpCircle,
  ArrowRight,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { crmService } from '@/lib/services/crm-service';
import { assistantTools } from '@/lib/services/assistant-tools';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'BUSCA' | 'AÇÃO';

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeMode, setActiveMode] = useState<Mode>('BUSCA');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Detecção de ação direta conforme digitação
  useEffect(() => {
    const text = query.toLowerCase().trim();
    if (!text) {
      setActiveMode('BUSCA');
      return;
    }

    if (
      text.includes('pagou') ||
      text.includes('pagamento') ||
      text.startsWith('crie') ||
      text.startsWith('criar') ||
      text.startsWith('exclua') ||
      text.includes('tarefa')
    ) {
      setActiveMode('AÇÃO');
    } else {
      setActiveMode('BUSCA');
    }
  }, [query]);

  if (!isOpen) return null;

  const leads = crmService.getLeads();
  const clients = crmService.getClients();
  const prospects = crmService.getProspects();
  const opportunities = crmService.getOpportunities();
  const services = crmService.getServices();

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.company_name.toLowerCase().includes(query.toLowerCase()) ||
      l.segment.toLowerCase().includes(query.toLowerCase())
  );

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.company_name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProspects = prospects.filter(
    (p) =>
      p.empresa.toLowerCase().includes(query.toLowerCase()) ||
      p.nome.toLowerCase().includes(query.toLowerCase()) ||
      p.segment.toLowerCase().includes(query.toLowerCase())
  );

  const filteredOpportunities = opportunities.filter(
    (o) =>
      o.company_name.toLowerCase().includes(query.toLowerCase()) ||
      o.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase())
  );

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleExecuteActionInline = async () => {
    const parsed = assistantTools.parseIntent(query);
    const result = await assistantTools.executeTool(
      parsed.toolName,
      parsed.params,
      'palette-session',
      query
    );
    setActionSuccess(result.message);
    setTimeout(() => {
      setActionSuccess(null);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-evo-black/85 backdrop-blur-[4px] transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-evo-card border border-evo-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Toast de Ação Executada */}
        {actionSuccess && (
          <div className="p-3 bg-evo-surface2 border-b border-evo-support/30 text-xs text-evo-text flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-evo-accent" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Barra de Modos: BUSCA, AÇÃO */}
        <div className="flex items-center justify-between px-4 py-2 bg-evo-black/80 border-b border-evo-border text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-evo-disabled">MODO:</span>
            <button
              onClick={() => setActiveMode('BUSCA')}
              className={`px-2.5 py-0.5 rounded-md transition-colors ${
                activeMode === 'BUSCA'
                  ? 'bg-evo-surface text-evo-support border border-evo-border'
                  : 'text-evo-disabled hover:text-evo-muted'
              }`}
            >
              BUSCA
            </button>
            <button
              onClick={() => setActiveMode('AÇÃO')}
              className={`px-2.5 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                activeMode === 'AÇÃO'
                  ? 'bg-evo-surface2 text-evo-accent border border-evo-support/30'
                  : 'text-evo-disabled hover:text-evo-muted'
              }`}
            >
              <Zap className="w-2.5 h-2.5" />
              <span>AÇÃO</span>
            </button>
          </div>

          <span className="text-evo-disabled hidden sm:inline">Pressione ESC para fechar</span>
        </div>

        {/* Campo de Busca / Comando */}
        <div className="flex items-center px-4 py-3.5 border-b border-evo-border bg-evo-deep/70">
          {activeMode === 'AÇÃO' ? (
            <Zap className="w-4 h-4 text-evo-accent shrink-0 mr-3" />
          ) : (
            <Search className="w-4 h-4 text-evo-support shrink-0 mr-3" />
          )}

          <input
            type="text"
            placeholder={
              activeMode === 'AÇÃO'
                ? 'Digite a ação... Ex: "João pagou 2 mil", "Crie uma tarefa para amanhã"'
                : 'Buscar por lead, cliente, prospect, serviço, proposta...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (activeMode === 'AÇÃO') handleExecuteActionInline();
              }
            }}
            autoFocus
            className="w-full bg-transparent text-evo-text placeholder-[#65706A] text-sm focus:outline-none font-sans"
          />
          <button
            onClick={onClose}
            className="text-evo-disabled hover:text-evo-text p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Resultados conforme o Modo */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">

          {/* MODO AÇÃO */}
          {activeMode === 'AÇÃO' && (
            <div className="p-4 rounded-xl bg-evo-deep border border-evo-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-heading text-xs font-semibold text-evo-accent flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Comando de Ação Identificado
                </span>
                <span className="text-[10px] font-mono text-evo-support">Permissão WRITE</span>
              </div>
              <p className="text-xs text-evo-muted leading-relaxed">
                Comando: &quot;{query}&quot;. A ação será validada pela camada de inteligência e registrada em <code className="text-evo-support">ai_action_logs</code>.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleExecuteActionInline}
                  className="px-3 py-1.5 rounded-lg bg-evo-surface2 hover:bg-[#235347] border border-evo-support/30 text-xs font-heading text-evo-accent flex items-center gap-1.5 transition-colors"
                >
                  <span>Executar Ação Agora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* MODO BUSCA TRADICIONAL */}
          {activeMode === 'BUSCA' && (
            <>
              {/* Prospects */}
              {filteredProspects.length > 0 && (
                <div>
                  <div className="text-[10px] font-heading font-semibold text-evo-disabled uppercase px-2 mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-evo-accent" />
                    Prospects ({filteredProspects.length})
                  </div>
                  <div className="space-y-1">
                    {filteredProspects.map((prospect) => (
                      <div
                        key={prospect.id}
                        onClick={() => navigateTo('/prospects')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-evo-surface cursor-pointer transition-colors border border-transparent hover:border-evo-border"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-evo-text font-heading">
                            {prospect.empresa}
                          </span>
                          <span className="text-[11px] text-evo-muted">
                            {prospect.nome} • {prospect.cidade}/{prospect.estado}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-evo-surface text-evo-accent border border-evo-border font-mono">
                          ICP {prospect.icp_score}/100
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leads */}
              {filteredLeads.length > 0 && (
                <div>
                  <div className="text-[10px] font-heading font-semibold text-evo-disabled uppercase px-2 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-evo-support" />
                    Leads ({filteredLeads.length})
                  </div>
                  <div className="space-y-1">
                    {filteredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => navigateTo(`/leads/${lead.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-evo-surface cursor-pointer transition-colors border border-transparent hover:border-evo-border"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-evo-text font-heading">
                            {lead.company_name}
                          </span>
                          <span className="text-[11px] text-evo-muted">
                            {lead.name} • Nicho: {lead.segment}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-evo-surface text-evo-support border border-evo-border">
                          Score {lead.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clientes */}
              {filteredClients.length > 0 && (
                <div>
                  <div className="text-[10px] font-heading font-semibold text-evo-disabled uppercase px-2 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-evo-support" />
                    Clientes ({filteredClients.length})
                  </div>
                  <div className="space-y-1">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => navigateTo(`/clientes/${client.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-evo-surface cursor-pointer transition-colors border border-transparent hover:border-evo-border"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-evo-text font-heading">
                            {client.company_name}
                          </span>
                          <span className="text-[11px] text-evo-muted">{client.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-evo-accent">
                          LTV R$ {client.lifetime_value.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Oportunidades */}
              {filteredOpportunities.length > 0 && (
                <div>
                  <div className="text-[10px] font-heading font-semibold text-evo-disabled uppercase px-2 mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-evo-support" />
                    Oportunidades ({filteredOpportunities.length})
                  </div>
                  <div className="space-y-1">
                    {filteredOpportunities.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => navigateTo('/pipeline')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-evo-surface cursor-pointer transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-evo-text">
                            {opp.company_name} — {opp.title}
                          </span>
                          <span className="text-[11px] text-evo-muted">
                            Estágio: {opp.stage_slug.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-evo-accent">
                          R$ {opp.estimated_value.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Serviços */}
              {filteredServices.length > 0 && (
                <div>
                  <div className="text-[10px] font-heading font-semibold text-evo-disabled uppercase px-2 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-evo-support" />
                    Catálogo de Serviços
                  </div>
                  <div className="space-y-1">
                    {filteredServices.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => navigateTo('/servicos')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-evo-surface cursor-pointer transition-colors"
                      >
                        <span className="text-xs text-evo-text">{service.name}</span>
                        <span className="text-[11px] font-mono text-evo-support">
                          R$ {service.base_price.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredLeads.length === 0 &&
                filteredClients.length === 0 &&
                filteredProspects.length === 0 &&
                filteredProposals.length === 0 &&
                filteredServices.length === 0 && (
                  <div className="p-8 text-center text-xs text-evo-disabled">
                    Nenhum resultado encontrado para &quot;{query}&quot;. Tente uma pergunta (&quot;Como está nossa conversão?&quot;) ou ação (&quot;João pagou 2 mil&quot;).
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
