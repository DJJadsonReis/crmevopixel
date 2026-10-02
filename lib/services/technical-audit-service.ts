import {
  TechnicalAuditReport,
  TechnicalIssueItem,
  SiteHealthStatus,
} from '@/types/database';
import { isUrlSafeForScraping } from '@/lib/utils/ssrf-protection';

export class TechnicalAuditService {
  /**
   * Executa a auditoria direta completa do website da empresa
   */
  public async auditWebsite(rawUrl?: string): Promise<TechnicalAuditReport> {
    const now = new Date().toISOString();

    if (!rawUrl || !rawUrl.trim()) {
      return {
        site_health_status: 'NO_WEBSITE',
        http_status: 0,
        ssl_valid: false,
        response_time_ms: 0,
        mobile_responsive: false,
        broken_images: [],
        broken_links: [],
        has_whatsapp_cta: false,
        detected_technologies: [],
        issues: [
          {
            type: 'no_whatsapp_cta',
            severity: 'critical',
            location: 'Presença Digital',
            description: 'A empresa não possui website registrado ou acessível.',
            commercial_impact: 'Perda diária de clientes corporativos que pesquisam no Google antes de entrar em contato.',
          },
        ],
        audited_at: now,
      };
    }

    const safeCheck = isUrlSafeForScraping(rawUrl);
    if (!safeCheck.safe || !safeCheck.url) {
      return {
        site_health_status: 'INCONCLUSIVE',
        http_status: 0,
        ssl_valid: false,
        response_time_ms: 0,
        mobile_responsive: false,
        broken_images: [],
        broken_links: [],
        has_whatsapp_cta: false,
        detected_technologies: [],
        issues: [
          {
            type: 'slow_server',
            severity: 'high',
            location: 'Validação de Segurança',
            description: safeCheck.reason || 'Endereço bloqueado por política de segurança.',
            commercial_impact: 'Não foi possível validar o site de forma segura.',
          },
        ],
        audited_at: now,
      };
    }

    let targetUrl = safeCheck.url.toString();
    const startTime = Date.now();
    let httpStatus = 0;
    let sslValid = targetUrl.startsWith('https://');
    let html = '';
    const issues: TechnicalIssueItem[] = [];

    // 1. Fetch da Home com medição de tempo e SSL
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 EvoPixelAudit/2.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      }).finally(() => clearTimeout(timeoutId));

      httpStatus = res.status;
      sslValid = res.url.startsWith('https://');
      html = await res.text();
    } catch (err: any) {
      // Se falhou via https, tenta http antes de decretar erro
      if (targetUrl.startsWith('https://')) {
        try {
          const httpFallback = targetUrl.replace('https://', 'http://');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const resFallback = await fetch(httpFallback, {
            method: 'GET',
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));
          httpStatus = resFallback.status;
          sslValid = false;
          html = await resFallback.text();
          targetUrl = httpFallback;
        } catch {
          return this.buildOfflineReport(now, 'Site inacessível via HTTPS e HTTP.');
        }
      } else {
        return this.buildOfflineReport(now, 'Servidor não respondeu dentro do tempo limite.');
      }
    }

    const responseTimeMs = Date.now() - startTime;
    const lowerHtml = html.toLowerCase();

    // 2. Análise de SSL
    if (!sslValid) {
      issues.push({
        type: 'ssl_missing',
        severity: 'high',
        location: 'Protocolo Web / SSL',
        description: 'Website operando sem certificado de segurança SSL ativo (HTTP simples).',
        commercial_impact: 'Navegadores como Chrome e Safari exibem alerta de "Não Seguro", afastando clientes e prejudicando o ranqueamento no Google.',
      });
    }

    // 3. Análise de Responsividade Mobile
    const mobileResponsive = /<meta[^>]*name=["']viewport["']/i.test(html);
    if (!mobileResponsive) {
      issues.push({
        type: 'mobile_overflow',
        severity: 'high',
        location: 'Meta Tag Viewport',
        description: 'Ausência de configuração viewport para smartphones.',
        commercial_impact: 'Usuários em celulares precisam dar zoom manual; mais de 70% dos acessos locais desistem imediatamente.',
      });
    }

    // 4. Detecção de WhatsApp CTA
    const waRegex = /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send)\?[^"' >]+|(?:https?:\/\/)?wa\.me\/[0-9]+/gi;
    const hasWhatsAppCta = Boolean(html.match(waRegex)) || lowerHtml.includes('whatsapp') || lowerHtml.includes('fale no zap');
    if (!hasWhatsAppCta) {
      issues.push({
        type: 'no_whatsapp_cta',
        severity: 'medium',
        location: 'Conversão & Chamada para Ação',
        description: 'Nenhum botão flutuante ou link direto de WhatsApp identificado na página principal.',
        commercial_impact: 'Visitantes interessados em agendar ou orçar não encontram canal de resposta rápida, vazando para concorrentes.',
      });
    }

    // 5. Verificação de Imagens Quebradas (Amostra controlada de até 8 imagens)
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const imgMatches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = imgRegex.exec(html)) !== null && imgMatches.length < 8) {
      const src = match[1].trim();
      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        imgMatches.push(src);
      }
    }

    const brokenImages: { url: string; status: number }[] = [];
    const baseUrl = new URL(targetUrl);

    for (const imgSrc of imgMatches) {
      try {
        const fullImgUrl = imgSrc.startsWith('http')
          ? imgSrc
          : imgSrc.startsWith('//')
          ? `https:${imgSrc}`
          : new URL(imgSrc, baseUrl.origin).toString();

        const imgCheck = isUrlSafeForScraping(fullImgUrl);
        if (imgCheck.safe && imgCheck.url) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const imgRes = await fetch(imgCheck.url.toString(), {
            method: 'HEAD',
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));

          if (imgRes.status >= 400) {
            brokenImages.push({ url: fullImgUrl, status: imgRes.status });
            issues.push({
              type: 'broken_image',
              severity: 'medium',
              resource_url: fullImgUrl,
              location: 'Imagens da Página',
              description: `Imagem retornou erro HTTP ${imgRes.status}.`,
              commercial_impact: 'Transmite amadorismo visual e sensação de site abandonado aos visitantes.',
            });
          }
        }
      } catch {
        // Ignora timeout isolado de imagem para não atrasar a resposta
      }
    }

    // 6. Verificação de Links Quebrados Principais (Amostra controlada)
    const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
    const internalLinks: string[] = [];
    while ((match = linkRegex.exec(html)) !== null && internalLinks.length < 6) {
      const href = match[1].trim();
      if (
        (href.startsWith('/') || href.startsWith(baseUrl.origin)) &&
        !href.startsWith('/#') &&
        !href.startsWith('mailto:') &&
        !href.startsWith('tel:') &&
        href !== '/'
      ) {
        internalLinks.push(href);
      }
    }

    const brokenLinks: { url: string; status: number }[] = [];
    for (const linkHref of internalLinks) {
      try {
        const fullLinkUrl = linkHref.startsWith('http')
          ? linkHref
          : new URL(linkHref, baseUrl.origin).toString();

        const linkCheck = isUrlSafeForScraping(fullLinkUrl);
        if (linkCheck.safe && linkCheck.url) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const linkRes = await fetch(linkCheck.url.toString(), {
            method: 'HEAD',
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));

          if (linkRes.status >= 400) {
            brokenLinks.push({ url: fullLinkUrl, status: linkRes.status });
            issues.push({
              type: 'broken_link',
              severity: 'high',
              resource_url: fullLinkUrl,
              location: 'Menu & Navegação',
              description: `Link interno quebrado retornando HTTP ${linkRes.status}.`,
              commercial_impact: 'Cliente clica para ver serviços ou contato e cai em página de erro 404.',
            });
          }
        }
      } catch {
        // Ignora timeout isolado
      }
    }

    // 7. Tecnologias detectadas
    const detectedTech: string[] = [];
    if (lowerHtml.includes('wp-content')) detectedTech.push('WordPress');
    if (lowerHtml.includes('elementor')) detectedTech.push('Elementor');
    if (lowerHtml.includes('wix.com')) detectedTech.push('Wix');
    if (lowerHtml.includes('shopify')) detectedTech.push('Shopify');
    if (lowerHtml.includes('webflow')) detectedTech.push('Webflow');
    if (lowerHtml.includes('_next/') || lowerHtml.includes('__next')) detectedTech.push('Next.js');
    if (lowerHtml.includes('tailwind')) detectedTech.push('Tailwind CSS');
    if (lowerHtml.includes('bootstrap')) detectedTech.push('Bootstrap');
    if (detectedTech.length === 0) detectedTech.push('HTML5 / Custom');

    // 8. Classificação Estruturada de Saúde do Site (Site Health Status)
    let siteHealth: SiteHealthStatus = 'ONLINE_OK';
    if (httpStatus >= 500) {
      siteHealth = 'CRITICAL';
    } else if (brokenLinks.length > 0 || brokenImages.length > 2) {
      siteHealth = 'MAINTENANCE_REQUIRED';
    } else if (!sslValid) {
      siteHealth = 'SSL_ERROR';
    } else if (issues.length > 0) {
      siteHealth = 'ONLINE_WITH_ISSUES';
    }

    return {
      site_health_status: siteHealth,
      http_status: httpStatus,
      ssl_valid: sslValid,
      response_time_ms: responseTimeMs,
      mobile_responsive: mobileResponsive,
      broken_images: brokenImages,
      broken_links: brokenLinks,
      has_whatsapp_cta: hasWhatsAppCta,
      detected_technologies: detectedTech,
      issues,
      audited_at: now,
    };
  }

  private buildOfflineReport(now: string, reason: string): TechnicalAuditReport {
    return {
      site_health_status: 'OFFLINE',
      http_status: 504,
      ssl_valid: false,
      response_time_ms: 0,
      mobile_responsive: false,
      broken_images: [],
      broken_links: [],
      has_whatsapp_cta: false,
      detected_technologies: [],
      issues: [
        {
          type: 'slow_server',
          severity: 'critical',
          location: 'Servidor / Hospedagem',
          description: reason,
          commercial_impact: 'Site fora do ar. Clientes que tentam acessar encontram erro de conexão e contratam concorrentes.',
        },
      ],
      audited_at: now,
    };
  }
}

export const technicalAuditService = new TechnicalAuditService();

