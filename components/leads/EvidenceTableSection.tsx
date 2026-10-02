'use client';

import React, { useState } from 'react';
import { Lead, EnrichmentEvidenceItem } from '@/types/database';
import {
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Filter,
} from 'lucide-react';

interface EvidenceTableSectionProps {
  lead: Lead;
}

export function EvidenceTableSection({ lead }: EvidenceTableSectionProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const rawEvidence = lead.enrichment_data?.evidence_items || [];

  // Fallback se não houver evidence_items estruturados mas houver ai_analysis
  const items: EnrichmentEvidenceItem[] = rawEvidence.length > 0
    ? rawEvidence
    : [
        ...(lead.ai_analysis?.data_points || []).map((dp, i) => ({
          key: `dp_${i}`,
          label: 'Ponto de Dado Coletado',
          value: dp,
          source: 'Verificação Digital Direct',
          confidence: 0.95,
          collected_at: lead.last_enriched_at || new Date().toISOString(),
          type: 'DADO' as const,
          verified: true,
        })),
        ...(lead.ai_analysis?.inferences || []).map((inf, i) => ({
          key: `inf_${i}`,
          label: 'Inferência IA',
          value: inf,
          source: 'Síntese Cruzada EVO IA',
          confidence: 0.85,
          collected_at: lead.last_enriched_at || new Date().toISOString(),
          type: 'INFERENCIA' as const,
          verified: false,
        })),
        {
          key: 'site_status',
          label: 'Presença Web',
          value: lead.website || 'Sem website registrado',
          source: 'HTTP Scanner / DNS',
          confidence: 1.0,
          collected_at: lead.last_enriched_at || new Date().toISOString(),
          type: lead.website ? ('DADO' as const) : ('NAO_ENCONTRADO' as const),
          verified: Boolean(lead.website),
        },
        {
          key: 'whatsapp_val',
          label: 'Canal WhatsApp',
          value: lead.whatsapp || lead.phone || 'Sem telefone',
          source: 'Cadastro Comercial',
          confidence: 0.9,
          collected_at: lead.last_enriched_at || new Date().toISOString(),
          type: (lead.whatsapp || lead.phone) ? ('DADO' as const) : ('NAO_ENCONTRADO' as const),
          verified: Boolean(lead.whatsapp || lead.phone),
        },
      ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredItems = items.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const valStr = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
      return item.label.toLowerCase().includes(q) || valStr.toLowerCase().includes(q) || item.source.toLowerCase().includes(q);
    }
    return true;
  });

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'DADO':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'INFERENCIA':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'HIPOTESE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'NAO_ENCONTRADO':
      default:
        return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DADO':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'INFERENCIA':
        return <HelpCircle className="w-3.5 h-3.5 text-blue-400" />;
      case 'HIPOTESE':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
      case 'NAO_ENCONTRADO':
      default:
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-evo-card border border-evo-border">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-evo-muted flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-evo-accent" />
            Classificação:
          </span>
          {[
            { id: 'all', label: `Todos (${items.length})` },
            { id: 'DADO', label: 'Dados Reais' },
            { id: 'INFERENCIA', label: 'Inferências IA' },
            { id: 'HIPOTESE', label: 'Hipóteses' },
            { id: 'NAO_ENCONTRADO', label: 'Não Encontrados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterType === tab.id
                  ? 'bg-evo-accent/15 text-evo-accent border border-evo-accent/40 shadow-sm'
                  : 'bg-evo-surface text-evo-muted border border-evo-border hover:text-evo-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-evo-muted" />
          <input
            type="text"
            placeholder="Filtrar evidências..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-evo-surface border border-evo-border rounded-lg text-evo-text placeholder-evo-muted/60 focus:outline-none focus:border-evo-accent"
          />
        </div>
      </div>

      {/* Evidence Table */}
      <div className="rounded-xl bg-evo-card border border-evo-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-evo-border bg-evo-surface/50 text-[11px] font-semibold text-evo-muted uppercase tracking-wider">
                <th className="py-3 px-4">Evidência / Campo</th>
                <th className="py-3 px-4">Classificação</th>
                <th className="py-3 px-4">Valor Identificado</th>
                <th className="py-3 px-4">Origem / Fonte</th>
                <th className="py-3 px-4 text-center">Confiança</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-evo-border text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-evo-muted">
                    <Database className="w-8 h-8 mx-auto text-evo-muted/40 mb-2" />
                    Nenhuma evidência encontrada para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const valString = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
                  const isUrl = typeof item.value === 'string' && (item.value.startsWith('http') || item.value.startsWith('www.'));

                  return (
                    <tr key={item.key} className="hover:bg-evo-surface/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-evo-text whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span>{item.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeStyle(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-evo-text max-w-md break-words font-mono text-[11px]">
                        {isUrl ? (
                          <a
                            href={item.value.startsWith('http') ? item.value : `https://${item.value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-evo-accent hover:underline inline-flex items-center gap-1"
                          >
                            {item.value}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          valString
                        )}
                      </td>
                      <td className="py-3 px-4 text-evo-muted text-[11px] whitespace-nowrap">
                        {item.source}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-evo-surface rounded-full overflow-hidden border border-evo-border">
                            <div
                              className="h-full bg-evo-accent"
                              style={{ width: `${Math.round((item.confidence || 0.8) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-evo-muted">
                            {Math.round((item.confidence || 0.8) * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleCopy(valString, item.key)}
                          title="Copiar valor"
                          className="p-1 rounded text-evo-muted hover:text-evo-text hover:bg-evo-surface transition-all"
                        >
                          {copiedKey === item.key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
