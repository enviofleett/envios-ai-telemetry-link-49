
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

interface BackupResult {
  backup_timestamp: string;
  import_id: string;
  backed_up_users: number;
  backed_up_vehicles: number;
  backed_up_sessions: number;
  backed_up_roles: number;
  backup_tables: string[];
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

      if (backupResult && typeof backupResult === 'object') {
        const result = backupResult as BackupResult;
        if (result.backup_tables && Array.isArray(result.backup_tables)) {
          this.context.backupTables = result.backup_tables;
          console.log('System backup created:', result);
        }
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
      
      // Use specific table operations instead of dynamic table names
      switch (operation.table) {
        case 'envio_users':
          result = await this.executeUserOperation(operation);
          break;
        case 'vehicles':
          result = await this.executeVehicleOperation(operation);
          break;
        case 'gp51_sessions':
          result = await this.executeSessionOperation(operation);
          break;
        case 'user_roles':
          result = await this.executeRoleOperation(operation);
          break;
        default:
          throw new Error(`Unsupported table for transaction: ${operation.table}`);
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

  private async executeUserOperation(operation: TransactionOperation): Promise<any> {
    switch (operation.type) {
      case 'insert':
        const { data: insertData, error: insertError } = await supabase
          .from('envio_users')
          .insert(operation.data)
          .select();
        if (insertError) throw insertError;
        return insertData;
        
      case 'update':
        const { data: updateData, error: updateError } = await supabase
          .from('envio_users')
          .update(operation.data.values)
          .eq('id', operation.data.id)
          .select();
        if (updateError) throw updateError;
        return updateData;
        
      case 'delete':
        const { data: deleteData, error: deleteError } = await supabase
          .from('envio_users')
          .delete()
          .eq('id', operation.data.id)
          .select();
        if (deleteError) throw deleteError;
        return deleteData;
        
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private async executeVehicleOperation(operation: TransactionOperation): Promise<any> {
    switch (operation.type) {
      case 'insert':
        const { data: insertData, error: insertError } = await supabase
          .from('vehicles')
          .insert(operation.data)
          .select();
        if (insertError) throw insertError;
        return insertData;
        
      case 'update':
        const { data: updateData, error: updateError } = await supabase
          .from('vehicles')
          .update(operation.data.values)
          .eq('id', operation.data.id)
          .select();
        if (updateError) throw updateError;
        return updateData;
        
      case 'delete':
        const { data: deleteData, error: deleteError } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', operation.data.id)
          .select();
        if (deleteError) throw deleteError;
        return deleteData;
        
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private async executeSessionOperation(operation: TransactionOperation): Promise<any> {
    switch (operation.type) {
      case 'insert':
        const { data: insertData, error: insertError } = await supabase
          .from('gp51_sessions')
          .insert(operation.data)
          .select();
        if (insertError) throw insertError;
        return insertData;
        
      case 'update':
        const { data: updateData, error: updateError } = await supabase
          .from('gp51_sessions')
          .update(operation.data.values)
          .eq('id', operation.data.id)
          .select();
        if (updateError) throw updateError;
        return updateData;
        
      case 'delete':
        const { data: deleteData, error: deleteError } = await supabase
          .from('gp51_sessions')
          .delete()
          .eq('id', operation.data.id)
          .select();
        if (deleteError) throw deleteError;
        return deleteData;
        
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private async executeRoleOperation(operation: TransactionOperation): Promise<any> {
    switch (operation.type) {
      case 'insert':
        const { data: insertData, error: insertError } = await supabase
          .from('user_roles')
          .insert(operation.data)
          .select();
        if (insertError) throw insertError;
        return insertData;
        
      case 'update':
        const { data: updateData, error: updateError } = await supabase
          .from('user_roles')
          .update(operation.data.values)
          .eq('id', operation.data.id)
          .select();
        if (updateError) throw updateError;
        return updateData;
        
      case 'delete':
        const { data: deleteData, error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('id', operation.data.id)
          .select();
        if (deleteError) throw deleteError;
        return deleteData;
        
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
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
      switch (operation.table) {
        case 'envio_users':
          await this.rollbackUserOperation(operation);
          break;
        case 'vehicles':
          await this.rollbackVehicleOperation(operation);
          break;
        case 'gp51_sessions':
          await this.rollbackSessionOperation(operation);
          break;
        case 'user_roles':
          await this.rollbackRoleOperation(operation);
          break;
        default:
          console.warn(`Unsupported table for rollback: ${operation.table}`);
      }
    } catch (error) {
      console.error(`Failed to rollback operation ${operation.id}:`, error);
      throw error;
    }
  }

  private async rollbackUserOperation(operation: TransactionOperation): Promise<void> {
    switch (operation.type) {
      case 'insert':
        await supabase.from('envio_users').delete().eq('id', operation.data.id);
        break;
      case 'update':
        if (operation.rollbackData) {
          await supabase.from('envio_users').update(operation.rollbackData).eq('id', operation.data.id);
        }
        break;
      case 'delete':
        if (operation.rollbackData) {
          await supabase.from('envio_users').insert(operation.rollbackData);
        }
        break;
    }
  }

  private async rollbackVehicleOperation(operation: TransactionOperation): Promise<void> {
    switch (operation.type) {
      case 'insert':
        await supabase.from('vehicles').delete().eq('id', operation.data.id);
        break;
      case 'update':
        if (operation.rollbackData) {
          await supabase.from('vehicles').update(operation.rollbackData).eq('id', operation.data.id);
        }
        break;
      case 'delete':
        if (operation.rollbackData) {
          await supabase.from('vehicles').insert(operation.rollbackData);
        }
        break;
    }
  }

  private async rollbackSessionOperation(operation: TransactionOperation): Promise<void> {
    switch (operation.type) {
      case 'insert':
        await supabase.from('gp51_sessions').delete().eq('id', operation.data.id);
        break;
      case 'update':
        if (operation.rollbackData) {
          await supabase.from('gp51_sessions').update(operation.rollbackData).eq('id', operation.data.id);
        }
        break;
      case 'delete':
        if (operation.rollbackData) {
          await supabase.from('gp51_sessions').insert(operation.rollbackData);
        }
        break;
    }
  }

  private async rollbackRoleOperation(operation: TransactionOperation): Promise<void> {
    switch (operation.type) {
      case 'insert':
        await supabase.from('user_roles').delete().eq('id', operation.data.id);
        break;
      case 'update':
        if (operation.rollbackData) {
          await supabase.from('user_roles').update(operation.rollbackData).eq('id', operation.data.id);
        }
        break;
      case 'delete':
        if (operation.rollbackData) {
          await supabase.from('user_roles').insert(operation.rollbackData);
        }
        break;
    }
  }

  getTransactionContext(): TransactionContext | null {
    return this.context;
  }
}

export const transactionManager = new TransactionManager();
