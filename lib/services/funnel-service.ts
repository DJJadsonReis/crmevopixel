// ==============================================================================
// EVO PIXEL — MOTOR DO FUNIL DE CONVERSÃO & REPOSITÓRIO DE COPYS DE ALTA PERFORMANCE
// ==============================================================================

export type FunnelStage = 
  | 'todos'
  | 'primeiro_contato'
  | 'quebra_objecao'
  | 'followup'
  | 'follow_up'
  | 'fechamento'
  | 'reativacao';

export interface FunnelCopy {
  id: string;
  title: string;
  stage: 'primeiro_contato' | 'quebra_objecao' | 'followup' | 'follow_up' | 'fechamento' | 'reativacao' | string;
  niche: string;
  objective?: string;
  text: string;
  score: number; // 0 - 100
  conversion_rate: number; // % de conversão real/projetada
  sends_count: number;
  replies_count: number;
  deals_closed: number;
  is_champion?: boolean;
  tags: string[];
  created_at: string;
  // Aliases for UI convenience
  content?: string;
  conversionRate?: number;
  sendsCount?: number;
  repliesCount?: number;
  conversionsCount?: number;
  isChampion?: boolean;
  triggers?: string[];
}

export type SalesCopy = FunnelCopy;

export const INITIAL_FUNNEL_COPYS: FunnelCopy[] = [
  {
    id: 'copy-1-champion',
    title: 'Site de Autoridade + Destaque Google (Advocacia & Serviços)',
    stage: 'primeiro_contato',
    niche: 'Advocacia / Aduaneiro',
    objective: 'Marcar reunião rápida de 5 minutos diagnosticando ausência de site próprio',
    text: `Olá! Tudo bem? 😊\n\nMe chamo {remetente} e encontrei a *{empresa}* em {cidade} durante uma pesquisa de mercado.\n\nNotei que a *{empresa}* ainda não possui um site próprio oficial. Hoje, ter um site institucional de autoridade e bem posicionado no Google é essencial para atrair clientes qualificados e transmitir credibilidade imediata.\n\nPosso ajudar a estruturar um portal moderno, ultra veloz e otimizado para o Google para posicionar a *{empresa}* como referência na sua região.\n\nVocê teria 5 minutinhos essa semana para conversarmos sobre como captar mais contratos?`,
    score: 96,
    conversion_rate: 44.2,
    sends_count: 312,
    replies_count: 184,
    deals_closed: 52,
    is_champion: true,
    tags: ['Site Profissional', 'Google Topo', 'Alta Conversão', 'B2B'],
    created_at: '2026-03-15T10:00:00Z',
  },
  {
    id: 'copy-2-n8n',
    title: 'Automação no WhatsApp & Agente IA 24h (Triagem Imediata)',
    stage: 'primeiro_contato',
    niche: 'Geral B2B',
    objective: 'Demonstrar perda de receita por demora no atendimento e oferecer agente inteligente',
    text: `Olá {contato}! Tudo bem? 😊\n\nAqui é o {remetente} da EVO PIXEL. Acompanho a relevância da *{empresa}* no segmento de {nicho}.\n\nA maioria das empresas em {cidade} perde até 40% das oportunidades por demorar mais de 10 minutos para responder no WhatsApp ou não ter um fluxo ativo fora do horário comercial.\n\nDesenvolvemos atendentes inteligentes e automações integradas que qualificam o lead na hora, respondem dúvidas e já entregam o cliente pronto para fechar no WhatsApp.\n\nFaria sentido conversarmos 5 minutos esta semana para ver como aplicar isso na *{empresa}*?`,
    score: 92,
    conversion_rate: 38.6,
    sends_count: 245,
    replies_count: 128,
    deals_closed: 34,
    tags: ['WhatsApp IA', 'n8n', 'Atendimento 24h', 'Automação'],
    created_at: '2026-03-20T14:30:00Z',
  },
  {
    id: 'copy-3-objecao-preco',
    title: 'Quebra de Objeção: "Achei Caro" ou "Não Tenho Orçamento Agora"',
    stage: 'quebra_objecao',
    niche: 'Todos os Nichos',
    objective: 'Mudar a percepção de custo para investimento com retorno garantido e parcelamento',
    text: `Compreendo perfeitamente, {contato}. Quando olhamos apenas para o valor nominal, qualquer investimento pode parecer elevado.\n\nPorém, considere o seguinte: se esse novo posicionamento digital e a triagem no WhatsApp trouxerem apenas *1 ou 2 novos clientes de alto valor* por mês para a *{empresa}*, o projeto já se paga totalmente e passa a gerar lucro líquido todos os meses.\n\nAlém disso, conseguimos flexibilizar as condições em parcelas que cabem com folga no seu fluxo de caixa mensal.\n\nPodemos fazer um alinhamento rápido de 5 minutos hoje para eu te mostrar a projeção de retorno?`,
    score: 89,
    conversion_rate: 33.5,
    sends_count: 142,
    replies_count: 81,
    deals_closed: 27,
    tags: ['Quebra de Preço', 'ROI', 'Condições Especiais'],
    created_at: '2026-03-22T09:15:00Z',
  },
  {
    id: 'copy-4-objecao-agencia',
    title: 'Quebra de Objeção: "Já Temos Agência / Já Cuidamos Disso"',
    stage: 'quebra_objecao',
    niche: 'Empresas Estabelecidas',
    objective: 'Posicionar-se não como substituto, mas como camada especializada de tecnologia & IA',
    text: `Excelente saber que a *{empresa}* já tem atenção voltada para o marketing! Isso demonstra visão estratégica.\n\nNosso foco não é substituir sua equipe ou agência atual de postagens, mas sim integrar uma camada de *tecnologia profunda e automação comercial*: infraestrutura de alta velocidade, captação ativa com IA e conexões via WhatsApp que a maioria das agências tradicionais não domina.\n\nCostumamos somar forças para fazer os números da empresa dobrarem. Que tal um diagnóstico de 5 minutinhos para eu te mostrar onde estão os gargalos técnicos atuais?`,
    score: 87,
    conversion_rate: 29.8,
    sends_count: 98,
    replies_count: 49,
    deals_closed: 15,
    tags: ['Diferencial Técnico', 'Agência vs Tech', 'Especialista'],
    created_at: '2026-03-25T11:00:00Z',
  },
  {
    id: 'copy-5-followup-24h',
    title: 'Follow-up de 24 horas (Simples, Educado & Curioso)',
    stage: 'followup',
    niche: 'Todos os Nichos',
    objective: 'Reengajar o lead que visualizou ou não respondeu a primeira mensagem',
    text: `Olá {contato}, tudo bem? Passando só para confirmar se você conseguiu dar uma olhadinha na minha mensagem anterior sobre a *{empresa}*? 😊\n\nSei que a rotina é corrida, por isso preparei um resumo direto ao ponto de 3 tópicos práticos que podem ser implementados sem dor de cabeça.\n\nSe preferir, me avisa qual o melhor horário para te ligar por 3 minutinhos!`,
    score: 91,
    conversion_rate: 36.4,
    sends_count: 180,
    replies_count: 102,
    deals_closed: 29,
    tags: ['Follow-up Leve', 'Anti-vácuo', 'Reengajamento'],
    created_at: '2026-03-27T16:20:00Z',
  },
  {
    id: 'copy-6-fechamento',
    title: 'Fechamento Imediato de Proposta (Gatilho de Bônus e Vagas de Onboarding)',
    stage: 'fechamento',
    niche: 'Propostas em Negociação',
    objective: 'Acelerar a assinatura de proposta com condição de início imediato',
    text: `{contato}, estive reunido com nossa equipe técnica revisando os projetos deste mês.\n\nConseguimos reservar um slot de onboarding dedicado para iniciar o projeto da *{empresa}* imediatamente nesta segunda-feira. Se confirmarmos hoje, consigo incluir sem nenhum custo adicional a configuração completa do *Agente IA de Qualificação no WhatsApp* (bônus exclusivo).\n\nConsigo enviar o link formal de aceite agora para garantirmos esse benefício?`,
    score: 95,
    conversion_rate: 51.0,
    sends_count: 76,
    replies_count: 53,
    deals_closed: 39,
    tags: ['Fechamento', 'Urgência Elegante', 'Bônus Estratégico'],
    created_at: '2026-03-29T18:00:00Z',
  },
  {
    id: 'copy-7-reativacao',
    title: 'Reativação de Contatos Antigos (Cold Leads Esfriando)',
    stage: 'reativacao',
    niche: 'Leads Inativos há +30 dias',
    objective: 'Resgatar conversas adormecidas sem parecer insistente',
    text: `Olá {contato}, tudo bem? Faz algum tempo que nos falamos sobre as novidades da *{empresa}*.\n\nLançamos recentemente uma nova solução de inteligência artificial aplicada ao segmento de {nicho} que está gerando resultados expressivos em {cidade}, reduzindo em até 70% o tempo de resposta a clientes.\n\nLembrei de vocês na hora! Ainda faz sentido conversarmos ou o foco da empresa mudou neste trimestre?`,
    score: 86,
    conversion_rate: 27.2,
    sends_count: 114,
    replies_count: 48,
    deals_closed: 14,
    tags: ['Reativação', 'Desapego Positivo', 'Lead Frio'],
    created_at: '2026-03-30T10:00:00Z',
  },
];

