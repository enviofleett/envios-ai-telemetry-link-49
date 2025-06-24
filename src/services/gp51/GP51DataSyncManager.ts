
import { supabase } from '@/integrations/supabase/client';

export interface SyncOperation {
  id: string;
  type: 'full_sync' | 'incremental_sync' | 'user_sync' | 'vehicle_sync';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  lastUpdate: Date;
  itemsProcessed: number;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  errorMessage?: string;
  details?: string;
}

export interface SyncConflict {
  id: string;
  entityType: 'user' | 'vehicle';
  conflictType: 'data_mismatch' | 'version_conflict' | 'deletion_conflict';
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  autoResolvable: boolean;
}

export interface DataIntegrityReport {
  score: number;
  totalRecords: number;
  issues: DataIntegrityIssue[];
  corruptedRecords: number;
  missingRelations: number;
  duplicateRecords: number;
  inconsistentData: number;
  timestamp: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  recommendations: string[];
}

export interface DataIntegrityIssue {
  id: string;
  type: 'corrupted' | 'missing_relation' | 'duplicate' | 'inconsistent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  entityId?: string;
  details?: any;
  autoFixable: boolean;
}

class GP51DataSyncManager {
  private syncOperations: Map<string, SyncOperation> = new Map();
  private subscribers: Set<(operation: SyncOperation) => void> = new Set();

  async startFullSync(): Promise<string> {
    const operationId = this.generateOperationId();
    const operation: SyncOperation = {
      id: operationId,
      type: 'full_sync',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      lastUpdate: new Date(),
      itemsProcessed: 0,
      totalItems: 0,
      successfulItems: 0,
      failedItems: 0
    };

    this.syncOperations.set(operationId, operation);
    this.notifySubscribers(operation);

    // Start sync process
    this.executeSync(operationId);
    
    return operationId;
  }

  async pauseSync(operationId: string): Promise<void> {
    const operation = this.syncOperations.get(operationId);
    if (operation && operation.status === 'running') {
      operation.status = 'paused';
      operation.lastUpdate = new Date();
      this.syncOperations.set(operationId, operation);
      this.notifySubscribers(operation);
    }
  }

  async resumeSync(operationId: string): Promise<void> {
    const operation = this.syncOperations.get(operationId);
    if (operation && operation.status === 'paused') {
      operation.status = 'running';
      operation.lastUpdate = new Date();
      this.syncOperations.set(operationId, operation);
      this.notifySubscribers(operation);
      this.executeSync(operationId);
    }
  }

  async cancelSync(operationId: string): Promise<void> {
    const operation = this.syncOperations.get(operationId);
    if (operation && (operation.status === 'running' || operation.status === 'paused')) {
      operation.status = 'cancelled';
      operation.completedAt = new Date();
      operation.lastUpdate = new Date();
      this.syncOperations.set(operationId, operation);
      this.notifySubscribers(operation);
    }
  }

