export const runtime = 'edge';
'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { crmService } from '@/lib/services/crm-service';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronLeft,
  Building2,
  Phone,
  Mail,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { openWhatsApp, cleanPhoneNumber } from '@/lib/utils/whatsapp';
import { GenerateMessageModal } from '@/components/modals/GenerateMessageModal';

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const client = crmService.getClientById(clientId);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  if (!client) {
    return (
      <div className="p-12 text-center text-xs text-evo-muted">
        Cliente não encontrado.{' '}
        <Link href="/clientes" className="text-evo-support underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const projects = crmService.getProjects().filter((p) => p.company_name === client.company_name);
  const historicalProjects = crmService.getHistoricalProjects().filter((p) => p.company_name === client.company_name);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-xs text-evo-muted hover:text-evo-text transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Voltar para Clientes</span>
      </Link>

      {/* Header do Cliente */}
      <div className="p-6 rounded-2xl bg-evo-card border border-evo-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-evo-support uppercase tracking-wider">
              {client.segment} • Cliente Ativo
            </span>
            <h1 className="text-2xl font-semibold text-evo-text font-heading mt-1">
              {client.company_name}
            </h1>
            <p className="text-xs text-evo-muted mt-0.5">
              Contato: {client.name} {client.email && `• ${client.email}`} {client.phone && `• ${client.phone}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chamar no WhatsApp */}
            <button
              onClick={() => {
                if (!client.phone || !cleanPhoneNumber(client.phone)) {
                  alert(`O cliente "${client.company_name}" não possui WhatsApp válido cadastrado.`);
                  return;
                }
                openWhatsApp(client.phone);
              }}
              className="p-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] transition-all active:scale-95 shadow-sm flex items-center justify-center"
              title="Abrir WhatsApp Web / App"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
            </button>

            {/* Gerar Mensagem */}
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-evo-surface hover:bg-evo-surface2 border border-evo-border text-evo-support hover:text-evo-accent text-xs font-heading font-medium flex items-center gap-1.5 transition-all active:scale-95"
              title="Gerar Mensagem para WhatsApp"
            >
              <Sparkles className="w-3.5 h-3.5 text-evo-accent" />
              <span>Gerar Mensagem</span>
            </button>

            <Link href="/pipeline">
              <Button variant="primary" size="sm" className="gap-1.5">
                <span>Ver no Pipeline</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#07100F]" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Métricas do Cliente */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-evo-border text-xs">
          <div>
            <span className="text-evo-muted">Lifetime Value (LTV)</span>
            <div className="text-xl font-semibold text-evo-accent font-mono mt-1">
              R$ {client.lifetime_value.toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            <span className="text-evo-muted">Total Recebido</span>
            <div className="text-xl font-semibold text-evo-support font-mono mt-1">
              R$ {client.total_received.toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            <span className="text-evo-muted">Pendente Atual</span>
            <div className="text-xl font-semibold text-evo-text font-mono mt-1">
              R$ {client.total_pending.toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            <span className="text-evo-muted">Projetos Realizados</span>
            <div className="text-xl font-semibold text-evo-text font-heading mt-1">
              {client.projects_count}
            </div>
          </div>
        </div>
      </div>

      {/* Projetos & Oportunidades de Expansão */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-6 space-y-4">
            <CardTitle>Projetos em Andamento & Entregas</CardTitle>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-4 rounded-xl bg-evo-surface border border-evo-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-evo-text font-heading">
                      {proj.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-evo-surface2 text-evo-support font-mono">
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-evo-muted">
                    Prazo: {proj.deadline} • Progresso: {proj.progress_percentage}%
                  </div>
                  {/* Barra de progresso */}
                  <div className="w-full bg-evo-deep h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-evo-support h-full rounded-full"
                      style={{ width: `${proj.progress_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {historicalProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-4 rounded-xl bg-evo-surface border border-evo-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-evo-text font-heading">
                      {proj.services_summary || 'Projeto Histórico'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-evo-surface2 text-evo-support font-mono">
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-evo-muted">
                    Data: {new Date(proj.project_date).toLocaleDateString('pt-BR')} • Recebido: R$ {proj.amount_received.toLocaleString('pt-BR')}
                  </div>
                  {/* Barra de progresso para histórico */}
                  <div className="w-full bg-evo-deep h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-evo-support h-full rounded-full"
                      style={{ width: `100%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-evo-accent">
              <Sparkles className="w-4 h-4" />
              <span>Oportunidades de Cross-sell</span>
            </div>
            <p className="text-xs text-evo-muted leading-relaxed">
              Baseado no histórico deste cliente, a IA recomenda a oferta dos seguintes serviços complementares:
            </p>
            <div className="space-y-2 pt-2">
              {client.cross_sell_opportunities?.map((opp, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-evo-surface border border-evo-border text-xs text-evo-text flex items-center justify-between"
                >
                  <span>{opp}</span>
                  <span className="text-[10px] text-evo-support font-mono">Alta sinergia</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Gerador de Mensagens */}
      <GenerateMessageModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        target={{
          id: client.id,
          name: client.name,
          company_name: client.company_name,
          phone: client.phone,
          whatsapp: client.phone,
          segment: client.segment,
        }}
      />
    </div>
  );
}
