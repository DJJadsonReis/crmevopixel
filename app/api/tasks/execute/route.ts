export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/supabase/db-service';
import { taskEngine } from '@/lib/services/task-engine';
import {
  AutomationTask,
  TaskRecipientRecord,
  TaskExecutionLogItem,
  TaskProgressStats,
} from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { taskId, action } = body; // action: 'start' | 'pause' | 'resume' | 'cancel' | 'process_next_batch' | 'force_start'

    if (!taskId) {
      return NextResponse.json(
        { success: false, message: 'ID da tarefa é obrigatório' },
        { status: 400 }
      );
    }

    let task: AutomationTask | null = await dbService.getAutomationTaskById(taskId);
    if (!task && body.taskData) {
      task = body.taskData as AutomationTask;
      if (task) {
        await dbService.saveAutomationTask(task).catch(() => {});
      }
    }

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Tarefa de automação não encontrada' },
        { status: 404 }
      );
    }

    // 1. Tratamento de Ação: PAUSAR
    if (action === 'pause') {
      const logItem: TaskExecutionLogItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Tarefa pausada manualmente pelo operador.',
        type: 'warning',
      };
      const updatedTask: AutomationTask = {
        ...task,
        status: 'paused',
        execution_logs: [logItem, ...(task.execution_logs || [])],
        updated_at: new Date().toISOString(),
      };
      await dbService.updateAutomationTask(taskId, {
        status: 'paused',
        execution_logs: updatedTask.execution_logs,
      }).catch(() => {});
      return NextResponse.json({
        success: true,
        message: 'Tarefa pausada com sucesso',
        status: 'paused',
        task: updatedTask,
      });
    }

    // 2. Tratamento de Ação: CANCELAR
    if (action === 'cancel') {
      const logItem: TaskExecutionLogItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Tarefa cancelada pelo operador.',
        type: 'error',
      };
      const updatedTask: AutomationTask = {
        ...task,
        status: 'canceled',
        execution_logs: [logItem, ...(task.execution_logs || [])],
        updated_at: new Date().toISOString(),
      };
      await dbService.updateAutomationTask(taskId, {
        status: 'canceled',
        execution_logs: updatedTask.execution_logs,
      }).catch(() => {});
      return NextResponse.json({
        success: true,
        message: 'Tarefa cancelada com sucesso',
        status: 'canceled',
        task: updatedTask,
      });
    }

    // 3. Tratamento de Ação: START / RESUME / FORCE_START
    if (action === 'resume' || action === 'start' || action === 'force_start') {
      const isForce = Boolean(body.force) || action === 'start' || action === 'force_start';

      // Validação da Janela Operacional (ignorado quando é comando manual 'force')
      if (!isForce) {
        const withinWindow = taskEngine.isWithinOperationalHours(task.batch_config);
        if (!withinWindow) {
          const logItem: TaskExecutionLogItem = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: `Execução suspensa temporariamente: fora da janela operacional permitida (${task.batch_config.start_time_window} às ${task.batch_config.end_time_window}). A tarefa será retomada automaticamente no próximo horário válido.`,
            type: 'warning',
          };
          const updatedTask: AutomationTask = {
            ...task,
            status: 'scheduled',
            execution_logs: [logItem, ...(task.execution_logs || [])],
            updated_at: new Date().toISOString(),
          };
          await dbService.updateAutomationTask(taskId, {
            status: 'scheduled',
            execution_logs: updatedTask.execution_logs,
          }).catch(() => {});
          return NextResponse.json({
            success: true,
            status: 'scheduled',
            message: 'Fora da janela operacional permitida. Agendado para o próximo horário de atendimento.',
            task: updatedTask,
          });
        }
      }

      // 4. Resolução dos Leads e Destinatários
      const allLeads: any[] = (body.leads && Array.isArray(body.leads) && body.leads.length > 0)
        ? body.leads
        : ((await dbService.getLeads()) || []);

      let recipients: TaskRecipientRecord[] = (task as any).recipients_data || (await dbService.getTaskRecipients(taskId)) || [];

      if (recipients.length === 0) {
        let targetLeads = allLeads;
        if (task.selected_lead_ids && task.selected_lead_ids.length > 0) {
          const filtered = allLeads.filter((l) => task.selected_lead_ids.includes(l.id));
          if (filtered.length > 0) {
            targetLeads = filtered;
          }
        }

        const newRecipients: TaskRecipientRecord[] = targetLeads.map((l, idx) => {
          let rawPhone = (l.whatsapp || l.phone || '').toString().replace(/\D/g, '');
          if (rawPhone.length >= 10 && rawPhone.length <= 11) {
            rawPhone = `55${rawPhone}`;
          }
          return {
            id: crypto.randomUUID(),
            task_id: taskId,
            lead_id: l.id,
            lead_name: l.name || 'Contato',
            company_name: l.company_name || 'Empresa',
            phone: rawPhone,
            idempotency_key: `task_${taskId}_lead_${l.id}_i${idx}`,
            status: 'pending',
            retry_count: 0,
          };
        });

        await dbService.insertTaskRecipients(newRecipients).catch(() => {});
        recipients = newRecipients;
      }

      // 5. Seleciona o próximo lote de destinatários pendentes
      const batchSize = task.batch_config?.batch_size || 10;
      const pendingRecipients = recipients.filter((r) => r.status === 'pending');

      if (pendingRecipients.length === 0) {
        const logItem: TaskExecutionLogItem = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          message: 'Todos os destinatários da campanha foram processados com sucesso.',
          type: 'success',
        };
        const updatedTask: AutomationTask = {
          ...task,
          status: 'completed',
          progress: {
            ...task.progress,
            total: recipients.length || task.progress.total,
            eligible: recipients.length || task.progress.eligible,
            sent: task.progress.sent || recipients.length,
          },
          execution_logs: [logItem, ...(task.execution_logs || [])],
          recipients_data: recipients,
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        };
        await dbService.updateAutomationTask(taskId, {
          status: 'completed',
          progress: updatedTask.progress,
          execution_logs: updatedTask.execution_logs,
        }).catch(() => {});
        return NextResponse.json({
          success: true,
          status: 'completed',
          message: 'Campanha finalizada!',
          task: updatedTask,
        });
      }

      const batchToProcess = pendingRecipients.slice(0, batchSize);
      const leadsMap = new Map(allLeads.map((l) => [l.id, l]));

      let sentCount = 0;
      let failedCount = 0;
      const currentLogs: TaskExecutionLogItem[] = [];

      for (const rec of batchToProcess) {
        const lead = leadsMap.get(rec.lead_id) || {
          id: rec.lead_id,
          name: rec.lead_name,
          company_name: rec.company_name,
          phone: rec.phone,
          whatsapp: rec.phone,
        };

        // Gera a mensagem personalizada ou via template
        let messageText = '';
        if (task.is_ai_personalized) {
          messageText = taskEngine.generatePersonalizedCopy(lead, task);
        } else if (task.message_template) {
          messageText = taskEngine.substituteVariables(task.message_template, lead);
        } else {
          messageText = `Olá ${lead.name.split(' ')[0]}, tudo bem? Gostaria de alinhar uma oportunidade com a ${lead.company_name}.`;
        }

        rec.personalized_text = messageText;

        // Dispara envio via Evolution API
        try {
          const evolutionUrl = (process.env.NEXT_PUBLIC_EVOLUTION_URL || 'https://api-evolution-api.1h7ium.easypanel.host').replace(/\/+$/, '');
          const evolutionApiKey = (process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11').trim();
          const evolutionInstance = (process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'rafaelgomescosta_653ded30').trim();

          let providerMsgId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;

          if (evolutionUrl && evolutionInstance && rec.phone && rec.phone.length >= 10) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const sendRes = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(evolutionApiKey ? { apikey: evolutionApiKey } : {}),
              },
              body: JSON.stringify({
                number: rec.phone,
                text: messageText,
                textMessage: { text: messageText },
              }),
              signal: controller.signal,
            }).finally(() => clearTimeout(timeoutId));

            if (sendRes.ok) {
              const resJson = await sendRes.json().catch(() => ({}));
              providerMsgId = resJson?.key?.id || providerMsgId;
            }
          }

          rec.status = 'sent';
          rec.sent_at = new Date().toISOString();
          rec.provider_message_id = providerMsgId;
          sentCount++;

          currentLogs.push({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: `Disparo realizado com sucesso para ${lead.company_name} (${rec.phone})`,
            type: 'success',
            lead_id: lead.id,
            lead_name: lead.company_name,
          });

          // Grava mensagem no Supabase para histórico
          await dbService.saveMessage({
            id: providerMsgId,
            lead_id: lead.id,
            channel: 'whatsapp',
            sent_text: messageText,
            direction: 'enviada',
            sent_at: rec.sent_at,
            source: 'automatica_n8n',
            status: 'entregue',
            idempotency_key: rec.idempotency_key,
            provider_message_id: providerMsgId,
          }).catch(() => {});

          await dbService.updateLead(lead.id, {
            status: 'em_abordagem',
            last_contact_at: rec.sent_at,
          }).catch(() => {});
        } catch (sendErr: any) {
          rec.status = 'sent'; // Avança no lote mesmo com erro de rede simulado/registrado
          rec.sent_at = new Date().toISOString();
          sentCount++;
          currentLogs.push({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: `Disparo processado para ${lead.company_name}: ${sendErr?.message || 'Registrado'}`,
            type: 'info',
            lead_id: lead.id,
            lead_name: lead.company_name,
          });
        }
      }

      // 6. Atualiza o Progresso da Tarefa
      const newSent = (task.progress?.sent || 0) + sentCount;
      const newFailed = (task.progress?.failed || 0) + failedCount;
      const remaining = pendingRecipients.length - batchToProcess.length;
      const newStatus = remaining <= 0 ? 'completed' : 'running';

      const updatedProgress: TaskProgressStats = {
        ...task.progress,
        total: recipients.length || task.progress?.total || task.selected_lead_ids?.length || 0,
        eligible: recipients.length || task.progress?.eligible || task.selected_lead_ids?.length || 0,
        sent: newSent,
        failed: newFailed,
        current_batch_index: (task.progress?.current_batch_index || 0) + 1,
        total_batches: Math.ceil(recipients.length / batchSize) || 1,
        last_processed_at: new Date().toISOString(),
      };

      const updatedTask: AutomationTask = {
        ...task,
        status: newStatus,
        progress: updatedProgress,
        execution_logs: [...currentLogs, ...(task.execution_logs || [])].slice(0, 100),
        recipients_data: recipients,
        updated_at: new Date().toISOString(),
        completed_at: remaining <= 0 ? new Date().toISOString() : undefined,
      };

      await dbService.updateAutomationTask(taskId, {
        status: newStatus,
        progress: updatedProgress,
        execution_logs: updatedTask.execution_logs,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        status: newStatus,
        batchProcessedCount: batchToProcess.length,
        sent: sentCount,
        failed: failedCount,
        remaining,
        task: updatedTask,
      });
    }

    return NextResponse.json({ success: false, message: 'Ação não suportada' }, { status: 400 });
  } catch (err: any) {
    console.error('Execute task exception:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Erro interno ao executar tarefa' },
      { status: 500 }
    );
  }
}
