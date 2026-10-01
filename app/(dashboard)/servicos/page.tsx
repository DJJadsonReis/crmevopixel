'use client';

import React, { useState } from 'react';
import { crmService } from '@/lib/services/crm-service';
import { useCrmSync } from '@/lib/hooks/useCrmSync';
import { Service, ServiceCategory } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Layers,
  Plus,
  Clock,
  DollarSign,
  Globe,
  Bot,
  Search,
  CheckCircle2,
  ListChecks,
  Sparkles,
  FileText,
  Trash2,
  Check,
  Tag,
  Info,
} from 'lucide-react';

export default function ServicosPage() {
  useCrmSync();
  const [services, setServices] = useState<Service[]>(() => crmService.getServices());
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<ServiceCategory>('WEBSITES');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDays, setNewServiceDays] = useState('');
  const [newIdealFor, setNewIdealFor] = useState('');

  // Entregáveis & Checklist detalhados
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [newDeliverableInput, setNewDeliverableInput] = useState('');

  const [checklist, setChecklist] = useState<string[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');

  const categories: ('todos' | ServiceCategory)[] = [
    'todos',
    'WEBSITES',
    'AUTOMAÇÃO',
    'PRESENÇA DIGITAL',
  ];

  const suggestedDeliverables = [
    'Design Figma Hi-Fi Exclusivo',
    'Copywriting Persuasivo Orientado a Conversão',
    'Otimização SEO Local & Schema.org',
    'Atendente IA Integrado ao WhatsApp 24/7',
    'Deploy em Infraestrutura Cloudflare Pages & SSL',
    'Dashboard de Métricas & Captação',
    'Funil de Conversão & Disparo Rápido',
    'Integração Completa ao CRM EVO',
  ];

  const suggestedChecklist = [
    'Briefing e levantamento de necessidades',
    'Aprovação de protótipo de alta fidelidade',
    'Desenvolvimento front-end e integrações',
    'Homologação de testes em mobile e desktop',
    'Go-live e treinamento da equipe',
  ];

  const handleOpenEdit = (service: Service) => {
    setEditingServiceId(service.id);
    setNewServiceName(service.name);
    setNewServiceCategory(service.category);
    setNewServiceDesc(service.description);
    setNewServicePrice(service.base_price.toString());
    setNewServiceDays(service.delivery_time_days?.toString() || '');
    setNewIdealFor(service.ideal_for || '');
    setDeliverables(service.deliverables || [
      'Arquitetura Editorial de Alta Conversão',
      'Responsividade Mobile-first',
      'Configuração de DNS e Domínio Próprio',
    ]);
    setChecklist(service.checklist || [
      'Aprovação de escopo',
      'Validação de copy',
      'Deploy em produção',
    ]);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingServiceId(null);
    setNewServiceName('');
    setNewServiceCategory('WEBSITES');
    setNewServiceDesc('');
    setNewServicePrice('');
    setNewServiceDays('10');
    setNewIdealFor('');
    setDeliverables([
      'Design Figma Hi-Fi Exclusivo',
      'Copywriting Persuasivo',
      'SEO & Google Topo',
      'Integração WhatsApp Direta',
    ]);
    setChecklist([
      'Briefing inicial',
      'Criação de layout',
      'Desenvolvimento & Testes',
      'Entrega e homologação',
    ]);
    setIsModalOpen(true);
  };

  const handleAddDeliverable = (itemToAdd?: string) => {
    const text = (itemToAdd || newDeliverableInput).trim();
    if (!text) return;
    if (!deliverables.includes(text)) {
      setDeliverables([...deliverables, text]);
    }
    setNewDeliverableInput('');
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleAddChecklist = (itemToAdd?: string) => {
    const text = (itemToAdd || newChecklistInput).trim();
    if (!text) return;
    if (!checklist.includes(text)) {
      setChecklist([...checklist, text]);
    }
    setNewChecklistInput('');
  };

  const handleRemoveChecklist = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleDeleteService = () => {
    if (editingServiceId && confirm('Tem certeza que deseja excluir este serviço?')) {
      crmService.deleteService(editingServiceId);
      setServices([...crmService.getServices()]);
      setIsModalOpen(false);
    }
  };

  const handleSaveService = () => {
    if (!newServiceName || !newServicePrice) {
      alert('Preencha o nome e o preço do serviço.');
      return;
    }

    const serviceData: Partial<Service> = {
      name: newServiceName,
      category: newServiceCategory,
      description: newServiceDesc || 'Solução tecnológica comercial estruturada pela EVO PIXEL.',
      base_price: Number(newServicePrice),
      delivery_time_days: Number(newServiceDays) || 7,
      ideal_for: newIdealFor || undefined,
      deliverables: deliverables.length > 0 ? deliverables : ['Entrega completa e documentada'],
      checklist: checklist.length > 0 ? checklist : ['Homologação técnica'],
      status: 'ativo',
    };

    if (editingServiceId) {
      crmService.updateService(editingServiceId, serviceData);
    } else {
      crmService.addService(serviceData as any);
    }

    setServices([...crmService.getServices()]);
    setIsModalOpen(false);
  };

  const filteredServices = services.filter((s) => {
    if (selectedCategory === 'todos') return true;
    return s.category === selectedCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-evo-support uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5 text-evo-accent" />
            Catálogo & Escopos Detalhados para Propostas
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-evo-text font-heading">
            Portfólio de Serviços EVO
          </h1>
          <p className="text-xs text-evo-muted mt-1">
            Soluções estruturadas com entregáveis claros, escopo itemizado e checklist para propostas comerciais de alto padrão.
          </p>
        </div>

        <Button variant="primary" size="sm" className="gap-1.5 text-xs" onClick={handleOpenCreate}>
          <Plus className="w-3.5 h-3.5 text-[#07100F]" />
          <span>Cadastrar Novo Serviço</span>
        </Button>
      </div>

      {/* Filtro por Categorias */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading transition-all ${
              selectedCategory === cat
                ? 'bg-evo-surface text-evo-text border border-evo-border font-medium'
                : 'text-evo-muted hover:text-evo-text'
            }`}
          >
            {cat === 'todos' ? 'Todos os Serviços' : cat}
          </button>
        ))}
      </div>

      {/* Grid de Serviços com Entregáveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const itemDeliverables = service.deliverables || [];

          return (
            <div
              key={service.id}
              className="p-6 rounded-2xl bg-evo-card border border-evo-border hover:border-evo-border-hover transition-all flex flex-col justify-between space-y-4 group shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-evo-support uppercase tracking-wider">
                    {service.category}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-evo-surface text-evo-support font-mono border border-evo-border">
                    {service.delivery_time_days} dias
                  </span>
                </div>

                <h3 className="text-base font-semibold text-evo-text font-heading group-hover:text-evo-accent transition-colors">
                  {service.name}
                </h3>

                <p className="text-xs text-evo-muted leading-relaxed line-clamp-2">
                  {service.description}
                </p>

                {/* Box de Entregáveis Estruturados */}
                <div className="pt-2 border-t border-evo-border/60 space-y-1.5">
                  <div className="text-[10px] font-mono text-evo-support uppercase tracking-wider flex items-center gap-1">
                    <ListChecks className="w-3 h-3 text-evo-accent" />
                    <span>Entregáveis do Escopo ({itemDeliverables.length}):</span>
                  </div>

                  <div className="space-y-1">
                    {itemDeliverables.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="text-[11px] text-evo-muted flex items-start gap-1.5 truncate">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                    {itemDeliverables.length > 3 && (
                      <div className="text-[10px] font-mono text-evo-disabled pl-4">
                        +{itemDeliverables.length - 3} itens inclusos na proposta
                      </div>
                    )}
                  </div>
                </div>

                {service.ideal_for && (
                  <div className="text-[10px] font-mono text-evo-disabled bg-evo-surface/60 p-2 rounded-lg border border-[rgba(218,241,222,0.04)]">
                    🎯 Indicado para: <span className="text-evo-text">{service.ideal_for}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-evo-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-evo-disabled block">Investimento Base</span>
                  <div className="text-lg font-bold font-mono text-evo-accent">
                    R$ {service.base_price.toLocaleString('pt-BR')}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs h-8 px-3"
                  onClick={() => handleOpenEdit(service)}
                >
                  Editar Escopo
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Avançado: Detalhamento Completo do Serviço, Entregáveis & Checklist */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingServiceId ? 'Editar Detalhes do Serviço' : 'Cadastrar Serviço com Escopo Completo'}
        subtitle="Configure os entregáveis que serão puxados automaticamente ao gerar propostas comerciais."
      >
        <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Nome do Serviço *</label>
              <input
                type="text"
                required
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Ex: Site Institucional de Autoridade"
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-evo-accent"
              />
            </div>
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Categoria</label>
              <select
                value={newServiceCategory}
                onChange={(e) => setNewServiceCategory(e.target.value as ServiceCategory)}
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none"
              >
                <option value="WEBSITES">Websites & LPs</option>
                <option value="AUTOMAÇÃO">Automação & Atendentes IA</option>
                <option value="PRESENÇA DIGITAL">Presença Digital & SEO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-evo-muted mb-1 font-medium">Descrição Resumida</label>
            <textarea
              rows={2}
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              placeholder="Descreva a promessa e o objetivo principal do serviço..."
              className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-evo-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Preço Base (R$) *</label>
              <input
                type="number"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                placeholder="Ex: 3500"
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-evo-accent font-mono"
              />
            </div>
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Prazo Estimado (Dias)</label>
              <input
                type="number"
                value={newServiceDays}
                onChange={(e) => setNewServiceDays(e.target.value)}
                placeholder="Ex: 10"
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-evo-accent font-mono"
              />
            </div>
            <div>
              <label className="block text-evo-muted mb-1 font-medium">Perfil Ideal / Indicado</label>
              <input
                type="text"
                value={newIdealFor}
                onChange={(e) => setNewIdealFor(e.target.value)}
                placeholder="Ex: Advogados, Médicos"
                className="w-full px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-evo-accent"
              />
            </div>
          </div>

          {/* Entregáveis do Escopo (Essenciais para a Proposta Comercial) */}
          <div className="pt-3 border-t border-evo-border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-evo-text flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-evo-accent" />
                  Entregáveis Estruturados da Proposta Comercial
                </span>
                <span className="text-[11px] text-evo-muted block mt-0.5">
                  Cada item aqui será detalhado no escopo da proposta gerada para o cliente.
                </span>
              </div>
            </div>

            {/* Input para adicionar entregável */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDeliverableInput}
                onChange={(e) => setNewDeliverableInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDeliverable();
                  }
                }}
                placeholder="Digite um entregável (ex: Otimização SEO Local Google)"
                className="flex-1 px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-evo-accent"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddDeliverable()}
                className="text-xs"
              >
                Adicionar
              </Button>
            </div>

            {/* Sugestões Rápidas */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-evo-disabled">Sugestões rápidas (clique para incluir):</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedDeliverables.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAddDeliverable(sug)}
                    className="px-2 py-0.5 rounded text-[10px] bg-evo-surface2 hover:bg-evo-accent/20 text-evo-support hover:text-evo-accent border border-evo-border transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Entregáveis Cadastrados */}
            <div className="space-y-1.5 pt-1">
              {deliverables.map((del, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-evo-surface border border-evo-border flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-evo-text">{del}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(idx)}
                    className="text-evo-muted hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist de Execução Técnica */}
          <div className="pt-3 border-t border-evo-border space-y-2">
            <span className="font-semibold text-evo-text flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Checklist de Execução & Etapas
            </span>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistInput}
                onChange={(e) => setNewChecklistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                }}
                placeholder="Ex: Aprovação de wireframe"
                className="flex-1 px-3 py-2 rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none focus:border-evo-accent"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddChecklist()}
                className="text-xs"
              >
                Adicionar
              </Button>
            </div>

            <div className="space-y-1">
              {checklist.map((chk, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-evo-surface2/40 border border-evo-border flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="text-evo-support">
                    {idx + 1}. {chk}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(idx)}
                    className="text-evo-muted hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className={`flex ${editingServiceId ? 'justify-between' : 'justify-end'} gap-2 pt-4 border-t border-evo-border`}>
            {editingServiceId && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-400 hover:text-red-300 border-red-900/30 hover:bg-red-900/20 text-xs"
                onClick={handleDeleteService}
              >
                Excluir Serviço
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveService} className="text-xs">
                Salvar Escopo Completo
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
