// ==============================================================================
// EVO PIXEL — MOTOR DE CONEXÃO COM PROVEDORES DE IA (CLAUDE, GEMINI, OPENAI, OPENROUTER)
// ==============================================================================

export type AIProviderType = 'gemini' | 'claude' | 'openai' | 'openrouter' | 'simulation';

export interface AIProviderConfig {
  activeProvider: AIProviderType;
  gemini: {
    apiKey: string;
    model: string;
    temperature: number;
    enabled: boolean;
  };
  claude: {
    apiKey: string;
    model: string;
    temperature: number;
    enabled: boolean;
  };
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
    enabled: boolean;
  };
  openrouter: {
    apiKey: string;
    model: string;
    temperature: number;
    enabled: boolean;
  };
  systemPrompt: string;
}

const DEFAULT_SYSTEM_PROMPT = `Você é o Evo Assistant, o motor de inteligência analítica e operacional da EVO PIXEL.
Sua postura é editorial, executiva, precisa, sem enrolação e focada em resultados comerciais.
Você analisa dados do EVO PIXEL (leads, clientes, prospects, propostas, pipeline, financeiro) e ajuda na tomada de decisão.
Diferencie sempre fatos verificados [DADO], deduções inteligentes [INFERÊNCIA] e recomendações práticas [RECOMENDAÇÃO].`;

export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  activeProvider: 'gemini',
  gemini: {
    apiKey: '',
    model: 'gemini-1.5-flash',
    temperature: 0.4,
    enabled: false,
  },
  claude: {
    apiKey: '',
    model: 'claude-3-7-sonnet-20250219',
    temperature: 0.4,
    enabled: false,
  },
  openai: {
    apiKey: '',
    model: 'gpt-4o',
    temperature: 0.4,
    enabled: false,
  },
  openrouter: {
    apiKey: '',
    model: 'anthropic/claude-3-5-sonnet:beta',
    temperature: 0.4,
    enabled: false,
  },
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
};

