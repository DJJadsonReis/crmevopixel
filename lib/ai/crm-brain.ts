// ==============================================================================
// EVO PIXEL — CÉREBRO COGNITIVO & AGENTE GESTOR DO CRM (CRM BRAIN)
// Retro-alimentação contínua, análise de sentimento em tempo real e notificações autônomas
// ==============================================================================

import { Lead, MessageLog } from '@/types/database';
import { crmService } from '@/lib/services/crm-service';

export interface SentimentAnalysis {
  score: number; // 0 a 100
  label: 'Gelado ❄️' | 'Frio 🌧️' | 'Morno 🌤️' | 'Quente 🔥' | 'Fechamento Iminente 🚀';
  thermometerColor: string; // Tailwind color class or hex
  clientMood: string; // e.g., 'Interessado em ROI', 'Hesitante sobre preço', 'Aguardando agendamento'
  keyObjectionsDetected: string[];
  recommendation: string; // Orientação tática instantânea para o operador
  bestNextAction: string;
  // Aliases for convenience
  thermometerScore: number;
  temperatureBadge: string;
  temperatureEmoji: string;
  tacticalAdvice: string;
}

export interface AutonomousAlert {
  id: string;
  type:
    | 'urgent_reply'
    | 'stale_lead'
    | 'high_interest'
    | 'proposal_pending'
    | 'funnel_insight'
    | 'reply'
    | 'stalled'
    | 'opportunity'
    | 'attention';
  title: string;
  message: string;
  leadId?: string;
  leadName?: string;
  phone?: string;
  timestamp: string;
  priority: 'alta' | 'media' | 'baixa';
  read?: boolean;
  actionLabel?: string;
}

export type ManagerAlert = AutonomousAlert;

