/**
 * Utilitário de Proteção contra SSRF (Server-Side Request Forgery)
 * Bloqueia acessos a localhost, IPs privados, endereços de loopback e metadados de nuvem.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254', // AWS/GCP/Azure link-local metadata
]);

export function isUrlSafeForScraping(targetUrl: string): { safe: boolean; reason?: string; url?: URL } {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { safe: false, reason: 'URL vazia ou inválida.' };
  }

  let parsed: URL;
  try {
    let urlToParse = targetUrl.trim();
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = `https://${urlToParse}`;
    }
    parsed = new URL(urlToParse);
  } catch {
    return { safe: false, reason: 'Formato de URL inválido.' };
  }

  // Apenas protocolos HTTP e HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, reason: `Protocolo "${parsed.protocol}" não permitido. Apenas HTTP/HTTPS são aceitos.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Bloqueio de hostnames restritos
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { safe: false, reason: `Hostname restrito/interno bloqueado por segurança: ${hostname}` };
  }

  // Verificação de faixas de IP IPv4 privadas (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipv4Regex);
  if (ipMatch) {
    const octet1 = parseInt(ipMatch[1], 10);
    const octet2 = parseInt(ipMatch[2], 10);

    // 127.0.0.0/8 (loopback)
    if (octet1 === 127) return { safe: false, reason: 'Endereço de loopback bloqueado.' };
    // 10.0.0.0/8 (privado)
    if (octet1 === 10) return { safe: false, reason: 'Rede privada 10.x.x.x bloqueada.' };
    // 172.16.0.0/12 (privado)
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return { safe: false, reason: 'Rede privada 172.16-31.x.x bloqueada.' };
    // 192.168.0.0/16 (privado)
    if (octet1 === 192 && octet2 === 168) return { safe: false, reason: 'Rede privada 192.168.x.x bloqueada.' };
    // 169.254.0.0/16 (link-local)
    if (octet1 === 169 && octet2 === 254) return { safe: false, reason: 'Endereço link-local de metadados bloqueado.' };
    // 0.0.0.0/8
    if (octet1 === 0) return { safe: false, reason: 'Endereço nulo bloqueado.' };
  }

  return { safe: true, url: parsed };
}

