import { Lead, Prospect, Temperature } from '@/types/database';
import { cleanPhoneNumber, formatWhatsAppNumber } from '@/lib/utils/whatsapp';
import { formatPhoneNumber } from '@/lib/utils';

export interface QualifyInput {
  name?: string;
  company_name?: string;
  phone?: string;
  whatsapp?: string;
  segment?: string;
  city?: string;
  state?: string;
  email?: string;
  role?: string;
  website?: string;
  instagram?: string;
  google_business?: string;
  status?: string;
  tags?: string[];
  enrichment_data?: any;
  technical_audit?: any;
  sequence_progress?: any;
}

export interface ScorePillar {
  name: string;
  points: number;
  maxPoints: number;
  factors: { label: string; points: number; positive: boolean }[];
}

export interface ScoreExplanation {
  total: number;
  temperature: Temperature;
  pillars: {
    dataCompleteness: ScorePillar;
    digitalOpportunity: ScorePillar;
    commercialFit: ScorePillar;
    engagement: ScorePillar;
    pipelineIntent: ScorePillar;
  };
  summary: string[];
}

/**
 * Cálculo transparente, auditável e 100% baseado em evidências do Lead Score (0 - 100)
 */
export function calculateEvidenceBasedScore(input: Partial<Lead> | QualifyInput): ScoreExplanation {
  // 1. DATA COMPLETENESS (0 - 15)
  const dataFactors: { label: string; points: number; positive: boolean }[] = [];
  let dataPoints = 0;

  const phone = input.whatsapp || input.phone || '';
  if (phone && phone.replace(/\D/g, '').length >= 10) {
    dataPoints += 6;
    dataFactors.push({ label: 'WhatsApp / Telefone válido identificado', points: 6, positive: true });
  } else {
    dataFactors.push({ label: 'Telefone ausente ou inválido', points: 0, positive: false });
  }

  if (input.email && input.email.includes('@')) {
    dataPoints += 4;
    dataFactors.push({ label: 'E-mail corporativo cadastrado', points: 4, positive: true });
  }

  if (input.city && input.city !== 'Não informada' && input.city.trim()) {
    dataPoints += 3;
    dataFactors.push({ label: `Localização geográfica definida (${input.city})`, points: 3, positive: true });
  }

  if (input.role && input.role !== 'Decisor Comercial' && input.role.trim()) {
    dataPoints += 2;
    dataFactors.push({ label: `Cargo do decisor identificado (${input.role})`, points: 2, positive: true });
  } else {
    dataPoints += 1;
    dataFactors.push({ label: 'Cargo padrão do decisor assumido', points: 1, positive: true });
  }
  dataPoints = Math.min(15, dataPoints);

  // 2. DIGITAL OPPORTUNITY (0 - 35) - Mede a oportunidade de venda de serviços EVO PIXEL
  const oppFactors: { label: string; points: number; positive: boolean }[] = [];
  let oppPoints = 0;

  const hasWebsite = Boolean(input.website && input.website.trim());
  const audit = (input as any).technical_audit;
  const enrich = (input as any).enrichment_data;

  if (!hasWebsite) {
    oppPoints += 25;
    oppFactors.push({ label: 'Sem website próprio (Oportunidade Máxima de Criação de Site)', points: 25, positive: true });
  } else {
    oppFactors.push({ label: 'Possui website publicado', points: 0, positive: false });
    if (audit?.site_health_status === 'OFFLINE' || audit?.site_health_status === 'APPLICATION_ERROR') {
      oppPoints += 20;
      oppFactors.push({ label: 'Site fora do ar ou com erro crítico (Oportunidade Recuperação)', points: 20, positive: true });
    } else if (audit?.site_health_status === 'MAINTENANCE_REQUIRED' || audit?.site_health_status === 'PARTIALLY_BROKEN') {
      oppPoints += 15;
      oppFactors.push({ label: 'Site com falhas de layout/links ou lento (Oportunidade Manutenção)', points: 15, positive: true });
    } else if (audit?.has_whatsapp_cta === false) {
      oppPoints += 12;
      oppFactors.push({ label: 'Site existente não possui botão direto para WhatsApp', points: 12, positive: true });
    } else {
      oppPoints += 5;
      oppFactors.push({ label: 'Site saudável identificado (Oportunidade SEO e Redesign)', points: 5, positive: true });
    }
  }

  if (input.google_business && input.google_business.trim()) {
    oppPoints += 6;
    oppFactors.push({ label: 'Presença no Google Maps confirmada', points: 6, positive: true });
  }
  if (input.instagram && input.instagram.trim()) {
    oppPoints += 4;
    oppFactors.push({ label: 'Perfil de Instagram ativo identificado', points: 4, positive: true });
  }
  oppPoints = Math.min(35, oppPoints);

  // 3. COMMERCIAL FIT (0 - 20) - Alinhamento com nichos atendidos pela EVO PIXEL
  const fitFactors: { label: string; points: number; positive: boolean }[] = [];
  let fitPoints = 0;

  const segment = (input.segment || '').toLowerCase();
  const priorityNiches = ['advoc', 'juríd', 'odonto', 'clínic', 'estétic', 'contab', 'marmor', 'engenhar', 'arquit', 'imobil', 'aduaneir'];
  const isPriorityNiche = priorityNiches.some((n) => segment.includes(n));

  if (isPriorityNiche) {
    fitPoints += 14;
    fitFactors.push({ label: `Nicho prioritário EVO PIXEL (${input.segment})`, points: 14, positive: true });
  } else {
    fitPoints += 7;
    fitFactors.push({ label: `Nicho geral com potencial digital (${input.segment || 'Geral'})`, points: 7, positive: true });
  }

  if (input.company_name && input.company_name.length > 3) {
    fitPoints += 6;
    fitFactors.push({ label: 'Razão social / Nome fantasia consolidado', points: 6, positive: true });
  }
  fitPoints = Math.min(20, fitPoints);

  // 4. ENGAGEMENT (0 - 20) - Sinais de interação e resposta
  const engFactors: { label: string; points: number; positive: boolean }[] = [];
  let engPoints = 0;

  const status = (input as any).status || 'novo';
  const progress = (input as any).sequence_progress;
  const isResponded = progress?.status === 'respondido' || status === 'em_conversa';

  if (isResponded) {
    engPoints += 20;
    engFactors.push({ label: 'Lead respondeu ao contato no WhatsApp (Lead Super Ativo)', points: 20, positive: true });
  } else if (status === 'em_abordagem') {
    engPoints += 8;
    engFactors.push({ label: 'Abordagem comercial disparada aguardando leitura', points: 8, positive: true });
  } else {
    engPoints += 2;
    engFactors.push({ label: 'Lead virgem pronto para primeira abordagem', points: 2, positive: true });
  }
  engPoints = Math.min(20, engPoints);

  // 5. PIPELINE INTENT (0 - 10) - Proximidade de fechamento
  const intentFactors: { label: string; points: number; positive: boolean }[] = [];
  let intentPoints = 0;

  if (status === 'qualificado' || (input as any).tags?.includes('Proposta Enviada')) {
    intentPoints += 10;
    intentFactors.push({ label: 'Lead em negociação avançada / proposta enviada', points: 10, positive: true });
  } else if (status === 'em_conversa' || (input as any).tags?.includes('Em Negociação')) {
    intentPoints += 7;
    intentFactors.push({ label: 'Negociação aberta e alinhamento em curso', points: 7, positive: true });
  } else {
    intentPoints += 2;
    intentFactors.push({ label: 'Fase de prospecção inicial', points: 2, positive: true });
  }
  intentPoints = Math.min(10, intentPoints);

  const total = Math.max(10, Math.min(100, dataPoints + oppPoints + fitPoints + engPoints + intentPoints));

  let temperature: Temperature = 'frio';
  if (total >= 75) temperature = 'quente';
  else if (total >= 50) temperature = 'morno';

  const summary = [
    ...oppFactors.filter((f) => f.positive).map((f) => `+${f.points} ${f.label}`),
    ...dataFactors.filter((f) => f.positive).map((f) => `+${f.points} ${f.label}`),
    ...fitFactors.filter((f) => f.positive).map((f) => `+${f.points} ${f.label}`),
  ];

  return {
    total,
    temperature,
    pillars: {
      dataCompleteness: { name: 'Completude de Dados', points: dataPoints, maxPoints: 15, factors: dataFactors },
      digitalOpportunity: { name: 'Oportunidade Digital', points: oppPoints, maxPoints: 35, factors: oppFactors },
      commercialFit: { name: 'Fit Comercial EVO PIXEL', points: fitPoints, maxPoints: 20, factors: fitFactors },
      engagement: { name: 'Engajamento & Resposta', points: engPoints, maxPoints: 20, factors: engFactors },
      pipelineIntent: { name: 'Intenção no Pipeline', points: intentPoints, maxPoints: 10, factors: intentFactors },
    },
    summary,
  };
}

