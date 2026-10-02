import { CompanyPersona, DEFAULT_COMPANY_PERSONA } from '@/types/persona';
import { Lead } from '@/types/database';
import { aiProvider } from '@/lib/ai/ai-provider';
import { createClient } from '@/utils/supabase/client';

export class AgentContextBuilder {
  private static cachedPersona: CompanyPersona | null = null;

  public static getPersona(): CompanyPersona {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('evocrm_company_persona');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.company_name) {
            const persona: CompanyPersona = { ...DEFAULT_COMPANY_PERSONA, ...parsed };
            this.cachedPersona = persona;
            return persona;
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar Persona do localStorage:', e);
      }
    }
    return this.cachedPersona || DEFAULT_COMPANY_PERSONA;
  }

  public static async savePersona(persona: CompanyPersona): Promise<CompanyPersona> {
    this.cachedPersona = persona;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('evocrm_company_persona', JSON.stringify(persona));
      } catch (e) {
        console.warn('Erro ao salvar Persona no localStorage:', e);
      }

      try {
        const supabase = createClient();
        await supabase
          .from('system_settings')
          .update({
            metadata: {
              company_persona: persona,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', 'default');
      } catch (e) {
        // Silencioso em caso de tabela inexistente
      }
    }
    return persona;
  }

  /**
   * Constrói o System Prompt oficial para atendimento no WhatsApp e Agente Comercial
   */
  public static buildSystemPrompt(lead?: Lead): string {
    const persona = this.getPersona();
    const forbidden = persona.forbidden_terms?.filter(Boolean).join(', ') || 'EVO PIXEL, grátis, barato';
    const servicesList = persona.services?.filter(Boolean).map((s) => `- ${s}`).join('\n') || '- Sites e Automação';

    let leadContext = '';
    if (lead) {
      leadContext = `
DADOS DO LEAD EM ATENDIMENTO:
- Nome do Contato: ${lead.name || 'Contato'}
- Empresa: ${lead.company_name || 'Empresa'}
- Segmento: ${lead.segment || 'Geral'}
- Cidade/UF: ${lead.city || 'São Paulo'} / ${lead.state || 'SP'}
- Possui Site: ${lead.website ? `Sim (${lead.website})` : 'Não possui site oficial'}
- Status Comercial: ${lead.status || 'novo'}
- Temperatura: ${lead.temperature || 'morno'}
- Score ICP: ${lead.score || 70}/100
`;
    }

    return `Você é o Atendente Comercial e Estrategista Digital da empresa "${persona.company_name}".
${persona.slogan ? `Posicionamento da empresa: "${persona.slogan}".` : ''}
Segmento de atuação: ${persona.segment}.

MISSÃO PRINCIPAL:
Conduzir conversas com potenciais clientes no WhatsApp de forma humana, consultiva, respeitosa e focada em qualificação e agendamento de reuniões/demonstrações.

DIRETRIZES DE COMUNICAÇÃO:
1. TOM DE VOZ: ${persona.tone_of_voice.toUpperCase()} (profissional, acolhedor, objetivo, sem parecer um robô ou spam).
2. NUNCA mencione os seguintes TERMOS PROIBIDOS sob qualquer hipótese: [${forbidden}].
3. Nunca invente dados técnicos falsos. Se não souber algo específico, ofereça conectar com um especialista humano da equipe.
4. SERVIÇOS OFERECIDOS PELA NOSSA EMPRESA:
${servicesList}

CHAMADA PARA AÇÃO (CTA) PADRÃO:
"${persona.standard_cta}"

REGRAS DE TRANSBORDO HUMANO:
${persona.human_handover_rules}
Quando detectar necessidade de transbordo, avise com elegância que estará chamando o responsável técnico/comercial para dar continuidade ao atendimento.
${leadContext}
Responda sempre com clareza, em português brasileiro coloquial porém profissional, utilizando parágrafos curtos adequados para o WhatsApp.`;
  }

  /**
   * Sanitiza qualquer mensagem contra termos proibidos
   */
  public static sanitizeMessage(text: string): string {
    if (!text) return '';
    const persona = this.getPersona();
    let sanitized = text;

    // Regra rígida universal contra "EVO PIXEL"
    sanitized = sanitized
      .replace(/\bda\s+EVO\s+PIXEL\b/gi, `da ${persona.company_name}`)
      .replace(/\bna\s+EVO\s+PIXEL\b/gi, `na ${persona.company_name}`)
      .replace(/\bpela\s+EVO\s+PIXEL\b/gi, `pela ${persona.company_name}`)
      .replace(/\bEVO\s+PIXEL\b/gi, persona.company_name);

    // Outros termos proibidos configurados
    if (persona.forbidden_terms && Array.isArray(persona.forbidden_terms)) {
      for (const term of persona.forbidden_terms) {
        if (!term || term.trim() === '') continue;
        const regex = new RegExp(`\\b${term.trim()}\\b`, 'gi');
        sanitized = sanitized.replace(regex, '[termo omitido]');
      }
    }

    return sanitized;
  }

  /**
   * Simulador interativo: envia uma pergunta de teste e recebe a resposta da IA com a Persona ativa
   */
  public static async simulatePersonaResponse(userMessage: string, testLead?: Lead): Promise<string> {
    const prompt = this.buildSystemPrompt(testLead);
    const fullUserPrompt = `${prompt}\n\nMensagem recebida do lead no WhatsApp:\n"${userMessage}"\n\nSua resposta consultiva como atendente da ${this.getPersona().company_name}:`;

    try {
      const res = await aiProvider.generateCompletion(fullUserPrompt, {
        temperature: 0.7,
        maxTokens: 350,
      });

      const responseText = res.text || 'Olá! Como posso te ajudar hoje com a presença digital da sua empresa?';
      return this.sanitizeMessage(responseText);
    } catch (err: any) {
      console.warn('Erro ao simular resposta da Persona:', err);
      return `Olá! Sou o atendente da ${this.getPersona().company_name}. Como podemos apoiar o crescimento da sua empresa esta semana?`;
    }
  }
}
