const fs = require('fs');
const path = require('path');

// Revert all files
const { execSync } = require('child_process');
execSync('git checkout .', { stdio: 'inherit' });

// Function to recursively find files
function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

// 1. Bulk Rename EvoPixel -> EVO PIXEL
const dirs = ['app', 'components', 'lib'];
dirs.forEach(d => {
    walk(d, (filePath) => {
        if (filePath.match(/\.(tsx|ts|jsx|js)$/)) {
            let content = fs.readFileSync(filePath, 'utf8');
            let newContent = content
                .replace(/EVOCRM/gi, 'EVO PIXEL')
                .replace(/EvoPixel/gi, 'EVO PIXEL')
                .replace(/crm-evopixel/gi, 'evo-pixel');
            if (content !== newContent) {
                fs.writeFileSync(filePath, newContent, 'utf8');
            }
        }
    });
});

// 2. Re-apply tailwind.config.ts
const tailwindConfig = import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        evo: {
          black: "var(--evo-black)",
          bg: "var(--evo-bg)",
          card: "var(--evo-card)",
          deep: "var(--evo-deep)",
          surface: "var(--evo-surface)",
          surface2: "var(--evo-surface2)",
          structural: "var(--evo-structural)",
          support: "var(--evo-support)",
          light: "var(--evo-light)",
          accent: "var(--evo-accent)",
          text: "var(--evo-text)",
          muted: "var(--evo-muted)",
          disabled: "var(--evo-disabled)",
          border: "var(--evo-border)",
          "border-hover": "var(--evo-border-hover)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        evo: "20px",
        "evo-sm": "12px",
        "evo-lg": "24px",
      },
      boxShadow: {
        "evo-glow": "0 0 50px -10px rgba(255, 193, 0, 0.06)",
        "evo-card": "0 20px 40px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;;
fs.writeFileSync('tailwind.config.ts', tailwindConfig, 'utf8');

// 3. Re-apply globals.css
const globalsCss = @tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-inter: 'Inter', sans-serif;
  --font-plus-jakarta: 'Plus Jakarta Sans', sans-serif;

  /* Cores Base EVO PIXEL */
  --evo-black: #030303;
  --evo-bg: #030303;
  --evo-card: #0C0C0C;
  --evo-deep: #0A0A0A;
  --evo-surface: #121212;
  --evo-surface2: #1A1A1A;
  --evo-structural: #333333;
  --evo-support: #D8AB49;
  --evo-light: #BDBDBD;
  --evo-accent: #FFC100;

  /* Tipografia */
  --evo-text: #FFFFFF;
  --evo-muted: #B0B0B0;
  --evo-disabled: #555555;

  /* Bordas */
  --evo-border: rgba(176, 176, 176, 0.15);
  --evo-border-hover: rgba(216, 171, 73, 0.30);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--evo-bg);
  color: var(--evo-text);
  font-family: var(--font-inter);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6, .font-heading {
  font-family: var(--font-plus-jakarta);
}

/* Scrollbar editorial sutil */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--evo-bg);
}

nextjs-portal,
[data-nextjs-dev-indicator],
[data-nextjs-toast],
#nextjs-dev-indicator {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

::-webkit-scrollbar-thumb {
  background: rgba(176, 176, 176, 0.15);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(216, 171, 73, 0.30);
}

.evo-atmospheric-glow {
  background-image: radial-gradient(
    circle at 50% -20%,
    rgba(255, 193, 0, 0.04) 0%,
    rgba(3, 3, 3, 0) 65%
  );
}

.evo-card-glow {
  background: var(--evo-card);
  border: 1px solid var(--evo-border);
  transition: border-color 0.2s ease, background-color 0.2s ease;
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.45);
}

.evo-card-glow:hover {
  border-color: var(--evo-border-hover);
  background-color: var(--evo-surface);
}

/* Badges */
.badge-quente {
  background: rgba(255, 193, 0, 0.1);
  color: #FFC100;
  border: 1px solid rgba(255, 193, 0, 0.25);
}

.badge-morno {
  background: rgba(216, 171, 73, 0.12);
  color: #D8AB49;
  border: 1px solid rgba(216, 171, 73, 0.2);
}

.badge-frio {
  background: rgba(176, 176, 176, 0.15);
  color: #B0B0B0;
  border: 1px solid rgba(176, 176, 176, 0.25);
}

.badge-desqualificado {
  background: rgba(85, 85, 85, 0.15);
  color: #999999;
  border: 1px solid rgba(85, 85, 85, 0.2);
}

