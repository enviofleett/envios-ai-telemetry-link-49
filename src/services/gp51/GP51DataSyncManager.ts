import { supabase } from '@/integrations/supabase/client';

export interface SyncOperation {
  id: string;
  type: 'full_sync' | 'incremental_sync' | 'manual_sync';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  conflicts: SyncConflict[];
  errorMessage?: string;
  metadata: Record<string, any>;
}

export interface SyncConflict {
  id: string;
  operationId: string;
  entityType: 'user' | 'vehicle';
  entityId: string;
  conflictType: 'data_mismatch' | 'concurrent_update' | 'constraint_violation';
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
  autoResolvable: boolean;
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: 'prefer_local' | 'prefer_remote' | 'merge';
}

export interface DataIntegrityReport {
  id: string;
  generatedAt: Date;
  score: number;
  totalRecords: number;
  issues: DataIntegrityIssue[];
  corruptedRecords: number;
  missingRelations: number;
  duplicateRecords: number;
  inconsistentData: number;
  timestamp: Date;
  recommendations: string[];
}

export interface DataIntegrityIssue {
  id: string;
  type: 'corrupted' | 'missing_relation' | 'duplicate' | 'inconsistent';
  description: string;
  entityType: string;
  entityId?: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  details: Record<string, any>;
  suggestedFix?: string;
}

class GP51DataSyncManager {
  private operations: Map<string, SyncOperation> = new Map();
  private subscribers: Set<(operation: SyncOperation) => void> = new Set();
  private isRunning = false;

  async startFullSync(): Promise<string> {
    if (this.isRunning) {
      throw new Error('Sync operation already in progress');
    }

    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      type: 'full_sync',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      totalItems: 0,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      conflicts: [],
      metadata: {}
    };

    this.operations.set(operation.id, operation);
    this.notifySubscribers(operation);

    // Start the sync process
    this.executeSync(operation);

