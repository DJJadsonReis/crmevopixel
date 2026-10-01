# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Usuário Primário**: Rafael Costa (Fundador / Diretor Executivo da EVO PIXEL).
- **Situação**: Gestão comercial de ponta a ponta de agência e consultoria de alta tecnologia, prospecção ativa de clientes corporativos por nicho, fechamento de contratos, cobrança de mensalidades (MRR) e orquestração de entregas operacionais.
- **Job to be Done**: Centralizar toda a esteira de receitas em uma única tela de comando sem depender de ferramentas dispersas — desde a descoberta do lead qualificado até o recebimento em conta e gestão contínua de contratos.
- **Audiências Secundárias**: Executivos comerciais (SDRs/closers) e operadores de projeto da EVO PIXEL sob controle de níveis de acesso RBAC (Administrador vs. Gestão/Operador).

## Product Purpose

O EVO PIXEL OS é a plataforma proprietária de inteligência comercial e gestão operacional da EVO PIXEL. O produto existe para eliminar atritos no processo de vendas consultivas B2B, automatizar o engajamento multicanal via WhatsApp e garantir previsibilidade financeira (separação rigorosa entre valores contratados, caixa liquidado e contas a receber). Sucesso significa zero leads esquecidos, acompanhamento em tempo real de metas mensais e autonomia total sobre integrações e infraestrutura.

## Positioning

Diferente de CRMs genéricos de mercado (que exigem plugins de terceiros e cobram por assento) ou planilhas manuais propensas a erro, o EVO PIXEL OS combina uma interface executiva autoral, integração direta com Evolution API para automação nativa de WhatsApp multi-instância, esteira de enriquecimento de leads e banco relacional Supabase dedicado, desenhado exclusivamente para o modelo de negócios da EVO PIXEL.

## Operating Context

- **Rotina Diária**: Abertura matinal do Dashboard para inspeção de metas do ciclo, faturamento acumulado e tarefas prioritárias; execução de disparos de réguas de follow-up por nicho; movimentação de negócios no Pipeline Kanban de 5 estágios; acompanhamento de pagamentos de mensalistas (MRR).
- **Ambiente**: Aplicação web desktop responsiva com layout denso e de comando, otimizada para monitor único ou estendido de trabalho.
- **Ferramentas Integradas**:
  - Supabase PostgreSQL (armazenamento relacional, autenticação client-side e Row-Level Security).
  - Evolution API (conexão WhatsApp via socket/QR Code para instâncias dinâmicas e disparo de réguas).
  - Automações n8n (webhooks para execução de fluxos e gatilhos de reengajamento).
  - Google Gemini AI (qualificação preditiva de score ICP, temperatura e abordagem sugerida).
  - Apify (captura e enriquecimento de dados de empresas no Google Maps por cidade e nicho).

## Capabilities and Constraints

- **Módulos Centrais**:
  - **Dashboard**: Visão executiva dinâmica com seletor temporal (`Hoje`, `7d`, `30d`, `90d`, `Ano`, `Total`), faturamento acumulado, MRR e prospects prioritários.
  - **Leads & Prospecção**: Listagem com filtros por nicho/temperatura, upload de planilhas CSV/XLSX, integração de busca Apify, geração de mensagens de abordagem e modal de qualificação com IA.
  - **Pipeline Kanban**: 5 estágios canônicos (`Primeiro Contato`, `Negociação`, `Fechado`, `Follow-up`, `Lead Perdido`) com movimentação rápida de cartões.
  - **Clientes & Mensalidades (MRR)**: Cadastro corporativo completo, acompanhamento de contratos recorrentes e controle de adimplência do mês.
  - **Financeiro**: Separação conceitual estrita entre Valor Contratado, Valor Recebido (Liquidado) e Valor Pendente.
  - **Propostas & Contratos**: Emissão, aprovação de propostas com conversão em contrato ativo e exportação para impressão.
  - **Minha História**: Linha do tempo e histórico acumulado de faturamento e entregas da agência desde a fundação.
  - **Gestão de Acessos**: Painel de administração de usuários do sistema (`rafaelgcostaa@gmail.com` como administrador pleno).
  - **Configurações**: Gerenciamento de credenciais da Evolution API com teste de conexão em tempo real, QR Code inline, chaves Supabase e credenciais de IA.
- **Restrições Técnicas**:
  - Execução no Cloudflare Pages com Next.js 15 App Router.
  - Supabase client implementado em padrão Singleton estrito no navegador para evitar duplicação de instâncias de `GoTrueClient` e bloqueios de thread.
  - Persistência híbrida resiliente (Supabase com fallback para localStorage operacional offline).

## Brand Commitments

- **Nome Oficial**: EVO PIXEL — Sistema Operacional Comercial & Operacional.
- **Assinatura**: "Performance Estratégica, Design Impecável. O controle do seu império começa aqui." — Rafael Costa - EVO PIXEL.
- **Identidade Visual**:
  - Paleta: Base profunda `bg-evo-deep` (`#07100F`), superfícies `bg-evo-card` / `bg-evo-surface` com iluminação atmosférica sutil, bordas esmeralda escuras `border-evo-border`, e acento primário verde neon `#F1F9A1`.
  - Tipografia: Plus Jakarta Sans para títulos e destaques corporativos, Inter para interface e leitura, JetBrains Mono para valores monetários, IDs e metadados.
  - Tom de Voz: Direto, sofisticado, corporativo de alto nível, rigorosamente profissional.

## Evidence on Hand

- Código-fonte completo em `c:\Users\admin.rafael\Desktop\crmevo`.
- Base de dados Supabase ativa no projeto `kkhnchiytqkuqextwbsq`.
- Instância Evolution API operacional `rafaelgomescosta_653ded30` em `https://api-evolution-api.1h7ium.easypanel.host`.
- Usuário administrador principal: `rafaelgcostaa@gmail.com`.

## Product Principles

1. **Ação Imediata & Clareza de Próximo Passo**: Nenhuma tela ou entidade no CRM deve existir sem uma chamada clara de ação (qualificar, avançar estágio, cobrar ou disparar mensagem).
2. **Separação Rigorosa de Métricas**: Valores contratados jamais se confundem com dinheiro liquidado em caixa; precisão matemática absoluta em todos os agregados de receita.
3. **Fluidez & Zero Bloqueio de Interface**: Operações assíncronas, sincronizações e navegação entre menus devem executar sem travamento da main thread do navegador.
4. **Design de Comando Executivo**: Ausência total de templates genéricos; foco em densidade de informação limpa, contraste preciso e acabamento autoral.
