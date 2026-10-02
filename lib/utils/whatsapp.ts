/**
 * Utilitários para integração e abertura de conversas no WhatsApp
 */

export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.toString().replace(/\D/g, '');
}

/**
 * Normaliza o número de telefone para formato aceito pela Evolution API / WhatsApp Brasil
 * - Remove caracteres não numéricos
 * - Elimina duplicações acidentais de DDI 55 (ex: 5555119196266 -> 55119196266)
 * - Adiciona DDI 55 caso seja número brasileiro com DDD (10 ou 11 dígitos) sem 55
 * - Preserva números internacionais ou já com 55 de 12/13 dígitos
 */
export function normalizeWhatsAppNumber(phone?: string): string {
  if (!phone) return '';
  let clean = cleanPhoneNumber(phone);
  if (!clean) return '';

  // Remove duplicações múltiplas de 55 no início (ex: 5555... -> 55...)
  while (clean.startsWith('5555')) {
    clean = clean.slice(2);
  }

  // Se já tem 55 e possui tamanho de telefone brasileiro padrão:
  // 12 dígitos: 55 + DDD (2) + Fixo (8)
  // 13 dígitos: 55 + DDD (2) + Celular (9)
  // 11 dígitos começando com 55 (ex: 55 + DDD + 7 dígitos antigos): preserva
  if (clean.startsWith('55')) {
    if (clean.length === 12 || clean.length === 13 || clean.length === 11) {
      return clean;
    }
  }

  // Se NÃO começa com 55 e tem tamanho de telefone brasileiro (10 dígitos DDD+8 ou 11 dígitos DDD+9)
  if (!clean.startsWith('55') && (clean.length === 10 || clean.length === 11)) {
    return `55${clean}`;
  }

  return clean;
}

export function formatWhatsAppNumber(phone?: string): string {
  return normalizeWhatsAppNumber(phone);
}

/**
 * Sanitiza e garante que termos proibidos (ex: EVO PIXEL) não apareçam em mensagens externas enviadas ao cliente
 */
export function sanitizeOutboundCustomerMessage(text: string, fallbackCompany = 'nossa agência'): string {
  if (!text) return '';
  // Substitui qualquer menção a EVO PIXEL / Evo Pixel / evo pixel por termo institucional ou nome da empresa
  return text
    .replace(/\bda\s+EVO\s+PIXEL\b/gi, `da ${fallbackCompany}`)
    .replace(/\bna\s+EVO\s+PIXEL\b/gi, `na ${fallbackCompany}`)
    .replace(/\bpela\s+EVO\s+PIXEL\b/gi, `pela ${fallbackCompany}`)
    .replace(/\bEVO\s+PIXEL\b/gi, fallbackCompany);
}

export function getWhatsAppUrl(phone?: string, text?: string): string {
  const formatted = formatWhatsAppNumber(phone);
  if (!formatted) return '';

  const baseUrl = `https://wa.me/${formatted}`;
  if (text && text.trim()) {
    return `${baseUrl}?text=${encodeURIComponent(text.trim())}`;
  }
  return baseUrl;
}

export function openWhatsApp(phone?: string, text?: string): boolean {
  const url = getWhatsAppUrl(phone, text);
  if (!url) {
    return false;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
