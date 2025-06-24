
import { supabase } from '@/integrations/supabase/client';
import { DataIntegrityReport, DataIntegrityIssue } from '@/types/dataIntegrity';

export interface SyncConflict {
  id: string;
  type: string;
  description: string;
  localData: any;
  remoteData: any;
  resolution?: 'prefer_local' | 'prefer_remote' | 'merge';
}

export interface SyncOperation {
  id: string;
  type: 'full_sync' | 'incremental_sync' | 'conflict_resolution';
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  conflicts: SyncConflict[];
  errorMessage?: string;
  logs: string[];
}

type SyncOperationListener = (operation: SyncOperation) => void;

export class GP51DataSyncManager {
  private static instance: GP51DataSyncManager;
  private syncOperations: Map<string, SyncOperation> = new Map();
  private listeners: SyncOperationListener[] = [];

  private constructor() {}

  static getInstance(): GP51DataSyncManager {
    if (!GP51DataSyncManager.instance) {
      GP51DataSyncManager.instance = new GP51DataSyncManager();
    }
    return GP51DataSyncManager.instance;
  }

  subscribe(listener: SyncOperationListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(operation: SyncOperation): void {
    this.listeners.forEach(listener => listener(operation));
  }

  async startFullSync(): Promise<string> {
    const operationId = `sync_${Date.now()}`;
    const operation: SyncOperation = {
      id: operationId,
      type: 'full_sync',
      status: 'pending',
      startTime: new Date(),
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      failedItems: 0,
      conflicts: [],
      logs: []
    };

    this.syncOperations.set(operationId, operation);
    this.notifyListeners(operation);

    // Start the sync process
    this.executeFullSync(operationId);

    return operationId;
  }

  private async executeFullSync(operationId: string): Promise<void> {
    const operation = this.syncOperations.get(operationId);
    if (!operation) return;

    try {
      operation.status = 'running';
      operation.logs.push('Starting full synchronization...');
      this.notifyListeners(operation);

      // Step 1: Get total count for progress tracking
      const { count: totalVehicles, error: countError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Failed to get vehicle count: ${countError.message}`);
      }

      operation.totalItems = totalVehicles || 0;
      operation.logs.push(`Found ${operation.totalItems} vehicles to sync`);
      this.notifyListeners(operation);

      // Step 2: Sync vehicles in batches
      const batchSize = 50;
      let offset = 0;

      while (offset < operation.totalItems && operation.status === 'running') {
        try {
          const { data: vehicles, error: fetchError } = await supabase
            .from('vehicles')
            .select('id, name, gp51_device_id, user_id')
            .range(offset, offset + batchSize - 1);

          if (fetchError) {
            operation.logs.push(`Batch sync error at offset ${offset}: ${fetchError.message}`);
            operation.failedItems += batchSize;
          } else if (vehicles) {
            // Process each vehicle in the batch
            for (const vehicle of vehicles) {
              if (operation.status !== 'running') break;
              
              try {
                // Simulate sync processing
                await this.syncVehicleData(vehicle);
                operation.processedItems++;
              } catch (error) {
                operation.failedItems++;
                operation.logs.push(`Failed to sync vehicle ${vehicle.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }

          offset += batchSize;
          operation.progress = Math.round((offset / operation.totalItems) * 100);
          this.notifyListeners(operation);

          // Small delay to prevent overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          operation.logs.push(`Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          operation.failedItems += batchSize;
        }
      }

      if (operation.status === 'running') {
        operation.status = 'completed';
        operation.endTime = new Date();
        operation.logs.push(`Sync completed. Processed: ${operation.processedItems}, Failed: ${operation.failedItems}`);
      }

    } catch (error) {
      operation.status = 'failed';
      operation.endTime = new Date();
      operation.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      operation.logs.push(`Sync failed: ${operation.errorMessage}`);
    }

    this.notifyListeners(operation);
  }

  private async syncVehicleData(vehicle: any): Promise<void> {
    // Simulate vehicle data synchronization
    // This would normally involve calling GP51 API and updating vehicle data
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Check for potential conflicts (simplified example)
    if (Math.random() < 0.1) { // 10% chance of conflict
      const operation = Array.from(this.syncOperations.values()).find(op => op.status === 'running');
      if (operation) {
        const conflict: SyncConflict = {
          id: `conflict_${Date.now()}_${vehicle.id}`,
          type: 'data_mismatch',
          description: `Data mismatch detected for vehicle ${vehicle.name || vehicle.id}`,
          localData: vehicle,
          remoteData: { ...vehicle, lastSync: new Date() }
        };
        operation.conflicts.push(conflict);
      }
    }
  }