/* TEMA CLARO */
html.light {
  --evo-black: #FFFFFF;
  --evo-bg: #FFFFFF;
  --evo-card: #FFFFFF;
  --evo-deep: #F8F8F8;
  --evo-surface: #F4F4F4;
  --evo-surface2: #EEEEEE;
  --evo-structural: #DDDDDD;
  --evo-support: #D8AB49;
  --evo-light: #030303;
  --evo-accent: #FFC100;

  --evo-text: #030303;
  --evo-muted: #666666;
  --evo-disabled: #999999;

  --evo-border: rgba(189, 189, 189, 0.40);
  --evo-border-hover: rgba(216, 171, 73, 0.60);
}

html.light aside {
  background-color: #FFFFFF !important;
  border-color: rgba(189, 189, 189, 0.40) !important;
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02) !important;
}

html.light aside > div:first-child {
  background-color: #FFFFFF !important;
  border-color: rgba(189, 189, 189, 0.40) !important;
}

html.light aside .text-evo-text {
  color: #030303 !important;
}

html.light aside .text-evo-muted,
html.light aside a {
  color: #666666 !important;
  font-weight: 500 !important;
}

html.light aside a:hover {
  background-color: #F8F8F8 !important;
  color: #030303 !important;
}

html.light aside .text-evo-disabled {
  color: #999999 !important;
}

html.light aside svg {
  color: #666666 !important;
}

html.light aside a.bg-evo-surface {
  background-color: #F4F4F4 !important;
  color: #030303 !important;
  border-color: rgba(189, 189, 189, 0.40) !important;
}

html.light aside a.bg-evo-surface svg {
  color: #030303 !important;
}

html.light header {
  background-color: rgba(255, 255, 255, 0.98) !important;
  border-color: rgba(189, 189, 189, 0.40) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03) !important;
}

html.light .bg-evo-bg,
html.light .bg-evo-bg\\/90,
html.light .bg-evo-bg\\/70,
html.light .bg-evo-bg\\/60 {
  background-color: #FFFFFF !important;
}

html.light .bg-evo-card {
  background-color: #FFFFFF !important;
  border-color: rgba(189, 189, 189, 0.40) !important;
  box-shadow: 0 14px 34px rgba(3, 3, 3, 0.05) !important;
}

html.light .bg-evo-black {
  background-color: #FFFFFF !important;
}

html.light .bg-evo-surface {
  background-color: #F4F4F4 !important;
  border-color: rgba(189, 189, 189, 0.40) !important;
}

html.light .text-evo-text,
html.light h1, html.light h2, html.light h3, html.light h4, html.light h5, html.light h6 {
  color: #030303 !important;
}

html.light .text-evo-muted {
  color: #666666 !important;
}

html.light .text-evo-disabled {
  color: #999999 !important;
}

html.light .text-evo-support {
  color: #D8AB49 !important;
}

html.light .text-evo-accent {
  color: #FFC100 !important;
}

html.light .bg-evo-accent {
  background-color: #FFC100 !important;
  color: #030303 !important;
}

html.light code {
  background-color: #EEEEEE !important;
  color: #030303 !important;
  border: 1px solid #DDDDDD !important;
  padding: 1px 4px !important;
  border-radius: 4px !important;
}

html.light input,
html.light textarea,
html.light select {
  background-color: #FFFFFF !important;
  color: #030303 !important;
  border-color: #BDBDBD !important;
}

html.light input:focus,
html.light textarea:focus,
html.light select:focus {
  border-color: #FFC100 !important;
}

html.light input::placeholder,
html.light textarea::placeholder {
  color: #666666 !important;
}

html.light table th {
  background-color: #F8F8F8 !important;
  color: #030303 !important;
  border-color: rgba(189, 189, 189, 0.40) !important;
  font-weight: 600 !important;
}

html.light table td {
  border-color: #EEEEEE !important;
  color: #666666 !important;
}

html.light table tr:hover {
  background-color: #F4F4F4 !important;
}

html.light ::-webkit-scrollbar-track {
  background: #FFFFFF;
}

html.light ::-webkit-scrollbar-thumb {
  background: rgba(189, 189, 189, 0.40);
}

html.light ::-webkit-scrollbar-thumb:hover {
  background: rgba(216, 171, 73, 0.60);
};
fs.writeFileSync('app/globals.css', globalsCss, 'utf8');

