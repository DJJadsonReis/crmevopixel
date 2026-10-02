import {
  PageSpeedReport,
  PageSpeedSnapshot,
  LighthouseScores,
  LabMetrics,
  FieldMetrics,
  LighthouseIssue,
  CoreWebVitalsRating,
} from '@/types/database';
import { isUrlSafeForScraping } from '@/lib/utils/ssrf-protection';

export interface PerformanceProvider {
  auditUrl(
    targetUrl: string,
    options?: { forceRefresh?: boolean; apiKey?: string; ttlHours?: number }
  ): Promise<PageSpeedReport>;
}

// Mapeamento de explicações comerciais amigáveis para audits técnicos comuns do Lighthouse
const COMMERCIAL_AUDIT_EXPLANATIONS: Record<string, string> = {
  'largest-contentful-paint': 'O elemento visual mais importante da página demora muito para carregar no celular, fazendo o visitante desistir.',
  'render-blocking-resources': 'Existem arquivos de código CSS ou scripts travando o carregamento inicial da página.',
  'unminified-javascript': 'O código do site não foi comprimido, gastando dados móveis e tempo desnecessário.',
  'unminified-css': 'Folhas de estilo pesadas e sem compressão atrasam a exibição do design.',
  'unused-javascript': 'O site carrega códigos que não são usados na tela inicial, pesando no smartphone.',
  'unused-css-rules': 'Estilos CSS desnecessários aumentam o tempo de resposta inicial.',
  'uses-responsive-images': 'As imagens exibidas no celular são pesadas como se fossem para computador.',
  'offscreen-images': 'Imagens distantes do topo estão sendo carregadas antes da hora (falta lazy-loading).',
  'modern-image-formats': 'O site usa formatos antigos (PNG/JPEG pesados) em vez de WebP/AVIF otimizados.',
  'total-byte-weight': 'O peso total da página é excessivo, consumindo o plano de dados dos clientes.',
  'server-response-time': 'O servidor de hospedagem demora muito para começar a responder (TTFB lento).',
  'cumulative-layout-shift': 'Elementos pulam de lugar durante o carregamento, causando cliques acidentais e frustração.',
  'meta-description': 'A descrição no Google está ausente ou mal configurada, reduzindo cliques nas buscas.',
  'document-title': 'O título da aba no navegador está ausente ou genérico.',
  'viewport': 'A tela não se adapta automaticamente a smartphones.',
  'font-display': 'O texto some enquanto as fontes personalizadas carregam (FOIT).',
};

export class GooglePageSpeedService implements PerformanceProvider {
  private cache: Map<string, { report: PageSpeedReport; expiresAt: number }> = new Map();
  private defaultTtlMs = 24 * 60 * 60 * 1000; // 24 horas

