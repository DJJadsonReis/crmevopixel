export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/supabase/db-service';
import { taskEngine } from '@/lib/services/task-engine';
import { normalizeWhatsAppNumber, sanitizeOutboundCustomerMessage } from '@/lib/utils/whatsapp';
import {
  AutomationTask,
  TaskRecipientRecord,
  TaskExecutionLogItem,
  TaskProgressStats,
  MessageLog,
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
        message: 'Tarefa pausada manualmente pelo operador. Disparos suspensos.',
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
    if (action === 'resume' || action === 'start' || action === 'force_start' || action === 'process_next_batch') {
      const isForce = Boolean(body.force) || action === 'start' || action === 'force_start';

      // Se a tarefa estiver pausada e não for comando explícito de retomada, não avança
      if (task.status === 'paused' && !isForce && action === 'resume') {
        return NextResponse.json({
          success: true,
          status: 'paused',
          message: 'Tarefa pausada. Ignorando loop automático.',
          task,
        });
      }

      // Validação da Janela Operacional (ignorado quando é comando manual 'force')
      if (!isForce) {
        const withinWindow = taskEngine.isWithinOperationalHours(task.batch_config);
        if (!withinWindow) {
          const logItem: TaskExecutionLogItem = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: `Execução suspensa temporariamente: fora da janela operacional permitida (${task.batch_config.start_time_window} às ${task.batch_config.end_time_window}).`,
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
            message: 'Fora da janela operacional permitida.',
            task: updatedTask,
          });
        }

        // Validação da Pausa Entre Lotes (next_batch_at)
        if (task.progress?.next_batch_at) {
          const nextBatchTime = new Date(task.progress.next_batch_at).getTime();
          const now = Date.now();
          if (now < nextBatchTime) {
            const diffMinutes = Math.ceil((nextBatchTime - now) / 60000);
            return NextResponse.json({
              success: true,
              status: 'running',
              waitingNextBatch: true,
              next_batch_at: task.progress.next_batch_at,
              message: `Aguardando pausa programada entre lotes (${diffMinutes} min restantes até ${new Date(task.progress.next_batch_at).toLocaleTimeString('pt-BR')}).`,
              task,
            });
          }
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
          const cleanPhone = normalizeWhatsAppNumber(l.whatsapp || l.phone || '');
          return {
            id: crypto.randomUUID(),
            task_id: taskId,
            lead_id: l.id,
            lead_name: l.name || 'Contato',
            company_name: l.company_name || 'Empresa',
            phone: cleanPhone,
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
            next_batch_at: undefined,
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
          message: 'Campanha finalizada com sucesso!',
          task: updatedTask,
        });
      }

      const batchToProcess = pendingRecipients.slice(0, batchSize);
      const leadsMap = new Map(allLeads.map((l) => [l.id, l]));

      let sentCount = 0;
      let failedCount = 0;
      const currentLogs: TaskExecutionLogItem[] = [];
      const dispatchedMessages: MessageLog[] = [];

      const evolutionUrl = (process.env.NEXT_PUBLIC_EVOLUTION_URL || 'https://api-evolution-api.1h7ium.easypanel.host').replace(/\/+$/, '');
      const evolutionApiKey = (process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11').trim();
      const evolutionInstance = (process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'rafaelgomescosta_653ded30').trim();

      for (let i = 0; i < batchToProcess.length; i++) {
        const rec = batchToProcess[i];
        const lead = leadsMap.get(rec.lead_id) || {
          id: rec.lead_id,
          name: rec.lead_name,
          company_name: rec.company_name,
          phone: rec.phone,
          whatsapp: rec.phone,
        };

        // Normalização rigorosa do telefone
        const targetPhone = normalizeWhatsAppNumber(rec.phone || lead.whatsapp || lead.phone);
        rec.phone = targetPhone;

        // Gera a mensagem personalizada ou via template
        let rawMessageText = '';
        if (task.is_ai_personalized) {
          rawMessageText = taskEngine.generatePersonalizedCopy(lead, task);
        } else if (task.message_template) {
          rawMessageText = taskEngine.substituteVariables(task.message_template, lead);
        } else {
          rawMessageText = `Olá ${lead.name.split(' ')[0]}, tudo bem? Gostaria de alinhar uma oportunidade com a ${lead.company_name}.`;
        }

        // Sanitização contra termos proibidos para cliente externo
        const messageText = sanitizeOutboundCustomerMessage(rawMessageText);
        rec.personalized_text = messageText;

        // Pausa anti-ban humanizada entre mensagens individuais dentro do lote (2s a 4s)
        if (i > 0) {
          const delayMs = Math.min(3000, Math.max(1500, (task.batch_config?.min_message_interval_seconds || 5) * 500));
          await new Promise((r) => setTimeout(r, delayMs));
        }

        let isSuccess = false;
        let providerMsgId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        let sendErrorDetail = '';

        try {
          if (evolutionUrl && evolutionInstance && targetPhone && targetPhone.length >= 10) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const sendRes = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(evolutionApiKey ? { apikey: evolutionApiKey } : {}),
              },
              body: JSON.stringify({
                number: targetPhone,
                text: messageText,
                textMessage: { text: messageText },
              }),
              signal: controller.signal,
            }).finally(() => clearTimeout(timeoutId));

            if (sendRes.ok) {
              const resJson = await sendRes.json().catch(() => ({}));
              providerMsgId = resJson?.key?.id || providerMsgId;
              isSuccess = true;
            } else {
              const errBody = await sendRes.text().catch(() => '');
              sendErrorDetail = `HTTP ${sendRes.status}: ${errBody}`;
              isSuccess = false;
            }
          } else {
            sendErrorDetail = 'Configuração da Evolution API ausente ou número inválido';
          }
        } catch (sendErr: any) {
          sendErrorDetail = sendErr?.message || 'Erro de conexão com Evolution API';
          isSuccess = false;
        }

        const nowIso = new Date().toISOString();

        if (isSuccess) {
          rec.status = 'sent';
          rec.sent_at = nowIso;
          rec.provider_message_id = providerMsgId;
          sentCount++;

          currentLogs.push({
            id: crypto.randomUUID(),
            timestamp: nowIso,
            message: `Disparo realizado com sucesso para ${lead.company_name} (${targetPhone})`,
            type: 'success',
            lead_id: lead.id,
            lead_name: lead.company_name,
          });

          const msgLog: MessageLog = {
            id: providerMsgId,
            lead_id: lead.id,
            phone: targetPhone,
            sender_name: 'Você',
            step_name: 'Disparo de Automação em Lote',
            channel: 'WhatsApp (Evolution API)',
            sent_text: messageText,
            direction: 'enviada',
            sent_at: nowIso,
            source: 'automatica_n8n',
            status: 'entregue',
            provider_message_id: providerMsgId,
          };
          dispatchedMessages.push(msgLog);

          // Grava mensagem no Supabase para histórico eterno
          await dbService.saveMessage({
            id: providerMsgId,
            lead_id: lead.id,
            channel: 'whatsapp',
            sent_text: messageText,
            direction: 'enviada',
            sent_at: nowIso,
            source: 'automatica_n8n',
            status: 'entregue',
            idempotency_key: rec.idempotency_key,
            provider_message_id: providerMsgId,
          }).catch(() => {});

          await dbService.updateLead(lead.id, {
            status: 'em_abordagem',
            last_contact_at: nowIso,
          }).catch(() => {});
        } else {
          rec.status = 'failed';
          rec.error_message = sendErrorDetail;
          failedCount++;

          currentLogs.push({
            id: crypto.randomUUID(),
            timestamp: nowIso,
            message: `Falha no envio para ${lead.company_name} (${targetPhone}): ${sendErrorDetail}`,
            type: 'error',
            lead_id: lead.id,
            lead_name: lead.company_name,
          });
        }
      }

      // 6. Atualiza o Progresso da Tarefa e Configura a Pausa entre Lotes
      const newSent = (task.progress?.sent || 0) + sentCount;
      const newFailed = (task.progress?.failed || 0) + failedCount;
      const remainingRecipients = pendingRecipients.length - batchToProcess.length;

      let nextBatchAt: string | undefined = undefined;
      let newStatus: AutomationTask['status'] = 'running';

      if (remainingRecipients <= 0) {
        newStatus = 'completed';
        currentLogs.unshift({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          message: `Campanha concluída! Total enviado: ${newSent}, Falhas: ${newFailed}.`,
          type: 'success',
        });
      } else {
        // Programa intervalo de pausa obrigatório entre lotes
        const pauseMinutes = task.batch_config?.batch_interval_minutes || 30;
        nextBatchAt = new Date(Date.now() + pauseMinutes * 60000).toISOString();

        currentLogs.unshift({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          message: `Lote de ${batchToProcess.length} contatos finalizado (${sentCount} enviadas, ${failedCount} falhas). Pausa de ${pauseMinutes} min iniciada para proteção da linha WhatsApp. Próximo lote às ${new Date(nextBatchAt).toLocaleTimeString('pt-BR')}.`,
          type: 'info',
        });
      }

      const updatedProgress: TaskProgressStats = {
        ...task.progress,
        total: recipients.length || task.progress?.total || task.selected_lead_ids?.length || 0,
        eligible: recipients.length || task.progress?.eligible || task.selected_lead_ids?.length || 0,
        sent: newSent,
        failed: newFailed,
        current_batch_index: (task.progress?.current_batch_index || 0) + 1,
        total_batches: Math.ceil(recipients.length / batchSize) || 1,
        last_processed_at: new Date().toISOString(),
        next_batch_at: nextBatchAt,
      };

      const updatedTask: AutomationTask = {
        ...task,
        status: newStatus,
        progress: updatedProgress,
        execution_logs: [...currentLogs, ...(task.execution_logs || [])].slice(0, 100),
        recipients_data: recipients,
        updated_at: new Date().toISOString(),
        completed_at: remainingRecipients <= 0 ? new Date().toISOString() : undefined,
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
        remaining: remainingRecipients,
        next_batch_at: nextBatchAt,
        dispatchedMessages,
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