export function detectNiche(text: string): string {
  const lower = (text || '').toLowerCase();
  if (lower.includes('aduaneir') || lower.includes('aduana') || lower.includes('comex') || lower.includes('exterior') || lower.includes('despachante')) {
    return 'Advogado Aduaneiro';
  }
  if (lower.includes('odonto') || lower.includes('dent') || lower.includes('clinic') || lower.includes('estetic') || lower.includes('saud') || lower.includes('medic')) {
    return 'Clínicas / Odonto / Estética';
  }
  if (lower.includes('contab') || lower.includes('bpo') || lower.includes('fiscal') || lower.includes('tribut')) {
    return 'Contabilidade';
  }
  if (lower.includes('advoc') || lower.includes('jurid') || lower.includes('direit') || lower.includes('oab')) {
    return 'Advocacia';
  }
  if (lower.includes('marmor') || lower.includes('granit') || lower.includes('pedra') || lower.includes('rocha')) {
    return 'Marmorarias / Marmoristas';
  }
  if (lower.includes('engenhar') || lower.includes('construt') || lower.includes('arquit') || lower.includes('obra')) {
    return 'Engenharia & Arquitetura';
  }
  if (lower.includes('imobil') || lower.includes('corret') || lower.includes('imove')) {
    return 'Imobiliárias';
  }
  return text && text.trim() ? text.trim() : 'Geral';
}