    return operation.id;
  }

  private async executeSync(operation: SyncOperation): Promise<void> {
    try {
      this.isRunning = true;
      operation.status = 'running';
      this.notifySubscribers(operation);

      // Get total items count
      const { count } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      operation.totalItems = count || 0;
      this.notifySubscribers(operation);

      // Process vehicles in batches
      const batchSize = 100;
      let offset = 0;

      while (offset < operation.totalItems) {
        if (operation.status === 'cancelled') {
          break;
        }

        if (operation.status === 'paused') {
          await new Promise(resolve => {
            const checkStatus = () => {
              if (operation.status !== 'paused') {
                resolve(void 0);
              } else {
                setTimeout(checkStatus, 1000);
              }
            };
            checkStatus();
          });
        }

        // Fetch batch of vehicles
        const { data: vehicles, error } = await supabase
          .from('vehicles')
          .select('id, name, license_plate, envio_user_id')
          .range(offset, offset + batchSize - 1);

        if (error) {
          console.error('Error fetching vehicles:', error);
          operation.failedItems += batchSize;
        } else if (vehicles) {
          // Process each vehicle
          for (const vehicle of vehicles) {
            try {
              await this.syncVehicleData(vehicle, operation);
              operation.successfulItems++;
            } catch (error) {
              console.error(`Failed to sync vehicle ${vehicle.id}:`, error);
              operation.failedItems++;
            }
            
            operation.processedItems++;
            operation.progress = (operation.processedItems / operation.totalItems) * 100;
            
            // Update operation every 10 items
            if (operation.processedItems % 10 === 0) {
              this.notifySubscribers(operation);
            }
          }
        }

        offset += batchSize;
      }

      operation.status = operation.status === 'cancelled' ? 'cancelled' : 'completed';
      operation.completedAt = new Date();
      
    } catch (error) {
      operation.status = 'failed';
      operation.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      operation.completedAt = new Date();
    } finally {
      this.isRunning = false;
      this.notifySubscribers(operation);
    }
  }

  private async syncVehicleData(vehicle: any, operation: SyncOperation): Promise<void> {
    // Simulate sync logic - replace with actual GP51 integration
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check for data conflicts
    const conflict = await this.detectConflicts(vehicle);
    if (conflict) {
      operation.conflicts.push(conflict);
    }
  }

  private async detectConflicts(vehicle: any): Promise<SyncConflict | null> {
    // Simulate conflict detection
    if (Math.random() < 0.1) { // 10% chance of conflict
      return {
        id: crypto.randomUUID(),
        operationId: '',
        entityType: 'vehicle',
        entityId: vehicle.id,
        conflictType: 'data_mismatch',
        localData: { name: vehicle.name },
        remoteData: { name: 'Updated ' + vehicle.name },
        severity: 'medium',
        autoResolvable: false,
        detectedAt: new Date()
      };
    }
    return null;
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
    
    const report: DataIntegrityReport = {
      id: crypto.randomUUID(),
      generatedAt: new Date(),
      score: 0,
      totalRecords: 0,
      issues: [],
      corruptedRecords: 0,
      missingRelations: 0,
      duplicateRecords: 0,
      inconsistentData: 0,
      timestamp: new Date(),
      recommendations: []
    };

    try {
      // Get total records count
      const { count: vehicleCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      const { count: userCount } = await supabase
        .from('envio_users')
        .select('*', { count: 'exact', head: true });

      report.totalRecords = (vehicleCount || 0) + (userCount || 0);

      // Check for duplicate license plates
      const duplicates = await this.findDuplicateLicensePlates();
      report.duplicateRecords = duplicates.length;
      
      // Add duplicate issues
      duplicates.forEach(duplicate => {
        report.issues.push({
          id: crypto.randomUUID(),
          type: 'duplicate',
          description: `Duplicate license plate: ${duplicate.license_plate}`,
          entityType: 'vehicle',
          severity: 'medium',
          detectedAt: new Date(),
          details: { license_plate: duplicate.license_plate, count: duplicate.count },
          suggestedFix: 'Review and merge duplicate vehicles'
        });
      });

      // Check for missing relations
      const { data: orphanedVehicles } = await supabase
        .from('vehicles')
        .select('id, name, envio_user_id')
        .is('envio_user_id', null);

      if (orphanedVehicles) {
        report.missingRelations = orphanedVehicles.length;
        
        orphanedVehicles.forEach(vehicle => {
          report.issues.push({
            id: crypto.randomUUID(),
            type: 'missing_relation',
            description: `Vehicle ${vehicle.name} has no assigned user`,
            entityType: 'vehicle',
            entityId: vehicle.id,
            severity: 'high',
            detectedAt: new Date(),
            details: { vehicle_id: vehicle.id, vehicle_name: vehicle.name },
            suggestedFix: 'Assign vehicle to a user or archive if not in use'
          });
        });
      }

      // Calculate integrity score
      const totalIssues = report.issues.length;
      const maxScore = 100;
      const penaltyPerIssue = totalIssues > 0 ? maxScore / (report.totalRecords * 0.1) : 0;
      report.score = Math.max(0, maxScore - (totalIssues * penaltyPerIssue));

      // Generate recommendations
      if (report.duplicateRecords > 0) {
        report.recommendations.push('Review and resolve duplicate license plates');
      }
      if (report.missingRelations > 0) {
        report.recommendations.push('Assign orphaned vehicles to users');
      }
      if (report.score < 80) {
        report.recommendations.push('Schedule regular data integrity checks');
      }

      console.log('✅ Data integrity report generated successfully');
      
    } catch (error) {
      console.error('❌ Failed to generate integrity report:', error);
      report.issues.push({
        id: crypto.randomUUID(),
        type: 'corrupted',
        description: 'Failed to complete integrity check',
        entityType: 'system',
        severity: 'high',
        detectedAt: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        suggestedFix: 'Check system logs and database connectivity'
      });
    }

    return report;
  }

  private async findDuplicateLicensePlates(): Promise<Array<{ license_plate: string; count: number }>> {
    try {
      // Get all license plates and their counts
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('license_plate')
        .not('license_plate', 'is', null);

      if (!vehicles) return [];

      // Count occurrences of each license plate
      const plateCount = new Map<string, number>();
      vehicles.forEach(vehicle => {
        if (vehicle.license_plate) {
          plateCount.set(vehicle.license_plate, (plateCount.get(vehicle.license_plate) || 0) + 1);
        }
      });

      // Return only duplicates
      return Array.from(plateCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([license_plate, count]) => ({ license_plate, count }));
        
    } catch (error) {
      console.error('Error finding duplicate license plates:', error);
      return [];
    }
  }

  async resolveConflict(conflictId: string, resolution: 'prefer_local' | 'prefer_remote' | 'merge'): Promise<void> {
    console.log(`🔧 Resolving conflict ${conflictId} with resolution: ${resolution}`);
    
    // Find the conflict across all operations
    let targetConflict: SyncConflict | undefined;
    let targetOperation: SyncOperation | undefined;

    for (const operation of this.operations.values()) {
      const conflict = operation.conflicts.find(c => c.id === conflictId);
      if (conflict) {
        targetConflict = conflict;
        targetOperation = operation;
        break;
      }
    }

    if (!targetConflict || !targetOperation) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    try {
      // Apply resolution based on type
      switch (resolution) {
        case 'prefer_local':
          // Keep local data, no changes needed
          break;
          
        case 'prefer_remote':
          // Update local data with remote data
          if (targetConflict.entityType === 'vehicle') {
            await supabase
              .from('vehicles')
              .update(targetConflict.remoteData)
              .eq('id', targetConflict.entityId);
          }
          break;
          
        case 'merge':
          // Merge both datasets (implement merge logic as needed)
          const mergedData = { ...targetConflict.localData, ...targetConflict.remoteData };
          if (targetConflict.entityType === 'vehicle') {
            await supabase
              .from('vehicles')
              .update(mergedData)
              .eq('id', targetConflict.entityId);
          }
          break;
      }

      // Mark conflict as resolved
      targetConflict.resolvedAt = new Date();
      targetConflict.resolution = resolution;

      this.notifySubscribers(targetOperation);
      console.log('✅ Conflict resolved successfully');
      
    } catch (error) {
      console.error('❌ Failed to resolve conflict:', error);
      throw error;
    }
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
        console.error('Error in sync operation subscriber:', error);
      }
    });
  }

  // Cleanup old operations (keep last 50)
  cleanup(): void {
    const operations = Array.from(this.operations.entries())
      .sort(([, a], [, b]) => b.startedAt.getTime() - a.startedAt.getTime());
    
    if (operations.length > 50) {
      const toRemove = operations.slice(50);
      toRemove.forEach(([id]) => {
        this.operations.delete(id);
      });
    }
  }
}

export const gp51DataSyncManager = new GP51DataSyncManager();
