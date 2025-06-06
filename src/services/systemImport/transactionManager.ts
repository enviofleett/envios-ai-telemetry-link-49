
import { supabase } from '@/integrations/supabase/client';
import { importErrorHandler } from './errorHandler';

export interface TransactionContext {
  importId: string;
  backupTables: string[];
  operations: TransactionOperation[];
  startTime: Date;
}

export interface TransactionOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: Date;
  completed: boolean;
  rollbackData?: any;
}

export class TransactionManager {
  private context: TransactionContext | null = null;
  private rollbackStack: TransactionOperation[] = [];

  async startTransaction(importId: string): Promise<void> {
    console.log('Starting transaction for import:', importId);
    
    this.context = {
      importId,
      backupTables: [],
      operations: [],
      startTime: new Date()
    };

    // Create system backup first
    try {
      const { data: backupResult, error } = await supabase.rpc('create_system_backup_for_import', {
        import_id: importId
      });

      if (error) {
        importErrorHandler.logError(
          'BACKUP_CREATION_FAILED',
          `Failed to create system backup: ${error.message}`,
          { importId, error },
          false
        );
        throw error;
      }

      if (backupResult?.backup_tables) {
        this.context.backupTables = backupResult.backup_tables;
        console.log('System backup created:', backupResult);
      }
    } catch (error) {
      this.context = null;
      throw error;
    }
  }

  async executeOperation(operation: Omit<TransactionOperation, 'id' | 'timestamp' | 'completed'>): Promise<any> {
    if (!this.context) {
      throw new Error('No active transaction context');
    }

    const fullOperation: TransactionOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      completed: false
    };

    try {
      let result;
      
      switch (operation.type) {
        case 'insert':
          const { data: insertData, error: insertError } = await supabase
            .from(operation.table)
            .insert(operation.data)
            .select();
          
          if (insertError) throw insertError;
          result = insertData;
          break;
          
        case 'update':
          const { data: updateData, error: updateError } = await supabase
            .from(operation.table)
            .update(operation.data.values)
            .eq('id', operation.data.id)
            .select();
          
          if (updateError) throw updateError;
          result = updateData;
          break;
          
        case 'delete':
          const { data: deleteData, error: deleteError } = await supabase
            .from(operation.table)
            .delete()
            .eq('id', operation.data.id)
            .select();
          
          if (deleteError) throw deleteError;
          result = deleteData;
          break;
          
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }

      fullOperation.completed = true;
      this.context.operations.push(fullOperation);
      this.rollbackStack.push(fullOperation);
      
      return result;
    } catch (error) {
      importErrorHandler.logError(
        'TRANSACTION_OPERATION_FAILED',
        `Transaction operation failed: ${error.message}`,
        { operation: fullOperation, error },
        true
      );
      throw error;
    }
  }

  async commitTransaction(): Promise<void> {
    if (!this.context) {
      throw new Error('No active transaction to commit');
    }

    console.log(`Committing transaction with ${this.context.operations.length} operations`);
    
    // Log successful completion
    await supabase
      .from('gp51_import_audit_log')
      .insert({
        system_import_id: this.context.importId,
        operation_type: 'transaction_committed',
        operation_details: {
          operationsCount: this.context.operations.length,
          duration: Date.now() - this.context.startTime.getTime(),
          backupTables: this.context.backupTables
        },
        success: true
      });

    this.context = null;
    this.rollbackStack = [];
  }

  async rollbackTransaction(reason?: string): Promise<void> {
    if (!this.context) {
      console.warn('No active transaction to rollback');
      return;
    }

    console.log('Rolling back transaction:', reason || 'Unknown reason');
    
    try {
      // Rollback operations in reverse order
      for (let i = this.rollbackStack.length - 1; i >= 0; i--) {
        const operation = this.rollbackStack[i];
        await this.rollbackOperation(operation);
      }

      // Log rollback completion
      await supabase
        .from('gp51_import_audit_log')
        .insert({
          system_import_id: this.context.importId,
          operation_type: 'transaction_rolled_back',
          operation_details: {
            reason: reason || 'Unknown',
            operationsRolledBack: this.rollbackStack.length,
            backupTables: this.context.backupTables
          },
          success: true
        });

      console.log(`Successfully rolled back ${this.rollbackStack.length} operations`);
    } catch (error) {
      importErrorHandler.logError(
        'ROLLBACK_FAILED',
        `Transaction rollback failed: ${error.message}`,
        { reason, error },
        false
      );
      throw error;
    } finally {
      this.context = null;
      this.rollbackStack = [];
    }
  }

  private async rollbackOperation(operation: TransactionOperation): Promise<void> {
    try {
      switch (operation.type) {
        case 'insert':
          // Delete the inserted record
          await supabase
            .from(operation.table)
            .delete()
            .eq('id', operation.data.id);
          break;
          
        case 'update':
          // Restore the original values
          if (operation.rollbackData) {
            await supabase
              .from(operation.table)
              .update(operation.rollbackData)
              .eq('id', operation.data.id);
          }
          break;
          
        case 'delete':
          // Restore the deleted record
          if (operation.rollbackData) {
            await supabase
              .from(operation.table)
              .insert(operation.rollbackData);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to rollback operation ${operation.id}:`, error);
      throw error;
    }
  }

  getTransactionContext(): TransactionContext | null {
    return this.context;
  }
}

export const transactionManager = new TransactionManager();
