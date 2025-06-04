
import { JobProcessingContext } from './enhanced-types.ts';

export interface TransactionResult {
  success: boolean;
  data?: any;
  error?: string;
  rollbackPerformed?: boolean;
}

export class TransactionManager {
  private context: JobProcessingContext;
  private createdUserIds: string[] = [];
  private createdVehicleIds: string[] = [];

  constructor(context: JobProcessingContext) {
    this.context = context;
  }

  async executeUserTransaction<T>(
    operation: () => Promise<T>,
    username: string
  ): Promise<TransactionResult> {
    try {
      console.log(`Starting transaction for user: ${username}`);
      
      // Execute the operation
      const result = await operation();
      
      console.log(`Transaction completed successfully for user: ${username}`);
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error(`Transaction failed for user ${username}:`, error);
      
      // Attempt rollback
      try {
        await this.rollbackUserTransaction(username);
        return {
          success: false,
          error: error.message,
          rollbackPerformed: true
        };
      } catch (rollbackError) {
        console.error(`Rollback failed for user ${username}:`, rollbackError);
        return {
          success: false,
          error: `${error.message}. Rollback also failed: ${rollbackError.message}`,
          rollbackPerformed: false
        };
      }
    }
  }

  private async rollbackUserTransaction(username: string): Promise<void> {
    console.log(`Attempting rollback for user: ${username}`);
    
    try {
      // Find and delete any vehicles created for this user in this session
      const { error: vehicleDeleteError } = await this.context.supabase
        .from('vehicles')
        .delete()
        .eq('gp51_username', username)
        .in('id', this.createdVehicleIds);

      if (vehicleDeleteError) {
        console.error(`Failed to rollback vehicles for user ${username}:`, vehicleDeleteError);
      } else {
        console.log(`Rolled back ${this.createdVehicleIds.length} vehicles for user ${username}`);
      }

      // Only delete the user if they were created in this session and have no other vehicles
      if (this.createdUserIds.length > 0) {
        const { data: existingVehicles } = await this.context.supabase
          .from('vehicles')
          .select('id')
          .eq('gp51_username', username)
          .limit(1);

        if (!existingVehicles || existingVehicles.length === 0) {
          const { error: userDeleteError } = await this.context.supabase
            .from('envio_users')
            .delete()
            .eq('gp51_username', username)
            .in('id', this.createdUserIds);

          if (userDeleteError) {
            console.error(`Failed to rollback user ${username}:`, userDeleteError);
          } else {
            console.log(`Rolled back user: ${username}`);
          }
        }
      }

    } catch (error) {
      console.error(`Rollback operation failed for user ${username}:`, error);
      throw error;
    }
  }

  trackCreatedUser(userId: string): void {
    this.createdUserIds.push(userId);
  }

  trackCreatedVehicles(vehicleIds: string[]): void {
    this.createdVehicleIds.push(...vehicleIds);
  }

  reset(): void {
    this.createdUserIds = [];
    this.createdVehicleIds = [];
  }
}