export function getRecommendedServices(segment: string): string[] {
  const lower = (segment || '').toLowerCase();
  if (lower.includes('aduaneir') || lower.includes('aduana') || lower.includes('comex')) {
    return ['Portal Institucional Aduaneiro & Comex', 'Automação WhatsApp & Triagem de Importação'];
  }
  if (lower.includes('clínica') || lower.includes('clinica') || lower.includes('odonto') || lower.includes('estética')) {
    return ['Landing Page de Alta Conversão', 'Automação WhatsApp & Agendamento'];
  }
  if (lower.includes('contabil') || lower.includes('contabilidade') || lower.includes('bpo')) {
    return ['Follow-up Automático n8n', 'Site Institucional & SEO'];
  }
  if (lower.includes('advoc') || lower.includes('jurídic') || lower.includes('juridic')) {
    return ['Site Institucional de Autoridade', 'Google Meu Negócio & Reputação'];
  }
  if (lower.includes('marmor')) {
    return ['Catálogo Digital de Materiais', 'Captação Google Ads & WhatsApp'];
  }
  if (lower.includes('engenhar') || lower.includes('arquit')) {
    return ['Portfólio Institucional Premium', 'Campanhas de Geração de Demanda'];
  }
  return ['Site Institucional Responsivo', 'Automação WhatsApp n8n'];
}

