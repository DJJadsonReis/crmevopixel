import { getSupabase, isSupabaseConfigured } from './client';
import {
  Lead,
  Client,
  Prospect,
  Opportunity,
  MonthlyClient,
  Proposal,
  Contract,
  Project,
  HistoricalProject,
  TaskItem,
  FinancialTransaction,
  Niche,
  AIPrompt,
  Conversation,
  ConversationMode,
  MessageLog,
  AutomationTask,
  TaskRecipientRecord,
  TaskProgressStats,
  TaskExecutionLogItem,
} from '@/types/database';

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function sanitizeLeadForSupabase(lead: Partial<Lead>): any {
  let notes = lead.notes || '';
  const metadata: any = {};
  if (lead.google_business) metadata.google_business = lead.google_business;
  if (Array.isArray(lead.services) && lead.services.length > 0) metadata.services = lead.services;
  if (Array.isArray(lead.tags) && lead.tags.length > 0) metadata.tags = lead.tags;
  if (lead.sequence_progress) metadata.sequence_progress = lead.sequence_progress;
  if (lead.ai_analysis) metadata.ai_analysis = lead.ai_analysis;
  if (lead.enrichment_status) metadata.enrichment_status = lead.enrichment_status;
  if (lead.enrichment_data) metadata.enrichment_data = lead.enrichment_data;
  if (lead.commercial_funnel) metadata.commercial_funnel = lead.commercial_funnel;
  if (lead.last_enriched_at) metadata.last_enriched_at = lead.last_enriched_at;
  if (lead.site_health_status) metadata.site_health_status = lead.site_health_status;
  if (lead.pagespeed_report) metadata.pagespeed_report = lead.pagespeed_report;
  if (lead.technical_audit) metadata.technical_audit = lead.technical_audit;
  if (lead.conversation_mode) metadata.conversation_mode = lead.conversation_mode;
  if (lead.conversation_archived !== undefined) metadata.conversation_archived = lead.conversation_archived;
  if (lead.suppression_status) metadata.suppression_status = lead.suppression_status;
  if (lead.unread_messages_count !== undefined) metadata.unread_messages_count = lead.unread_messages_count;

  if (Object.keys(metadata).length > 0) {
    const cleanedNotes = notes.replace(/<!--METADATA:[\s\S]*?-->/, '').trim();
    notes = cleanedNotes
      ? `${cleanedNotes}\n<!--METADATA:${JSON.stringify(metadata)}-->`
      : `<!--METADATA:${JSON.stringify(metadata)}-->`;
  }

  const payload: any = {};
  if (lead.id && isValidUUID(lead.id)) payload.id = lead.id;
  if (lead.name !== undefined) payload.name = lead.name;
  if (lead.company_name !== undefined) payload.company_name = lead.company_name;
  if (lead.role !== undefined) payload.role = lead.role || null;
  if (lead.email !== undefined) payload.email = lead.email || null;
  if (lead.phone !== undefined) payload.phone = lead.phone || null;
  if (lead.whatsapp !== undefined) payload.whatsapp = lead.whatsapp || null;
  if (lead.instagram !== undefined) payload.instagram = lead.instagram || null;
  if (lead.website !== undefined) payload.website = lead.website || null;
  if (lead.city !== undefined) payload.city = lead.city || null;
  if (lead.state !== undefined) payload.state = lead.state || null;
  if (lead.segment !== undefined) payload.segment = lead.segment || null;
  if (lead.score !== undefined) payload.score = lead.score;
  if (lead.temperature !== undefined) payload.temperature = lead.temperature;
  if (lead.status !== undefined) payload.status = lead.status;
  if (lead.next_action !== undefined) payload.next_action = lead.next_action || null;
  if (lead.next_action_at !== undefined) payload.next_action_at = lead.next_action_at || null;
  if (lead.last_contact_at !== undefined) payload.last_contact_at = lead.last_contact_at || null;
  if (lead.company_id && isValidUUID(lead.company_id)) payload.company_id = lead.company_id;
  if (lead.niche_id && isValidUUID(lead.niche_id)) payload.niche_id = lead.niche_id;
  if (lead.source_id && isValidUUID(lead.source_id)) payload.source_id = lead.source_id;
  if (lead.conversation_mode !== undefined) payload.conversation_mode = lead.conversation_mode;
  if (lead.conversation_archived !== undefined) payload.conversation_archived = lead.conversation_archived;
  if (lead.suppression_status !== undefined) payload.suppression_status = lead.suppression_status;
  if (lead.unread_messages_count !== undefined) payload.unread_messages_count = lead.unread_messages_count;
  payload.notes = notes || null;
  payload.updated_at = new Date().toISOString();

  return payload;
}