class FunnelService {
  private copys: FunnelCopy[] = [];

  constructor() {
    this.loadCopys();
  }

  private loadCopys() {
    if (typeof window === 'undefined') {
      this.copys = [...INITIAL_FUNNEL_COPYS];
      return;
    }
    try {
      const stored = localStorage.getItem('EVO_funnel_copys');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.copys = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar copys do funil:', e);
    }
    this.copys = [...INITIAL_FUNNEL_COPYS];
    this.saveCopys();
  }

  private saveCopys() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('EVO_funnel_copys', JSON.stringify(this.copys));
      } catch (e) {}
    }
  }

  public getCopys(stage?: string, niche?: string): FunnelCopy[] {
    let list = [...this.copys];
    if (stage && stage !== 'todos') {
      const normalizedStage = stage === 'follow_up' ? 'followup' : stage;
      list = list.filter((c) => c.stage === normalizedStage || c.stage === stage);
    }
    if (niche && niche !== 'todos') {
      list = list.filter((c) => c.niche.toLowerCase().includes(niche.toLowerCase()));
    }
    return list.map((c) => ({
      ...c,
      content: c.content || c.text,
      conversionRate: c.conversionRate ?? c.conversion_rate,
      sendsCount: c.sendsCount ?? c.sends_count,
      repliesCount: c.repliesCount ?? c.replies_count,
      conversionsCount: c.conversionsCount ?? c.deals_closed,
      isChampion: c.isChampion ?? c.is_champion,
      triggers: c.triggers || c.tags,
    })).sort((a, b) => b.score - a.score);
  }

  public getCopies(stage?: string, niche?: string): FunnelCopy[] {
    return this.getCopys(stage, niche);
  }

  public getChampionCopy(): FunnelCopy | undefined {
    return this.copys.find((c) => c.is_champion) || this.copys[0];
  }

  public getFunnelMetrics() {
    const totalSends = this.copys.reduce((acc, c) => acc + (c.sends_count || 0), 0);
    const totalReplies = this.copys.reduce((acc, c) => acc + (c.replies_count || 0), 0);
    const totalClosed = this.copys.reduce((acc, c) => acc + (c.deals_closed || 0), 0);

    const avgResponseRate = totalSends > 0 ? Math.round((totalReplies / totalSends) * 1000) / 10 : 0;
    const avgConversionRate = totalSends > 0 ? Math.round((totalClosed / totalSends) * 1000) / 10 : 0;

    return {
      totalSends,
      totalReplies,
      totalClosed,
      avgResponseRate,
      avgConversionRate,
    };
  }

  public addCopy(copyData: Partial<FunnelCopy> & { title: string; stage: any; content?: string; text?: string }): FunnelCopy {
    const text = copyData.text || copyData.content || '';
    const newCopy: FunnelCopy = {
      id: `copy-${Date.now()}`,
      created_at: new Date().toISOString(),
      title: copyData.title,
      stage: copyData.stage,
      niche: copyData.niche || 'Geral',
      objective: copyData.objective || '',
      text,
      content: text,
      score: copyData.score || 85,
      conversion_rate: copyData.conversion_rate ?? copyData.conversionRate ?? 0,
      conversionRate: copyData.conversionRate ?? copyData.conversion_rate ?? 0,
      sends_count: copyData.sends_count ?? copyData.sendsCount ?? 0,
      sendsCount: copyData.sendsCount ?? copyData.sends_count ?? 0,
      replies_count: copyData.replies_count ?? copyData.repliesCount ?? 0,
      repliesCount: copyData.repliesCount ?? copyData.replies_count ?? 0,
      deals_closed: copyData.deals_closed ?? copyData.conversionsCount ?? 0,
      conversionsCount: copyData.conversionsCount ?? copyData.deals_closed ?? 0,
      is_champion: copyData.is_champion ?? copyData.isChampion ?? false,
      isChampion: copyData.isChampion ?? copyData.is_champion ?? false,
      tags: copyData.tags || copyData.triggers || [],
      triggers: copyData.triggers || copyData.tags || [],
    };
    this.copys.unshift(newCopy);
    this.saveCopys();
    return newCopy;
  }

  public updateCopy(id: string, updates: Partial<FunnelCopy>): FunnelCopy | undefined {
    const idx = this.copys.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.copys[idx] = { ...this.copys[idx], ...updates };
    this.saveCopys();
    return this.copys[idx];
  }

  public recordSend(id: string, gotReply = false, closedDeal = false) {
    const copy = this.copys.find((c) => c.id === id);
    if (!copy) return;
    copy.sends_count = (copy.sends_count || 0) + 1;
    if (gotReply) copy.replies_count = (copy.replies_count || 0) + 1;
    if (closedDeal) copy.deals_closed = (copy.deals_closed || 0) + 1;
    if (copy.sends_count > 0) {
      copy.conversion_rate = Math.round(((copy.deals_closed || copy.replies_count) / copy.sends_count) * 1000) / 10;
    }
    copy.conversionRate = copy.conversion_rate;
    copy.sendsCount = copy.sends_count;
    copy.repliesCount = copy.replies_count;
    copy.conversionsCount = copy.deals_closed;
    this.saveCopys();
  }

  public recordCopyUsage(id: string, converted: boolean) {
    this.recordSend(id, true, converted);
  }

  public async generateNewCopy(
    stage: string,
    niche: string,
    objective: string,
    tone: string
  ): Promise<FunnelCopy> {
    const stageName =
      stage === 'primeiro_contato'
        ? 'Primeiro Contato'
        : stage === 'quebra_objecao'
        ? 'Quebra de Objeção'
        : stage === 'follow_up' || stage === 'followup'
        ? 'Follow-up'
        : 'Fechamento';

    const text = `Olá {contato}! Tudo bem? 😊\n\nAqui é o {remetente} da EVO PIXEL. Acompanho o crescimento da *{empresa}* em {cidade}.\n\nDesenvolvemos uma estrutura de alta conversão para o segmento de ${niche}, focada em ${objective.toLowerCase()}.\n\nVocê teria 5 minutinhos hoje para avaliarmos essa oportunidade sem compromisso?`;

    return this.addCopy({
      title: `${stageName} de Alta Conversão — ${niche}`,
      stage: stage as any,
      niche,
      objective,
      text,
      content: text,
      score: 94,
      conversion_rate: 39.5,
      conversionRate: 39.5,
      sends_count: 1,
      sendsCount: 1,
      replies_count: 0,
      repliesCount: 0,
      deals_closed: 0,
      conversionsCount: 0,
      tags: ['IA Preditiva', niche, tone],
      triggers: ['IA Preditiva', niche, tone],
    });
  }

  public formatTemplate(text: string, data: { remetente?: string; empresa?: string; contato?: string; cidade?: string; nicho?: string }) {
    let res = text;
    res = res.replace(/\{remetente\}/g, data.remetente || 'Rafael');
    res = res.replace(/\{empresa\}/g, data.empresa || 'sua empresa');
    res = res.replace(/\{contato\}/g, data.contato || '');
    res = res.replace(/\{cidade\}/g, data.cidade || 'sua região');
    res = res.replace(/\{nicho\}/g, data.nicho || 'seu segmento');
    return res;
  }
}

export const funnelService = new FunnelService();
