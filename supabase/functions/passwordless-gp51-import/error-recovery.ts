
import { UserImportResult } from './types.ts';

export interface RollbackContext {
  authUsersCreated: string[];
  envioUsersCreated: string[];
  vehiclesCreated: string[];
  operationsLog: Array<{
    operation: string;
    timestamp: string;
    data: any;
  }>;
}

export class ErrorRecoveryManager {
  private context: RollbackContext;
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.context = {
      authUsersCreated: [],
      envioUsersCreated: [],
      vehiclesCreated: [],
      operationsLog: []
    };
  }

  logOperation(operation: string, data: any) {
    this.context.operationsLog.push({
      operation,
      timestamp: new Date().toISOString(),
      data
    });
  }

  addAuthUser(userId: string) {
    this.context.authUsersCreated.push(userId);
    this.logOperation('auth_user_created', { userId });
  }

  addEnvioUser(userId: string) {
    this.context.envioUsersCreated.push(userId);
    this.logOperation('envio_user_created', { userId });
  }

  addVehicles(deviceIds: string[]) {
    this.context.vehiclesCreated.push(...deviceIds);
    this.logOperation('vehicles_created', { deviceIds });
  }

  async rollbackTransaction(): Promise<void> {
    console.log('Starting rollback operation...');
    
    // Rollback in reverse order
    try {
      // Remove vehicles first
      if (this.context.vehiclesCreated.length > 0) {
        console.log(`Rolling back ${this.context.vehiclesCreated.length} vehicles...`);
        const { error: vehicleError } = await this.supabase
          .from('vehicles')
          .delete()
          .in('device_id', this.context.vehiclesCreated);
        
        if (vehicleError) {
          console.error('Failed to rollback vehicles:', vehicleError);
        } else {
          console.log('Successfully rolled back vehicles');
        }
      }

      // Remove envio users
      if (this.context.envioUsersCreated.length > 0) {
        console.log(`Rolling back ${this.context.envioUsersCreated.length} envio users...`);
        const { error: envioError } = await this.supabase
          .from('envio_users')
          .delete()
          .in('id', this.context.envioUsersCreated);
        
        if (envioError) {
          console.error('Failed to rollback envio users:', envioError);
        } else {
          console.log('Successfully rolled back envio users');
        }
      }

      // Remove auth users last
      if (this.context.authUsersCreated.length > 0) {
        console.log(`Rolling back ${this.context.authUsersCreated.length} auth users...`);
        for (const userId of this.context.authUsersCreated) {
          try {
            await this.supabase.auth.admin.deleteUser(userId);
            console.log(`Rolled back auth user: ${userId}`);
          } catch (error) {
            console.error(`Failed to rollback auth user ${userId}:`, error);
          }
        }
      }

      console.log('Rollback operation completed');
    } catch (error) {
      console.error('Critical error during rollback:', error);
      throw error;
    }
  }

  async cleanupOrphanedData(): Promise<void> {
    console.log('Starting orphaned data cleanup...');

    try {
      // Find vehicles without valid envio users
      const { data: orphanedVehicles, error: vehicleError } = await this.supabase
        .from('vehicles')
        .select('id, device_id, envio_user_id')
        .is('envio_user_id', null)
        .or('envio_user_id.not.in.(select id from envio_users)');

      if (vehicleError) {
        console.error('Error finding orphaned vehicles:', vehicleError);
      } else if (orphanedVehicles && orphanedVehicles.length > 0) {
        console.log(`Found ${orphanedVehicles.length} orphaned vehicles, cleaning up...`);
        const { error: deleteError } = await this.supabase
          .from('vehicles')
          .delete()
          .in('id', orphanedVehicles.map(v => v.id));
        
        if (deleteError) {
          console.error('Failed to cleanup orphaned vehicles:', deleteError);
        } else {
          console.log('Successfully cleaned up orphaned vehicles');
        }
      }

      // Find envio users without auth users (more complex check)
      // This would require additional validation logic

      console.log('Orphaned data cleanup completed');
    } catch (error) {
      console.error('Error during orphaned data cleanup:', error);
    }
  }

  getContext(): RollbackContext {
    return { ...this.context };
  }
}

export class RetryManager {
  static async withExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 30000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  static isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const retryableMessages = [
      'network',
      'timeout',
      'connection',
      'rate limit',
      'temporary',
      'service unavailable'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }
}