  async pauseSync(operationId: string): Promise<void> {
    const operation = this.syncOperations.get(operationId);
    if (operation && operation.status === 'running') {
      operation.status = 'paused';
      operation.logs.push('Sync paused by user');
      this.notifyListeners(operation);
    }
  }

  async resumeSync(operationId: string): Promise<void> {
    const operation = this.syncOperations.get(operationId);
    if (operation && operation.status === 'paused') {
      operation.status = 'running';
      operation.logs.push('Sync resumed by user');
      this.notifyListeners(operation);
      // Continue the sync process
      this.executeFullSync(operationId);
    }
  }

  async cancelSync(operationId: string): Promise<void> {
    const operation = this.syncOperations.get(operationId);
    if (operation && (operation.status === 'running' || operation.status === 'paused')) {
      operation.status = 'cancelled';
      operation.endTime = new Date();
      operation.logs.push('Sync cancelled by user');
      this.notifyListeners(operation);
    }
  }

  async generateIntegrityReport(): Promise<DataIntegrityReport> {
    const report: DataIntegrityReport = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      overallScore: 0,
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      issues: [],
      recommendations: [],
      checks: []
    };

    try {
      // Get vehicle count
      const { count: totalVehicles, error: countError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Failed to get vehicle count: ${countError.message}`);
      }

      report.totalRecords = totalVehicles || 0;

      // Check for vehicles without GP51 device IDs
      const { count: vehiclesWithoutDeviceId, error: noDeviceError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .is('gp51_device_id', null);

      if (!noDeviceError && vehiclesWithoutDeviceId) {
        const issue: DataIntegrityIssue = {
          id: 'missing_device_ids',
          type: 'missing_data',
          description: `${vehiclesWithoutDeviceId} vehicles missing GP51 device IDs`,
          severity: vehiclesWithoutDeviceId > 10 ? 'high' : 'medium',
          autoFixable: false,
          count: vehiclesWithoutDeviceId
        };
        report.issues.push(issue);
        report.invalidRecords += vehiclesWithoutDeviceId;
      }

      // Check for vehicles without user assignments
      const { count: vehiclesWithoutUser, error: noUserError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null);

      if (!noUserError && vehiclesWithoutUser) {
        const issue: DataIntegrityIssue = {
          id: 'missing_user_assignments',
          type: 'missing_assignment',
          description: `${vehiclesWithoutUser} vehicles not assigned to users`,
          severity: vehiclesWithoutUser > 5 ? 'high' : 'medium',
          autoFixable: true,
          count: vehiclesWithoutUser
        };
        report.issues.push(issue);
        report.invalidRecords += vehiclesWithoutUser;
      }

      // Calculate valid records
      report.validRecords = report.totalRecords - report.invalidRecords;

      // Calculate overall score
      if (report.totalRecords > 0) {
        report.overallScore = Math.round((report.validRecords / report.totalRecords) * 100);
      } else {
        report.overallScore = 100;
      }

      // Determine status based on score
      if (report.overallScore >= 95) {
        report.status = 'ok';
      } else if (report.overallScore >= 80) {
        report.status = 'warning';
      } else {
        report.status = 'critical';
      }

      // Add recommendations
      if (report.issues.length > 0) {
        report.recommendations.push('Review and resolve data integrity issues');
        if (report.issues.some(issue => issue.autoFixable)) {
          report.recommendations.push('Run auto-fix for resolvable issues');
        }
      }

    } catch (error) {
      report.status = 'critical';
      report.issues.push({
        id: 'report_generation_error',
        type: 'system_error',
        description: `Failed to generate integrity report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        autoFixable: false
      });
    }

    return report;
  }

  async resolveConflict(conflictId: string, resolution: 'prefer_local' | 'prefer_remote' | 'merge'): Promise<void> {
    for (const operation of this.syncOperations.values()) {
      const conflict = operation.conflicts.find(c => c.id === conflictId);
      if (conflict) {
        conflict.resolution = resolution;
        operation.logs.push(`Conflict ${conflictId} resolved with strategy: ${resolution}`);
        this.notifyListeners(operation);
        break;
      }
    }
  }

  getAllSyncOperations(): SyncOperation[] {
    return Array.from(this.syncOperations.values());
  }

  getSyncOperation(operationId: string): SyncOperation | undefined {
    return this.syncOperations.get(operationId);
  }
}

export const gp51DataSyncManager = GP51DataSyncManager.getInstance();
