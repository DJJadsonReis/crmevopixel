'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { crmService } from '@/lib/services/crm-service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  FileCheck,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export default function ContratosPage() {
  const [contracts, setContracts] = useState(() => crmService.getContracts());
  const [selectedContract, setSelectedContract] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cCompany, setCCompany] = useState('');
  const [cClient, setCClient] = useState('');
  const [cServices, setCServices] = useState('');
  const [cAmount, setCAmount] = useState('');
  const [cDate, setCDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleAddContract = () => {
    if (!cCompany || !cAmount) {
      alert('Preencha a Empresa e o Valor Total.');
      return;
    }
    crmService.addContract({
      code: `CONT-2026-${String(contracts.length + 1).padStart(3, '0')}`,
      company_name: cCompany,
      client_name: cClient || cCompany,
      services_summary: cServices || 'Prestação de Serviços Web',
      total_amount: Number(cAmount),
      status: 'aguardando_assinatura',
      start_date: cDate,
      signature_provider: 'Clicksign'
    });
    setContracts([...crmService.getContracts()]);
    setIsModalOpen(false);
    setCCompany('');
    setCClient('');
    setCServices('');
    setCAmount('');
    setCDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-evo-support uppercase tracking-wider mb-1">
            <FileCheck className="w-3.5 h-3.5" />
            Formalização & Assinatura Digital
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-evo-text font-heading">
            Gestão de Contratos
          </h1>
          <p className="text-xs text-evo-muted mt-1">
            Contratos gerados automaticamente a partir de propostas aceitas. Preparado para Clicksign / DocuSign.
          </p>
        </div>

        <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 text-[#07100F]" />
          <span>Novo Contrato</span>
        </Button>
      </div>

      {/* Grid de Contratos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="p-6 rounded-2xl bg-evo-card border border-evo-border hover:border-evo-border-hover transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-evo-support">{contract.code}</span>
                  <h3 className="text-base font-semibold text-evo-text font-heading mt-0.5">
                    {contract.company_name}
                  </h3>
                  <span className="text-xs text-evo-muted">{contract.client_name}</span>
                </div>

                <Badge
                  variant={contract.status === 'assinado' ? 'success' : 'accent'}
                  className="text-[10px]"
                >
                  {contract.status === 'assinado' ? 'Assinado' : 'Aguardando Assinatura'}
                </Badge>
              </div>

              <p className="text-xs text-evo-muted mt-3 leading-relaxed">
                Escopo: <strong className="text-evo-text">{contract.services_summary}</strong>
              </p>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-evo-border text-xs">
                <div>
                  <span className="text-evo-disabled text-[11px]">Valor Total</span>
                  <div className="text-sm font-mono font-semibold text-evo-accent mt-0.5">
                    R$ {contract.total_amount.toLocaleString('pt-BR')}
                  </div>
                </div>
                <div>
                  <span className="text-evo-disabled text-[11px]">Provedor de Assinatura</span>
                  <div className="text-xs font-mono text-evo-support mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{contract.signature_provider || 'Eletrônica'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-evo-border flex items-center justify-between text-xs">
              <span className="text-[10px] text-evo-disabled">
                Início: {new Date(contract.start_date).toLocaleDateString('pt-BR')}
              </span>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-7 text-xs px-2.5"
                onClick={() => setSelectedContract(contract)}
              >
                Ver Documento
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Visualizador do Contrato */}
      <Modal
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        title={`Contrato: ${selectedContract?.code || ''}`}
        subtitle={`Minuta de prestação de serviços para ${selectedContract?.company_name || ''}`}
        maxWidth="lg"
      >
        {selectedContract && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white text-[#0A0A0A] rounded-xl border border-gray-200 font-sans space-y-3 leading-relaxed shadow-sm">
              <div className="flex justify-between items-start border-b pb-2 border-gray-200">
                <div>
                  <h4 className="font-bold text-sm text-black">INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS</h4>
                  <span className="text-[10px] text-gray-500 font-mono">Código: {selectedContract.code}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-800 border">
                  Provedor: {selectedContract.signature_provider || 'Clicksign'}
                </span>
              </div>

              <p>
                <strong>CONTRATADA:</strong> EVO PIXEL TECNOLOGIA E PERFORMANCE EIRELI.
              </p>
              <p>
                <strong>CONTRATANTE:</strong> {selectedContract.company_name}, representada por {selectedContract.client_name || selectedContract.company_name}.
              </p>
              <p>
                <strong>OBJETO DO CONTRATO:</strong> {selectedContract.services_summary}.
              </p>
              <p>
                <strong>VALOR TOTAL DO INSTRUMENTO:</strong> R$ {Number(selectedContract.total_amount || 0).toLocaleString('pt-BR')}.
              </p>
              <p className="text-[11px] text-gray-600">
                As partes elegem os canais digitais e assinatura via {selectedContract.signature_provider || 'Clicksign'} para formalização com validade jurídica conforme MP 2.200-2/2001.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-evo-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedContract(null)}
              >
                Fechar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.print();
                }}
              >
                Imprimir / PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gerar Novo Contrato"
        subtitle="Preencha os dados básicos para gerar a minuta do contrato"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Empresa Contratante *</label>
            <input
              type="text"
              value={cCompany}
              onChange={(e) => setCCompany(e.target.value)}
              placeholder="Ex: Clínica Vida"
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Nome do Cliente Responsável</label>
            <input
              type="text"
              value={cClient}
              onChange={(e) => setCClient(e.target.value)}
              placeholder="Ex: Dr. João Silva"
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Resumo dos Serviços (Escopo)</label>
            <textarea
              value={cServices}
              onChange={(e) => setCServices(e.target.value)}
              placeholder="Ex: Site Institucional + Automação de Agendamentos WhatsApp"
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Valor Total (R$) *</label>
              <input
                type="number"
                value={cAmount}
                onChange={(e) => setCAmount(e.target.value)}
                placeholder="Ex: 5000"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Data de Início</label>
              <input
                type="date"
                value={cDate}
                onChange={(e) => setCDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--evo-border)] flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddContract}>
              Gerar Contrato
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