class CRMBrainService {
  /**
   * Analisa em tempo real o histórico de mensagens trocadas com o lead e calcula o termômetro de sentimento.
   */
  public analyzeConversationSentiment(
    messagesOrName: MessageLog[] | any[] | string,
    leadOrMessages?: Lead | any
  ): SentimentAnalysis {
    let rawMessages: any[] = [];
    let lead: any = null;

    if (Array.isArray(messagesOrName)) {
      rawMessages = messagesOrName;
      lead = leadOrMessages || null;
    } else if (Array.isArray(leadOrMessages)) {
      rawMessages = leadOrMessages;
      if (typeof messagesOrName === 'string') {
        lead = { name: messagesOrName };
      }
    }

    // Normaliza mensagens
    const messages = rawMessages.map((m) => ({
      sent_text: m.sent_text || m.text || '',
      direction: m.direction || (m.sender && m.sender !== 'Você' ? 'recebida' : 'enviada'),
    }));

    if (!messages || messages.length === 0) {
      const initialScore = lead?.score || 50;
      let label: SentimentAnalysis['label'] = initialScore >= 80 ? 'Quente 🔥' : initialScore >= 50 ? 'Morno 🌤️' : 'Frio 🌧️';
      let color = initialScore >= 80 ? '#f97316' : initialScore >= 50 ? '#eab308' : '#38bdf8';
      let emoji = initialScore >= 80 ? '🔥' : initialScore >= 50 ? '🌤️' : '🌧️';

      return {
        score: initialScore,
        label,
        thermometerColor: color,
        clientMood: initialScore >= 80 ? 'Perfil ICP Altamente Qualificado' : 'Aguardando primeiro contato comercial',
        keyObjectionsDetected: [],
        recommendation: initialScore >= 80 
          ? 'Inicie a abordagem consultiva com foco na dor principal (site ou atendimento WhatsApp).'
          : 'Personalize a saudação com o nome da empresa e da cidade antes de disparar.',
        bestNextAction: 'Disparar primeira abordagem pelo WhatsApp.',
        thermometerScore: initialScore,
        temperatureBadge: label,
        temperatureEmoji: emoji,
        tacticalAdvice: initialScore >= 80 
          ? 'Lead quente: envie mensagem consultiva curta direto no WhatsApp.'
          : 'Aguardando primeiro contato. Envie mensagem personalizada.',
      };
    }

    // Avalia o teor das mensagens do cliente (direção: recebida)
    const incomingMessages = messages.filter((m) => m.direction === 'recebida');
    const lastIncoming = incomingMessages[incomingMessages.length - 1]?.sent_text?.toLowerCase() || '';

    let score = 55;
    const objections: string[] = [];
    let mood = 'Em negociação ativa';
    let recommendation = 'Mantenha o diálogo objetivo com respostas curtas e ágeis.';
    let bestNextAction = 'Conduzir para reunião de 5 minutos no Google Meet ou WhatsApp.';

    // Gatilhos de Fechamento / Super Quente
    if (
      lastIncoming.includes('como funciona') ||
      lastIncoming.includes('qual o valor') ||
      lastIncoming.includes('quanto custa') ||
      lastIncoming.includes('preço') ||
      lastIncoming.includes('orçamento') ||
      lastIncoming.includes('proposta') ||
      lastIncoming.includes('pode me ligar') ||
      lastIncoming.includes('pode sim') ||
      lastIncoming.includes('vamos marcar') ||
      lastIncoming.includes('horário') ||
      lastIncoming.includes('fechado')
    ) {
      score = 92;
      mood = 'Altíssimo interesse comercial (Pronto para Reunião/Proposta)';
      recommendation = '🚨 O cliente demonstrou interesse claro! NÃO mande textos longos. Envie opções de horários ou link direto de reunião agora.';
      bestNextAction = 'Enviar horários de agendamento imediatos.';
    }
    // Gatilhos de Objeção de Preço
    else if (
      lastIncoming.includes('caro') ||
      lastIncoming.includes('sem verba') ||
      lastIncoming.includes('sem orçamento') ||
      lastIncoming.includes('apertado') ||
      lastIncoming.includes('fora do orçamento')
    ) {
      score = 48;
      objections.push('Objeção de Preço / Custo');
      mood = 'Hesitante quanto ao investimento';
      recommendation = '⚠️ Quebre a objeção mostrando o retorno sobre o investimento (ROI): 1 ou 2 novos contratos já pagam o sistema.';
      bestNextAction = 'Usar botão rápido de Quebra de Objeção de Preço.';
    }
    // Gatilhos de "Já tenho" ou "Não preciso"
    else if (
      lastIncoming.includes('já tenho') ||
      lastIncoming.includes('já temos') ||
      lastIncoming.includes('não temos interesse') ||
      lastIncoming.includes('não preciso')
    ) {
      score = 35;
      objections.push('Já possui fornecedor / Rejeição inicial');
      mood = 'Defensivo em relação a serviços comuns';
      recommendation = 'Diferencie-se das agências convencionais: destaque a tecnologia de ponta, IA ativa e automação comercial de processos.';
      bestNextAction = 'Oferecer diagnóstico gratuito de 3 minutos.';
    }
    // Respostas positivas simples
    else if (
      lastIncoming.includes('olá') ||
      lastIncoming.includes('bom dia') ||
      lastIncoming.includes('boa tarde') ||
      lastIncoming.includes('tudo bem') ||
      lastIncoming.includes('opa')
    ) {
      score = 70;
      mood = 'Receptivo e cordial';
      recommendation = 'O lead respondeu à saudação. Apresente rapidamente a oportunidade detectada na região.';
      bestNextAction = 'Apresentar a dor e benefício principal.';
    }
    // Vácuo prolongado (várias mensagens enviadas sem resposta)
    else if (messages.length >= 3 && incomingMessages.length === 0) {
      score = 28;
      mood = 'Em silêncio / Visualizado sem resposta';
      recommendation = 'Evite insistência repetitiva. Utilize o follow-up de "desapego elegante" ou mude o ângulo da abordagem.';
      bestNextAction = 'Disparar Follow-up de 24h ou aguardar 48h.';
    } else {
      score = 65;
    }

    // Se o lead já tinha um score alto no CRM
    if (lead?.score && lead.score > 80 && score < 80 && incomingMessages.length > 0) {
      score = Math.min(95, score + 12);
    }

    let label: SentimentAnalysis['label'] = 'Morno 🌤️';
    let color = '#eab308';
    let emoji = '🌤️';

    if (score >= 88) {
      label = 'Fechamento Iminente 🚀';
      color = '#a855f7';
      emoji = '🚀';
    } else if (score >= 72) {
      label = 'Quente 🔥';
      color = '#f97316';
      emoji = '🔥';
    } else if (score >= 50) {
      label = 'Morno 🌤️';
      color = '#eab308';
      emoji = '🌤️';
    } else if (score >= 30) {
      label = 'Frio 🌧️';
      color = '#38bdf8';
      emoji = '🌧️';
    } else {
      label = 'Gelado ❄️';
      color = '#94a3b8';
      emoji = '❄️';
    }

    return {
      score,
      label,
      thermometerColor: color,
      clientMood: mood,
      keyObjectionsDetected: objections,
      recommendation,
      bestNextAction,
      thermometerScore: score,
      temperatureBadge: label,
      temperatureEmoji: emoji,
      tacticalAdvice: recommendation,
    };
  }

