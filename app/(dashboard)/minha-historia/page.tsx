'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { crmService } from '@/lib/services/crm-service';
import { useCrmSync } from '@/lib/hooks/useCrmSync';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  History,
  TrendingUp,
  Award,
  Calendar,
  Layers,
  Building2,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

export default function MinhaHistoriaPage() {
  useCrmSync();
  // Using state for data and historicalProjects to trigger re-renders
  const [data, setData] = useState(() => crmService.getMinhaHistoriaData());
  const [historicalProjects, setHistoricalProjects] = useState(() => crmService.getHistoricalProjects());
  const [metricMode, setMetricMode] = useState<'recebido' | 'contratado' | 'pendente'>('recebido');
  const [periodFilter, setPeriodFilter] = useState<'ano' | 'mes'>('ano');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hCompany, setHCompany] = useState('');
  const [hClient, setHClient] = useState('');
  const [hSegment, setHSegment] = useState('');
  const [hServices, setHServices] = useState<string[]>([]);
  const [hDate, setHDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hContracted, setHContracted] = useState('');
  const [hReceived, setHReceived] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const handleAddHistorical = () => {
    if (!hCompany || !hContracted || !hReceived) {
      alert('Preencha a Empresa, Valor Contratado e Recebido.');
      return;
    }

    const payload = {
      company_name: hCompany,
      client_name: hClient || 'N/A',
      segment: hSegment || 'Geral',
      services_summary: hServices.length > 0 ? hServices.join(', ') : 'Serviços Gerais',
      project_date: hDate,
      amount_contracted: Number(hContracted),
      amount_received: Number(hReceived),
      amount_pending: Number(hContracted) - Number(hReceived),
      status: (Number(hContracted) <= Number(hReceived) ? 'liquidado' : 'pendente') as any
    };

    if (editId) {
      crmService.updateHistoricalProject(editId, payload);
    } else {
      crmService.addHistoricalProject(payload);
    }

    setHistoricalProjects([...crmService.getHistoricalProjects()]);
    setData(crmService.getMinhaHistoriaData());
    closeModal();
  };

  const handleEdit = (hp: any) => {
    setEditId(hp.id);
    setHCompany(hp.company_name);
    setHClient(hp.client_name);
    setHSegment(hp.segment || '');
    setHServices(hp.services_summary ? hp.services_summary.split(', ') : []);
    setHDate(hp.project_date);
    setHContracted(String(hp.amount_contracted));
    setHReceived(String(hp.amount_received));
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      crmService.deleteHistoricalProject(id);
      setHistoricalProjects([...crmService.getHistoricalProjects()]);
      setData(crmService.getMinhaHistoriaData());
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setHCompany('');
    setHClient('');
    setHSegment('');
    setHServices([]);
    setHContracted('');
    setHReceived('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Topo Editorial: Desde o Início */}
      <div className="relative p-8 md:p-10 rounded-3xl bg-evo-card border border-evo-border overflow-hidden shadow-2xl">
        {/* Glow sutil de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,_rgba(241,249,161,0.04),transparent_70%)] pointer-events-none" />

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-evo-support uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-evo-accent" />
            Desde o Início da EVO PIXEL
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-evo-text font-heading tracking-tight">
              Meu Histórico
            </h1>
            <Button variant="primary" size="sm" className="gap-1.5 z-20 relative hidden sm:flex" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 text-[#07100F]" />
              <span>Adicionar Histórico</span>
            </Button>
          </div>
          <div className="sm:hidden mt-2 z-20 relative">
            <Button variant="primary" size="sm" className="gap-1.5 w-full" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 text-[#07100F]" />
              <span>Adicionar Histórico</span>
            </Button>
          </div>

          <div className="pt-2">
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold font-heading text-evo-accent tracking-tight">
              R$ {data.faturamentoAcumulado.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-evo-support mt-2 font-mono">
              Faturamento acumulado baseado em todos os projetos registrados na trajetória.
            </p>
          </div>
        </div>

        {/* Resumo de Contratado vs Pendente Histórico */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-evo-border relative z-10 text-xs">
          <div>
            <span className="text-evo-muted">Total Contratado</span>
            <div className="text-lg font-semibold text-evo-text font-heading mt-0.5">
              R$ {data.contratadoAcumulado.toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            <span className="text-evo-muted">Total Liquidado</span>
            <div className="text-lg font-semibold text-evo-support font-heading mt-0.5">
              R$ {data.faturamentoAcumulado.toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            <span className="text-evo-muted">Pendente Atual</span>
            <div className="text-lg font-semibold text-evo-accent font-heading mt-0.5">
              R$ {data.pendenteAcumulado.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid de Marcos & Conquistas (Seção 31) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl bg-evo-card border border-evo-border">
          <span className="text-[10px] text-evo-muted uppercase font-mono">Projetos</span>
          <div className="text-xl font-semibold text-evo-text font-heading mt-1">
            {data.projetosRealizados}
          </div>
          <span className="text-[10px] text-evo-support">concluídos</span>
        </div>

        <div className="p-4 rounded-2xl bg-evo-card border border-evo-border">
          <span className="text-[10px] text-evo-muted uppercase font-mono">Clientes</span>
          <div className="text-xl font-semibold text-evo-text font-heading mt-1">
            {data.clientesAtendidos}
          </div>
          <span className="text-[10px] text-evo-support">atendidos</span>
        </div>

        <div className="p-4 rounded-2xl bg-evo-card border border-evo-border">
          <span className="text-[10px] text-evo-muted uppercase font-mono">Ticket Médio</span>
          <div className="text-xl font-semibold text-evo-accent font-heading mt-1">
            R$ {data.ticketMedio.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-evo-support">+18% recente</span>
        </div>

        <div className="p-4 rounded-2xl bg-evo-card border border-evo-border">
          <span className="text-[10px] text-evo-muted uppercase font-mono">Melhor Ano</span>
          <div className="text-sm font-semibold text-evo-text font-heading mt-1 truncate">
            {data.melhorAno}
          </div>
          <span className="text-[10px] text-evo-support">recorde anual</span>
        </div>

        <div className="p-4 rounded-2xl bg-evo-card border border-evo-border">
          <span className="text-[10px] text-evo-muted uppercase font-mono">Melhor Mês</span>
          <div className="text-sm font-semibold text-evo-text font-heading mt-1 truncate">
            {data.melhorMes}
          </div>
          <span className="text-[10px] text-evo-support">faturamento pico</span>
        </div>

        <div className="p-4 rounded-2xl bg-evo-card border border-evo-border col-span-2 md:col-span-1">
          <span className="text-[10px] text-evo-muted uppercase font-mono">Serviço Top</span>
          <div className="text-xs font-semibold text-evo-text font-heading mt-1 truncate">
            {data.servicoMaisRentavel}
          </div>
          <span className="text-[10px] text-evo-support">maior volume</span>
        </div>

        <div className="p-4 rounded-2xl bg-evo-card border border-evo-border col-span-2 md:col-span-1">
          <span className="text-[10px] text-evo-muted uppercase font-mono">Cliente Top</span>
          <div className="text-xs font-semibold text-evo-accent font-heading mt-1 truncate">
            {data.clienteMaisValioso}
          </div>
          <span className="text-[10px] text-evo-support">maior LTV</span>
        </div>
      </div>

      {/* 3. Gráfico Grande: Evolução da EVO PIXEL (Seção 31) */}
      <Card className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-5">
          <div>
            <span className="text-[10px] font-mono text-evo-support uppercase tracking-wider">
              Análise Histórica Longitudinal
            </span>
            <h3 className="text-xl font-semibold text-evo-text font-heading mt-0.5">
              Evolução da EVO PIXEL ao Longo dos Anos
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Alternar Métrica */}
            <div className="inline-flex p-1 rounded-xl bg-evo-deep border border-evo-border text-xs">
              <button
                onClick={() => setMetricMode('recebido')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  metricMode === 'recebido'
                    ? 'bg-evo-surface text-evo-accent font-medium'
                    : 'text-evo-muted'
                }`}
              >
                Recebido
              </button>
              <button
                onClick={() => setMetricMode('contratado')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  metricMode === 'contratado'
                    ? 'bg-evo-surface text-evo-text font-medium'
                    : 'text-evo-muted'
                }`}
              >
                Contratado
              </button>
              <button
                onClick={() => setMetricMode('pendente')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  metricMode === 'pendente'
                    ? 'bg-evo-surface text-evo-support font-medium'
                    : 'text-evo-muted'
                }`}
              >
                Pendente
              </button>
            </div>
          </div>
        </div>

        {/* Visualizador de Barras Editoriais dos Anos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
          {data.yearlyEvolution.map((item) => {
            const val =
              metricMode === 'recebido'
                ? item.received
                : metricMode === 'contratado'
                ? item.contracted
                : item.pending;

            const heightPct = Math.max(20, Math.min(100, Math.round((val / 65000) * 100)));

            return (
              <div
                key={item.year}
                className="p-5 rounded-2xl bg-evo-surface/60 border border-evo-border flex flex-col justify-between h-64 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-evo-text font-heading">
                    {item.year}
                  </span>
                  <span className="text-[11px] font-mono text-evo-disabled">
                    {item.projects} projetos
                  </span>
                </div>

                <div className="flex-1 flex items-end justify-center py-2">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[60px] rounded-t-lg bg-gradient-to-t from-[#163832] to-[#8EB69B] hover:to-[#F1F9A1] transition-all relative group cursor-pointer"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-evo-black text-[10px] text-evo-text rounded border border-evo-border whitespace-nowrap pointer-events-none">
                      R$ {val.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2 border-t border-[rgba(218,241,222,0.04)]">
                  <span className="text-xs font-mono font-semibold text-evo-accent">
                    R$ {val.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 4. Projetos Históricos Realizados (Seção 29 & 30) */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-evo-border pb-4">
          <div>
            <h3 className="text-base font-medium text-evo-text font-heading">
              Registro de Projetos Históricos Cadastrados
            </h3>
            <p className="text-xs text-evo-muted mt-0.5">
              Projetos realizados antes ou durante o EVO PIXEL que compõem o faturamento acumulado oficial.
            </p>
          </div>
          <Link href="/financeiro">
            <Button variant="secondary" size="sm" className="text-xs">
              Ver Financeiro Completo
            </Button>
          </Link>
        </div>

        {historicalProjects.length === 0 ? (
          <div className="py-12 text-center text-xs text-evo-muted bg-evo-surface/30 rounded-xl border border-[rgba(218,241,222,0.04)]">
            Nenhum projeto histórico cadastrado no momento. Conforme seus projetos forem concluídos, eles comporão este registro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-evo-border text-[11px] font-mono text-evo-disabled uppercase">
                  <th className="py-2.5 px-3">Cliente / Empresa</th>
                  <th className="py-2.5 px-3">Serviços Executados</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Contratado</th>
                  <th className="py-2.5 px-3">Recebido</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(218,241,222,0.04)]">
                {historicalProjects.map((hp) => (
                  <tr key={hp.id} className="hover:bg-evo-surface/40">
                    <td className="py-3 px-3 font-medium text-evo-text">
                      {hp.company_name}
                      <div className="text-[11px] text-evo-muted">{hp.client_name}</div>
                    </td>
                    <td className="py-3 px-3 text-evo-muted">{hp.services_summary}</td>
                    <td className="py-3 px-3 font-mono text-evo-disabled">
                      {new Date(hp.project_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-mono text-evo-text">
                      R$ {hp.amount_contracted.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-mono text-evo-support">
                      R$ {hp.amount_received.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-evo-surface2 text-evo-support font-mono">
                        {hp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(hp)} className="text-evo-support hover:text-evo-text">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(hp.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editId ? "Editar Registro Histórico" : "Novo Registro Histórico"}
        subtitle="Cadastre ou edite um cliente para compor seu faturamento acumulado."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Empresa Contratante *</label>
              <input
                type="text"
                value={hCompany}
                onChange={(e) => setHCompany(e.target.value)}
                placeholder="Ex: Clínica Alpha"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Nome do Cliente</label>
              <input
                type="text"
                value={hClient}
                onChange={(e) => setHClient(e.target.value)}
                placeholder="Ex: Dr. Roberto"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Nicho / Segmento</label>
            <select
              value={hSegment}
              onChange={(e) => setHSegment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
            >
              <option value="">Selecione um nicho...</option>
              {crmService.getNiches().map((n) => (
                <option key={n.id} value={n.name}>{n.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Serviços Realizados (Segure CTRL para vários)</label>
            <select
              multiple
              value={hServices}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setHServices(selected);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs min-h-[100px]"
            >
              {crmService.getServices().map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Data (Mês/Ano) *</label>
              <input
                type="date"
                value={hDate}
                onChange={(e) => setHDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Contratado (R$) *</label>
              <input
                type="number"
                value={hContracted}
                onChange={(e) => setHContracted(e.target.value)}
                placeholder="Ex: 5000"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Recebido (R$) *</label>
              <input
                type="number"
                value={hReceived}
                onChange={(e) => setHReceived(e.target.value)}
                placeholder="Ex: 5000"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--evo-border)] flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={closeModal}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddHistorical}>
              {editId ? 'Salvar Alterações' : 'Adicionar ao Histórico'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
