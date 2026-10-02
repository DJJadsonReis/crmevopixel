'use client';

import React, { useState } from 'react';
import {
  TechnicalAuditReport,
  PageSpeedReport,
  SiteHealthStatus,
  Lead,
} from '@/types/database';
import {
  Globe,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  RefreshCw,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Link2,
  HelpCircle,
  Activity,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SiteHealthSectionProps {
  lead: Lead;
  onReanalyzeSite?: () => void;
  onReanalyzePageSpeed?: () => void;
  isAnalyzing?: boolean;
}

export function SiteHealthSection({
  lead,
  onReanalyzeSite,
  onReanalyzePageSpeed,
  isAnalyzing,
}: SiteHealthSectionProps) {
  const [deviceStrategy, setDeviceStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [selectedIssueTab, setSelectedIssueTab] = useState<'all' | 'critical' | 'broken'>('all');

  const tech = lead.technical_audit;
  const ps = lead.pagespeed_report;
  const currentSnapshot = deviceStrategy === 'mobile' ? ps?.mobile : ps?.desktop;

  const getScoreColor = (score: number | null | undefined) => {
    if (score == null) return 'text-zinc-500 border-zinc-700 bg-zinc-800/40';
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getHealthBadge = (status?: SiteHealthStatus) => {
    switch (status) {
      case 'ONLINE_OK':
        return { label: 'Online & Saudável', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'ONLINE_WITH_ISSUES':
        return { label: 'Online com Alertas', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'MAINTENANCE_REQUIRED':
        return { label: 'Manutenção Necessária', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
      case 'CRITICAL':
        return { label: 'Crítico / Lentidão Alta', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
      case 'OFFLINE':
        return { label: 'Offline / Inacessível', color: 'bg-red-600/20 text-red-300 border-red-500/40' };
      case 'SSL_ERROR':
        return { label: 'Erro de SSL (Inseguro)', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
      case 'NO_WEBSITE':
        return { label: 'Sem Website Oficial', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
      default:
        return { label: 'Não Auditado', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  };

  const healthBadge = getHealthBadge(lead.site_health_status);

  if (!lead.website && !tech) {
    return (
      <div className="p-8 text-center rounded-2xl bg-evo-card border border-evo-border space-y-3">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
          <Globe className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-evo-text font-heading">
          Nenhum Website Cadastrado
        </h4>
        <p className="text-xs text-evo-muted max-w-md mx-auto">
          Este lead não possui um endereço web indexado. Essa é a oportunidade perfeita para ofertar a criação de um Site Institucional de Alta Performance com arquitetura de conversão.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de Status do Domínio & Ações Rápidas */}
      <div className="p-5 rounded-2xl bg-evo-card border border-evo-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-evo-surface border border-evo-border flex items-center justify-center text-evo-support shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={lead.website?.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-evo-text hover:text-evo-accent transition-colors flex items-center gap-1.5"
              >
                <span>{lead.website || 'Sem domínio'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-evo-muted" />
              </a>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${healthBadge.color}`}>
                {healthBadge.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-evo-muted mt-1 flex-wrap">
              <span>HTTP: {tech?.http_status ? `${tech.http_status} OK` : '—'}</span>
              <span>•</span>
              <span className={tech?.ssl_valid ? 'text-emerald-400 flex items-center gap-1' : 'text-rose-400 flex items-center gap-1'}>
                {tech?.ssl_valid ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                {tech?.ssl_valid ? 'SSL Válido (HTTPS)' : 'Sem SSL Seguro'}
              </span>
              <span>•</span>
              <span>Tempo de Resposta: {tech?.response_time_ms ? `${tech.response_time_ms}ms` : '—'}</span>
              {tech?.audited_at && (
                <>
                  <span>•</span>
                  <span className="text-[11px] text-evo-disabled">
                    Auditado em: {new Date(tech.audited_at).toLocaleString('pt-BR')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onReanalyzeSite}
            disabled={isAnalyzing}
            className="text-xs gap-1.5"
            title="Executa auditoria direta de HTTP, SSL, imagens quebradas e links"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Reanalisar Site</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onReanalyzePageSpeed}
            disabled={isAnalyzing}
            className="text-xs gap-1.5 text-evo-support hover:text-evo-accent"
            title="Executa nova consulta oficial ao Google PageSpeed Insights API v5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Atualizar PageSpeed</span>
          </Button>
        </div>
      </div>

      {/* Seção Google PageSpeed Insights API v5 */}
      <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-evo-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                Google PageSpeed Insights API v5
              </span>
              {ps?.cached && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Cache 24h
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-evo-text font-heading mt-1">
              Desempenho Lighthouse & Métricas Reais do Usuário
            </h3>
            <p className="text-xs text-evo-muted mt-0.5">
              Avaliação oficial do Google utilizada diretamente para ranqueamento na busca e conversão de tráfego móvel.
            </p>
          </div>

          {/* Toggle Mobile / Desktop */}
          <div className="flex items-center p-1 rounded-xl bg-evo-surface border border-evo-border shrink-0">
            <button
              onClick={() => setDeviceStrategy('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                deviceStrategy === 'mobile'
                  ? 'bg-evo-card text-evo-text shadow-sm border border-evo-border'
                  : 'text-evo-muted hover:text-evo-text'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Mobile (4G)</span>
            </button>
            <button
              onClick={() => setDeviceStrategy('desktop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                deviceStrategy === 'desktop'
                  ? 'bg-evo-card text-evo-text shadow-sm border border-evo-border'
                  : 'text-evo-muted hover:text-evo-text'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Desktop</span>
            </button>
          </div>
        </div>

        {/* 4 Pontuações Lighthouse */}
        {currentSnapshot?.scores ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Performance */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${getScoreColor(currentSnapshot.scores.performance)}`}>
              <div className="text-3xl font-extrabold font-mono tracking-tight">
                {currentSnapshot.scores.performance != null ? currentSnapshot.scores.performance : '—'}
              </div>
              <div className="text-xs font-semibold mt-1">Performance</div>
              <div className="text-[10px] opacity-80 font-mono mt-0.5">Velocidade & Carregamento</div>
            </div>

            {/* Acessibilidade */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${getScoreColor(currentSnapshot.scores.accessibility)}`}>
              <div className="text-3xl font-extrabold font-mono tracking-tight">
                {currentSnapshot.scores.accessibility != null ? currentSnapshot.scores.accessibility : '—'}
              </div>
              <div className="text-xs font-semibold mt-1">Acessibilidade</div>
              <div className="text-[10px] opacity-80 font-mono mt-0.5">Contraste & Leitura</div>
            </div>

            {/* Melhores Práticas */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${getScoreColor(currentSnapshot.scores.best_practices)}`}>
              <div className="text-3xl font-extrabold font-mono tracking-tight">
                {currentSnapshot.scores.best_practices != null ? currentSnapshot.scores.best_practices : '—'}
              </div>
              <div className="text-xs font-semibold mt-1">Boas Práticas</div>
              <div className="text-[10px] opacity-80 font-mono mt-0.5">Segurança & Padrões Web</div>
            </div>

            {/* SEO */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${getScoreColor(currentSnapshot.scores.seo)}`}>
              <div className="text-3xl font-extrabold font-mono tracking-tight">
                {currentSnapshot.scores.seo != null ? currentSnapshot.scores.seo : '—'}
              </div>
              <div className="text-xs font-semibold mt-1">SEO Estrutural</div>
              <div className="text-[10px] opacity-80 font-mono mt-0.5">Indexação no Google</div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl bg-evo-surface border border-evo-border text-xs text-evo-muted">
            Dados de PageSpeed ainda não calculados para este domínio. Clique em <strong>Atualizar PageSpeed</strong> acima para executar o teste do Google.
          </div>
        )}

        {/* Métricas de Laboratório (Lighthouse Lab Metrics) */}
        {currentSnapshot?.lab_metrics && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-evo-text uppercase tracking-wider font-mono">
                Métricas de Laboratório (Simulação Controlada Google)
              </span>
              <span className="text-[11px] text-evo-muted">Dispositivo: {deviceStrategy.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-evo-surface border border-evo-border">
                <div className="text-[10px] text-evo-muted font-mono">FCP (1ª Pintura)</div>
                <div className="text-sm font-bold font-mono text-evo-text mt-1">
                  {currentSnapshot.lab_metrics.fcp_ms ? `${(currentSnapshot.lab_metrics.fcp_ms / 1000).toFixed(1)}s` : '—'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-evo-surface border border-evo-border">
                <div className="text-[10px] text-evo-muted font-mono">LCP (Conteúdo Principal)</div>
                <div className="text-sm font-bold font-mono text-evo-text mt-1">
                  {currentSnapshot.lab_metrics.lcp_ms ? `${(currentSnapshot.lab_metrics.lcp_ms / 1000).toFixed(1)}s` : '—'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-evo-surface border border-evo-border">
                <div className="text-[10px] text-evo-muted font-mono">TBT (Bloqueio Total)</div>
                <div className="text-sm font-bold font-mono text-evo-text mt-1">
                  {currentSnapshot.lab_metrics.tbt_ms ? `${currentSnapshot.lab_metrics.tbt_ms}ms` : '0ms'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-evo-surface border border-evo-border">
                <div className="text-[10px] text-evo-muted font-mono">CLS (Mudança de Layout)</div>
                <div className="text-sm font-bold font-mono text-evo-text mt-1">
                  {currentSnapshot.lab_metrics.cls != null ? currentSnapshot.lab_metrics.cls.toFixed(2) : '0.00'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-evo-surface border border-evo-border">
                <div className="text-[10px] text-evo-muted font-mono">Speed Index</div>
                <div className="text-sm font-bold font-mono text-evo-text mt-1">
                  {currentSnapshot.lab_metrics.speed_index_ms ? `${(currentSnapshot.lab_metrics.speed_index_ms / 1000).toFixed(1)}s` : '—'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-evo-surface border border-evo-border">
                <div className="text-[10px] text-evo-muted font-mono">Peso da Página</div>
                <div className="text-sm font-bold font-mono text-evo-text mt-1">
                  {currentSnapshot.lab_metrics.page_size_kb ? `${(currentSnapshot.lab_metrics.page_size_kb / 1024).toFixed(1)} MB` : '—'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Core Web Vitals de Campo (CrUX Real Users) */}
        <div className="p-4 rounded-xl bg-evo-surface border border-evo-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-evo-text flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-evo-accent" />
              Core Web Vitals Reais (Google CrUX — Experiência do Visitante)
            </span>
            <span className="text-[10px] font-mono text-evo-muted">
              {currentSnapshot?.field_metrics?.available ? 'Dados Coletados' : 'Pouco tráfego Chrome registrado'}
            </span>
          </div>
          {currentSnapshot?.field_metrics?.available ? (
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-lg bg-evo-card border border-evo-border text-center">
                <div className="text-[10px] text-evo-muted">LCP Real</div>
                <div className="text-xs font-bold text-evo-text mt-0.5">
                  {currentSnapshot.field_metrics.lcp ? `${(currentSnapshot.field_metrics.lcp.value / 1000).toFixed(1)}s` : '—'}
                </div>
                <span className="text-[9px] font-mono text-emerald-400">
                  {currentSnapshot.field_metrics.lcp?.rating || 'BOM'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-evo-card border border-evo-border text-center">
                <div className="text-[10px] text-evo-muted">INP Real (Interatividade)</div>
                <div className="text-xs font-bold text-evo-text mt-0.5">
                  {currentSnapshot.field_metrics.inp ? `${currentSnapshot.field_metrics.inp.value}ms` : '—'}
                </div>
                <span className="text-[9px] font-mono text-emerald-400">
                  {currentSnapshot.field_metrics.inp?.rating || 'BOM'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-evo-card border border-evo-border text-center">
                <div className="text-[10px] text-evo-muted">CLS Real (Estabilidade)</div>
                <div className="text-xs font-bold text-evo-text mt-0.5">
                  {currentSnapshot.field_metrics.cls ? currentSnapshot.field_metrics.cls.value.toFixed(2) : '—'}
                </div>
                <span className="text-[9px] font-mono text-emerald-400">
                  {currentSnapshot.field_metrics.cls?.rating || 'BOM'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-evo-muted leading-relaxed">
              O relatório CrUX (Chrome User Experience Report) não possui volume amostral suficiente para métricas de campo agregadas neste domínio nos últimos 28 dias. Avaliação baseada nas métricas de laboratório controladas acima.
            </p>
          )}
        </div>

        {/* Problemas Técnicos Traduzidos para Linguagem Comercial */}
        {currentSnapshot?.top_issues && currentSnapshot.top_issues.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-evo-text uppercase tracking-wider font-mono">
                Oportunidades Técnicas Identificadas pelo Google ({currentSnapshot.top_issues.length})
              </span>
              <span className="text-[10px] text-evo-muted">Com explicação comercial amigável</span>
            </div>

            <div className="space-y-2">
              {currentSnapshot.top_issues.slice(0, 5).map((issue, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-evo-surface/80 border border-evo-border flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-evo-text">{issue.title}</span>
                      {issue.display_value && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          {issue.display_value}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-evo-support font-medium">
                      💡 <strong>Impacto Comercial:</strong> {issue.commercial_explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auditoria Direta do Servidor, Recursos Quebrados & Tecnologias */}
      {tech && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Imagens e Links Quebrados */}
          <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-evo-support" />
                <h4 className="text-sm font-semibold text-evo-text font-heading">
                  Inspeção de Recursos & Integridade
                </h4>
              </div>
              <span className="text-xs font-mono text-evo-muted">
                {tech.broken_images?.length || 0} imagens com erro • {tech.broken_links?.length || 0} links com erro
              </span>
            </div>

            {tech.broken_images && tech.broken_images.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Imagens que não carregam (Erro 404):
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {tech.broken_images.map((img, i) => (
                    <div key={i} className="text-[11px] font-mono text-evo-muted truncate p-1.5 rounded bg-evo-surface border border-evo-border">
                      {img.url}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Nenhuma imagem quebrada detectada na página inicial.</span>
              </div>
            )}

            {tech.broken_links && tech.broken_links.length > 0 ? (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" />
                  Links Internos Quebrados:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {tech.broken_links.map((link, i) => (
                    <div key={i} className="text-[11px] font-mono text-evo-muted truncate p-1.5 rounded bg-evo-surface border border-evo-border">
                      {link.url}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Nenhum link interno quebrado na amostragem inicial.</span>
              </div>
            )}
          </div>

          {/* Card Tecnologias Detectadas & Checklist Operacional */}
          <div className="p-6 rounded-2xl bg-evo-card border border-evo-border space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-evo-support" />
              <h4 className="text-sm font-semibold text-evo-text font-heading">
                Stack & Checklist de Presença Digital
              </h4>
            </div>

            <div>
              <div className="text-[11px] text-evo-muted font-mono uppercase mb-2">
                Tecnologias / CMS Detectados:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tech.detected_technologies && tech.detected_technologies.length > 0 ? (
                  tech.detected_technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-evo-surface text-evo-text border border-evo-border font-medium"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-evo-muted font-mono">HTML5 / Plataforma Custom</span>
                )}
              </div>
            </div>

            <div className="pt-2 space-y-2 border-t border-evo-border">
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-evo-muted">Viewport Responsivo (Mobile)</span>
                <span className={tech.mobile_responsive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {tech.mobile_responsive ? '✓ Configurado' : '✕ Ausente'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-evo-muted">Botão WhatsApp Direto no Site</span>
                <span className={tech.has_whatsapp_cta ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {tech.has_whatsapp_cta ? '✓ Integrado' : '✕ Não Detectado'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-evo-muted">Certificado SSL / HTTPS</span>
                <span className={tech.ssl_valid ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {tech.ssl_valid ? '✓ Seguro' : '✕ Inseguro'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
