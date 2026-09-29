'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { openWhatsApp, cleanPhoneNumber } from '@/lib/utils/whatsapp';
import { formatPhoneNumber } from '@/lib/utils';
import { GenerateMessageModal, TargetEntity } from '@/components/modals/GenerateMessageModal';
import { qualifyLeadWithAI } from '@/lib/ai/qualification';

export default function LeadsPage() {
  useCrmSync();
  const leads = crmService.getLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemperature, setSelectedTemperature] = useState<string>('todos');
  const [selectedNiche, setSelectedNiche] = useState<string>('todos');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<{ total: number; count: number } | null>(null);

  // Multi-selection states
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Modal de Mensagem WhatsApp
  const [messageTarget, setMessageTarget] = useState<TargetEntity | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSegment, setNewSegment] = useState('Contabilidade');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newCity, setNewCity] = useState('');

  const niches = crmService.getNiches();

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
    });

    crmService.addLead(qualified);

    setNewName('');
    setNewCompany('');
    setNewWhatsapp('');
    setNewCity('');
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

  const handleDirectWhatsApp = (whatsapp?: string, companyName?: string) => {
    if (!whatsapp || !cleanPhoneNumber(whatsapp)) {
      alert(`O lead "${companyName}" não possui número de WhatsApp válido cadastrado.`);
      return;
    }
    openWhatsApp(whatsapp);
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
      lead.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTemp =
      selectedTemperature === 'todos' || lead.temperature === selectedTemperature;

    const matchesNiche =
      selectedNiche === 'todos' || lead.segment === selectedNiche;

    return matchesSearch && matchesTemp && matchesNiche;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(218,241,222,0.06)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8EB69B] uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            Base de Contatos & Qualificação
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[#E7ECE8] font-heading">
            Leads Comerciais
          </h1>
          <p className="text-xs text-[#9BA6A0] mt-1">
            Acompanhe o score, chame diretamente no WhatsApp e gere abordagens personalizadas com 1 clique.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedLeadIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Selecionados ({selectedLeadIds.length})</span>
            </Button>
          )}

          <Link href="/prospeccao">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8EB69B]" />
              <span>Prospecção IA</span>
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setImportStats(null);
              setIsImportModalOpen(true);
            }}
          >
            <Upload className="w-3.5 h-3.5 text-[#8EB69B]" />
            <span>Importar Planilha</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsNewLeadModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 text-[#07100F]" />
            <span>Adicionar Lead</span>
          </Button>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#8EB69B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por empresa, contato ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0C1A19] border border-[rgba(218,241,222,0.08)] text-xs text-[#E7ECE8] placeholder-[#65706A] focus:outline-none focus:border-[#8EB69B]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedTemperature}
            onChange={(e) => setSelectedTemperature(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0C1A19] border border-[rgba(218,241,222,0.08)] text-xs text-[#E7ECE8] focus:outline-none focus:border-[#8EB69B] appearance-none cursor-pointer"
          >
            <option value="todos">Todas as Temperaturas</option>
            <option value="quente">🔥 Quente</option>
            <option value="morno">● Morno</option>
            <option value="frio">○ Frio</option>
            <option value="desqualificado">− Não qualificado</option>
          </select>

          <select
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0C1A19] border border-[rgba(218,241,222,0.08)] text-xs text-[#E7ECE8] focus:outline-none focus:border-[#8EB69B] appearance-none cursor-pointer max-w-[200px]"
          >
            <option value="todos">Todos os Nichos</option>
            {niches.map((n) => (
              <option key={n.id} value={n.name}>
                {n.name}
              </option>
            ))}
            <option value="Marmorarias / Marmoristas">Marmorarias / Marmoristas</option>
            <option value="Geral">Outro / Geral</option>
          </select>
        </div>
      </div>

      {/* Tabela de Leads */}
      <div className="bg-[#0C1A19] border border-[rgba(218,241,222,0.08)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[rgba(218,241,222,0.06)] bg-[#07100F] text-[11px] font-mono text-[#65706A] uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-[#9BA6A0] hover:text-[#E7ECE8] transition-colors"
                    title={selectedLeadIds.length === filteredLeads.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  >
                    {selectedLeadIds.length > 0 && selectedLeadIds.length === filteredLeads.length ? (
                      <CheckSquare className="w-4 h-4 text-[#8EB69B]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#65706A]" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Lead / Empresa</th>
                <th className="py-3 px-4">Segmento</th>
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

                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-[#10201E]/40 transition-colors group ${
                      isSelected ? 'bg-[#10201E]/70' : ''
                    }`}
                  >
                    {/* Checkbox de Seleção */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleSelectLead(lead.id)}
                        className="text-[#9BA6A0] hover:text-[#E7ECE8] transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#8EB69B]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#65706A]" />
                        )}
                      </button>
                    </td>

                    {/* Nome & Empresa */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-[#E7ECE8] group-hover:text-[#F1F9A1] transition-colors flex items-center gap-1.5"
                      >
                        <span>{lead.company_name}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <div className="text-[11px] text-[#9BA6A0] mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{lead.name}</span>
                        <span>•</span>
                        <span>{lead.city}/{lead.state}</span>
                        {lead.whatsapp && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[#8EB69B]">{lead.whatsapp}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Segmento / Nicho */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#8EB69B]">
                        {lead.segment}
                      </span>
                      {lead.sequence_progress && (
                        <div className="text-[10px] text-[#65706A] truncate max-w-[140px]">
                          Seq: {lead.sequence_progress.status}
                        </div>
                      )}
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
                            ? 'text-[#F1F9A1] bg-[#F1F9A1]/10'
                            : lead.score >= 60
                            ? 'text-[#8EB69B] bg-[#8EB69B]/10'
                            : 'text-[#9BA6A0] bg-[#10201E]'
                        }`}
                      >
                        {lead.score}
                      </span>
                    </td>

                    {/* Serviços Identificados */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {lead.services.map((srv, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-[#10201E] text-[#9BA6A0] border border-[rgba(218,241,222,0.06)] truncate max-w-[160px]"
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Próxima Ação */}
                    <td className="py-3.5 px-4 text-[11px] text-[#9BA6A0] max-w-xs">
                      <div className="truncate">{lead.next_action || 'Nenhuma ação pendente'}</div>
                    </td>

                    {/* Ações: WhatsApp, Gerar Mensagem, Olho/Perfil & Excluir */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Chamar no WhatsApp */}
                        <button
                          onClick={() => handleDirectWhatsApp(lead.whatsapp, lead.company_name)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-heading font-medium flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          title={`Chamar ${lead.company_name} no WhatsApp`}
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden xl:inline">WhatsApp</span>
                        </button>

                        {/* Botão Gerar Mensagem (Anexo 1) */}
                        <button
                          onClick={() => handleOpenMessageModal(lead)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#10201E] hover:bg-[#163832] border border-[rgba(218,241,222,0.12)] text-[#8EB69B] hover:text-[#F1F9A1] text-xs font-heading font-medium flex items-center gap-1 transition-all active:scale-95"
                          title="Gerar Mensagem para WhatsApp"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#F1F9A1]" />
                          <span className="hidden xl:inline">Mensagem</span>
                        </button>

                        {/* Botão Olho: Ver Ficha do Lead */}
                        <Link href={`/leads/${lead.id}`} title="Abrir Perfil do Lead">
                          <button className="p-1.5 rounded-xl bg-[#10201E] hover:bg-[#163832] border border-[rgba(218,241,222,0.12)] text-[#8EB69B] hover:text-[#F1F9A1] transition-all flex items-center justify-center active:scale-95">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        {/* Botão Excluir */}
                        <button
                          onClick={(e) => handleDeleteLead(lead.id, e)}
                          className="p-1.5 rounded-xl text-[#65706A] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remover lead"
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
          <div className="p-8 text-center text-xs text-[#9BA6A0]">
            Nenhum lead localizado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Modal Adicionar Lead */}
      <Modal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        title="Cadastrar Novo Lead"
        subtitle="Preencha os dados do lead para classificação e vinculação à sequência de nicho."
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#9BA6A0] mb-1 font-medium">Nome do Contato *</label>
            <input
              type="text"
              required
              placeholder="Ex: Dr. Roberto Silva"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#07100F] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] placeholder-[#65706A] focus:outline-none focus:border-[#8EB69B]"
            />
          </div>

          <div>
            <label className="block text-[#9BA6A0] mb-1 font-medium">Empresa / Razão Social *</label>
            <input
              type="text"
              required
              placeholder="Ex: Silva Odontologia Integrada"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#07100F] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] placeholder-[#65706A] focus:outline-none focus:border-[#8EB69B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9BA6A0] mb-1 font-medium">Segmento / Nicho</label>
              <select
                value={newSegment}
                onChange={(e) => setNewSegment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#07100F] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] focus:outline-none focus:border-[#8EB69B] appearance-none"
              >
                {niches.map((n) => (
                  <option key={n.id} value={n.name}>
                    {n.name}
                  </option>
                ))}
                <option value="Marmorarias / Marmoristas">Marmorarias / Marmoristas</option>
                <option value="Geral">Outro / Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-[#9BA6A0] mb-1 font-medium">Cidade</label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#07100F] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] placeholder-[#65706A] focus:outline-none focus:border-[#8EB69B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#9BA6A0] mb-1 font-medium">WhatsApp / Telefone</label>
            <input
              type="text"
              placeholder="(11) 99999-9999"
              value={newWhatsapp}
              onChange={(e) => setNewWhatsapp(formatPhoneNumber(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#07100F] border border-[rgba(218,241,222,0.08)] text-[#E7ECE8] placeholder-[#65706A] focus:outline-none focus:border-[#8EB69B] font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(218,241,222,0.06)]">
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
              <label className="relative p-8 border-2 border-dashed border-[rgba(218,241,222,0.12)] hover:border-[rgba(218,241,222,0.3)] rounded-2xl flex flex-col items-center justify-center text-center bg-[#10201E]/40 cursor-pointer overflow-hidden transition-all group">
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleSpreadsheetUpload}
                  disabled={isImporting}
                />
                <FileSpreadsheet className="w-9 h-9 text-[#8EB69B] group-hover:text-[#F1F9A1] transition-colors mb-3" />
                <span className="text-xs font-medium text-[#E7ECE8] mb-1">
                  {isImporting ? 'Processando e qualificando via IA...' : 'Clique ou arraste sua planilha CSV / XLSX aqui'}
                </span>
                <span className="text-[11px] text-[#65706A]">
                  Reconhece colunas: Nome, Empresa, Telefone / WhatsApp, Cidade, Nicho e Email
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
              <div className="p-4 rounded-xl bg-[#10201E] border border-[rgba(218,241,222,0.08)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8EB69B]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importStats.count} leads importados e qualificados com sucesso!</span>
                </div>
                <p className="text-[11px] text-[#9BA6A0]">
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
    </div>
  );
}
