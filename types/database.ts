export type Temperature = 'quente' | 'morno' | 'frio' | 'desqualificado';
export type Priority = 'alta' | 'media' | 'baixa';
export type ServiceCategory = 'WEBSITES' | 'AUTOMAÇÃO' | 'PRESENÇA DIGITAL';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'commercial' | 'operator';
  avatar_url?: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  base_price: number;
  delivery_time_days: number;
  status: 'ativo' | 'inativo';
  checklist?: string[];
  deliverables?: string[]; // Entregáveis estruturados para propostas comerciais
  technical_specs?: string[]; // Especificações técnicas do escopo
  ideal_for?: string; // Perfil de cliente indicado
}

export interface Niche {
  id: string;
  name: string;
  description: string;
  status: 'ativo' | 'inativo';
  sequences_count?: number;
}

export interface MessageSequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  name: string;
  message_text: string;
  wait_days: number;
  channel: 'whatsapp' | 'email' | 'instagram';
  status: 'ativo' | 'rascunho' | 'arquivada';
}

export interface MessageSequence {
  id: string;
  niche_id: string;
  niche_name?: string;
  name: string;
  status: 'ativa' | 'rascunho' | 'arquivada';
  steps: MessageSequenceStep[];
}

export interface LeadSequenceProgress {
  id: string;
  lead_id: string;
  sequence_id: string;
  sequence_name?: string;
  current_step_id?: string;
  current_step_name?: string;
  current_step_order?: number;
  status: 'aguardando_envio' | 'enviado' | 'aguardando_resposta' | 'respondido' | 'pausado' | 'concluido_sem_resposta';
  last_sent_at?: string;
  next_due_at?: string;
  paused_reason?: string;
}

export type ConversationMode = 'AI' | 'HUMAN' | 'PAUSED';