// 4. Re-apply layout.tsx
const layoutTsx = import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EVO PIXEL — Sistema Operacional Comercial & Operacional',
  description: 'Plataforma proprietária de gestão comercial, prospecção por nicho, automação n8n e inteligência de vendas.',
  icons: {
    icon: '/logo-icon-dark.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={\dark \ \\}>
      <body className="bg-evo-bg text-evo-text antialiased selection:bg-evo-accent/20 selection:text-evo-accent font-sans transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
};
fs.writeFileSync('app/layout.tsx', layoutTsx, 'utf8');

// 5. Re-apply ai-provider.ts
const aiProvider = // ==============================================================================
// EVO PIXEL — MOTOR DE CONEXÃO COM PROVEDORES DE IA (CLAUDE, GEMINI, OPENAI, OPENROUTER)
// ==============================================================================

export type AIProviderType = 'gemini' | 'claude' | 'openai' | 'openrouter' | 'simulation';

export interface AIProviderConfig {
  activeProvider: AIProviderType;
  gemini: { apiKey: string; model: string; temperature: number; enabled: boolean; };
  claude: { apiKey: string; model: string; temperature: number; enabled: boolean; };
  openai: { apiKey: string; model: string; temperature: number; enabled: boolean; };
  openrouter: { apiKey: string; model: string; temperature: number; enabled: boolean; };
  systemPrompt: string;
}

const DEFAULT_SYSTEM_PROMPT = \Você é o Evo Assistant, o motor de inteligência analítica e operacional da EVO PIXEL.
Sua postura é editorial, executiva, precisa, sem enrolação e focada em resultados comerciais.
Você analisa dados do EVO PIXEL (leads, clientes, prospects, propostas, pipeline, financeiro) e ajuda na tomada de decisão.
Diferencie sempre fatos verificados [DADO], deduções inteligentes [INFERÊNCIA] e recomendações práticas [RECOMENDAÇÃO].\;

export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  activeProvider: 'gemini',
  gemini: { apiKey: '', model: 'gemini-1.5-flash', temperature: 0.4, enabled: false },
  claude: { apiKey: '', model: 'claude-3-7-sonnet-20250219', temperature: 0.4, enabled: false },
  openai: { apiKey: '', model: 'gpt-4o', temperature: 0.4, enabled: false },
  openrouter: { apiKey: '', model: 'anthropic/claude-3-5-sonnet:beta', temperature: 0.4, enabled: false },
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
};

class AIProviderService {
  private config: AIProviderConfig = { ...DEFAULT_AI_CONFIG };
  constructor() { if (typeof window !== 'undefined') this.loadConfig(); }
  public loadConfig(): AIProviderConfig {
    if (typeof window === 'undefined') return this.config;
    try { const saved = localStorage.getItem('EVO PIXEL_ai_config'); if (saved) this.config = { ...DEFAULT_AI_CONFIG, ...JSON.parse(saved) }; } catch { this.config = { ...DEFAULT_AI_CONFIG }; }
    return this.config;
  }
  public saveConfig(newConfig: Partial<AIProviderConfig>): AIProviderConfig {
    this.config = { ...this.config, ...newConfig };
    if (typeof window !== 'undefined') localStorage.setItem('EVO PIXEL_ai_config', JSON.stringify(this.config));
    return this.config;
  }
  public getConfig(): AIProviderConfig { return this.config; }

