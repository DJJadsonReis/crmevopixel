export interface CompanyPersona {
  company_name: string;
  slogan: string;
  segment: string;
  tone_of_voice: 'consultivo' | 'formal' | 'amigavel' | 'direto' | 'energico';
  presentation_template: string;
  services: string[];
  forbidden_terms: string[];
  standard_cta: string;
  human_handover_rules: string;
  sender_name?: string;
  updated_at: string;
}

export const DEFAULT_COMPANY_PERSONA: CompanyPersona = {
  company_name: 'Minha Agência Digital',
  slogan: 'Especialistas em Presença Digital de Alta Performance & Automação Comercial',
  segment: 'Assessoria de Crescimento, Sites e Automação de Vendas',
  tone_of_voice: 'consultivo',
  presentation_template: 'Olá {contato}! Sou o {remetente} da {empresa_nome}. Acompanho o crescimento da *{empresa_alvo}* em {cidade}.',
  services: [
    'Sites Institucionais de Alta Performance',
    'Automação de Atendimento & Agendamento WhatsApp (IA)',
    'SEO Local & Otimização Google Meu Negócio',
    'Auditoria Técnica & Recuperação de Sites Fora do Ar',
  ],
  forbidden_terms: [
    'EVO PIXEL',
    'grátis',
    'promoção imperdível',
    'baratinho',
    'desconto imperdível',
  ],
  standard_cta: 'Você teria 5 minutinhos esta semana para avaliarmos essa oportunidade sem compromisso?',
  human_handover_rules: 'Transferir imediatamente para o operador humano caso o lead solicite falar com um atendente real, envie proposta de negociação de valores, solicite contrato formal ou após 3 objeções consecutivas não resolvidas.',
  sender_name: 'Rafael Costa',
  updated_at: new Date().toISOString(),
};