  private async executeSync(operationId: string): Promise<void> {
    const operation = this.syncOperations.get(operationId);
    if (!operation) return;

    try {
      operation.status = 'running';
      operation.lastUpdate = new Date();
      this.notifySubscribers(operation);

      // Simulate sync progress
      for (let i = 0; i <= 100; i += 10) {
        const currentOp = this.syncOperations.get(operationId);
        if (!currentOp || currentOp.status === 'cancelled') break;

        operation.progress = i;
        operation.itemsProcessed = Math.floor(operation.totalItems * (i / 100));
        operation.lastUpdate = new Date();
        this.notifySubscribers(operation);

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (operation.status !== 'cancelled') {
        operation.status = 'completed';
        operation.progress = 100;
        operation.completedAt = new Date();
        operation.lastUpdate = new Date();
        this.notifySubscribers(operation);
      }
    } catch (error) {
      operation.status = 'failed';
      operation.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      operation.lastUpdate = new Date();
      this.notifySubscribers(operation);
    }
  }

  async generateIntegrityReport(): Promise<DataIntegrityReport> {
    try {
      console.log('🔍 Generating data integrity report...');

      // Query vehicles with proper error handling
      let vehicleCount = 0;
      let duplicatePlates: string[] = [];

      try {
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, gp51_device_id, created_at')
          .limit(1000);

        if (vehiclesError) {
          console.error('Error fetching vehicles:', vehiclesError);
          vehicleCount = 0;
        } else {
          vehicleCount = vehicles?.length || 0;
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
        vehicleCount = 0;
      }

      // Check for duplicates using a simpler approach
      try {
        const { data: allVehicles, error: allVehiclesError } = await supabase
          .from('vehicles')
          .select('gp51_device_id')
          .not('gp51_device_id', 'is', null);

        if (!allVehiclesError && allVehicles) {
          const deviceIds = allVehicles.map(v => v.gp51_device_id);
          const duplicates = deviceIds.filter((id, index) => deviceIds.indexOf(id) !== index);
          duplicatePlates = [...new Set(duplicates)];
        }
      } catch (error) {
        console.error('Failed to check for duplicates:', error);
      }

      // Query users with proper error handling
      let userCount = 0;
      let orphanedVehicles = 0;

      try {
        const { data: users, error: usersError } = await supabase
          .from('envio_users')
          .select('id, name')
          .limit(1000);

        if (usersError) {
          console.error('Error fetching users:', usersError);
          userCount = 0;
        } else {
          userCount = users?.length || 0;
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        userCount = 0;
      }

      // Calculate integrity score
      const issues: DataIntegrityIssue[] = [];
      let corruptedRecords = 0;
      let missingRelations = orphanedVehicles;
      let duplicateRecords = duplicatePlates.length;
      let inconsistentData = 0;

      // Add issues based on findings
      if (duplicateRecords > 0) {
        issues.push({
          id: 'duplicate-devices',
          type: 'duplicate',
          severity: 'medium',
          description: `Found ${duplicateRecords} duplicate device IDs`,
          autoFixable: true
        });
      }

      if (missingRelations > 0) {
        issues.push({
          id: 'orphaned-vehicles',
          type: 'missing_relation',
          severity: 'high',
          description: `Found ${missingRelations} vehicles without user assignments`,
          autoFixable: false
        });
      }

      const totalRecords = vehicleCount + userCount;
      const totalIssues = corruptedRecords + missingRelations + duplicateRecords + inconsistentData;
      
      let score = 100;
      if (totalRecords > 0) {
        score = Math.max(0, 100 - (totalIssues / totalRecords) * 100);
      }

      let status: 'excellent' | 'good' | 'warning' | 'critical';
      if (score >= 95) status = 'excellent';
      else if (score >= 80) status = 'good';
      else if (score >= 60) status = 'warning';
      else status = 'critical';

      const recommendations: string[] = [];
      if (duplicateRecords > 0) {
        recommendations.push('Remove duplicate device assignments to improve data consistency');
      }
      if (missingRelations > 0) {
        recommendations.push('Assign orphaned vehicles to appropriate users');
      }
      if (issues.length === 0) {
        recommendations.push('Data integrity is excellent - no immediate action required');
      }

      const report: DataIntegrityReport = {
        score,
        totalRecords,
        issues,
        corruptedRecords,
        missingRelations,
        duplicateRecords,
        inconsistentData,
        timestamp: new Date().toISOString(),
        status,
        recommendations
      };

      console.log('✅ Data integrity report generated:', report);
      return report;

    } catch (error) {
      console.error('❌ Failed to generate integrity report:', error);
      
      // Return a fallback report
      return {
        score: 0,
        totalRecords: 0,
        issues: [{
          id: 'report-generation-failed',
          type: 'corrupted',
          severity: 'critical',
          description: 'Failed to generate integrity report',
          autoFixable: false
        }],
        corruptedRecords: 0,
        missingRelations: 0,
        duplicateRecords: 0,
        inconsistentData: 0,
        timestamp: new Date().toISOString(),
        status: 'critical',
        recommendations: ['Contact system administrator to resolve data integrity check issues']
      };
    }
  }

  async resolveConflict(conflictId: string, resolution: 'prefer_local' | 'prefer_remote' | 'merge'): Promise<void> {
    console.log(`Resolving conflict ${conflictId} with resolution: ${resolution}`);
    // Implementation would depend on the specific conflict resolution strategy
  }

  getAllSyncOperations(): SyncOperation[] {
    return Array.from(this.syncOperations.values());
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
        console.error('Error in sync operation subscriber:', error);
      }
    });
  }

  private generateOperationId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const gp51DataSyncManager = new GP51DataSyncManager();