export interface Conversation {
  id: string;
  lead_id: string;
  client_id?: string;
  channel: string;
  external_id?: string; // remoteJid ou telefone
  conversation_mode: ConversationMode;
  archived: boolean;
  archived_at?: string;
  locked_by?: string;
  locked_at?: string;
  attention_recommended?: boolean;
  attention_reason?: string;
  last_message_at?: string;
  last_message_text?: string;
  last_message_direction?: 'enviada' | 'recebida';
  status: 'aberta' | 'fechada' | 'pausada';
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface MessageLog {
  id: string;
  lead_id: string;
  conversation_id?: string;
  phone?: string;
  sender_name?: string;
  sequence_step_id?: string;
  step_name?: string;
  channel: string;
  sent_text: string;
  direction: 'enviada' | 'recebida';
  sent_at: string;
  source: 'manual' | 'automatica_n8n';
  status: 'entregue' | 'lida' | 'falhou' | 'pendente';
  idempotency_key?: string;
  provider_message_id?: string;
  media_url?: string;
  media_type?: string;
  error_message?: string;
}

export type EnrichmentStatus = 'not_analyzed' | 'in_progress' | 'enriched' | 'partial' | 'error';

export interface EnrichmentEvidenceItem {
  key: string;
  label: string;
  value: any;
  source: string; // ex: 'Website HTML', 'Google Maps', 'Instagram', 'DuckDuckGo'
  confidence: number; // 0.0 a 1.0
  collected_at: string;
  type: 'DADO' | 'INFERENCIA' | 'HIPOTESE' | 'NAO_ENCONTRADO';
  verified: boolean;
}

export interface EnrichmentData {
  company_summary: string;
  digital_presence: {
    has_website: boolean;
    website_url?: string;
    website_status?: number;
    ssl_active?: boolean;
    mobile_friendly?: boolean;
    has_whatsapp_cta?: boolean;
    whatsapp_links?: string[];
    apparent_tech?: string;
    has_contact_form?: boolean;
    page_title?: string;
    meta_description?: string;
    has_schema?: boolean;
    google_maps_found?: boolean;
    google_rating?: number;
    google_reviews_count?: number;
    instagram_found?: boolean;
    instagram_handle?: string;
    identified_emails?: string[];
    identified_phones?: string[];
  };
  evidence_items: EnrichmentEvidenceItem[];
  diagnosis: string[]; // Problemas, falhas e ausências reais identificadas
  opportunities: string[]; // Oportunidades comerciais de alto impacto
  compatible_services: string[]; // Serviços EVO PIXEL indicados
  sales_arguments: string[]; // Motivos e justificativas financeiras
  sales_hooks: string[]; // 3 ganchos personalizados e específicos
  possible_objections: {
    objection: string;
    suggested_response: string;
  }[];
  approach_strategy: string; // Como abordar sem parecer spam
  next_best_action: string;
  score_breakdown: {
    total: number;
    website_score: number;
    local_seo_score: number;
    whatsapp_score: number;
    service_fit_score: number;
    rationale: string;
  };
  analyzed_at: string;
  model_used?: string;
  site_health_status?: SiteHealthStatus;
  pagespeed_report?: PageSpeedReport;
  technical_audit?: TechnicalAuditReport;
}

export type SiteHealthStatus =
  | 'ONLINE_OK'
  | 'ONLINE_WITH_ISSUES'
  | 'PARTIALLY_BROKEN'
  | 'MAINTENANCE_REQUIRED'
  | 'CRITICAL'
  | 'OFFLINE'
  | 'DNS_ERROR'
  | 'SSL_ERROR'
  | 'APPLICATION_ERROR'
  | 'NO_WEBSITE'
  | 'INCONCLUSIVE';

export type CoreWebVitalsRating = 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';

export interface LighthouseScores {
  performance: number | null;
  accessibility: number | null;
  best_practices: number | null;
  seo: number | null;
}

export interface LabMetrics {
  fcp_ms?: number | null;
  lcp_ms?: number | null;
  tbt_ms?: number | null;
  cls?: number | null;
  speed_index_ms?: number | null;
  ttfb_ms?: number | null;
  page_size_kb?: number | null;
  request_count?: number | null;
}

export interface FieldMetrics {
  available: boolean;
  lcp?: { value: number; rating: CoreWebVitalsRating };
  inp?: { value: number; rating: CoreWebVitalsRating };
  cls?: { value: number; rating: CoreWebVitalsRating };
  fcp?: { value: number; rating: CoreWebVitalsRating };
  ttfb?: { value: number; rating: CoreWebVitalsRating };
}

export interface LighthouseIssue {
  audit_id: string;
  title: string;
  description: string;
  score: number | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  display_value?: string;
  commercial_explanation: string;
}

export interface PageSpeedSnapshot {
  strategy: 'mobile' | 'desktop';
  analyzed_at: string;
  scores: LighthouseScores;
  lab_metrics: LabMetrics;
  field_metrics: FieldMetrics;
  top_issues: LighthouseIssue[];
}

export interface TechnicalIssueItem {
  type: 'broken_image' | 'broken_link' | 'ssl_missing' | 'mobile_overflow' | 'no_whatsapp_cta' | 'slow_server';
  severity: 'critical' | 'high' | 'medium' | 'low';
  resource_url?: string;
  location: string;
  description: string;
  commercial_impact: string;
}

export interface TechnicalAuditReport {
  site_health_status: SiteHealthStatus;
  http_status: number;
  ssl_valid: boolean;
  response_time_ms: number;
  mobile_responsive: boolean;
  broken_images: { url: string; status: number }[];
  broken_links: { url: string; status: number }[];
  has_whatsapp_cta: boolean;
  detected_technologies: string[];
  issues: TechnicalIssueItem[];
  audited_at: string;
}

export interface PageSpeedReport {
  mobile: PageSpeedSnapshot | null;
  desktop: PageSpeedSnapshot | null;
  status:
    | 'SUCCESS'
    | 'PARTIAL'
    | 'RATE_LIMITED'
    | 'TIMEOUT'
    | 'INVALID_KEY'
    | 'PROVIDER_ERROR'
    | 'SITE_NOT_ANALYZABLE'
    | 'NO_WEBSITE';
  cached: boolean;
  last_audit_at: string;
}

export interface CommercialFunnelStep {
  step_order: number;
  title: string;
  phase: string; // Ex: '1. Abertura', '2. Contexto', '3. Diagnóstico', '4. Transformação', '5. CTA', '6. Follow-up 1'...
  objective: string;
  message_template: string;
  channel: 'whatsapp' | 'email' | 'instagram';
  wait_hours_or_days?: string;
}

export interface AIPrompt {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  prompt_type: 'atendimento' | 'prospeccao' | 'closer' | 'aduaneiro' | 'personalizado';
  is_default: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  company_name: string;
  role?: string;
  segment: string; // nicho
  niche_id?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  google_business?: string;
  company_id?: string;
  source_id?: string;
  city: string;
  state: string;
  score: number;
  temperature: Temperature;
  status: 'novo' | 'em_abordagem' | 'em_conversa' | 'qualificado' | 'desqualificado' | 'convertido';
  services: string[]; // Serviços identificados
  tags?: string[]; // Etiquetas / Post-it de status (ex: Em Negociação, Fechado)
  last_contact_at?: string;
  next_action?: string;
  next_action_at?: string;
  notes?: string;
  sequence_progress?: LeadSequenceProgress;
  enrichment_status?: EnrichmentStatus;
  enrichment_data?: EnrichmentData;
  commercial_funnel?: CommercialFunnelStep[];
  last_enriched_at?: string;
  site_health_status?: SiteHealthStatus;
  pagespeed_report?: PageSpeedReport;
  technical_audit?: TechnicalAuditReport;
  ai_analysis?: {
    data_points: string[];
    inferences: string[];
    recommendations: string[];
    main_hook: string;
    should_approach: boolean;
    reason_if_not?: string;
  };
  conversation_mode?: ConversationMode; // 'AI' | 'HUMAN' | 'PAUSED'
  conversation_archived?: boolean;
  suppression_status?: 'active' | 'opt_out' | 'blocked';
  unread_messages_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

export interface Opportunity {
  id: string;
  lead_id: string;
  lead_name: string;
  company_name: string;
  stage_slug: string;
  title: string;
  estimated_value: number;
  probability: number;
  score: number;
  temperature: Temperature;
  priority: Priority;
  services: string[];
  last_interaction?: string;
  approach_strategy?: string;
  n8n_automated?: boolean;
}

export interface Client {
  id: string;
  name: string;
  company_name: string;
  segment: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  total_contracted: number;
  total_received: number;
  total_pending: number;
  lifetime_value: number;
  projects_count: number;
  last_project_at?: string;
  status: 'ativo' | 'inativo';
  cross_sell_opportunities?: string[];
}

export interface ProposalItem {
  id: string;
  service_id: string;
  service_name: string;
  description: string;
  price: number;
  discount: number;
  total: number;
}

export interface Proposal {
  id: string;
  code: string;
  client_id?: string;
  client_name: string;
  company_name: string;
  items: ProposalItem[];
  subtotal: number;
  discount: number;
  total: number;
  installments_count: number;
  installments_description: string;
  status: 'rascunho' | 'enviada' | 'visualizada' | 'aceita' | 'recusada' | 'expirada';
  created_at: string;
  valid_until: string;
}

export interface Contract {
  id: string;
  code: string;
  client_name: string;
  company_name: string;
  services_summary: string;
  total_amount: number;
  status: 'rascunho' | 'enviado' | 'visualizado' | 'aguardando_assinatura' | 'assinado' | 'cancelado';
  signed_at?: string;
  signature_provider?: string;
  start_date: string;
  end_date?: string;
}

export interface Project {
  id: string;
  client_name: string;
  company_name: string;
  name: string;
  status: 'aguardando_inicio' | 'briefing' | 'em_desenvolvimento' | 'revisao' | 'ajustes' | 'aguardando_cliente' | 'concluido' | 'cancelado';
  services: {
    service_name: string;
    checklist: { item: string; completed: boolean }[];
  }[];
  start_date: string;
  deadline: string;
  progress_percentage: number;
}

export interface HistoricalProject {
  id: string;
  client_name: string;
  company_name: string;
  segment?: string;
  services_summary: string;
  amount_contracted: number;
  amount_received: number;
  amount_pending: number;
  project_date: string;
  status: 'concluido' | 'parcial' | 'cancelado';
  notes?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  related_to: string; // Ex: 'Clínica Vida' ou 'Projeto Website'
  due_date: string;
  start_date?: string;
  start_time?: string;
  end_time?: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'atrasada';
  priority: Priority;
  assigned_to?: 'operador' | 'agente_ia' | 'ambos';
  auto_execute?: boolean;
  execution_notes?: string;
  task_type?: TaskActionType;
  automation_task_id?: string;
}

export type TaskActionType =
  | 'whatsapp_message'
  | 'followup'
  | 'campaign'
  | 'cross_reference'
  | 'site_audit'
  | 'pagespeed'
  | 'generate_copy'
  | 'pipeline_move'
  | 'reminder'
  | 'custom_routine';

export type AutomationTaskStatus =
  | 'draft'
  | 'scheduled'
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'canceled';

export interface TaskAudienceFilter {
  cities?: string[];
  segments?: string[];
  statuses?: string[];
  pipeline_stages?: string[];
  min_score?: number;
  max_score?: number;
  tags?: string[];
  has_whatsapp?: boolean;
  has_website?: boolean;
  broken_website?: boolean;
  responded?: boolean;
  never_contacted?: boolean;
  search_query?: string;
}

export interface TaskBatchConfig {
  batch_size: number;
  batch_interval_minutes: number;
  min_message_interval_seconds: number;
  max_message_interval_seconds: number;
  start_time_window: string; // ex: '09:00'
  end_time_window: string; // ex: '18:00'
  allow_weekends: boolean;
  timezone: string;
}

export interface TaskProgressStats {
  total: number;
  eligible: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  opt_outs: number;
  current_batch_index: number;
  total_batches: number;
  next_batch_at?: string;
  last_processed_at?: string;
}

export interface TaskExecutionLogItem {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  lead_id?: string;
  lead_name?: string;
}

export interface AutomationTask {
  id: string;
  title: string;
  description?: string;
  task_type: TaskActionType;
  status: AutomationTaskStatus;
  priority: Priority;
  assigned_to: 'operador' | 'agente_ia' | 'ambos';
  auto_execute_by_ai: boolean;
  allowed_tools?: string[];

