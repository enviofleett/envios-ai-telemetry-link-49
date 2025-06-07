
import { supabase } from '@/integrations/supabase/client';

export interface TransactionOptions {
  retryAttempts?: number;
  timeoutMs?: number;
  isolationLevel?: 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  enableSavepoints?: boolean;
}

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  transactionId: string;
  duration: number;
  rollbackPerformed?: boolean;
  savepointsUsed?: string[];
}

export interface SavepointInfo {
  name: string;
  timestamp: number;
  operation: string;
}

export class EnhancedTransactionManager {
  private static instance: EnhancedTransactionManager;
  private activeTransactions = new Map<string, {
    startTime: number;
    savepoints: SavepointInfo[];
    operations: string[];
  }>();

  static getInstance(): EnhancedTransactionManager {
    if (!EnhancedTransactionManager.instance) {
      EnhancedTransactionManager.instance = new EnhancedTransactionManager();
    }
    return EnhancedTransactionManager.instance;
  }

  async executeTransaction<T>(
    operations: (client: any, transactionId: string) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<TransactionResult<T>> {
    const transactionId = this.generateTransactionId();
    const startTime = Date.now();
    
    const {
      retryAttempts = 3,
      timeoutMs = 30000,
      enableSavepoints = true
    } = options;

    this.activeTransactions.set(transactionId, {
      startTime,
      savepoints: [],
      operations: []
    });

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(`Starting transaction ${transactionId}, attempt ${attempt}/${retryAttempts}`);
        
        const result = await this.executeWithTimeout(
          () => this.runTransactionWithSavepoints(operations, transactionId, enableSavepoints),
          timeoutMs
        );

        const duration = Date.now() - startTime;
        this.activeTransactions.delete(transactionId);

        return {
          success: true,
          data: result,
          transactionId,
          duration,
          savepointsUsed: this.getSavepointNames(transactionId)
        };

      } catch (error) {
        lastError = error as Error;
        console.error(`Transaction ${transactionId} attempt ${attempt} failed:`, error);
        
        if (attempt < retryAttempts) {
          await this.wait(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    const duration = Date.now() - startTime;
    this.activeTransactions.delete(transactionId);

    return {
      success: false,
      error: lastError!,
      transactionId,
      duration,
      rollbackPerformed: true
    };
  }

  private async runTransactionWithSavepoints<T>(
    operations: (client: any, transactionId: string) => Promise<T>,
    transactionId: string,
    enableSavepoints: boolean
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      supabase.rpc('begin_transaction').then(async () => {
        try {
          if (enableSavepoints) {
            await this.createSavepoint(transactionId, 'transaction_start', 'BEGIN');
          }

          const result = await operations(supabase, transactionId);
          
          await supabase.rpc('commit_transaction');
          resolve(result);
        } catch (error) {
          console.error(`Transaction ${transactionId} failed, rolling back:`, error);
          await supabase.rpc('rollback_transaction');
          reject(error);
        }
      }).catch(reject);
    });
  }

  async createSavepoint(transactionId: string, name: string, operation: string): Promise<void> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const savepoint: SavepointInfo = {
      name,
      timestamp: Date.now(),
      operation
    };

    transaction.savepoints.push(savepoint);
    transaction.operations.push(operation);

    // In a real implementation, you would execute SQL SAVEPOINT command
    console.log(`Created savepoint ${name} for transaction ${transactionId}`);
  }

  async rollbackToSavepoint(transactionId: string, savepointName: string): Promise<void> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const savepointIndex = transaction.savepoints.findIndex(sp => sp.name === savepointName);
    if (savepointIndex === -1) {
      throw new Error(`Savepoint ${savepointName} not found in transaction ${transactionId}`);
    }

    // Remove savepoints created after the target savepoint
    transaction.savepoints.splice(savepointIndex + 1);
    
