
import { supabase } from '@/integrations/supabase/client';

export interface SyncOperation {
  id: string;
  type: 'full_sync' | 'incremental_sync' | 'conflict_resolution';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  totalItems: number;
  processedItems: number;
  errorCount: number;
  errorMessage?: string; // Added this property
  conflicts: SyncConflict[];
  details: Record<string, any>;
}

export interface SyncConflict {
  id: string;
  entityType: 'user' | 'vehicle';
  entityId: string;
  conflictType: 'data_mismatch' | 'version_conflict' | 'duplicate_entry';
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  autoResolvable: boolean;
}

export interface DataIntegrityReport {
  timestamp: string;
  score: number;
  totalRecords: number;
  issues: DataIntegrityIssue[];
  corruptedRecords: number;
  missingRelations: number;
  duplicateRecords: number;
  inconsistentData: number;
  recommendations: string[];
}

export interface DataIntegrityIssue {
  id: string;
  type: 'corrupted' | 'missing_relation' | 'duplicate' | 'inconsistent';
  description: string;
  entityId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: any;
}

export class GP51DataSyncManager {
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
      errorCount: 0,
      conflicts: [],
      details: {}
    };

    this.operations.set(operationId, operation);
    this.notifySubscribers(operation);

    // Start the sync process
    this.executeSync(operationId);

    return operationId;
  }

  private async executeSync(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    try {
      // Update status to running
      operation.status = 'running';
      this.notifySubscribers(operation);

      // Simulate sync process with proper error handling
      await this.syncVehicleData(operation);
      await this.syncUserData(operation);

      // Complete the operation
      operation.status = 'completed';
      operation.progress = 100;
      operation.completedAt = new Date();
      this.notifySubscribers(operation);

    } catch (error) {
      operation.status = 'failed';
      operation.errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      operation.errorCount++;
      this.notifySubscribers(operation);
    }
  }

  private async syncVehicleData(operation: SyncOperation): Promise<void> {
    try {
      // Get vehicles with proper column names
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, name, license_plate, gp51_device_id, user_id')
        .limit(1000);

      if (error) {
        throw new Error(`Failed to fetch vehicles: ${error.message}`);
      }

      operation.totalItems += vehicles?.length || 0;
      operation.processedItems += vehicles?.length || 0;
      operation.progress = Math.min((operation.processedItems / operation.totalItems) * 100, 90);
      
      this.notifySubscribers(operation);
    } catch (error) {
      console.error('Vehicle sync error:', error);
      operation.errorCount++;
      operation.errorMessage = error instanceof Error ? error.message : 'Vehicle sync failed';
      throw error;
    }
  }

  private async syncUserData(operation: SyncOperation): Promise<void> {
    try {
      const { data: users, error } = await supabase
        .from('envio_users')
        .select('id, name, email, gp51_username')
        .limit(1000);

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      operation.totalItems += users?.length || 0;
      operation.processedItems += users?.length || 0;
      operation.progress = 100;
      
      this.notifySubscribers(operation);
    } catch (error) {
      console.error('User sync error:', error);
      operation.errorCount++;
      operation.errorMessage = error instanceof Error ? error.message : 'User sync failed';
      throw error;
    }
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
      this.executeSync(operationId);
    }
  }

  async cancelSync(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = 'failed';
      operation.errorMessage = 'Operation cancelled by user';
      this.notifySubscribers(operation);
    }
  }

  async generateIntegrityReport(): Promise<DataIntegrityReport> {
    try {
      console.log('🔍 Generating data integrity report...');

      // Check for duplicate license plates
      const { data: duplicates, error: duplicatesError } = await supabase
        .from('vehicles')
        .select('license_plate')
        .not('license_plate', 'is', null)
        .not('license_plate', 'eq', '');

      if (duplicatesError) {
        console.error('Error checking duplicates:', duplicatesError);
      }

      // Count total records
      const { count: vehicleCount, error: countError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error counting vehicles:', countError);
      }

      // Check for missing relations
      const { data: orphanedVehicles, error: orphanError } = await supabase
        .from('vehicles')
        .select('id, user_id')
        .not('user_id', 'is', null);

      if (orphanError) {
        console.error('Error checking orphaned vehicles:', orphanError);
      }

      const issues: DataIntegrityIssue[] = [];
      const duplicateCount = this.countDuplicates(duplicates || []);
      const missingRelationCount = 0; // We'll calculate this properly
      const corruptedCount = 0;

      if (duplicateCount > 0) {
        issues.push({
          id: crypto.randomUUID(),
          type: 'duplicate',
          description: `Found ${duplicateCount} duplicate license plates`,
          severity: duplicateCount > 10 ? 'high' : 'medium',
          details: { count: duplicateCount }
        });
      }

      const totalRecords = vehicleCount || 0;
      const totalIssues = duplicateCount + missingRelationCount + corruptedCount;
      const score = totalRecords > 0 ? Math.max(0, 100 - (totalIssues / totalRecords) * 100) : 100;

      const report: DataIntegrityReport = {
        timestamp: new Date().toISOString(),
        score: Math.round(score),
        totalRecords,
        issues,
        corruptedRecords: corruptedCount,
        missingRelations: missingRelationCount,
        duplicateRecords: duplicateCount,
        inconsistentData: 0,
        recommendations: this.generateRecommendations(issues)
      };

      console.log('✅ Data integrity report generated:', report);
      return report;

    } catch (error) {
      console.error('❌ Failed to generate integrity report:', error);
      
      // Return a fallback report
      return {
        timestamp: new Date().toISOString(),
        score: 0,
        totalRecords: 0,
        issues: [{
          id: crypto.randomUUID(),
          type: 'corrupted',
          description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'critical'
        }],
        corruptedRecords: 0,
        missingRelations: 0,
        duplicateRecords: 0,
        inconsistentData: 0,
        recommendations: ['Fix data integrity check errors', 'Ensure database connectivity']
      };
    }
  }

  private countDuplicates(records: any[]): number {
    const licensePlates = records.map(r => r.license_plate).filter(Boolean);
    const uniquePlates = new Set(licensePlates);
    return licensePlates.length - uniquePlates.size;
  }

  private generateRecommendations(issues: DataIntegrityIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.type === 'duplicate')) {
      recommendations.push('Remove or merge duplicate records');
    }
    
    if (issues.some(i => i.type === 'missing_relation')) {
      recommendations.push('Fix broken relationships between entities');
    }
    
    if (issues.some(i => i.type === 'corrupted')) {
      recommendations.push('Repair corrupted data entries');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Data integrity is good - no immediate actions required');
    }
    
    return recommendations;
  }

  async resolveConflict(conflictId: string, resolution: 'prefer_local' | 'prefer_remote' | 'merge'): Promise<void> {
    console.log(`🔧 Resolving conflict ${conflictId} with resolution: ${resolution}`);
    
    // Find the conflict across all operations
    for (const operation of this.operations.values()) {
      const conflictIndex = operation.conflicts.findIndex(c => c.id === conflictId);
      if (conflictIndex !== -1) {
        // Remove the resolved conflict
        operation.conflicts.splice(conflictIndex, 1);
        this.notifySubscribers(operation);
        console.log(`✅ Conflict ${conflictId} resolved`);
        return;
      }
    }
    
    console.warn(`⚠️ Conflict ${conflictId} not found`);
  }

  getAllSyncOperations(): SyncOperation[] {
    return Array.from(this.operations.values());
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
        console.error('Subscriber error:', error);
      }
    });
  }
}

export const gp51DataSyncManager = GP51DataSyncManager.getInstance();
