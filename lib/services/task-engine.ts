import {
  Lead,
  AutomationTask,
  TaskAudienceFilter,
  TaskBatchConfig,
  TaskRecipientRecord,
  TaskProgressStats,
  TaskExecutionLogItem,
  AIPrompt,
} from '@/types/database';

export interface FilterResult {
  eligibleLeads: Lead[];
  summary: {
    total_selected: number;
    valid_whatsapp: number;
    invalid_whatsapp: number;
    suppressed: number;
    duplicates: number;
    eligible: number;
  };
}

export class TaskEngine {
  /**
   * Filtra leads com base nas regras de audiência e calcula resumo com precisão
   */
  public filterAudience(allLeads: Lead[], filter: TaskAudienceFilter): FilterResult {
    const seenPhones = new Set<string>();
    let totalSelected = 0;
    let validWhatsappCount = 0;
    let invalidWhatsappCount = 0;
    let suppressedCount = 0;
    let duplicatesCount = 0;
    const eligibleLeads: Lead[] = [];

    for (const lead of allLeads) {
      // 1. Filtro por Cidades
      if (filter.cities && filter.cities.length > 0) {
        if (!lead.city || !filter.cities.includes(lead.city)) continue;
      }

      // 2. Filtro por Segmentos / Nichos
      if (filter.segments && filter.segments.length > 0) {
        if (!lead.segment || !filter.segments.includes(lead.segment)) continue;
      }

      // 3. Filtro por Status
      if (filter.statuses && filter.statuses.length > 0) {
        if (!filter.statuses.includes(lead.status)) continue;
      }

      // 4. Filtro por Tags (Post-it)
      if (filter.tags && filter.tags.length > 0) {
        const leadTags = lead.tags || [];
        const hasTag = filter.tags.some((t) => leadTags.includes(t));
        if (!hasTag) continue;
      }

      // 5. Filtro por Score
      if (filter.min_score !== undefined && lead.score < filter.min_score) continue;
      if (filter.max_score !== undefined && lead.score > filter.max_score) continue;

      // 6. Filtro por Presença Web
      if (filter.has_website === true && !lead.website) continue;
      if (filter.has_website === false && lead.website) continue;
      if (filter.broken_website === true) {
        const isBroken =
          lead.site_health_status === 'OFFLINE' ||
          lead.site_health_status === 'DNS_ERROR' ||
          lead.site_health_status === 'SSL_ERROR' ||
          lead.site_health_status === 'APPLICATION_ERROR' ||
          lead.site_health_status === 'CRITICAL' ||
          lead.site_health_status === 'PARTIALLY_BROKEN';
        if (!isBroken) continue;
      }

      // 7. Filtro por Resposta
      if (filter.responded === true) {
        if (lead.sequence_progress?.status !== 'respondido' && lead.status !== 'em_conversa') continue;
      }

      // 8. Filtro por Nunca Contatado
      if (filter.never_contacted === true) {
        if (lead.last_contact_at || (lead.sequence_progress && lead.sequence_progress.status !== 'aguardando_envio')) {
          continue;
        }
      }

      // 9. Filtro por Busca Textual
      if (filter.search_query && filter.search_query.trim()) {
        const q = filter.search_query.toLowerCase();
        const matches =
          lead.name.toLowerCase().includes(q) ||
          lead.company_name.toLowerCase().includes(q) ||
          lead.city?.toLowerCase().includes(q) ||
          lead.segment?.toLowerCase().includes(q);
        if (!matches) continue;
      }

      totalSelected++;

      // Validação do Telefone WhatsApp
      const rawPhone = (lead.whatsapp || lead.phone || '').replace(/\D/g, '');
      const hasValidPhone = rawPhone.length >= 10 && rawPhone.length <= 13;

      if (!hasValidPhone) {
        invalidWhatsappCount++;
        continue;
      }

      validWhatsappCount++;

      // Checa Supressão / Bloqueio / Opt-out
      if (lead.suppression_status === 'opt_out' || lead.suppression_status === 'blocked') {
        suppressedCount++;
        continue;
      }

      // Checa Duplicidade na mesma campanha
      if (seenPhones.has(rawPhone)) {
        duplicatesCount++;
        continue;
      }

      seenPhones.add(rawPhone);
      eligibleLeads.push(lead);
    }

    return {
      eligibleLeads,
      summary: {
        total_selected: totalSelected,
        valid_whatsapp: validWhatsappCount,
        invalid_whatsapp: invalidWhatsappCount,
        suppressed: suppressedCount,
        duplicates: duplicatesCount,
        eligible: eligibleLeads.length,
      },
    };
  }

