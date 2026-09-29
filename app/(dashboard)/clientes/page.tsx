'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { crmService } from '@/lib/services/crm-service';
import { useCrmSync } from '@/lib/hooks/useCrmSync';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  Search,
  Plus,
  Sparkles,
  Phone,
  Pencil,
  Trash2,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { openWhatsApp, cleanPhoneNumber } from '@/lib/utils/whatsapp';
import { formatPhoneNumber } from '@/lib/utils';
import { GenerateMessageModal, TargetEntity } from '@/components/modals/GenerateMessageModal';

export default function ClientesPage() {
  useCrmSync();
  const clients = crmService.getClients();
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cName, setCName] = useState('');
  const [cCompany, setCCompany] = useState('');
  const [cSegment, setCSegment] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  // Modal de Geração de Mensagem para WhatsApp
  const [messageTarget, setMessageTarget] = useState<TargetEntity | null>(null);

  const handleAddClient = () => {
    if (!cCompany || !cName) {
      alert('Preencha ao menos o Nome e a Empresa.');
      return;
    }

    const payload = {
      name: cName,
      company_name: cCompany,
      segment: cSegment || 'Geral',
      projects_count: 0,
      lifetime_value: 0,
      total_pending: 0,
      total_contracted: 0,
      total_received: 0,
      status: 'ativo' as const,
      cross_sell_opportunities: [],
      phone: cPhone,
      email: cEmail,
    };

    if (editId) {
      const existingClient = clients.find((c) => c.id === editId);
      crmService.updateClient(editId, {
        ...payload,
        projects_count: existingClient?.projects_count || 0,
        lifetime_value: existingClient?.lifetime_value || 0,
        total_pending: existingClient?.total_pending || 0,
        total_contracted: existingClient?.total_contracted || 0,
        total_received: existingClient?.total_received || 0,
      });
    } else {
      crmService.addClient(payload);
    }

    closeModal();
  };

  const handleEdit = (client: any) => {
    setEditId(client.id);
    setCName(client.name);
    setCCompany(client.company_name);
    setCSegment(client.segment);
    setCEmail(client.email || '');
    setCPhone(client.phone || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      crmService.deleteClient(id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setCName('');
    setCCompany('');
    setCSegment('');
    setCEmail('');
    setCPhone('');
  };

  const handleDirectWhatsApp = (phone?: string, companyName?: string, clientObj?: any) => {
    if (!phone || !cleanPhoneNumber(phone)) {
      if (confirm(`O cliente "${companyName}" ainda não possui telefone/WhatsApp cadastrado. Deseja cadastrar agora?`)) {
        handleEdit(clientObj);
      }
      return;
    }
    openWhatsApp(phone);
  };

  const handleOpenMessageModal = (client: any) => {
    setMessageTarget({
      id: client.id,
      name: client.name,
      company_name: client.company_name,
      phone: client.phone,
      whatsapp: client.phone,
      segment: client.segment,
    });
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.segment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(218,241,222,0.06)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8EB69B] uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#F1F9A1]" />
            Gestão de Carteira & Clientes
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[#E7ECE8] font-heading">
            Clientes da EvoPixel
          </h1>
          <p className="text-xs text-[#9BA6A0] mt-1">
            Visão consolidada de Lifetime Value, projetos entregues, contato direto via WhatsApp e histórico.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#07100F]" />
            <span>Novo Cliente</span>
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-[#8EB69B] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por cliente, empresa ou segmento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#0C1A19] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] placeholder-[#65706A] focus:outline-none focus:border-[#8EB69B]"
        />
      </div>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="p-6 rounded-2xl bg-[#0C1A19] border border-[rgba(218,241,222,0.08)] hover:border-[rgba(218,241,222,0.18)] transition-all group flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono text-[#8EB69B] uppercase tracking-wider">
                  {client.segment}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#10201E] text-[#8EB69B] font-mono">
                  {client.projects_count} projetos
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-[#E7ECE8] font-heading group-hover:text-[#F1F9A1] transition-colors">
                    {client.company_name}
                  </h3>
                  <div className="text-xs text-[#9BA6A0] mt-0.5 flex items-center gap-1.5">
                    <span>{client.name}</span>
                    {client.phone && (
                      <span className="font-mono text-[11px] text-[#8EB69B]">
                        • {client.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-1.5 rounded-lg bg-[#10201E] text-[#8EB69B] hover:text-[#E7ECE8] transition-colors"
                    title="Editar cliente"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-1.5 rounded-lg bg-[#10201E] text-red-400 hover:text-red-300 transition-colors"
                    title="Excluir cliente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* LTV & Indicadores Financeiros */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[rgba(218,241,222,0.06)] text-xs">
                <div>
                  <span className="text-[#65706A] text-[11px]">Lifetime Value</span>
                  <div className="text-sm font-semibold font-mono text-[#F1F9A1] mt-0.5">
                    R$ {client.lifetime_value.toLocaleString('pt-BR')}
                  </div>
                </div>
                <div>
                  <span className="text-[#65706A] text-[11px]">Pendente</span>
                  <div className="text-sm font-semibold font-mono text-[#E7ECE8] mt-0.5">
                    R$ {client.total_pending.toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Oportunidades de Cross-sell */}
              {client.cross_sell_opportunities && client.cross_sell_opportunities.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[rgba(218,241,222,0.04)]">
                  <div className="text-[10px] font-mono text-[#8EB69B] uppercase mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#8EB69B]" />
                    Oportunidade de Expansão
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {client.cross_sell_opportunities.map((opp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#10201E] text-[#9BA6A0] border border-[rgba(218,241,222,0.06)]"
                      >
                        {opp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Card: Telefone, WhatsApp e Olho para Ficha */}
            <div className="pt-3 border-t border-[rgba(218,241,222,0.06)] flex items-center justify-between gap-2">
              <span className="text-[10px] text-[#65706A] truncate">
                {client.last_project_at ? `Último: ${client.last_project_at}` : 'Cliente Ativo'}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                {/* Botão Gerar Mensagem WhatsApp */}
                <button
                  onClick={() => handleOpenMessageModal(client)}
                  className="p-1.5 rounded-xl bg-[#10201E] hover:bg-[#163832] border border-[rgba(218,241,222,0.12)] text-[#8EB69B] hover:text-[#F1F9A1] transition-all flex items-center justify-center active:scale-95"
                  title="Gerar Mensagem para WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>

                {/* Botão WhatsApp Direto */}
                <button
                  onClick={() => handleDirectWhatsApp(client.phone, client.company_name, client)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-heading font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  title={client.phone ? `Chamar ${client.company_name} no WhatsApp` : 'Adicionar WhatsApp'}
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp</span>
                </button>

                {/* Botão Olho: Abre a Ficha do Cliente (Substitui "Ver 360°") */}
                <Link href={`/clientes/${client.id}`} title="Abrir Ficha do Cliente">
                  <button className="p-1.5 rounded-xl bg-[#10201E] hover:bg-[#163832] border border-[rgba(218,241,222,0.12)] text-[#8EB69B] hover:text-[#F1F9A1] transition-all flex items-center justify-center active:scale-95">
                    <Eye className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="p-12 text-center text-xs text-[#9BA6A0] bg-[#0C1A19] rounded-2xl border border-[rgba(218,241,222,0.06)]">
          Nenhum cliente encontrado com os critérios de busca.
        </div>
      )}

      {/* Modal Cadastrar / Editar Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
        subtitle={editId ? 'Altere os dados básicos do cliente' : 'Preencha os dados básicos do novo cliente'}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Nome do Cliente / Contato *</label>
            <input
              type="text"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Ex: Dra Dulce"
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-[#8EB69B] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Empresa / Razão Social *</label>
            <input
              type="text"
              value={cCompany}
              onChange={(e) => setCCompany(e.target.value)}
              placeholder="Ex: Dulce Guerra Advocacia"
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-[#8EB69B] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Segmento / Nicho</label>
            <select
              value={cSegment}
              onChange={(e) => setCSegment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-[#8EB69B] text-xs appearance-none"
            >
              <option value="" disabled>Selecione um Nicho</option>
              <option value="Geral">Geral</option>
              {crmService.getNiches().map((niche) => (
                <option key={niche.id} value={niche.name}>
                  {niche.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">E-mail</label>
              <input
                type="email"
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                placeholder="contato@empresa.com"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-[#8EB69B] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={cPhone}
                onChange={(e) => setCPhone(formatPhoneNumber(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-[#8EB69B] text-xs font-mono"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--evo-border)] flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={closeModal}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddClient}>
              {editId ? 'Salvar Alterações' : 'Salvar Cliente'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Gerar Mensagem WhatsApp (Anexo 1) */}
      <GenerateMessageModal
        isOpen={Boolean(messageTarget)}
        onClose={() => setMessageTarget(null)}
        target={messageTarget}
      />
    </div>
  );
}