function parseLeadFromSupabase(row: any): Lead {
  let google_business = row.google_business || '';
  let services: string[] = Array.isArray(row.services) ? row.services : [];
  let tags: string[] = Array.isArray(row.tags) ? row.tags : [];
  let sequence_progress = row.sequence_progress;
  let ai_analysis = row.ai_analysis;
  let enrichment_status = row.enrichment_status || 'not_analyzed';
  let enrichment_data = row.enrichment_data || undefined;
  let commercial_funnel = row.commercial_funnel || undefined;
  let last_enriched_at = row.last_enriched_at || undefined;
  let site_health_status = row.site_health_status || undefined;
  let pagespeed_report = row.pagespeed_report || undefined;
  let technical_audit = row.technical_audit || undefined;
  let conversation_mode: ConversationMode = row.conversation_mode || 'AI';
  let conversation_archived = row.conversation_archived ?? false;
  let suppression_status = row.suppression_status || 'active';
  let unread_messages_count = row.unread_messages_count || 0;
  let notes = row.notes || '';

  if (notes && notes.includes('<!--METADATA:')) {
    const match = notes.match(/<!--METADATA:([\s\S]*?)-->/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.google_business && !google_business) google_business = parsed.google_business;
        if (Array.isArray(parsed.services) && services.length === 0) services = parsed.services;
        if (Array.isArray(parsed.tags) && tags.length === 0) tags = parsed.tags;
        if (parsed.sequence_progress && !sequence_progress) sequence_progress = parsed.sequence_progress;
        if (parsed.ai_analysis && !ai_analysis) ai_analysis = parsed.ai_analysis;
        if (parsed.enrichment_status) enrichment_status = parsed.enrichment_status;
        if (parsed.enrichment_data) enrichment_data = parsed.enrichment_data;
        if (parsed.commercial_funnel) commercial_funnel = parsed.commercial_funnel;
        if (parsed.last_enriched_at) last_enriched_at = parsed.last_enriched_at;
        if (parsed.site_health_status) site_health_status = parsed.site_health_status;
        if (parsed.pagespeed_report) pagespeed_report = parsed.pagespeed_report;
        if (parsed.technical_audit) technical_audit = parsed.technical_audit;
        if (parsed.conversation_mode) conversation_mode = parsed.conversation_mode;
        if (parsed.conversation_archived !== undefined) conversation_archived = parsed.conversation_archived;
        if (parsed.suppression_status) suppression_status = parsed.suppression_status;
        if (parsed.unread_messages_count !== undefined) unread_messages_count = parsed.unread_messages_count;
        notes = notes.replace(/<!--METADATA:[\s\S]*?-->/, '').trim();
      } catch (e) {}
    }
  }

  // Fallback garantido para serviços se vazio
  if (!services || services.length === 0) {
    services = ['Site Institucional Responsivo', 'Automação WhatsApp n8n'];
  }

  return {
    ...row,
    notes,
    google_business,
    services,
    tags,
    sequence_progress,
    ai_analysis,
    enrichment_status,
    enrichment_data,
    commercial_funnel,
    last_enriched_at,
    site_health_status,
    pagespeed_report,
    technical_audit,
    conversation_mode,
    conversation_archived,
    suppression_status,
    unread_messages_count,
  } as Lead;
}

