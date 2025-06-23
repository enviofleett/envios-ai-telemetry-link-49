
import { BulkEmailOperation, BulkEmailRequest } from './types';
import { BulkOperationsManager } from './operationsManager';
import { BulkEmailExecutor } from './emailExecutor';
import { CSVProcessor } from './csvProcessor';
import { AnalyticsExporter } from './analyticsExporter';

class BulkEmailService {
  private operationsManager = new BulkOperationsManager();
  private emailExecutor = new BulkEmailExecutor();
  private csvProcessor = new CSVProcessor();
  private analyticsExporter = new AnalyticsExporter();

  async processBulkEmail(request: BulkEmailRequest): Promise<BulkEmailOperation> {
    // Create operation record
    const operation = await this.operationsManager.createBulkEmailOperation({
      operation_type: 'send_bulk',
      operation_name: `Bulk Email: ${request.subject}`,
      total_items: request.recipients.length,
      operation_data: {
        subject: request.subject,
        message: request.message,
        template_id: request.template_id,
        scheduled_for: request.scheduled_for
      }
    });

    try {
      // Update status to processing
      await this.operationsManager.updateOperation(operation.id, { status: 'processing' });

      if (request.send_immediately !== false) {
        // Process immediately
        await this.emailExecutor.executeBulkSend(operation.id, request);
      } else {
        // Schedule for later (would integrate with a job queue in production)
        console.log(`Bulk email scheduled for: ${request.scheduled_for}`);
      }

      return operation;
    } catch (error) {
      await this.operationsManager.updateOperation(operation.id, { 
        status: 'failed',
        error_log: [{ error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() }]
      });
      throw error;
    }
  }

  // Delegate methods to respective managers
  async getBulkOperations(): Promise<BulkEmailOperation[]> {
    return this.operationsManager.getBulkOperations();
  }

  async getBulkOperation(id: string): Promise<BulkEmailOperation | null> {
    return this.operationsManager.getBulkOperation(id);
  }

  async cancelBulkOperation(id: string): Promise<void> {
    return this.operationsManager.cancelBulkOperation(id);
  }

  async importRecipientsFromCSV(csvData: string): Promise<Array<{email: string, name?: string}>> {
    return this.csvProcessor.importRecipientsFromCSV(csvData);
  }

  async exportAnalytics(dateRange: { from: Date; to: Date }): Promise<string> {
    return this.analyticsExporter.exportAnalytics(dateRange);
  }
}

export const bulkEmailService = new BulkEmailService();

// Export types for external use
export type { BulkEmailOperation, BulkEmailRequest } from './types';
