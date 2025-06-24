
import { supabase } from '@/integrations/supabase/client';

export interface SyncOperation {
  id: string;
  type: 'full_sync' | 'incremental_sync' | 'conflict_resolution';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errors: SyncError[];
  conflicts: SyncConflict[];
}

export interface SyncError {
  id: string;
  operationId: string;
  entityType: 'user' | 'vehicle';
  entityId: string;
  errorType: 'network' | 'validation' | 'permission' | 'data_conflict';
  errorMessage: string;
  timestamp: Date;
  retryable: boolean;
}

export interface SyncConflict {
  id: string;
  operationId: string;
  entityType: 'user' | 'vehicle';
  entityId: string;
  conflictType: 'field_mismatch' | 'version_conflict' | 'deletion_conflict';
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
  autoResolvable: boolean;
  detectedAt: Date;
}

export interface DataIntegrityReport {
  id: string;
  generatedAt: Date;
  totalUsers: number;
  totalVehicles: number;
  inconsistencies: DataInconsistency[];
  summary: {
    criticalIssues: number;
    warningIssues: number;
    informationalIssues: number;
  };
}

export interface DataInconsistency {
  id: string;
  type: 'missing_data' | 'duplicate_data' | 'invalid_reference' | 'format_error';
  severity: 'critical' | 'warning' | 'info';
  entityType: 'user' | 'vehicle';
  entityId: string;
  description: string;
  suggestedAction: string;
  detectedAt: Date;
}

class GP51DataSyncManager {
  private static instance: GP51DataSyncManager;
  private operations: Map<string, SyncOperation> = new Map();
  private subscribers: Set<(operation: SyncOperation) => void> = new Set();

  private constructor() {}

  static getInstance(): GP51DataSyncManager {
    if (!GP51DataSyncManager.instance) {
      GP51DataSyncManager.instance = new GP51DataSyncManager();
    }
    return GP51DataSyncManager.instance;
  }

  async startFullSync(): Promise<string> {
    const operationId = crypto.randomUUID();
    
    const operation: SyncOperation = {
      id: operationId,
      type: 'full_sync',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      totalItems: 0,
      processedItems: 0,
      failedItems: 0,
      errors: [],
      conflicts: []
    };

    this.operations.set(operationId, operation);
    this.notifySubscribers(operation);

    // Start the sync process asynchronously
    this.executeFullSync(operationId).catch(error => {
      console.error('Full sync failed:', error);
      this.updateOperationStatus(operationId, 'failed');
    });

    return operationId;
  }

  private async executeFullSync(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    try {
      // Update status to running
      operation.status = 'running';
      this.notifySubscribers(operation);

      // Get total counts for progress tracking
      const { data: users } = await supabase
        .from('envio_users')
        .select('id', { count: 'exact', head: true });
      
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true });

      operation.totalItems = (users?.length || 0) + (vehicles?.length || 0);

      // Sync users first
      await this.syncUsers(operationId);
      
      // Then sync vehicles
      await this.syncVehicles(operationId);

