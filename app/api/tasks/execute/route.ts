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
    const { taskId, action } = body; // action: 'start' | 'pause' | 'resume' | 'cancel' | 'process_next_batch'

    if (!taskId) {
      return NextResponse.json(
        { success: false, message: 'ID da tarefa é obrigatório' },
        { status: 400 }
      );
    }

    const task = await dbService.getAutomationTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Tarefa de automação não encontrada' },
        { status: 404 }
      );
    }

    // 1. Tratamento de Ações de Controle
    if (action === 'pause') {
      const logItem: TaskExecutionLogItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Tarefa pausada manualmente pelo operador.',
        type: 'warning',
      };
      await dbService.updateAutomationTask(taskId, {
        status: 'paused',
        execution_logs: [logItem, ...(task.execution_logs || [])],
      });
      return NextResponse.json({ success: true, message: 'Tarefa pausada', status: 'paused' });
    }

    if (action === 'cancel') {
      const logItem: TaskExecutionLogItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Tarefa cancelada pelo operador.',
        type: 'error',
      };
      await dbService.updateAutomationTask(taskId, {
        status: 'canceled',
        execution_logs: [logItem, ...(task.execution_logs || [])],
      });
      return NextResponse.json({ success: true, message: 'Tarefa cancelada', status: 'canceled' });
    }

    if (action === 'resume' || action === 'start') {
      // 2. Validação da Janela Operacional (ex: 09:00 - 18:00)
      const withinWindow = taskEngine.isWithinOperationalHours(task.batch_config);
      if (!withinWindow) {
        const logItem: TaskExecutionLogItem = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          message: `Execução suspensa temporariamente: fora da janela operacional permitida (${task.batch_config.start_time_window} às ${task.batch_config.end_time_window}). A tarefa será retomada automaticamente no próximo horário válido.`,
          type: 'warning',
        };
        await dbService.updateAutomationTask(taskId, {
          status: 'scheduled',
          execution_logs: [logItem, ...(task.execution_logs || [])],
        });
        return NextResponse.json({
          success: true,
          status: 'scheduled',
          message: 'Fora da janela operacional permitida. Agendado para o próximo horário de atendimento.',
        });
      }

      // 3. Inicialização dos Destinatários se ainda não existem
      let recipients = (await dbService.getTaskRecipients(taskId)) || [];
      const allLeads = (await dbService.getLeads()) || [];

      if (recipients.length === 0 && task.selected_lead_ids.length > 0) {
        const targetLeads = allLeads.filter((l) => task.selected_lead_ids.includes(l.id));
        const newRecipients: TaskRecipientRecord[] = targetLeads.map((l, idx) => {
          const rawPhone = (l.whatsapp || l.phone || '').replace(/\D/g, '');
          const cleanPhone = rawPhone.length <= 11 ? `55${rawPhone}` : rawPhone;
          return {
            id: crypto.randomUUID(),
            task_id: taskId,
            lead_id: l.id,
            lead_name: l.name,
            company_name: l.company_name,
            phone: cleanPhone,
            idempotency_key: `task_${taskId}_lead_${l.id}_i${idx}`,
            status: 'pending',
            retry_count: 0,
          };
        });
        await dbService.insertTaskRecipients(newRecipients);
        recipients = newRecipients;
      }

      // 4. Seleciona o próximo lote de destinatários pendentes
      const batchSize = task.batch_config.batch_size || 20;
      const pendingRecipients = recipients.filter((r) => r.status === 'pending');

      if (pendingRecipients.length === 0) {
        // Todos já foram processados!
        const logItem: TaskExecutionLogItem = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          message: 'Todos os destinatários da campanha foram processados com sucesso.',
          type: 'success',
        };
        await dbService.updateAutomationTask(taskId, {
          status: 'completed',
          execution_logs: [logItem, ...(task.execution_logs || [])],
        });
        return NextResponse.json({ success: true, status: 'completed', message: 'Campanha finalizada!' });
      }

      const batchToProcess = pendingRecipients.slice(0, batchSize);
      const leadsMap = new Map(allLeads.map((l) => [l.id, l]));

      let sentCount = 0;
      let failedCount = 0;
      const currentLogs: TaskExecutionLogItem[] = [];

      // Dispara envio do lote (com controle de erro por lead)
      for (const rec of batchToProcess) {
        const lead = leadsMap.get(rec.lead_id);
        if (!lead) {
          rec.status = 'failed';
          rec.error_message = 'Lead não localizado na base';
          failedCount++;
          continue;
        }

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

        // Dispara envio via endpoint interno ou Evolution API
        try {
          const evolutionUrl = (process.env.NEXT_PUBLIC_EVOLUTION_URL || 'https://api-evolution-api.1h7ium.easypanel.host').replace(/\/+$/, '');
          const evolutionApiKey = (process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11').trim();
          const evolutionInstance = (process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'rafaelgomescosta_653ded30').trim();

          let providerMsgId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;

          if (evolutionUrl && evolutionInstance) {
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
            });

            if (sendRes.ok) {
              const resJson = await sendRes.json().catch(() => ({}));
              providerMsgId = resJson?.key?.id || providerMsgId;
            }
          }

          rec.status = 'sent';
          rec.sent_at = new Date().toISOString();
          rec.provider_message_id = providerMsgId;
          sentCount++;

          // Grava mensagem no Supabase para histórico completo
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
          });

          // Atualiza status do Lead para 'em_abordagem'
          await dbService.updateLead(lead.id, {
            status: 'em_abordagem',
            last_contact_at: rec.sent_at,
          });

          currentLogs.push({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: `Disparo realizado com sucesso para ${lead.company_name} (${rec.phone})`,
            type: 'success',
            lead_id: lead.id,
            lead_name: lead.company_name,
          });
        } catch (sendErr: any) {
          rec.status = 'failed';
          rec.error_message = sendErr?.message || 'Falha no disparo';
          failedCount++;
          currentLogs.push({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: `Falha no envio para ${lead.company_name}: ${rec.error_message}`,
            type: 'error',
            lead_id: lead.id,
            lead_name: lead.company_name,
          });
        }

        // Atualiza o registro individual do destinatário
        await dbService.updateTaskRecipient(rec.id, rec);
      }

      // 5. Atualiza o Progresso da Tarefa
      const newSent = (task.progress?.sent || 0) + sentCount;
      const newFailed = (task.progress?.failed || 0) + failedCount;
      const remaining = pendingRecipients.length - batchToProcess.length;
      const newStatus = remaining <= 0 ? 'completed' : 'running';

      const updatedProgress: TaskProgressStats = {
        ...task.progress,
        sent: newSent,
        failed: newFailed,
        current_batch_index: (task.progress?.current_batch_index || 0) + 1,
        total_batches: Math.ceil(recipients.length / batchSize),
        last_processed_at: new Date().toISOString(),
      };

      await dbService.updateAutomationTask(taskId, {
        status: newStatus,
        progress: updatedProgress,
        execution_logs: [...currentLogs, ...(task.execution_logs || [])].slice(0, 100),
      });

      return NextResponse.json({
        success: true,
        status: newStatus,
        batchProcessedCount: batchToProcess.length,
        sent: sentCount,
        failed: failedCount,
        remaining,
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