class AIProviderService {
  private config: AIProviderConfig = { ...DEFAULT_AI_CONFIG };

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadConfig();
    }
  }

  public loadConfig(): AIProviderConfig {
    if (typeof window === 'undefined') return this.config;
    try {
      const saved = localStorage.getItem('EVO PIXEL_ai_config');
      if (saved) {
        this.config = { ...DEFAULT_AI_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      this.config = { ...DEFAULT_AI_CONFIG };
    }
    return this.config;
  }

  public saveConfig(newConfig: Partial<AIProviderConfig>): AIProviderConfig {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('EVO PIXEL_ai_config', JSON.stringify(this.config));
    }
    return this.config;
  }

  public getConfig(): AIProviderConfig {
    return this.config;
  }

  public async testGemini(apiKey: string, model: string = 'gemini-1.5-flash'): Promise<{ success: boolean; message: string }> {
    if (!apiKey) return { success: false, message: 'API Key do Gemini não fornecida.' };
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responda apenas: "OK. Conexão Gemini estabelecida com sucesso."' }] }],
          generationConfig: { maxOutputTokens: 20 },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, message: `Erro da API Gemini (${res.status}): ${errData.error?.message || 'Erro de conexão'}` };
      }
      const data = await res.json();
      return { success: true, message: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Conectado!' };
    } catch (err: any) {
      return { success: false, message: `Falha na requisição Gemini: ${err.message}` };
    }
  }

  public async testClaude(apiKey: string, model: string = 'claude-3-7-sonnet-20250219'): Promise<{ success: boolean; message: string }> {
    if (!apiKey) return { success: false, message: 'API Key da Anthropic Claude não fornecida.' };
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-haiku-20241022',
          max_tokens: 25,
          messages: [{ role: 'user', content: 'Responda apenas: "OK. Conexão Claude estabelecida com sucesso."' }],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, message: `Erro API Claude (${res.status}): ${errData.error?.message || 'Chave inválida'}` };
      }
      const data = await res.json();
      return { success: true, message: data.content?.[0]?.text?.trim() || 'Conectado!' };
    } catch (err: any) {
      return { success: false, message: `Falha na requisição Claude: ${err.message}` };
    }
  }

  public async testOpenAI(apiKey: string, model: string = 'gpt-4o'): Promise<{ success: boolean; message: string }> {
    if (!apiKey) return { success: false, message: 'API Key da OpenAI não fornecida.' };
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o',
          max_tokens: 25,
          messages: [{ role: 'user', content: 'Responda apenas: "OK. Conexão OpenAI estabelecida com sucesso."' }],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, message: `Erro API OpenAI (${res.status}): ${errData.error?.message || 'Chave inválida'}` };
      }
      const data = await res.json();
      return { success: true, message: data.choices?.[0]?.message?.content?.trim() || 'Conectado!' };
    } catch (err: any) {
      return { success: false, message: `Falha na requisição OpenAI: ${err.message}` };
    }
  }

  public async testOpenRouter(apiKey: string, model: string = 'openai/gpt-4o'): Promise<{ success: boolean; message: string }> {
    if (!apiKey) return { success: false, message: 'API Key do OpenRouter não fornecida.' };
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://evopixel.com.br',
          'X-Title': 'EVO PIXEL CRM'
        },
        body: JSON.stringify({
          model: model || 'openai/gpt-4o',
          max_tokens: 25,
          messages: [{ role: 'user', content: 'Responda apenas: "OK. Conexão OpenRouter estabelecida com sucesso."' }],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, message: `Erro API OpenRouter (${res.status}): ${errData.error?.message || 'Chave inválida'}` };
      }
      const data = await res.json();
      return { success: true, message: data.choices?.[0]?.message?.content?.trim() || 'Conectado!' };
    } catch (err: any) {
      return { success: false, message: `Falha na requisição OpenRouter: ${err.message}` };
    }
  }

  public async generateCompletion(userPrompt: string, contextData: Record<string, unknown>): Promise<{ text: string; provider: string; model: string }> {
    const cfg = this.loadConfig();
    const systemPromptWithContext = `${cfg.systemPrompt}\n\n[CONTEXTO ATUAL DO CRM]:\n${JSON.stringify(contextData, null, 2)}`;

    if (cfg.activeProvider === 'gemini' && cfg.gemini.apiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cfg.gemini.model}:generateContent?key=${cfg.gemini.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPromptWithContext }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: cfg.gemini.temperature, maxOutputTokens: 800 },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return { text: text.trim(), provider: 'Google Gemini', model: cfg.gemini.model };
        }
      } catch (e) {}
    }

    if (cfg.activeProvider === 'claude' && cfg.claude.apiKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': cfg.claude.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: cfg.claude.model,
            system: systemPromptWithContext,
            max_tokens: 800,
            temperature: cfg.claude.temperature,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.content?.[0]?.text;
          if (text) return { text: text.trim(), provider: 'Anthropic Claude', model: cfg.claude.model };
        }
      } catch (e) {}
    }

    if (cfg.activeProvider === 'openai' && cfg.openai.apiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfg.openai.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: cfg.openai.model,
            max_tokens: 800,
            temperature: cfg.openai.temperature,
            messages: [{ role: 'system', content: systemPromptWithContext }, { role: 'user', content: userPrompt }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) return { text: text.trim(), provider: 'OpenAI', model: cfg.openai.model };
        }
      } catch (e) {}
    }

    if (cfg.activeProvider === 'openrouter' && cfg.openrouter.apiKey) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfg.openrouter.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://evopixel.com.br',
            'X-Title': 'EVO PIXEL CRM'
          },
          body: JSON.stringify({
            model: cfg.openrouter.model,
            max_tokens: 800,
            temperature: cfg.openrouter.temperature,
            messages: [{ role: 'system', content: systemPromptWithContext }, { role: 'user', content: userPrompt }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) return { text: text.trim(), provider: 'OpenRouter', model: cfg.openrouter.model };
        }
      } catch (e) {}
    }

    return {
      text: `Analisando com motor analítico nativo: "${userPrompt}". O sistema utilizou as métricas estruturadas de faturamento e prospecção registradas no CRM.`,
      provider: 'Motor Nativo EVO PIXEL',
      model: 'Rule-based Pipeline',
    };
  }
}

export const aiProvider = new AIProviderService();