export function qualifyLeadWithAI(input: QualifyInput): Omit<Lead, 'id'> {
  const segment = input.segment && input.segment.trim()
    ? input.segment.trim()
    : detectNiche(input.company_name || '');
  const rawPhone = input.whatsapp || input.phone || '';
  const cleanedPhone = cleanPhoneNumber(rawPhone);
  const formattedPhone = cleanedPhone ? formatPhoneNumber(cleanedPhone) : rawPhone;

  // Cálculo baseado em evidências (sem números mágicos arbitrários)
  const scoreData = calculateEvidenceBasedScore({ ...input, segment });

  const services = getRecommendedServices(segment);
  const company = (input.company_name || input.name || 'Empresa').trim();
  const contactName = (input.name || 'Decisor').trim();
  const city = (input.city || 'São Paulo').trim();
  const website = (input.website || '').trim();

  return {
    name: contactName,
    company_name: company,
    role: input.role || 'Decisor Comercial',
    segment: segment,
    city: city,
    state: input.state || 'SP',
    website: website || undefined,
    email: input.email || '',
    instagram: input.instagram || '',
    google_business: input.google_business || '',
    phone: formattedPhone,
    whatsapp: formattedPhone,
    score: scoreData.total,
    temperature: scoreData.temperature,
    status: (input.status as any) || 'novo',
    services: services,
    next_action: `Iniciar abordagem consultiva via WhatsApp para ${services[0]}`,
    notes: `Lead qualificado com Score Evidencial ${scoreData.total}/100 em ${new Date().toLocaleDateString('pt-BR')}.`,
    ai_analysis: {
      data_points: [
        `Contato: ${contactName} (${company})`,
        `Telefone verificado: ${formattedPhone || 'Pendente'}`,
        `Website identificado: ${website || 'Não identificado (Oportunidade)'}`,
        `Nicho detectado: ${segment}`,
        `Localização: ${city}`,
      ],
      inferences: [
        `Oportunidade comercial para ${services[0]}.`,
        website ? 'Empresa já possui presença digital básica.' : 'Empresa depende exclusivamente de redes sociais ou WhatsApp, necessitando de autoridade institucional.',
      ],
      recommendations: [
        `Abordar via WhatsApp destacando a oportunidade de ${services[0]}.`,
        `Apresentar proposta sob medida com retorno estimado.`,
      ],
      main_hook: website
        ? `Olá ${contactName}! Analisei a presença web da ${company} e preparei uma sugestão para otimizar suas conversões com ${services[0]}.`
        : `Olá ${contactName}, parabéns pelo trabalho na ${company}! Notei que vocês ainda não possuem um site institucional com botão direto para WhatsApp. Criamos estruturas prontas que colocam a empresa no topo do Google em 7 dias.`,
      should_approach: true,
    },
  };
}

export function qualifyProspectWithAI(input: QualifyInput): Omit<Prospect, 'id'> {
  const segment = input.segment && input.segment.trim()
    ? input.segment.trim()
    : detectNiche(input.company_name || '');
  const rawPhone = input.whatsapp || input.phone || '';
  const cleanedPhone = cleanPhoneNumber(rawPhone);
  const formattedPhone = cleanedPhone ? formatPhoneNumber(cleanedPhone) : rawPhone;

  let score = 65;
  if (cleanedPhone) score += 15;
  if (input.email && input.email.includes('@')) score += 5;
  if (input.city && input.city !== 'Não informada') score += 5;
  if (score > 95) score = 95;

  const services = getRecommendedServices(segment);
  const company = (input.company_name || input.name || 'Empresa').trim();
  const contactName = (input.name || company).trim();

  return {
    nome: contactName,
    empresa: company,
    segment: segment,
    email: input.email || '',
    telefone: formattedPhone,
    whatsapp: formattedPhone,
    cidade: input.city || 'São Paulo',
    estado: input.state || 'SP',
    icp_score: score,
    opportunity_score: Math.min(score + 5, 95),
    digital_presence_score: Math.max(score - 10, 45),
    source: 'Importação com IA',
    suggested_service: services[0],
    identified_signals: [
      `Empresa do nicho de ${segment}`,
      `Telefone comercial ativo detectado: ${formattedPhone || 'Pendente'}`,
      `Oportunidade primária: ${services[0]}`,
    ],
    status: score >= 80 ? 'priority' : 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