      // Complete the operation
      operation.status = 'completed';
      operation.completedAt = new Date();
      operation.progress = 100;

    } catch (error) {
      operation.status = 'failed';
      operation.errors.push({
        id: crypto.randomUUID(),
        operationId,
        entityType: 'user',
        entityId: 'system',
        errorType: 'network',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        retryable: true
      });
    }

    this.notifySubscribers(operation);
  }

  private async syncUsers(operationId: string): Promise<void> {
    // Simulate user sync process
    const operation = this.operations.get(operationId);
    if (!operation) return;

    // This would contain actual GP51 API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    operation.processedItems += 50; // Example progress
    operation.progress = (operation.processedItems / operation.totalItems) * 100;
    this.notifySubscribers(operation);
  }

  private async syncVehicles(operationId: string): Promise<void> {
    // Simulate vehicle sync process
    const operation = this.operations.get(operationId);
    if (!operation) return;

    // This would contain actual GP51 API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    operation.processedItems += 50; // Example progress
    operation.progress = (operation.processedItems / operation.totalItems) * 100;
    this.notifySubscribers(operation);
  }

  async pauseSync(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    if (operation && operation.status === 'running') {
      operation.status = 'paused';
      this.notifySubscribers(operation);
    }
  }

  async resumeSync(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    if (operation && operation.status === 'paused') {
      operation.status = 'running';
      this.notifySubscribers(operation);
      
      // Resume the sync process
      this.executeFullSync(operationId);
    }
  }

  async cancelSync(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    if (operation && (operation.status === 'running' || operation.status === 'paused')) {
      operation.status = 'cancelled';
      operation.completedAt = new Date();
      this.notifySubscribers(operation);
    }
  }

  async generateIntegrityReport(): Promise<DataIntegrityReport> {
    console.log('🔍 Generating data integrity report...');

    const reportId = crypto.randomUUID();
    const now = new Date();

    try {
      // Get basic counts
      const { count: userCount } = await supabase
        .from('envio_users')
        .select('*', { count: 'exact', head: true });

      const { count: vehicleCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      // Check for data inconsistencies
      const inconsistencies: DataInconsistency[] = [];

      // Check for users without vehicles
      const { data: usersWithoutVehicles } = await supabase
        .from('envio_users')
        .select(`
          id, 
          name,
          vehicles!vehicles_owner_id_fkey(id)
        `)
        .is('vehicles.id', null);

      usersWithoutVehicles?.forEach(user => {
        inconsistencies.push({
          id: crypto.randomUUID(),
          type: 'missing_data',
          severity: 'info',
          entityType: 'user',
          entityId: user.id,
          description: `User "${user.name}" has no associated vehicles`,
          suggestedAction: 'Assign vehicles to user or verify if user should have vehicles',
          detectedAt: now
        });
      });

      // Check for vehicles without owners
      const { data: vehiclesWithoutOwners } = await supabase
        .from('vehicles')
        .select('id, vehicle_name, license_plate')
        .is('owner_id', null);

      vehiclesWithoutOwners?.forEach(vehicle => {
        inconsistencies.push({
          id: crypto.randomUUID(),
          type: 'missing_data',
          severity: 'warning',
          entityType: 'vehicle',
          entityId: vehicle.id,
          description: `Vehicle "${vehicle.vehicle_name || vehicle.license_plate}" has no owner assigned`,
          suggestedAction: 'Assign an owner to this vehicle',
          detectedAt: now
        });
      });

      // Check for duplicate license plates
      const { data: duplicatePlates } = await supabase
        .rpc('get_duplicate_license_plates')
        .select('license_plate, count')
        .gt('count', 1);

      if (duplicatePlates) {
        duplicatePlates.forEach(plate => {
          inconsistencies.push({
            id: crypto.randomUUID(),
            type: 'duplicate_data',
            severity: 'critical',
            entityType: 'vehicle',
            entityId: 'multiple',
            description: `Duplicate license plate "${plate.license_plate}" found in ${plate.count} vehicles`,
            suggestedAction: 'Review and update duplicate license plates to ensure uniqueness',
            detectedAt: now
          });
        });
      }

      const summary = {
        criticalIssues: inconsistencies.filter(i => i.severity === 'critical').length,
        warningIssues: inconsistencies.filter(i => i.severity === 'warning').length,
        informationalIssues: inconsistencies.filter(i => i.severity === 'info').length
      };

      const report: DataIntegrityReport = {
        id: reportId,
        generatedAt: now,
        totalUsers: userCount || 0,
        totalVehicles: vehicleCount || 0,
        inconsistencies,
        summary
      };

      console.log('✅ Data integrity report generated:', {
        totalUsers: report.totalUsers,
        totalVehicles: report.totalVehicles,
        issuesFound: inconsistencies.length
      });

      return report;

    } catch (error) {
      console.error('❌ Failed to generate integrity report:', error);
      
      // Return a basic report with error information
      return {
        id: reportId,
        generatedAt: now,
        totalUsers: 0,
        totalVehicles: 0,
        inconsistencies: [{
          id: crypto.randomUUID(),
          type: 'format_error',
          severity: 'critical',
          entityType: 'user',
          entityId: 'system',
          description: `Failed to generate integrity report: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestedAction: 'Check system logs and database connectivity',
          detectedAt: now
        }],
        summary: {
          criticalIssues: 1,
          warningIssues: 0,
          informationalIssues: 0
        }
      };
    }
  }

  async resolveConflict(conflictId: string, resolution: 'prefer_local' | 'prefer_remote' | 'merge'): Promise<void> {
    console.log(`🔧 Resolving conflict ${conflictId} with resolution: ${resolution}`);
    
    // Find the conflict across all operations
    let targetOperation: SyncOperation | undefined;
    let targetConflict: SyncConflict | undefined;

    for (const operation of this.operations.values()) {
      const conflict = operation.conflicts.find(c => c.id === conflictId);
      if (conflict) {
        targetOperation = operation;
        targetConflict = conflict;
        break;
      }
    }

    if (!targetOperation || !targetConflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    try {
      // Apply the resolution based on the chosen strategy
      switch (resolution) {
        case 'prefer_local':
          await this.applyLocalData(targetConflict);
          break;
        case 'prefer_remote':
          await this.applyRemoteData(targetConflict);
          break;
        case 'merge':
          await this.mergeData(targetConflict);
          break;
      }

      // Remove the conflict from the operation
      targetOperation.conflicts = targetOperation.conflicts.filter(c => c.id !== conflictId);
      this.notifySubscribers(targetOperation);

      console.log(`✅ Conflict ${conflictId} resolved successfully`);

    } catch (error) {
      console.error(`❌ Failed to resolve conflict ${conflictId}:`, error);
      throw error;
    }
  }

  private async applyLocalData(conflict: SyncConflict): Promise<void> {
    // Apply local data to the database
    const tableName = conflict.entityType === 'user' ? 'envio_users' : 'vehicles';
    
    await supabase
      .from(tableName)
      .update(conflict.localData)
      .eq('id', conflict.entityId);
  }

  private async applyRemoteData(conflict: SyncConflict): Promise<void> {
    // Apply remote data to the database
    const tableName = conflict.entityType === 'user' ? 'envio_users' : 'vehicles';
    
    await supabase
      .from(tableName)
      .update(conflict.remoteData)
      .eq('id', conflict.entityId);
  }

  private async mergeData(conflict: SyncConflict): Promise<void> {
    // Implement smart merge logic
    const mergedData = { ...conflict.localData, ...conflict.remoteData };
    
    const tableName = conflict.entityType === 'user' ? 'envio_users' : 'vehicles';
    
    await supabase
      .from(tableName)
      .update(mergedData)
      .eq('id', conflict.entityId);
  }

  getAllSyncOperations(): SyncOperation[] {
    return Array.from(this.operations.values());
  }

  getSyncOperation(operationId: string): SyncOperation | undefined {
    return this.operations.get(operationId);
  }

  subscribe(callback: (operation: SyncOperation) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(operation: SyncOperation): void {
    this.subscribers.forEach(callback => {
      try {
        callback(operation);
      } catch (error) {
        console.error('Sync subscriber error:', error);
      }
    });
  }

  private updateOperationStatus(operationId: string, status: SyncOperation['status']): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = status;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        operation.completedAt = new Date();
      }
      this.notifySubscribers(operation);
    }
  }
}

export const gp51DataSyncManager = GP51DataSyncManager.getInstance();
