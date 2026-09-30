'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { crmService } from '@/lib/services/crm-service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/ui/MetricCard';
import { Modal } from '@/components/ui/Modal';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  ArrowUpRight,
  Download,
} from 'lucide-react';

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState(() => crmService.getFinancialTransactions());
  const summary = crmService.getFinancialSummary();

  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fClient, setFClient] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fDueDate, setFDueDate] = useState('');

  const handleAddTx = () => {
    if (!fTitle || !fAmount || !fClient) {
      alert('Preencha o Título, o Cliente e o Valor.');
      return;
    }
    crmService.addFinancialTransaction({
      title: fTitle,
      client_name: fClient,
      category: fCategory || 'Geral',
      amount_contracted: Number(fAmount),
      amount_received: 0,
      amount_pending: Number(fAmount),
      due_date: fDueDate || new Date().toISOString().split('T')[0],
      status: 'pendente'
    });
    setTransactions([...crmService.getFinancialTransactions()]);
    setIsModalOpen(false);
    setFTitle('');
    setFClient('');
    setFCategory('');
    setFAmount('');
    setFDueDate('');
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterStatus === 'todos') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-evo-support uppercase tracking-wider mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            Gestão Financeira • Separação Rigorosa
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-evo-text font-heading">
            Financeiro & Faturamento
          </h1>
          <p className="text-xs text-evo-muted mt-1">
            Diferenciação clara entre valor contratado, valor efetivamente recebido e parcelas a liquidar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/minha-historia">
            <Button variant="secondary" size="sm">
              <span>Meu Histórico</span>
            </Button>
          </Link>
          <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 text-[#07100F]" />
            <span>Novo Lançamento</span>
          </Button>
        </div>
      </div>

      {/* Grid Principal de 3 Métricas: Contratado vs Recebido vs Pendente (Seção 32) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Contratado */}
        <div className="p-6 rounded-2xl bg-evo-card border border-evo-border">
          <span className="text-xs font-mono uppercase tracking-wider text-evo-muted">
            Valor Contratado
          </span>
          <div className="text-3xl font-semibold font-heading text-evo-text mt-2 tracking-tight">
            R$ {summary.contratado.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-evo-muted mt-1">
            Soma dos contratos e propostas aprovadas vigentes.
          </p>
        </div>

        {/* Recebido (Destaque Positivo) */}
        <div className="p-6 rounded-2xl bg-evo-card border border-[rgba(142,182,155,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-evo-support">
              Valor Recebido
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-evo-support/10 text-evo-support font-mono">
              Liquidado
            </span>
          </div>
          <div className="text-3xl font-semibold font-heading text-evo-support mt-2 tracking-tight">
            R$ {summary.recebido.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-evo-muted mt-1">
            Recursos em caixa provenientes de pagamentos confirmados.
          </p>
        </div>

        {/* Pendente (Atenção / Cobrança) */}
        <div className="p-6 rounded-2xl bg-evo-card border border-[rgba(241,249,161,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-evo-accent">
              Valor Pendente
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-evo-accent/10 text-evo-accent font-mono">
              A Receber
            </span>
          </div>
          <div className="text-3xl font-semibold font-heading text-evo-accent mt-2 tracking-tight">
            R$ {summary.pendente.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-evo-muted mt-1">
            Parcelas a vencer e faturamentos com vencimento no mês.
          </p>
        </div>
      </div>

      {/* Tabela de Transações & Lançamentos */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-evo-border pb-4">
          <div>
            <h3 className="text-base font-medium text-evo-text font-heading">
              Lançamentos & Contas
            </h3>
            <p className="text-xs text-evo-muted mt-0.5">
              Histórico detalhado por cliente, vencimento e status de liquidação.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-evo-surface border border-evo-border text-evo-text focus:outline-none"
            >
              <option value="todos">Todos os Status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="parcialmente_pago">Parcialmente Pago</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-evo-surface border border-evo-border flex items-center justify-center text-evo-support mx-auto mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-evo-text font-heading">
              Nenhum lançamento financeiro
            </h4>
            <p className="text-xs text-evo-muted max-w-sm mx-auto mt-1 mb-5">
              Suas movimentações e parcelas financeiras aparecerão aqui quando registradas.
            </p>
            <Button variant="primary" size="sm" className="gap-1.5 text-xs mx-auto">
              <Plus className="w-3.5 h-3.5 text-[#07100F]" />
              <span>Adicionar Primeiro Lançamento</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-evo-border text-[11px] font-mono text-evo-disabled uppercase">
                  <th className="py-3 px-3">Título / Cliente</th>
                  <th className="py-3 px-3">Categoria</th>
                  <th className="py-3 px-3">Vencimento</th>
                  <th className="py-3 px-3">Contratado</th>
                  <th className="py-3 px-3">Recebido</th>
                  <th className="py-3 px-3">Pendente</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(218,241,222,0.04)]">
                {filteredTransactions.map((item) => (
                  <tr key={item.id} className="hover:bg-evo-surface/40 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-medium text-evo-text">{item.title}</span>
                      <div className="text-[11px] text-evo-muted">{item.client_name}</div>
                    </td>
                    <td className="py-3 px-3 text-evo-muted">{item.category}</td>
                    <td className="py-3 px-3 font-mono text-evo-disabled">
                      {new Date(item.due_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-mono text-evo-text">
                      R$ {item.amount_contracted.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-mono text-evo-support">
                      R$ {item.amount_received.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-mono text-evo-accent">
                      R$ {item.amount_pending.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono ${
                          item.status === 'pago'
                            ? 'bg-evo-support/10 text-evo-support border border-evo-support/20'
                            : item.status === 'pendente'
                            ? 'bg-evo-accent/10 text-evo-accent border border-evo-accent/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
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
        onClose={() => setIsModalOpen(false)}
        title="Novo Lançamento Financeiro"
        subtitle="Adicione uma nova receita ou parcela a receber no sistema."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Título do Lançamento *</label>
            <input
              type="text"
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
              placeholder="Ex: Parcela 1/3 - Desenvolvimento Web"
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Nome do Cliente / Empresa *</label>
            <input
              type="text"
              value={fClient}
              onChange={(e) => setFClient(e.target.value)}
              placeholder="Ex: Clínica Vida"
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Valor Contratado (R$) *</label>
              <input
                type="number"
                value={fAmount}
                onChange={(e) => setFAmount(e.target.value)}
                placeholder="Ex: 1500"
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Data de Vencimento</label>
              <input
                type="date"
                value={fDueDate}
                onChange={(e) => setFDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--evo-muted)] mb-1">Categoria</label>
            <input
              type="text"
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value)}
              placeholder="Ex: Desenvolvimento Web"
              className="w-full px-3 py-2 rounded-xl bg-[var(--evo-surface)] border border-[var(--evo-border)] text-[var(--evo-text)] focus:outline-none focus:border-evo-support text-xs"
            />
          </div>
          <div className="pt-4 border-t border-[var(--evo-border)] flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddTx}>
              Registrar Lançamento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