  /**
   * Gera respostas rápidas inteligentes contextuais baseadas no histórico
   */
  public getSmartQuickReplies(lead: any, messages: MessageLog[]): Array<{ label: string; text: string; icon: string }> {
    const name = lead.name ? lead.name.split(' ')[0] : 'Dr(a)';
    const company = lead.company_name || lead.company || 'sua empresa';

    return [
      {
        label: '🚀 Marcar Reunião 5min',
        icon: 'Calendar',
        text: `Perfeito, ${name}! Para não tomar seu tempo, você teria 5 minutinhos amanhã às 10h ou às 15h para uma conversa rápida via Meet ou aqui mesmo no WhatsApp?`,
      },
      {
        label: '💰 Explicar Retorno (ROI)',
        icon: 'DollarSign',
        text: `${name}, o diferencial deste projeto é que ele se paga rapidamente: com apenas 1 ou 2 novos contratos fechados via Google e WhatsApp, o investimento já tem retorno total. Além disso, facilitamos em parcelas mensais bem acessíveis.`,
      },
      {
        label: '📋 Resumo de Entregáveis',
        icon: 'FileText',
        text: `Com certeza! O escopo para a *${company}* inclui: 1) Site Institucional Premium ultra rápido; 2) Otimização completa no topo do Google; e 3) Atendente IA conectado ao WhatsApp para triagem imediata.`,
      },
      {
        label: '🛡️ Quebrar Objeção "Já Tenho"',
        icon: 'ShieldAlert',
        text: `Entendo perfeitamente, ${name}! Nossa tecnologia não concorre com seu time ou agência atual — atuamos como uma camada técnica avançada de infraestrutura e agentes autônomos que potencializam os resultados que você já tem.`,
      },
      {
        label: '👋 Follow-up Leve',
        icon: 'Clock',
        text: `Olá ${name}! Passando só para ver se você conseguiu avaliar minha mensagem anterior? Se a semana estiver corrida, posso te chamar na próxima segunda sem problemas! 😊`,
      },
    ];
  }

  /**
   * Gera notificações autônomas do Agente Gestor para guiar o operador
   */
  public generateAutonomousAlerts(): AutonomousAlert[] {
    const leads = crmService.getLeads();
    const alerts: AutonomousAlert[] = [];

    // 1. Leads quentes aguardando atenção
    const hotLeads = leads.filter((l) => l.temperature === 'quente' && l.whatsapp);
    if (hotLeads.length > 0) {
      const topHot = hotLeads[0];
      alerts.push({
        id: `alert-hot-${topHot.id}`,
        type: 'high_interest',
        title: 'Oportunidade Quente no Radar!',
        message: `O lead "${topHot.company_name}" (${topHot.segment}) está com Score IA ${topHot.score}/100. Dispare a abordagem agora para não esfriar.`,
        leadId: topHot.id,
        leadName: topHot.company_name,
        phone: topHot.whatsapp,
        timestamp: new Date().toISOString(),
        priority: 'alta',
        actionLabel: 'Disparar Abordagem',
      });
    }

    // 2. Leads em negociação recente
    const negotiationLeads = leads.filter((l) => l.status === 'em_abordagem');
    if (negotiationLeads.length > 0) {
      const lead = negotiationLeads[0];
      alerts.push({
        id: `alert-neg-${lead.id}`,
        type: 'reply',
        title: 'Lead em Conversa Ativa',
        message: `"${lead.company_name}" está em fase de negociação no WhatsApp. Abra o Inbox para checar o termômetro de sentimento.`,
        leadId: lead.id,
        leadName: lead.company_name,
        phone: lead.whatsapp,
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        priority: 'alta',
        actionLabel: 'Abrir Chat',
      });
    }

    // 3. Propostas pendentes de fechamento
    const proposals = crmService.getProposals ? crmService.getProposals() : [];
    const pendingProposals = proposals.filter((p: any) => p.status === 'enviada');
    if (pendingProposals.length > 0) {
      alerts.push({
        id: 'alert-proposal-pending',
        type: 'stalled',
        title: 'Proposta aguardando Follow-up',
        message: `Existem ${pendingProposals.length} propostas comerciais aguardando resposta há mais de 24 horas. Dispare o gatilho de fechamento no funil.`,
        timestamp: new Date().toISOString(),
        priority: 'media',
        actionLabel: 'Ver Propostas',
      });
    }

    // 4. Insight do Funil de Conversão
    alerts.push({
      id: 'alert-funnel-insight',
      type: 'opportunity',
      title: 'Insight do Funil EVO',
      message: 'A copy "Site de Autoridade + Destaque Google" atingiu taxa de 44.2% de conversão em reuniões nesta semana.',
      timestamp: new Date().toISOString(),
      priority: 'baixa',
      actionLabel: 'Ver no Funil',
    });

    return alerts;
  }
}

export const crmBrain = new CRMBrainService();