  public async testGemini(apiKey: string, model: string = 'gemini-1.5-flash'): Promise<{ success: boolean; message: string }> {
    if (!apiKey) return { success: false, message: 'API Key do Gemini não fornecida.' };
    try {
      const res = await fetch(\https://generativelanguage.googleapis.com/v1beta/models/\:generateContent?key=\\, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Responda apenas: "OK. Conexão Gemini estabelecida com sucesso."' }] }], generationConfig: { maxOutputTokens: 20 } }),
      });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); return { success: false, message: \Erro da API Gemini (\): \\ }; }
      const data = await res.json(); return { success: true, message: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Conectado!' };
    } catch (err: any) { return { success: false, message: \Falha: \\ }; }
  }

  public async testClaude(apiKey: string, model: string = 'claude-3-7-sonnet-20250219'): Promise<{ success: boolean; message: string }> {
    if (!apiKey) return { success: false, message: 'API Key da Anthropic Claude não fornecida.' };
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: model || 'claude-3-5-haiku-20241022', max_tokens: 25, messages: [{ role: 'user', content: 'Responda apenas: "OK. Conexão Claude estabelecida com sucesso."' }] }),
      });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); return { success: false, message: \Erro API Claude (\): \\ }; }
      const data = await res.json(); return { success: true, message: data.content?.[0]?.text?.trim() || 'Conectado!' };
    } catch (err: any) { return { success: false, message: \Falha: \\ }; }
  }

  public async testOpenAI(apiKey: string, model: string = 'gpt-4o'): Promise<{ success: boolean; message: string }> {
    if (!apiKey) return { success: false, message: 'API Key da OpenAI não fornecida.' };
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': \Bearer \\, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'gpt-4o', max_tokens: 25, messages: [{ role: 'user', content: 'Responda apenas: "OK. Conexão OpenAI estabelecida com sucesso."' }] }),
      });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); return { success: false, message: \Erro API OpenAI (\): \\ }; }
      const data = await res.json(); return { success: true, message: data.choices?.[0]?.message?.content?.trim() || 'Conectado!' };
    } catch (err: any) { return { success: false, message: \Falha: \\ }; }
  }

  public async testOpenRouter(apiKey: string, model: string = 'openai/gpt-4o'): Promise<{ success: boolean; message: string }> {
    if (!apiKey) return { success: false, message: 'API Key do OpenRouter não fornecida.' };
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': \Bearer \\, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://evopixel.com.br', 'X-Title': 'EVO PIXEL CRM' },
        body: JSON.stringify({ model: model || 'openai/gpt-4o', max_tokens: 25, messages: [{ role: 'user', content: 'Responda apenas: "OK. Conexão OpenRouter estabelecida com sucesso."' }] }),
      });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); return { success: false, message: \Erro API OpenRouter (\): \\ }; }
      const data = await res.json(); return { success: true, message: data.choices?.[0]?.message?.content?.trim() || 'Conectado!' };
    } catch (err: any) { return { success: false, message: \Falha: \\ }; }
  }

  public async generateCompletion(userPrompt: string, contextData: Record<string, unknown>): Promise<{ text: string; provider: string; model: string }> {
    const cfg = this.loadConfig();
    const systemPromptWithContext = \\\\n\\n[CONTEXTO ATUAL DO CRM]:\\n\\;
    
    if (cfg.activeProvider === 'gemini' && cfg.gemini.apiKey) {
      try {
        const res = await fetch(\https://generativelanguage.googleapis.com/v1beta/models/\:generateContent?key=\\, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPromptWithContext }] }, contents: [{ parts: [{ text: userPrompt }] }], generationConfig: { temperature: cfg.gemini.temperature, maxOutputTokens: 800 } }),
        });
        if (res.ok) { const data = await res.json(); const text = data.candidates?.[0]?.content?.parts?.[0]?.text; if (text) return { text: text.trim(), provider: 'Google Gemini', model: cfg.gemini.model }; }
      } catch (e) {}
    }
    
    if (cfg.activeProvider === 'claude' && cfg.claude.apiKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers: { 'x-api-key': cfg.claude.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: cfg.claude.model, system: systemPromptWithContext, max_tokens: 800, temperature: cfg.claude.temperature, messages: [{ role: 'user', content: userPrompt }] }),
        });
        if (res.ok) { const data = await res.json(); const text = data.content?.[0]?.text; if (text) return { text: text.trim(), provider: 'Anthropic Claude', model: cfg.claude.model }; }
      } catch (e) {}
    }
    
    if (cfg.activeProvider === 'openai' && cfg.openai.apiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Authorization': \Bearer \\, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: cfg.openai.model, max_tokens: 800, temperature: cfg.openai.temperature, messages: [{ role: 'system', content: systemPromptWithContext }, { role: 'user', content: userPrompt }] }),
        });
        if (res.ok) { const data = await res.json(); const text = data.choices?.[0]?.message?.content; if (text) return { text: text.trim(), provider: 'OpenAI', model: cfg.openai.model }; }
      } catch (e) {}
    }
    
    if (cfg.activeProvider === 'openrouter' && cfg.openrouter.apiKey) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST', headers: { 'Authorization': \Bearer \\, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://evopixel.com.br', 'X-Title': 'EVO PIXEL CRM' },
          body: JSON.stringify({ model: cfg.openrouter.model, max_tokens: 800, temperature: cfg.openrouter.temperature, messages: [{ role: 'system', content: systemPromptWithContext }, { role: 'user', content: userPrompt }] }),
        });
        if (res.ok) { const data = await res.json(); const text = data.choices?.[0]?.message?.content; if (text) return { text: text.trim(), provider: 'OpenRouter', model: cfg.openrouter.model }; }
      } catch (e) {}
    }
    
    return { text: \Analisando com motor analítico nativo: "\".\, provider: 'Motor Nativo EVO PIXEL', model: 'Rule-based Pipeline' };
  }
}
export const aiProvider = new AIProviderService();;
fs.writeFileSync('lib/ai/ai-provider.ts', aiProvider, 'utf8');