  // Público / Audiência
  audience_filter?: TaskAudienceFilter;
  selected_lead_ids: string[];
  excluded_lead_ids?: string[];
  audience_summary: {
    total_selected: number;
    valid_whatsapp: number;
    invalid_whatsapp: number;
    suppressed: number;
    duplicates: number;
    eligible: number;
  };

  // Mensagem & IA
  message_template?: string;
  is_ai_personalized: boolean;
  ai_copy_config?: {
    objective: 'prospeccao' | 'followup' | 'apresentacao' | 'reativacao' | 'agendamento' | 'proposta' | 'manutencao' | 'site' | 'seo';
    tone: 'consultivo' | 'direto' | 'profissional' | 'cordial' | 'personalizado';
    cta: 'responder' | 'marcar_reuniao' | 'solicitar_analise' | 'whatsapp';
    custom_instructions?: string;
  };

  // Agendamento & Lotes
  scheduled_for?: string;
  start_immediately: boolean;
  batch_config: TaskBatchConfig;
  progress: TaskProgressStats;
  execution_logs: TaskExecutionLogItem[];

  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskRecipientRecord {
  id: string;
  task_id: string;
  lead_id: string;
  lead_name: string;
  company_name: string;
  phone: string;
  idempotency_key: string;
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed' | 'canceled' | 'suppressed';
  personalized_text?: string;
  provider_message_id?: string;
  error_message?: string;
  retry_count: number;
  next_retry_at?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  replied_at?: string;
}

export interface FollowUpItem {
  id: string;
  target_name: string;
  contact_name?: string;
  company_name: string;
  context: string;
  due_date: string;
  next_action: string;
  is_automated: boolean;
  type: 'hoje' | 'atrasado' | 'proximo' | 'automatico';
  status: 'pendente' | 'concluido' | 'atrasado';
}

export interface FinancialTransaction {
  id: string;
  title: string;
  client_name: string;
  category: string;
  amount_contracted: number;
  amount_received: number;
  amount_pending: number;
  due_date: string;
  status: 'pago' | 'pendente' | 'parcialmente_pago' | 'atrasado' | 'cancelado';
}

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  metric?: string;
  action_label?: string;
  link?: string;
}

// ==============================================================================
// EVOLUÇÃO — INTELIGÊNCIA, EVO ASSISTANT, PROSPECTS & METAS
// ==============================================================================

export type PermissionLevel = 'READ' | 'WRITE' | 'RESTRICTED';

export type ProspectStatus =
  | 'new'
  | 'analyzed'
  | 'priority'
  | 'contacted'
  | 'responded'
  | 'converted_to_lead'
  | 'discarded';

export interface Prospect {
  id: string;
  nome: string;
  empresa: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  instagram?: string;
  cidade: string;
  estado: string;
  segment: string;
  niche_id?: string;
  icp_score: number; // 0 a 100
  opportunity_score: number; // 0 a 100
  digital_presence_score: number; // 0 a 100
  observations?: string;
  source: string;
  suggested_service: string;
  identified_signals: string[];
  status: ProspectStatus;
  converted_lead_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessContext {
  id: string;
  nome_empresa: string;
  descricao: string;
  servicos: string[];
  ticket_medio: number;
  icp: {
    tamanho_empresa: string;
    faturamento_estimado: string;
    decisor: string;
    presenca_digital: string;
  };
  nichos_prioritarios: string[];
  regiao_atuacao: string;
  objetivos: string[];
  metas: string[];
  regras_comerciais: string[];
  tom_comunicacao: string;
  servicos_prioritarios: string[];
  servicos_evitar: string[];
  created_at: string;
  updated_at: string;
}

export interface CommercialGoal {
  id: string;
  periodo: string; // Ex: 'Março 2026'
  faturamento_alvo: number;
  faturamento_atual: number;
  novos_clientes_alvo: number;
  novos_clientes_atual: number;
  propostas_alvo: number;
  propostas_atual: number;
  leads_qualificados_alvo: number;
  leads_qualificados_atual: number;
  prospeccoes_alvo: number;
  prospeccoes_atual: number;
  status: 'em_progresso' | 'atingida' | 'superada' | 'encerrada';
}

export interface ConversationSummary {
  id: string;
  conversation_id: string;
  lead_id: string;
  lead_name: string;
  company_name: string;
  summary: string;
  intent: string;
  lead_temperature: Temperature;
  lead_score: number;
  services_detected: string[];
  objections: string[];
  next_action: string;
  ai_confidence: number;
  updated_at: string;
}

export interface AICommand {
  id: string;
  user_id?: string;
  session_id: string;
  intent: string;
  input: string;
  tool_used?: string;
  permission_level: PermissionLevel;
  parameters: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'success' | 'error' | 'cancelled';
  created_at: string;
}

export interface AIActionLog {
  id: string;
  user_id?: string;
  command_id?: string;
  action_type: 'create' | 'update' | 'delete' | 'register_payment';
  entity_type: 'lead' | 'client' | 'opportunity' | 'task' | 'payment' | 'prospect' | 'contract' | 'proposal';
  entity_id: string;
  entity_label?: string;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  created_at: string;
}

export interface AIFeedback {
  id: string;
  user_id?: string;
  entity_type: string;
  entity_id: string;
  recommendation: string;
  feedback: 'positive' | 'negative';
  reason?: string;
  created_at: string;
}

export interface NextBestAction {
  id: string;
  entity_type: 'lead' | 'opportunity' | 'client' | 'dashboard';
  entity_id: string;
  entity_name: string;
  action_title: string;
  reason: string;
  action_label: string;
  action_link: string;
  priority: Priority;
  data_source: string;
}

export interface EvoInsightItem {
  id: string;
  type: 'DADO' | 'INFERENCIA' | 'RECOMENDACAO';
  title: string;
  explanation: string;
  period: string; // Ex: 'Últimos 30 dias', 'Mês atual'
  data_source: string;
  suggested_action?: {
    label: string;
    link: string;
  };
}

export interface MonthlyClient {
  id: string;
  client_id?: string;
  client_name: string;
  company_name: string;
  segment: string;
  plan_name: string; // Ex: 'Suporte & Manutenção Web', 'Gestão IA & Automação n8n', 'Hospedagem & SEO'
  monthly_value: number; // R$ valor da mensalidade
  billing_day: number; // Dia de vencimento no mês (1 a 31)
  payment_method: 'pix' | 'boleto' | 'cartao' | 'transferencia';
  status: 'ativo' | 'inadimplente' | 'pausado' | 'cancelado';
  current_month_status: 'pago' | 'pendente' | 'atrasado';
  start_date: string;
  last_payment_date?: string;
  notes?: string;
}


