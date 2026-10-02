'use client';

import React, { useState } from 'react';
import { EnrichmentEvidenceItem, Lead } from '@/types/database';
import { CheckCircle2, HelpCircle, Search, Filter, ShieldCheck, Sparkles } from 'lucide-react';

interface EvidenceTableSectionProps {
  lead: Lead;
}

export function EvidenceTableSection({ lead }: EvidenceTableSectionProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'DADO' | 'INFERENCIA' | 'HIPOTESE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const items: EnrichmentEvidenceItem[] = lead.enrichment_data?.evidence_items || [];

  const filtered = items.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.label.toLowerCase().includes(term) ||
        String(item.value).toLowerCase().includes(term) ||
        item.source.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DADO':
        return { label: 'DADO (Fato)', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'INFERENCIA':
        return { label: 'INFERÊNCIA', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
      case 'HIPOTESE':
        return { label: 'HIPÓTESE', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      default:
        return { label: type, color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-evo-card border border-evo-border text-xs text-evo-muted">
        Nenhuma evidência registrada para este lead ainda. Execute o Cruzamento de Dados para auditar a empresa.
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-4">
        <div>
          <h4 className="text-sm font-semibold text-evo-text font-heading">
            Tabela de Evidências Auditáveis ({items.length})
          </h4>
          <p className="text-xs text-evo-muted mt-0.5">
            Diferenciação rigorosa entre fatos brutos, deduções analíticas e hipóteses a validar na abordagem.
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-evo-surface border border-evo-border">
            {(['ALL', 'DADO', 'INFERENCIA', 'HIPOTESE'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterType === type
                    ? 'bg-evo-card text-evo-text shadow-sm border border-evo-border font-semibold'
                    : 'text-evo-muted hover:text-evo-text'
                }`}
              >
                {type === 'ALL' ? 'Todos' : type}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-evo-disabled" />
            <input
              type="text"
              placeholder="Buscar evidência..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-evo-surface border border-evo-border text-xs text-evo-text placeholder:text-evo-disabled focus:outline-none w-40 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Lista de Evidências */}
      <div className="divide-y divide-evo-border/60">
        {filtered.map((item, idx) => {
          const typeInfo = getTypeBadge(item.type);

          return (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <span className="font-semibold text-evo-text font-sans">
                    {item.label}
                  </span>
                </div>
                <div className="text-xs text-evo-muted truncate max-w-xl">
                  {typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-right sm:text-right">
                <div className="text-right">
                  <div className="text-[11px] font-mono text-evo-disabled">
                    Fonte: {item.source}
                  </div>
                  <div className="text-[10px] text-evo-support font-mono">
                    Confiança: {Math.round(item.confidence * 100)}%
                  </div>
                </div>

                <div className="w-6 flex items-center justify-center">
                  {item.verified ? (
                    <span title="Verificado">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </span>
                  ) : (
                    <span title="Hipótese a validar">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