export class DatabaseService {
  // ============================================================================
  // CLIENTES
  // ============================================================================
  public async getClients(): Promise<Client[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) {
        console.error('Supabase getClients error:', error);
        return null;
      }
      return data as Client[];
    } catch (err) {
      console.error('Supabase getClients exception:', err);
      return null;
    }
  }

  public async insertClient(client: Client): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      
      // Remover ID mock (ex: 'client-...') para que o Supabase gere o UUID
      let dataToInsert = { ...client };
      if (dataToInsert.id && dataToInsert.id.startsWith('client-')) {
        delete (dataToInsert as any).id;
      }

      const { error } = await supabase.from('clients').upsert([dataToInsert]);
      if (error) console.error('Supabase insertClient error:', error);
      return !error;
    } catch (err) {
      console.error('Supabase insertClient exception:', err);
      return false;
    }
  }

  public async updateClient(id: string, data: Partial<Client>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      
      // Remover ID mock
      let dataToUpdate = { ...data };
      if (dataToUpdate.id && dataToUpdate.id.startsWith('client-')) {
        delete (dataToUpdate as any).id;
      }

      const { error } = await supabase.from('clients').update(dataToUpdate).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteClient(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('clients').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // CLIENTES MENSALISTAS (MRR)
  // ============================================================================
  public async getMonthlyClients(): Promise<MonthlyClient[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('monthly_clients')
        .select('*')
        .order('billing_day', { ascending: true });
      if (error || !data) return null;
      return data as MonthlyClient[];
    } catch {
      return null;
    }
  }

  public async insertMonthlyClient(client: MonthlyClient): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('monthly_clients').upsert([client]);
      return !error;
    } catch {
      return false;
    }
  }

  public async updateMonthlyClient(id: string, data: Partial<MonthlyClient>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('monthly_clients').update(data).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteMonthlyClient(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('monthly_clients').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // LEADS
  // ============================================================================
  public async getLeads(): Promise<Lead[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) {
        if (error) console.error('Supabase getLeads error:', error);
        return null;
      }
      return data.map(parseLeadFromSupabase);
    } catch (err) {
      console.error('Supabase getLeads exception:', err);
      return null;
    }
  }

  public async insertLead(lead: Lead): Promise<Lead | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const payload = sanitizeLeadForSupabase(lead);
      const { data, error } = await supabase.from('leads').upsert([payload]).select();
      if (error) {
        console.error('Supabase insertLead error:', error);
        return null;
      }
      if (data && data.length > 0) {
        return parseLeadFromSupabase(data[0]);
      }
      return null;
    } catch (err) {
      console.error('Supabase insertLead exception:', err);
      return null;
    }
  }

  public async updateLead(id: string, data: Partial<Lead>): Promise<boolean> {
    if (!isSupabaseConfigured() || !isValidUUID(id)) return false;
    try {
      const supabase = getSupabase();
      const payload = sanitizeLeadForSupabase(data);
      delete payload.id;
      const { error } = await supabase.from('leads').update(payload).eq('id', id);
      if (error) console.error('Supabase updateLead error:', error);
      return !error;
    } catch (err) {
      console.error('Supabase updateLead exception:', err);
      return false;
    }
  }

  public async deleteLead(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !isValidUUID(id)) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) console.error('Supabase deleteLead error:', error);
      return !error;
    } catch (err) {
      console.error('Supabase deleteLead exception:', err);
      return false;
    }
  }

  public async deleteLeads(ids: string[]): Promise<boolean> {
    const validUuids = ids.filter(isValidUUID);
    if (!isSupabaseConfigured() || validUuids.length === 0) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('leads').delete().in('id', validUuids);
      if (error) console.error('Supabase deleteLeads error:', error);
      return !error;
    } catch (err) {
      console.error('Supabase deleteLeads exception:', err);
      return false;
    }
  }

  // ============================================================================
  // PROSPECTOS (PROSPECÇÃO ATIVA IA)
  // ============================================================================
  public async getProspects(): Promise<Prospect[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('icp_score', { ascending: false });
      if (error || !data) return null;
      return data as Prospect[];
    } catch {
      return null;
    }
  }

  public async insertProspect(prospect: Prospect): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('prospects').upsert([prospect]);
      return !error;
    } catch {
      return false;
    }
  }

  public async updateProspectStatus(id: string, status: Prospect['status']): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('prospects')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteProspect(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('prospects').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // OPORTUNIDADES / PIPELINE KANBAN
  // ============================================================================
  public async getOpportunities(): Promise<Opportunity[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('opportunities').select('*');
      if (error || !data) return null;
      return data as Opportunity[];
    } catch {
      return null;
    }
  }

  public async insertOpportunity(opportunity: Opportunity): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('opportunities').upsert([opportunity]);
      return !error;
    } catch {
      return false;
    }
  }

  public async updateOpportunityStage(id: string, stageSlug: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('opportunities')
        .update({ stage_slug: stageSlug, updated_at: new Date().toISOString() })
        .eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteOpportunity(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // PROPOSTAS
  // ============================================================================
  public async getProposals(): Promise<Proposal[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) return null;
      return data as Proposal[];
    } catch {
      return null;
    }
  }

  public async insertProposal(proposal: Proposal): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('proposals').upsert([proposal]);
      return !error;
    } catch {
      return false;
    }
  }

  public async updateProposal(id: string, data: Partial<Proposal>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('proposals').update(data).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteProposal(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('proposals').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // CONTRATOS
  // ============================================================================
  public async getContracts(): Promise<Contract[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('contracts').select('*');
      if (error || !data) return null;
      return data as Contract[];
    } catch {
      return null;
    }
  }

  public async insertContract(contract: Contract): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('contracts').upsert([contract]);
      return !error;
    } catch {
      return false;
    }
  }

  public async updateContract(id: string, data: Partial<Contract>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('contracts').update(data).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteContract(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // PROJETOS & MEU HISTÓRICO
  // ============================================================================
  public async getProjects(): Promise<Project[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('projects').select('*');
      if (error || !data) return null;
      return data as Project[];
    } catch {
      return null;
    }
  }

  public async insertProject(project: Project): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('projects').upsert([project]);
      return !error;
    } catch {
      return false;
    }
  }

  public async updateProject(id: string, data: Partial<Project>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('projects').update(data).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async getHistoricalProjects(): Promise<HistoricalProject[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('historical_projects')
        .select('*')
        .order('project_date', { ascending: false });
      if (error || !data) {
        console.error('Supabase getHistoricalProjects error:', error);
        return null;
      }
      return data as HistoricalProject[];
    } catch (err) {
      console.error('Supabase getHistoricalProjects exception:', err);
      return null;
    }
  }

  public async insertHistoricalProject(project: HistoricalProject): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();

      // Remover ID mock (ex: 'hist-...') para que o Supabase gere o UUID
      let dataToInsert = { ...project };
      if (dataToInsert.id && dataToInsert.id.startsWith('hist-')) {
        delete (dataToInsert as any).id;
      }

      const { error } = await supabase.from('historical_projects').upsert([dataToInsert]);
      if (error) console.error('Supabase insertHistoricalProject error:', error);
      return !error;
    } catch (err) {
      console.error('Supabase insertHistoricalProject exception:', err);
      return false;
    }
  }

  public async updateHistoricalProject(id: string, data: Partial<HistoricalProject>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();

      // Remover ID mock
      let dataToUpdate = { ...data };
      if (dataToUpdate.id && dataToUpdate.id.startsWith('hist-')) {
        delete (dataToUpdate as any).id;
      }

      const { error } = await supabase.from('historical_projects').update(dataToUpdate).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteHistoricalProject(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('historical_projects').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // TAREFAS
  // ============================================================================
  public async getTasks(): Promise<TaskItem[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });
      if (error || !data) return null;
      return data as TaskItem[];
    } catch {
      return null;
    }
  }

  public async insertTask(task: TaskItem): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('tasks').upsert([task]);
      return !error;
    } catch {
      return false;
    }
  }

  public async updateTask(id: string, data: Partial<TaskItem>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('tasks').update(data).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteTask(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // LANÇAMENTOS FINANCEIROS
  // ============================================================================
  public async getTransactions(): Promise<FinancialTransaction[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('due_date', { ascending: false });
      if (error || !data) return null;
      return data as FinancialTransaction[];
    } catch {
      return null;
    }
  }

  public async insertTransaction(tx: FinancialTransaction): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('financial_transactions').upsert([tx]);
      return !error;
    } catch {
      return false;
    }
  }

  public async updateTransaction(id: string, data: Partial<FinancialTransaction>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('financial_transactions').update(data).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteTransaction(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // NICHOS
  // ============================================================================
  public async getNiches(): Promise<Niche[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('niches').select('*');
      if (error || !data) return null;
      return data as Niche[];
    } catch {
      return null;
    }
  }

  public async insertNiche(niche: Niche): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const toInsert: any = {
        name: niche.name,
        description: niche.description || null,
        status: niche.status || 'ativo',
      };
      if (isValidUUID(niche.id)) {
        toInsert.id = niche.id;
      }
      const { error } = await supabase.from('niches').upsert([toInsert]);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteNiche(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('niches').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async updateNiche(id: string, updates: Partial<Niche>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.status !== undefined) payload.status = updates.status;
      const { error } = await supabase.from('niches').update(payload).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }


  // ============================================================================
  // SYSTEM PROMPTS DO AGENTE
  // ============================================================================
  public async getAiPrompts(): Promise<AIPrompt[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) return null;
      return data as AIPrompt[];
    } catch {
      return null;
    }
  }

  public async saveAiPrompt(prompt: AIPrompt): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      const toUpsert: any = {
        name: prompt.name,
        description: prompt.description || null,
        prompt: prompt.prompt,
        prompt_type: prompt.prompt_type || 'atendimento',
        is_default: prompt.is_default || false,
        version: prompt.version || 1,
        updated_at: new Date().toISOString(),
      };
      if (isValidUUID(prompt.id)) {
        toUpsert.id = prompt.id;
      }
      const { error } = await supabase.from('ai_prompts').upsert([toUpsert]);
      return !error;
    } catch {
      return false;
    }
  }

  public async setDefaultAiPrompt(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      // Remove default dos outros
      await supabase.from('ai_prompts').update({ is_default: false }).neq('id', id);
      const { error } = await supabase.from('ai_prompts').update({ is_default: true }).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // CONVERSAS & WHATSAPP INBOX
  // ============================================================================
  public async getConversations(): Promise<Conversation[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error || !data) {
        return null;
      }

      return data.map((row: any) => ({
        id: row.id,
        lead_id: row.lead_id,
        client_id: row.client_id,
        channel: row.channel || 'whatsapp',
        external_id: row.external_id,
        conversation_mode: (row.mode || row.conversation_mode || 'AI') as ConversationMode,
        archived: row.is_archived ?? row.archived ?? false,
        archived_at: row.archived_at,
        locked_by: row.locked_by,
        locked_at: row.locked_at,
        attention_recommended: row.attention_recommended ?? false,
        attention_reason: row.attention_reason,
        last_message_at: row.last_message_at || row.updated_at || row.created_at,
        last_message_text: row.last_message_text || (row.metadata?.last_message_text),
        last_message_direction: row.last_message_direction || (row.metadata?.last_message_direction),
        status: row.status || 'aberta',
        unread_count: row.unread_count || 0,
        created_at: row.created_at,
        updated_at: row.updated_at || row.created_at,
      }));
    } catch (err) {
      console.error('getConversations exception:', err);
      return null;
    }
  }

  public async getConversationByLeadId(leadId: string): Promise<Conversation | null> {
    if (!isSupabaseConfigured() || !leadId) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('lead_id', leadId)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        lead_id: data.lead_id,
        client_id: data.client_id,
        channel: data.channel || 'whatsapp',
        external_id: data.external_id,
        conversation_mode: (data.mode || data.conversation_mode || 'AI') as ConversationMode,
        archived: data.is_archived ?? data.archived ?? false,
        archived_at: data.archived_at,
        locked_by: data.locked_by,
        locked_at: data.locked_at,
        attention_recommended: data.attention_recommended ?? false,
        attention_reason: data.attention_reason,
        last_message_at: data.last_message_at || data.updated_at || data.created_at,
        last_message_text: data.last_message_text || data.metadata?.last_message_text,
        last_message_direction: data.last_message_direction || data.metadata?.last_message_direction,
        status: data.status || 'aberta',
        unread_count: data.unread_count || 0,
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at,
      };
    } catch {
      return null;
    }
  }

  public async getConversationByPhone(phone: string): Promise<Conversation | null> {
    if (!isSupabaseConfigured() || !phone) return null;
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`external_id.eq.${phone},external_id.eq.${cleanPhone},external_id.ilike.%${cleanPhone}%`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        lead_id: data.lead_id,
        client_id: data.client_id,
        channel: data.channel || 'whatsapp',
        external_id: data.external_id,
        conversation_mode: (data.mode || data.conversation_mode || 'AI') as ConversationMode,
        archived: data.is_archived ?? data.archived ?? false,
        archived_at: data.archived_at,
        locked_by: data.locked_by,
        locked_at: data.locked_at,
        attention_recommended: data.attention_recommended ?? false,
        attention_reason: data.attention_reason,
        last_message_at: data.last_message_at || data.updated_at || data.created_at,
        last_message_text: data.last_message_text || data.metadata?.last_message_text,
        last_message_direction: data.last_message_direction || data.metadata?.last_message_direction,
        status: data.status || 'aberta',
        unread_count: data.unread_count || 0,
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at,
      };
    } catch {
      return null;
    }
  }

  public async saveConversation(conv: Partial<Conversation>): Promise<Conversation | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (conv.id && isValidUUID(conv.id)) payload.id = conv.id;
      if (conv.lead_id && isValidUUID(conv.lead_id)) payload.lead_id = conv.lead_id;
      if (conv.client_id && isValidUUID(conv.client_id)) payload.client_id = conv.client_id;
      if (conv.channel) payload.channel = conv.channel;
      if (conv.external_id) payload.external_id = conv.external_id;
      if (conv.conversation_mode) payload.mode = conv.conversation_mode;
      if (conv.archived !== undefined) payload.is_archived = conv.archived;
      if (conv.unread_count !== undefined) payload.unread_count = conv.unread_count;
      if (conv.status) payload.status = conv.status;
      if (conv.last_message_at) payload.last_message_at = conv.last_message_at;

      // metadata para campos adicionais
      payload.metadata = {
        last_message_text: conv.last_message_text,
        last_message_direction: conv.last_message_direction,
        attention_recommended: conv.attention_recommended,
        attention_reason: conv.attention_reason,
        locked_by: conv.locked_by,
        locked_at: conv.locked_at,
      };

      const { data, error } = await supabase
        .from('conversations')
        .upsert([payload])
        .select()
        .single();

      if (error || !data) {
        console.error('saveConversation error:', error);
        return null;
      }

      return {
        id: data.id,
        lead_id: data.lead_id,
        client_id: data.client_id,
        channel: data.channel || 'whatsapp',
        external_id: data.external_id,
        conversation_mode: (data.mode || 'AI') as ConversationMode,
        archived: data.is_archived ?? false,
        last_message_at: data.last_message_at,
        last_message_text: conv.last_message_text,
        last_message_direction: conv.last_message_direction,
        status: data.status || 'aberta',
        unread_count: data.unread_count || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (e) {
      console.error('saveConversation exception:', e);
      return null;
    }
  }

  public async updateConversationMode(
    conversationId: string,
    mode: ConversationMode,
    leadId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !conversationId) return false;
    try {
      const supabase = getSupabase();
      await supabase
        .from('conversations')
        .update({ mode, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (leadId && isValidUUID(leadId)) {
        await supabase
          .from('leads')
          .update({ conversation_mode: mode, updated_at: new Date().toISOString() })
          .eq('id', leadId);
      }
      return true;
    } catch {
      return false;
    }
  }

  public async archiveConversation(
    conversationId: string,
    isArchived: boolean,
    leadId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !conversationId) return false;
    try {
      const supabase = getSupabase();
      await supabase
        .from('conversations')
        .update({
          is_archived: isArchived,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (leadId && isValidUUID(leadId)) {
        await supabase
          .from('leads')
          .update({
            conversation_archived: isArchived,
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId);
      }
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // MENSAGENS (PERSISTÊNCIA COMPLETA SUPABASE)
  // ============================================================================
  public async getMessages(conversationId?: string, leadId?: string): Promise<MessageLog[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();

      // Primeiro busca na tabela messages
      let query = supabase.from('messages').select('*').order('sent_at', { ascending: true });
      if (conversationId && isValidUUID(conversationId)) {
        query = query.eq('conversation_id', conversationId);
      } else if (leadId && isValidUUID(leadId)) {
        query = query.eq('lead_id', leadId);
      } else {
        return [];
      }

      const { data: messagesData, error: messagesError } = await query;

      if (!messagesError && messagesData && messagesData.length > 0) {
        return messagesData.map((row: any) => ({
          id: row.id,
          lead_id: row.lead_id || leadId || '',
          conversation_id: row.conversation_id,
          channel: 'whatsapp',
          sent_text: row.content || row.sent_text || '',
          direction: (row.direction === 'incoming' || row.direction === 'recebida') ? 'recebida' : 'enviada',
          sent_at: row.sent_at || row.created_at || new Date().toISOString(),
          source: row.sender_type === 'user' ? 'manual' : 'automatica_n8n',
          status: row.status || 'entregue',
          idempotency_key: row.idempotency_key,
          provider_message_id: row.provider_message_id,
          media_url: row.media_url,
          media_type: row.media_type,
          error_message: row.error_message,
        }));
      }

      // Fallback para message_logs se tabela messages estiver vazia para o lead
      if (leadId && isValidUUID(leadId)) {
        const { data: logsData } = await supabase
          .from('message_logs')
          .select('*')
          .eq('lead_id', leadId)
          .order('sent_at', { ascending: true });

        if (logsData && logsData.length > 0) {
          return logsData as MessageLog[];
        }
      }

      return [];
    } catch (err) {
      console.error('getMessages exception:', err);
      return null;
    }
  }

  public async saveMessage(msg: Partial<MessageLog>): Promise<MessageLog | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const directionNormalized = (msg.direction === 'recebida') ? 'incoming' : 'outgoing';
      const senderType = msg.source === 'manual' ? 'user' : (msg.direction === 'recebida' ? 'contact' : 'ia');
      const now = msg.sent_at || new Date().toISOString();

      // Salva na tabela messages se conversation_id disponível
      if (msg.conversation_id && isValidUUID(msg.conversation_id)) {
        const payload: any = {
          conversation_id: msg.conversation_id,
          sender_type: senderType,
          content: msg.sent_text || '',
          sent_at: now,
          status: msg.status || 'entregue',
          direction: directionNormalized,
          lead_id: msg.lead_id && isValidUUID(msg.lead_id) ? msg.lead_id : null,
          idempotency_key: msg.idempotency_key || null,
          provider_message_id: msg.provider_message_id || null,
          media_url: msg.media_url || null,
          media_type: msg.media_type || null,
          error_message: msg.error_message || null,
        };

        if (msg.id && isValidUUID(msg.id)) {
          payload.id = msg.id;
        }

        await supabase.from('messages').insert([payload]);

        // Atualiza last_message da conversa
        await supabase
          .from('conversations')
          .update({
            last_message_at: now,
            updated_at: now,
            is_archived: false, // Reactive unarchive se nova mensagem chegar
            metadata: {
              last_message_text: msg.sent_text,
              last_message_direction: msg.direction,
            }
          })
          .eq('id', msg.conversation_id);
      }

      // Também grava em message_logs para compatibilidade total de relatórios
      if (msg.lead_id && isValidUUID(msg.lead_id)) {
        const logPayload: any = {
          lead_id: msg.lead_id,
          channel: msg.channel || 'whatsapp',
          sent_text: msg.sent_text || '',
          direction: msg.direction || 'enviada',
          sent_at: now,
          source: msg.source || 'manual',
          status: msg.status || 'entregue',
        };
        await supabase.from('message_logs').insert([logPayload]);

        // Atualiza last_contact_at no lead
        await supabase
          .from('leads')
          .update({
            last_contact_at: now,
            conversation_archived: false,
          })
          .eq('id', msg.lead_id);
      }

      return {
        id: msg.id || crypto.randomUUID(),
        lead_id: msg.lead_id || '',
        conversation_id: msg.conversation_id,
        channel: msg.channel || 'whatsapp',
        sent_text: msg.sent_text || '',
        direction: msg.direction || 'enviada',
        sent_at: now,
        source: msg.source || 'manual',
        status: msg.status || 'entregue',
        idempotency_key: msg.idempotency_key,
        provider_message_id: msg.provider_message_id,
      };
    } catch (err) {
      console.error('saveMessage exception:', err);
      return null;
    }
  }

  public async markMessagesAsRead(conversationId: string, leadId?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const supabase = getSupabase();
      if (conversationId && isValidUUID(conversationId)) {
        await supabase
          .from('conversations')
          .update({ unread_count: 0, updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
      if (leadId && isValidUUID(leadId)) {
        await supabase
          .from('leads')
          .update({ unread_messages_count: 0 })
          .eq('id', leadId);
      }
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // CENTRAL DE AUTOMAÇÕES & TAREFAS EM LOTE (AUTOMATION TASKS)
  // ============================================================================
  public async getAutomationTasks(): Promise<AutomationTask[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        task_type: row.task_type,
        status: row.status,
        priority: row.priority || 'media',
        assigned_to: row.assigned_to || 'agente_ia',
        auto_execute_by_ai: row.auto_execute_by_ai ?? true,
        allowed_tools: row.allowed_tools || [],
        audience_filter: row.audience_filter || {},
        selected_lead_ids: Array.isArray(row.selected_lead_ids) ? row.selected_lead_ids : [],
        excluded_lead_ids: Array.isArray(row.excluded_lead_ids) ? row.excluded_lead_ids : [],
        audience_summary: row.audience_summary || {
          total_selected: 0,
          valid_whatsapp: 0,
          invalid_whatsapp: 0,
          suppressed: 0,
          duplicates: 0,
          eligible: 0,
        },
        message_template: row.message_template || row.message_payload?.template,
        is_ai_personalized: row.is_ai_personalized ?? false,
        ai_copy_config: row.ai_copy_config || row.message_payload?.ai_copy_config,
        scheduled_for: row.scheduled_for,
        start_immediately: row.start_immediately ?? true,
        batch_config: row.batch_config || {
          batch_size: 20,
          batch_interval_minutes: 10,
          min_message_interval_seconds: 15,
          max_message_interval_seconds: 45,
          start_time_window: '09:00',
          end_time_window: '18:00',
          allow_weekends: false,
          timezone: 'America/Sao_Paulo',
        },
        progress: row.progress || {
          total: 0,
          eligible: 0,
          sent: 0,
          delivered: 0,
          read: 0,
          replied: 0,
          failed: 0,
          opt_outs: 0,
          current_batch_index: 0,
          total_batches: 0,
        },
        execution_logs: Array.isArray(row.execution_logs) ? row.execution_logs : [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch {
      return null;
    }
  }

  public async getAutomationTaskById(id: string): Promise<AutomationTask | null> {
    if (!isSupabaseConfigured() || !isValidUUID(id)) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        task_type: data.task_type,
        status: data.status,
        priority: data.priority,
        assigned_to: data.assigned_to,
        auto_execute_by_ai: data.auto_execute_by_ai,
        allowed_tools: data.allowed_tools,
        audience_filter: data.audience_filter,
        selected_lead_ids: data.selected_lead_ids || [],
        excluded_lead_ids: data.excluded_lead_ids || [],
        audience_summary: data.audience_summary || {
          total_selected: 0,
          valid_whatsapp: 0,
          invalid_whatsapp: 0,
          suppressed: 0,
          duplicates: 0,
          eligible: 0,
        },
        message_template: data.message_template || data.message_payload?.template,
        is_ai_personalized: data.is_ai_personalized ?? false,
        ai_copy_config: data.ai_copy_config || data.message_payload?.ai_copy_config,
        scheduled_for: data.scheduled_for,
        start_immediately: data.start_immediately ?? true,
        batch_config: data.batch_config,
        progress: data.progress,
        execution_logs: data.execution_logs || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch {
      return null;
    }
  }

  public async saveAutomationTask(task: AutomationTask): Promise<AutomationTask | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getSupabase();
      const payload: any = {
        title: task.title,
        description: task.description || null,
        task_type: task.task_type,
        status: task.status,
        priority: task.priority || 'media',
        assigned_to: task.assigned_to || 'agente_ia',
        auto_execute_by_ai: task.auto_execute_by_ai ?? true,
        allowed_tools: task.allowed_tools || [],
        audience_filter: task.audience_filter || {},
        selected_lead_ids: task.selected_lead_ids || [],
        excluded_lead_ids: task.excluded_lead_ids || [],
        audience_summary: task.audience_summary,
        batch_config: task.batch_config,
        message_template: task.message_template || null,
        is_ai_personalized: task.is_ai_personalized ?? false,
        ai_copy_config: task.ai_copy_config || null,
        message_payload: {
          template: task.message_template,
          is_ai_personalized: task.is_ai_personalized,
          ai_copy_config: task.ai_copy_config,
        },
        scheduled_for: task.scheduled_for || null,
        start_immediately: task.start_immediately ?? true,
        progress: task.progress,
        execution_logs: task.execution_logs || [],
        updated_at: new Date().toISOString(),
      };

      if (isValidUUID(task.id)) {
        payload.id = task.id;
      }

      const { data, error } = await supabase
        .from('automation_tasks')
        .upsert([payload])
        .select()
        .single();

      if (error || !data) {
        console.error('saveAutomationTask error:', error);
        return null;
      }

      return {
        ...task,
        id: data.id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (err) {
      console.error('saveAutomationTask exception:', err);
      return null;
    }
  }

  public async updateAutomationTask(id: string, data: Partial<AutomationTask>): Promise<boolean> {
    if (!isSupabaseConfigured() || !isValidUUID(id)) return false;
    try {
      const supabase = getSupabase();
      const payload: any = {
        ...data,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('automation_tasks').update(payload).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async deleteAutomationTask(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !isValidUUID(id)) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('automation_tasks').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public async getTaskRecipients(taskId: string): Promise<TaskRecipientRecord[] | null> {
    if (!isSupabaseConfigured() || !isValidUUID(taskId)) return null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('task_recipients')
        .select('*')
        .eq('automation_task_id', taskId);

      if (error || !data) return null;
      return data as TaskRecipientRecord[];
    } catch {
      return null;
    }
  }

  public async insertTaskRecipients(recipients: TaskRecipientRecord[]): Promise<boolean> {
    if (!isSupabaseConfigured() || recipients.length === 0) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('task_recipients').upsert(recipients);
      return !error;
    } catch {
      return false;
    }
  }

  public async updateTaskRecipient(id: string, data: Partial<TaskRecipientRecord>): Promise<boolean> {
    if (!isSupabaseConfigured() || !isValidUUID(id)) return false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('task_recipients').update(data).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }
}

export const dbService = new DatabaseService();