  /**
   * Verifica se o momento atual está dentro da janela operacional permitida (ex: 09:00 - 18:00)
   */
  public isWithinOperationalHours(config: TaskBatchConfig): boolean {
    const now = new Date();
    // Horário de Brasília UTC-3
    const utcHours = now.getUTCHours();
    const brHours = (utcHours - 3 + 24) % 24;
    const brMinutes = now.getUTCMinutes();
    const currentMinutesOfDay = brHours * 60 + brMinutes;

    const [startH, startM] = (config.start_time_window || '09:00').split(':').map(Number);
    const [endH, endM] = (config.end_time_window || '18:00').split(':').map(Number);

    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    // Checa finais de semana (0 = Domingo, 6 = Sábado)
    const dayOfWeek = now.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend && !config.allow_weekends) {
      return false;
    }

    return currentMinutesOfDay >= startMinutes && currentMinutesOfDay <= endMinutes;
  }

  /**
   * Substitui variáveis de tag na mensagem
   */
  public substituteVariables(template: string, lead: Lead): string {
    let text = template;
    const firstName = (lead.name || '').split(' ')[0] || 'Tudo bem?';
    const mainDiagnosis = lead.enrichment_data?.diagnosis?.[0] || 'otimização da sua presença digital';
    const mainOpportunity = lead.enrichment_data?.opportunities?.[0] || 'aumento no volume de clientes qualificados';

    const replacements: Record<string, string> = {
      '{{nome}}': firstName,
      '{{nome_completo}}': lead.name || 'Cliente',
      '{{empresa}}': lead.company_name || 'sua empresa',
      '{{cidade}}': lead.city || 'sua região',
      '{{segmento}}': lead.segment || 'seu nicho',
      '{{site}}': lead.website || '',
      '{{diagnostico}}': mainDiagnosis,
      '{{oportunidade}}': mainOpportunity,
      '{{score}}': String(lead.score || 0),
    };

    for (const [key, val] of Object.entries(replacements)) {
      text = text.replaceAll(key, val);
    }

    return text;
  }

  /**
   * Gera texto altamente personalizado pela IA para o lead com base no seu diagnóstico e System Prompt
   */
  public generatePersonalizedCopy(lead: Lead, task: Partial<AutomationTask>, systemPromptText?: string): string {
    const firstName = (lead.name || '').split(' ')[0] || 'Dr(a)';
    const company = lead.company_name;
    const enrich = lead.enrichment_data;
    const audit = lead.technical_audit;
    const objective = task.ai_copy_config?.objective || 'prospeccao';

    // Se temos gancho personalizado da IA no diagnóstico do lead, prioriza ele
    if (enrich?.sales_hooks && enrich.sales_hooks.length > 0) {
      return `Olá, ${firstName}! ${enrich.sales_hooks[0]}`;
    }

    // Se site está quebrado/com erro
    if (audit && (audit.site_health_status === 'OFFLINE' || audit.site_health_status === 'APPLICATION_ERROR' || audit.site_health_status === 'DNS_ERROR' || audit.site_health_status === 'CRITICAL')) {
      return `Olá ${firstName}, tudo bem? Notei que o site da *${company}* está fora do ar no momento, o que pode estar fazendo vocês perderem clientes que buscam no Google. Temos como restaurar isso hoje mesmo. Posso te passar um diagnóstico rápido?`;
    }

    if (audit && (audit.site_health_status === 'MAINTENANCE_REQUIRED' || audit.site_health_status === 'PARTIALLY_BROKEN' || audit.response_time_ms > 2500)) {
      return `Olá ${firstName}! Analisei o site da *${company}* e identifiquei um tempo de carregamento alto no mobile (${audit.response_time_ms}ms), o que reduz as conversões. Preparamos uma correção para acelerar o site em até 3x. Gostaria de ver o relatório?`;
    }

    if (!lead.website) {
      return `Olá ${firstName}, parabéns pelo trabalho na *${company}* em ${lead.city}! Notei que vocês ainda não possuem um site institucional com botão direto para WhatsApp, dependendo apenas do Instagram. Criamos estruturas prontas que colocam a empresa no topo do Google em 7 dias. Você teria 5 minutos para ver uma prévia?`;
    }

    // Padrão consultivo de alto impacto
    return `Olá ${firstName}, espero que esteja tudo bem! Estive analisando a presença digital da *${company}* em ${lead.city} e identifiquei 2 oportunidades claras para acelerar o recebimento de leads qualificados no WhatsApp. Se fizer sentido, posso te mandar um áudio de 1 minuto explicando como funciona?`;
  }
}

export const taskEngine = new TaskEngine();
