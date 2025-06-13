
import { emailTriggerService } from '@/services/emailTriggers/emailTriggerService';
import { BulkEmailRequest, BulkEmailRecipient } from './types';
import { BulkOperationsManager } from './operationsManager';

export class BulkEmailExecutor {
  private operationsManager = new BulkOperationsManager();

  async executeBulkSend(operationId: string, request: BulkEmailRequest): Promise<void> {
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    const errorLog: any[] = [];

    for (const recipient of request.recipients) {
      try {
        await emailTriggerService.sendTriggeredEmail({
          to: recipient.email,
          trigger_type: 'bulk_operation',
          template_variables: {
            user_name: recipient.name || recipient.email,
            ...recipient.variables || {}
          },
          related_entity_id: operationId,
          fallback_subject: request.subject,
          fallback_message: request.message
        });

        successCount++;
      } catch (error) {
        failedCount++;
        errorLog.push({
          recipient: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }

      processedCount++;

      // Update progress every 10 emails
      if (processedCount % 10 === 0) {
        await this.operationsManager.updateOperation(operationId, {
          processed_items: processedCount,
          successful_items: successCount,
          failed_items: failedCount
        });
      }

      // Small delay to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Final update
    await this.operationsManager.updateOperation(operationId, {
      status: failedCount === 0 ? 'completed' : 'failed',
      processed_items: processedCount,
      successful_items: successCount,
      failed_items: failedCount,
      completed_at: new Date().toISOString(),
      error_log: errorLog.length > 0 ? errorLog : undefined
    });
  }
}