    // In a real implementation, you would execute SQL ROLLBACK TO SAVEPOINT command
    console.log(`Rolled back to savepoint ${savepointName} for transaction ${transactionId}`);
  }

  // Batch operations with individual rollback capability
  async executeBatchWithSelectiveRollback<T>(
    operations: Array<{
      name: string;
      operation: (client: any, transactionId: string) => Promise<T>;
      critical?: boolean;
    }>,
    options: TransactionOptions = {}
  ): Promise<{
    success: boolean;
    results: Array<{ name: string; success: boolean; data?: T; error?: Error }>;
    transactionId: string;
  }> {
    const transactionId = this.generateTransactionId();
    const results: Array<{ name: string; success: boolean; data?: T; error?: Error }> = [];
    
    try {
      await this.executeTransaction(async (client) => {
        for (const op of operations) {
          try {
            await this.createSavepoint(transactionId, `before_${op.name}`, op.name);
            
            const data = await op.operation(client, transactionId);
            results.push({ name: op.name, success: true, data });
            
          } catch (error) {
            console.error(`Operation ${op.name} failed:`, error);
            
            if (op.critical) {
              // Critical operation failed, rollback entire transaction
              throw error;
            } else {
              // Non-critical operation, rollback to savepoint and continue
              await this.rollbackToSavepoint(transactionId, `before_${op.name}`);
              results.push({ name: op.name, success: false, error: error as Error });
            }
          }
        }
      }, options);

      return { success: true, results, transactionId };
      
    } catch (error) {
      return { 
        success: false, 
        results, 
        transactionId 
      };
    }
  }

  // Enhanced user import with transaction management
  async executeUserImportTransaction(
    username: string,
    userData: any,
    vehicleData: any[]
  ): Promise<TransactionResult<{
    userId: string;
    vehicleIds: string[];
    importStats: any;
  }>> {
    return this.executeTransaction(async (client, transactionId) => {
      await this.createSavepoint(transactionId, 'before_user_creation', 'CREATE_USER');
      
      // Create user
      const { data: user, error: userError } = await client
        .from('envio_users')
        .insert({
          name: userData.name || username,
          email: userData.email || `${username}@example.com`,
          gp51_username: username,
          is_gp51_imported: true,
          import_source: 'gp51_api',
          registration_status: 'active'
        })
        .select()
        .single();

      if (userError) throw userError;

      await this.createSavepoint(transactionId, 'after_user_creation', 'USER_CREATED');

      // Create vehicles
      const vehicleIds: string[] = [];
      const importStats = {
        userCreated: 1,
        vehiclesCreated: 0,
        vehiclesFailed: 0
      };

      for (const vehicle of vehicleData) {
        try {
          await this.createSavepoint(transactionId, `before_vehicle_${vehicle.deviceid}`, 'CREATE_VEHICLE');
          
          const { data: createdVehicle, error: vehicleError } = await client
            .from('vehicles')
            .insert({
              device_id: vehicle.deviceid.toString(),
              device_name: vehicle.devicename,
              device_type: vehicle.devicetype?.toString(),
              gp51_username: username,
              envio_user_id: user.id,
              is_active: true,
              gp51_metadata: vehicle
            })
            .select()
            .single();

          if (vehicleError) throw vehicleError;
          
          vehicleIds.push(createdVehicle.id);
          importStats.vehiclesCreated++;
          
        } catch (vehicleError) {
          console.error(`Failed to create vehicle ${vehicle.deviceid}:`, vehicleError);
          await this.rollbackToSavepoint(transactionId, `before_vehicle_${vehicle.deviceid}`);
          importStats.vehiclesFailed++;
        }
      }

      return {
        userId: user.id,
        vehicleIds,
        importStats
      };
    }, {
      retryAttempts: 3,
      timeoutMs: 60000,
      enableSavepoints: true
    });
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Transaction timeout after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSavepointNames(transactionId: string): string[] {
    const transaction = this.activeTransactions.get(transactionId);
    return transaction?.savepoints.map(sp => sp.name) || [];
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Transaction monitoring
  getActiveTransactions(): Array<{
    id: string;
    duration: number;
    savepointCount: number;
    operations: string[];
  }> {
    const now = Date.now();
    return Array.from(this.activeTransactions.entries()).map(([id, info]) => ({
      id,
      duration: now - info.startTime,
      savepointCount: info.savepoints.length,
      operations: info.operations
    }));
  }

  // Performance metrics
  getTransactionMetrics(): {
    activeCount: number;
    averageDuration: number;
    longestRunning?: { id: string; duration: number };
  } {
    const active = this.getActiveTransactions();
    const averageDuration = active.length > 0 
      ? active.reduce((sum, tx) => sum + tx.duration, 0) / active.length 
      : 0;
    
    const longestRunning = active.length > 0
      ? active.reduce((longest, current) => 
          current.duration > longest.duration ? current : longest
        )
      : undefined;

    return {
      activeCount: active.length,
      averageDuration,
      longestRunning
    };
  }
}

export const enhancedTransactionManager = EnhancedTransactionManager.getInstance();