  private getApiKey(explicitKey?: string): string {
    if (explicitKey && explicitKey.trim()) return explicitKey.trim();
    if (typeof process !== 'undefined' && process.env?.GOOGLE_PAGESPEED_API_KEY) {
      return process.env.GOOGLE_PAGESPEED_API_KEY.trim();
    }
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('EVO_pagespeedApiKey') || '').trim();
    }
    return '';
  }

  public async auditUrl(
    targetUrl: string,
    options: { forceRefresh?: boolean; apiKey?: string; ttlHours?: number } = {}
  ): Promise<PageSpeedReport> {
    if (!targetUrl || !targetUrl.trim()) {
      return {
        mobile: null,
        desktop: null,
        status: 'NO_WEBSITE',
        cached: false,
        last_audit_at: new Date().toISOString(),
      };
    }

    const safeCheck = isUrlSafeForScraping(targetUrl);
    if (!safeCheck.safe || !safeCheck.url) {
      return {
        mobile: null,
        desktop: null,
        status: 'SITE_NOT_ANALYZABLE',
        cached: false,
        last_audit_at: new Date().toISOString(),
      };
    }

    const normalizedUrl = safeCheck.url.toString();
    const cacheKey = normalizedUrl.toLowerCase();
    const now = Date.now();

    // 1. Verificação de Cache
    if (!options.forceRefresh && this.cache.has(cacheKey)) {
      const cachedEntry = this.cache.get(cacheKey)!;
      if (cachedEntry.expiresAt > now) {
        return {
          ...cachedEntry.report,
          cached: true,
        };
      }
    }

    const apiKey = this.getApiKey(options.apiKey);

    // 2. Executa estratégias Mobile e Desktop em paralelo com proteção de timeout
    try {
      const [mobileResult, desktopResult] = await Promise.allSettled([
        this.runStrategy(normalizedUrl, 'mobile', apiKey),
        this.runStrategy(normalizedUrl, 'desktop', apiKey),
      ]);

      const mobileSnapshot = mobileResult.status === 'fulfilled' ? mobileResult.value : null;
      const desktopSnapshot = desktopResult.status === 'fulfilled' ? desktopResult.value : null;

      let status: PageSpeedReport['status'] = 'SUCCESS';
      if (!mobileSnapshot && !desktopSnapshot) {
        // Identifica motivo de falha
        const reason =
          mobileResult.status === 'rejected' ? (mobileResult.reason as any)?.message : '';
        if (reason?.includes('429') || reason?.includes('quota')) {
          status = 'RATE_LIMITED';
        } else if (reason?.includes('timeout') || reason?.includes('abort')) {
          status = 'TIMEOUT';
        } else if (reason?.includes('400') || reason?.includes('API_KEY_INVALID')) {
          status = 'INVALID_KEY';
        } else {
          status = 'SITE_NOT_ANALYZABLE';
        }
      } else if (!mobileSnapshot || !desktopSnapshot) {
        status = 'PARTIAL';
      }

      const report: PageSpeedReport = {
        mobile: mobileSnapshot,
        desktop: desktopSnapshot,
        status,
        cached: false,
        last_audit_at: new Date().toISOString(),
      };

      // Grava no cache
      const ttl = (options.ttlHours ? options.ttlHours * 60 * 60 * 1000 : this.defaultTtlMs);
      this.cache.set(cacheKey, { report, expiresAt: now + ttl });

      return report;
    } catch (err: any) {
      console.warn('Erro global na auditoria PageSpeed:', err);
      return {
        mobile: null,
        desktop: null,
        status: 'PROVIDER_ERROR',
        cached: false,
        last_audit_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Executa a API oficial v5 do Google PageSpeed Insights para uma estratégia
   */
  private async runStrategy(
    url: string,
    strategy: 'mobile' | 'desktop',
    apiKey?: string
  ): Promise<PageSpeedSnapshot | null> {
    const params = new URLSearchParams({
      url: url,
      strategy: strategy,
      category: 'PERFORMANCE',
    });
    // Adiciona categorias suportadas
    params.append('category', 'ACCESSIBILITY');
    params.append('category', 'BEST_PRACTICES');
    params.append('category', 'SEO');

    if (apiKey) {
      params.append('key', apiKey);
    }

    const endpoint = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    } catch (err: any) {
      throw new Error(`Timeout ou erro de rede no PageSpeed (${strategy}): ${err.message}`);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} PageSpeed (${strategy}): ${errText}`);
    }

    const data = await res.json();
    return this.parseLighthouseResponse(data, strategy);
  }

  /**
   * Converte a resposta bruta da API PageSpeed v5 para nossa estrutura tipada
   */
  private parseLighthouseResponse(data: any, strategy: 'mobile' | 'desktop'): PageSpeedSnapshot {
    const lighthouse = data.lighthouseResult || {};
    const categories = lighthouse.categories || {};
    const audits = lighthouse.audits || {};
    const loadingExperience = data.loadingExperience || {};

    // 1. Scores (0 a 100)
    const scores: LighthouseScores = {
      performance: categories.performance?.score !== null && categories.performance?.score !== undefined
        ? Math.round(categories.performance.score * 100)
        : null,
      accessibility: categories.accessibility?.score !== null && categories.accessibility?.score !== undefined
        ? Math.round(categories.accessibility.score * 100)
        : null,
      best_practices: categories['best-practices']?.score !== null && categories['best-practices']?.score !== undefined
        ? Math.round(categories['best-practices'].score * 100)
        : null,
      seo: categories.seo?.score !== null && categories.seo?.score !== undefined
        ? Math.round(categories.seo.score * 100)
        : null,
    };

    // 2. Dados de Laboratório (Lighthouse Simulation)
    const labMetrics: LabMetrics = {
      fcp_ms: audits['first-contentful-paint']?.numericValue
        ? Math.round(audits['first-contentful-paint'].numericValue)
        : null,
      lcp_ms: audits['largest-contentful-paint']?.numericValue
        ? Math.round(audits['largest-contentful-paint'].numericValue)
        : null,
      tbt_ms: audits['total-blocking-time']?.numericValue
        ? Math.round(audits['total-blocking-time'].numericValue)
        : null,
      cls: audits['cumulative-layout-shift']?.numericValue !== undefined
        ? Number(audits['cumulative-layout-shift'].numericValue.toFixed(3))
        : null,
      speed_index_ms: audits['speed-index']?.numericValue
        ? Math.round(audits['speed-index'].numericValue)
        : null,
      ttfb_ms: audits['server-response-time']?.numericValue
        ? Math.round(audits['server-response-time'].numericValue)
        : null,
      page_size_kb: audits['total-byte-weight']?.numericValue
        ? Math.round(audits['total-byte-weight'].numericValue / 1024)
        : null,
      request_count: audits['network-requests']?.numericValue || null,
    };

    // 3. Dados Reais / Core Web Vitals (quando disponíveis)
    const fieldMetrics: FieldMetrics = this.parseFieldMetrics(loadingExperience);

    // 4. Diagnósticos e Problemas Técnicos Relevantes
    const topIssues: LighthouseIssue[] = [];

    const interestingAudits = [
      'largest-contentful-paint',
      'render-blocking-resources',
      'unused-javascript',
      'unused-css-rules',
      'modern-image-formats',
      'uses-responsive-images',
      'offscreen-images',
      'total-byte-weight',
      'server-response-time',
      'cumulative-layout-shift',
      'meta-description',
      'viewport',
    ];

    interestingAudits.forEach((id) => {
      const a = audits[id];
      if (a && a.score !== null && a.score < 0.85) {
        const severity = a.score < 0.5 ? 'critical' : a.score < 0.75 ? 'high' : 'medium';
        topIssues.push({
          audit_id: id,
          title: a.title || id,
          description: a.description || '',
          score: Math.round(a.score * 100),
          severity,
          display_value: a.displayValue || undefined,
          commercial_explanation:
            COMMERCIAL_AUDIT_EXPLANATIONS[id] ||
            'Otimização técnica recomendada para acelerar o carregamento da página.',
        });
      }
    });

    return {
      strategy,
      analyzed_at: new Date().toISOString(),
      scores,
      lab_metrics: labMetrics,
      field_metrics: fieldMetrics,
      top_issues: topIssues.slice(0, 8),
    };
  }

  /**
   * Extrai e classifica Core Web Vitals reais com regras rígidas do Google
   */
  private parseFieldMetrics(loadingExperience: any): FieldMetrics {
    const metrics = loadingExperience.metrics || {};
    const available = Boolean(loadingExperience.overall_category && Object.keys(metrics).length > 0);

    if (!available) {
      return { available: false };
    }

    const classifyCWV = (
      metricKey: string,
      goodMax: number,
      needsImprovementMax: number
    ): { value: number; rating: CoreWebVitalsRating } | undefined => {
      const m = metrics[metricKey];
      if (!m || m.percentile === undefined) return undefined;
      const val = m.percentile;
      let rating: CoreWebVitalsRating = 'GOOD';
      if (val > needsImprovementMax) rating = 'POOR';
      else if (val > goodMax) rating = 'NEEDS_IMPROVEMENT';
      return { value: val, rating };
    };

    return {
      available: true,
      lcp: classifyCWV('LARGEST_CONTENTFUL_PAINT_MS', 2500, 4000),
      inp: classifyCWV('INTERACTION_TO_NEXT_PAINT', 200, 500),
      cls: classifyCWV('CUMULATIVE_LAYOUT_SHIFT_SCORE', 10, 25), // Google retorna CLS multiplicado por 100 na API às vezes
      fcp: classifyCWV('FIRST_CONTENTFUL_PAINT_MS', 1800, 3000),
      ttfb: classifyCWV('EXPERIMENTAL_TIME_TO_FIRST_BYTE', 800, 1800),
    };
  }

  /**
   * Teste rápido de conectividade da API com validação de chave
   */
  public async testConnection(apiKey?: string): Promise<{ success: boolean; message: string; status: number }> {
    const key = this.getApiKey(apiKey);
    try {
      const testUrl = 'https://example.com';
      const endpoint = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
        testUrl
      )}&strategy=mobile&category=PERFORMANCE${key ? `&key=${encodeURIComponent(key)}` : ''}`;

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        return {
          success: true,
          message: 'Google PageSpeed Insights API v5 conectada com sucesso!',
          status: 200,
        };
      }

      if (res.status === 429) {
        return {
          success: false,
          message: 'Limite de cota da API Google PageSpeed atingido temporariamente (429 Too Many Requests).',
          status: 429,
        };
      }

      if (res.status === 400 || res.status === 403) {
        return {
          success: false,
          message: 'Chave de API do Google inválida ou sem permissão para PageSpeed Insights API v5.',
          status: res.status,
        };
      }

      return {
        success: false,
        message: `Falha na requisição PageSpeed API (HTTP ${res.status}).`,
        status: res.status,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erro de conexão com o Google PageSpeed: ${err.message}`,
        status: 500,
      };
    }
  }
}

export const pageSpeedService = new GooglePageSpeedService();

