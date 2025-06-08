import { supabase } from '@/integrations/supabase/client';
import { dataConsistencyVerifier, ConsistencyCheck } from './DataConsistencyVerifier';
import { gp51ApiService } from '@/services/gp51ApiService';

export interface ReconciliationRule {
  id: string;
  name: string;
  description: string;
  checkType: string;
  severity: string[];
  autoExecute: boolean;
  strategy: 'merge' | 'overwrite_local' | 'overwrite_remote' | 'manual_review' | 'ignore';
  conditions?: any;
}

export interface ReconciliationResult {
  ruleId: string;
  success: boolean;
  recordsProcessed: number;
  recordsFixed: number;
  recordsFailed: number;
  duration: number;
  details: any;
  error?: string;
}

export interface ReconciliationJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  results: ReconciliationResult[];
  totalRecordsProcessed: number;
  totalRecordsFixed: number;
  errorCount: number;
}

export class DataReconciliationService {
  private static instance: DataReconciliationService;
  private reconciliationRules: ReconciliationRule[] = [];
  private activeJobs = new Map<string, ReconciliationJob>();

  static getInstance(): DataReconciliationService {
    if (!DataReconciliationService.instance) {
      DataReconciliationService.instance = new DataReconciliationService();
      DataReconciliationService.instance.initializeDefaultRules();
    }
    return DataReconciliationService.instance;
  }

  private initializeDefaultRules(): void {
    this.reconciliationRules = [
      {
        id: 'fix_orphaned_vehicles',
        name: 'Fix Orphaned Vehicles',
        description: 'Link orphaned vehicles to their correct users based on GP51 username',
        checkType: 'user_vehicle_link',
        severity: ['high', 'critical'],
        autoExecute: true,
        strategy: 'merge'
      },
      {
        id: 'fix_username_mismatches',
        name: 'Fix Username Mismatches',
        description: 'Correct username mismatches between vehicles and users',
        checkType: 'user_vehicle_link',
        severity: ['critical'],
        autoExecute: true,
        strategy: 'overwrite_local'
      },
      {
        id: 'update_missing_metadata',
        name: 'Update Missing Metadata',
        description: 'Fetch and update missing vehicle metadata from GP51',
        checkType: 'data_integrity',
        severity: ['medium', 'high'],
        autoExecute: false,
        strategy: 'overwrite_local'
      },
      {
        id: 'resolve_duplicate_devices',
        name: 'Resolve Duplicate Devices',
        description: 'Handle duplicate device ID conflicts',
        checkType: 'data_integrity',
        severity: ['critical'],
        autoExecute: false,
        strategy: 'manual_review'
      },
      {
        id: 'fix_inactive_with_activity',
        name: 'Fix Inactive Vehicles with Activity',
        description: 'Reactivate vehicles that show recent activity but are marked inactive',
        checkType: 'data_integrity',
        severity: ['medium'],
        autoExecute: true,
        strategy: 'overwrite_local'
      }
    ];
  }

  async performAutomaticReconciliation(): Promise<ReconciliationJob> {
    const jobId = this.generateJobId();
    const job: ReconciliationJob = {
      id: jobId,
      name: 'Automatic Reconciliation',
      status: 'running',
      startedAt: new Date().toISOString(),
      results: [],
      totalRecordsProcessed: 0,
      totalRecordsFixed: 0,
      errorCount: 0
    };

    this.activeJobs.set(jobId, job);

    try {
      console.log(`Starting automatic reconciliation job ${jobId}`);
      
      // Run consistency check first
      const consistencyReport = await dataConsistencyVerifier.performFullConsistencyCheck();
      
      // Get auto-executable rules for detected issues
      const applicableRules = this.getApplicableRules(consistencyReport.checks, true);
      
      for (const rule of applicableRules) {
        try {
          const result = await this.executeReconciliationRule(rule, consistencyReport.checks);
          job.results.push(result);
          job.totalRecordsProcessed += result.recordsProcessed;
          job.totalRecordsFixed += result.recordsFixed;
        } catch (error) {
          job.errorCount++;
          job.results.push({
            ruleId: rule.id,
            success: false,
            recordsProcessed: 0,
            recordsFixed: 0,
            recordsFailed: 0,
            duration: 0,
            details: {},
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      
      console.log(`Reconciliation job ${jobId} completed: ${job.totalRecordsFixed} records fixed`);
      
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date().toISOString();
      job.errorCount++;
      console.error(`Reconciliation job ${jobId} failed:`, error);
    }

    return job;
  }

  async performManualReconciliation(ruleIds: string[]): Promise<ReconciliationJob> {
    const jobId = this.generateJobId();
    const job: ReconciliationJob = {
      id: jobId,
      name: 'Manual Reconciliation',
      status: 'running',
      startedAt: new Date().toISOString(),
      results: [],
      totalRecordsProcessed: 0,
      totalRecordsFixed: 0,
      errorCount: 0
    };

    this.activeJobs.set(jobId, job);

    try {
      const consistencyReport = await dataConsistencyVerifier.performFullConsistencyCheck();
      
      for (const ruleId of ruleIds) {
        const rule = this.reconciliationRules.find(r => r.id === ruleId);
        if (rule) {
          const result = await this.executeReconciliationRule(rule, consistencyReport.checks);
          job.results.push(result);
          job.totalRecordsProcessed += result.recordsProcessed;
          job.totalRecordsFixed += result.recordsFixed;
        }
      }

      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date().toISOString();
      job.errorCount++;
    }

    return job;
  }

  private async executeReconciliationRule(
    rule: ReconciliationRule, 
    checks: ConsistencyCheck[]
  ): Promise<ReconciliationResult> {
    const startTime = Date.now();
    
    console.log(`Executing reconciliation rule: ${rule.name}`);
    
    try {
      switch (rule.id) {
        case 'fix_orphaned_vehicles':
          return await this.fixOrphanedVehicles();
        case 'fix_username_mismatches':
          return await this.fixUsernameMismatches();
        case 'update_missing_metadata':
          return await this.updateMissingMetadata();
        case 'fix_inactive_with_activity':
          return await this.fixInactiveWithActivity();
        default:
          throw new Error(`Unknown reconciliation rule: ${rule.id}`);
      }
    } catch (error) {
      return {
        ruleId: rule.id,
        success: false,
        recordsProcessed: 0,
        recordsFixed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async fixOrphanedVehicles(): Promise<ReconciliationResult> {
    const startTime = Date.now();
    
    try {
      // Find orphaned vehicles
      const { data: orphanedVehicles } = await supabase
        .from('vehicles')
        .select('id, device_id, gp51_username')
        .is('envio_user_id', null)
        .not('gp51_username', 'is', null);

      if (!orphanedVehicles || orphanedVehicles.length === 0) {
        return {
          ruleId: 'fix_orphaned_vehicles',
          success: true,
          recordsProcessed: 0,
          recordsFixed: 0,
          recordsFailed: 0,
          duration: Date.now() - startTime,
          details: { message: 'No orphaned vehicles found' }
        };
      }

      let recordsFixed = 0;
      let recordsFailed = 0;

      for (const vehicle of orphanedVehicles) {
        try {
          // Find the user with matching GP51 username
          const { data: user } = await supabase
            .from('envio_users')
            .select('id')
            .eq('gp51_username', vehicle.gp51_username)
            .single();

          if (user) {
            // Link vehicle to user
            await supabase
              .from('vehicles')
              .update({ envio_user_id: user.id })
              .eq('id', vehicle.id);
            
            recordsFixed++;
          } else {
            recordsFailed++;
          }
        } catch (error) {
          console.error(`Failed to fix orphaned vehicle ${vehicle.device_id}:`, error);
          recordsFailed++;
        }
      }

      return {
        ruleId: 'fix_orphaned_vehicles',
        success: true,
        recordsProcessed: orphanedVehicles.length,
        recordsFixed,
        recordsFailed,
        duration: Date.now() - startTime,
        details: {
          orphanedVehicles: orphanedVehicles.length,
          fixed: recordsFixed,
          failed: recordsFailed
        }
      };
    } catch (error) {
      return {
        ruleId: 'fix_orphaned_vehicles',
        success: false,
        recordsProcessed: 0,
        recordsFixed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async fixUsernameMismatches(): Promise<ReconciliationResult> {
    const startTime = Date.now();

    try {
      // Find username mismatches
      const { data: mismatches } = await supabase
        .from('vehicles')
        .select(`
          id,
          device_id,
          gp51_username,
          envio_user_id,
          envio_users!inner(id, gp51_username)
        `);

      const actualMismatches = mismatches?.filter(vehicle => 
        vehicle.gp51_username !== vehicle.envio_users?.gp51_username
      ) || [];

      if (actualMismatches.length === 0) {
        return {
          ruleId: 'fix_username_mismatches',
          success: true,
          recordsProcessed: 0,
          recordsFixed: 0,
          recordsFailed: 0,
          duration: Date.now() - startTime,
          details: { message: 'No username mismatches found' }
        };
      }

      let recordsFixed = 0;
      let recordsFailed = 0;

      for (const mismatch of actualMismatches) {
        try {
          // Update vehicle username to match user
          await supabase
            .from('vehicles')
            .update({ gp51_username: mismatch.envio_users.gp51_username })
            .eq('id', mismatch.id);
          
          recordsFixed++;
        } catch (error) {
          console.error(`Failed to fix username mismatch for vehicle ${mismatch.device_id}:`, error);
          recordsFailed++;
        }
      }

      return {
        ruleId: 'fix_username_mismatches',
        success: true,
        recordsProcessed: actualMismatches.length,
        recordsFixed,
        recordsFailed,
        duration: Date.now() - startTime,
        details: {
          mismatches: actualMismatches.length,
          fixed: recordsFixed,
          failed: recordsFailed
        }
      };
    } catch (error) {
      return {
        ruleId: 'fix_username_mismatches',
        success: false,
        recordsProcessed: 0,
        recordsFixed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async updateMissingMetadata(): Promise<ReconciliationResult> {
    const startTime = Date.now();
    
    // Find vehicles with missing metadata
    const { data: vehiclesWithoutMetadata } = await supabase
      .from('vehicles')
      .select('id, device_id, gp51_username')
      .or('gp51_metadata.is.null,gp51_metadata.eq.{}')
      .limit(50); // Process in batches

    if (!vehiclesWithoutMetadata || vehiclesWithoutMetadata.length === 0) {
      return {
        ruleId: 'update_missing_metadata',
        success: true,
        recordsProcessed: 0,
        recordsFixed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
        details: { message: 'No vehicles with missing metadata found' }
      };
    }

    let recordsFixed = 0;
    let recordsFailed = 0;

    // Try to fetch fresh data from GP51
    try {
      const vehiclesResult = await gp51ApiService.fetchVehicles();
      
      if (vehiclesResult.success && vehiclesResult.vehicles) {
        for (const localVehicle of vehiclesWithoutMetadata) {
          const gp51Vehicle = vehiclesResult.vehicles.find(v => 
            v.deviceid.toString() === localVehicle.device_id
          );
          
          if (gp51Vehicle) {
            try {
              await supabase
                .from('vehicles')
                .update({ 
                  gp51_metadata: {
                    ...gp51Vehicle,
                    updated_from_reconciliation: true,
                    reconciliation_timestamp: new Date().toISOString()
                  }
                })
                .eq('id', localVehicle.id);
              
              recordsFixed++;
            } catch (error) {
              console.error(`Failed to update metadata for vehicle ${localVehicle.device_id}:`, error);
              recordsFailed++;
            }
          } else {
            recordsFailed++;
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch vehicles from GP51:', error);
      recordsFailed = vehiclesWithoutMetadata.length;
    }

    return {
      ruleId: 'update_missing_metadata',
      success: true,
      recordsProcessed: vehiclesWithoutMetadata.length,
      recordsFixed,
      recordsFailed,
      duration: Date.now() - startTime,
      details: {
        vehiclesProcessed: vehiclesWithoutMetadata.length,
        metadataUpdated: recordsFixed,
        updatesFailed: recordsFailed
      }
    };
  }

  private async fixInactiveWithActivity(): Promise<ReconciliationResult> {
    const startTime = Date.now();
    
    // Find inactive vehicles with recent activity (last 24 hours)
    const { data: inactiveWithActivity } = await supabase
      .from('vehicles')
      .select('id, device_id, gp51_metadata')
      .eq('is_active', false)
      .gte('gp51_metadata->>lastupdate', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!inactiveWithActivity || inactiveWithActivity.length === 0) {
      return {
        ruleId: 'fix_inactive_with_activity',
        success: true,
        recordsProcessed: 0,
        recordsFixed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
        details: { message: 'No inactive vehicles with recent activity found' }
      };
    }

    let recordsFixed = 0;
    let recordsFailed = 0;

    for (const vehicle of inactiveWithActivity) {
      try {
        await supabase
          .from('vehicles')
          .update({ 
            is_active: true,
            reactivated_by_reconciliation: true,
            reactivation_timestamp: new Date().toISOString()
          })
          .eq('id', vehicle.id);
        
        recordsFixed++;
      } catch (error) {
        console.error(`Failed to reactivate vehicle ${vehicle.device_id}:`, error);
        recordsFailed++;
      }
    }

    return {
      ruleId: 'fix_inactive_with_activity',
      success: true,
      recordsProcessed: inactiveWithActivity.length,
      recordsFixed,
      recordsFailed,
      duration: Date.now() - startTime,
      details: {
        vehiclesReactivated: recordsFixed,
        reactivationsFailed: recordsFailed
      }
    };
  }

  private getApplicableRules(checks: ConsistencyCheck[], autoExecuteOnly: boolean): ReconciliationRule[] {
    const failedChecks = checks.filter(c => c.status === 'failed' || c.status === 'warning');
    
    return this.reconciliationRules.filter(rule => {
      if (autoExecuteOnly && !rule.autoExecute) return false;
      
      return failedChecks.some(check => 
        check.checkType === rule.checkType &&
        rule.severity.includes(check.severity)
      );
    });
  }

  // Scheduled reconciliation
  async startScheduledReconciliation(intervalHours: number = 24): Promise<void> {
    console.log(`Starting scheduled reconciliation (every ${intervalHours} hours)`);
    
    setInterval(async () => {
      try {
        console.log('Running scheduled reconciliation...');
        const job = await this.performAutomaticReconciliation();
        console.log(`Scheduled reconciliation completed: ${job.totalRecordsFixed} records fixed`);
      } catch (error) {
        console.error('Scheduled reconciliation failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  private generateJobId(): string {
    return `reconciliation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Management methods
  getReconciliationRules(): ReconciliationRule[] {
    return [...this.reconciliationRules];
  }

  getActiveJobs(): ReconciliationJob[] {
    return Array.from(this.activeJobs.values());
  }

  getJobStatus(jobId: string): ReconciliationJob | undefined {
    return this.activeJobs.get(jobId);
  }

  addCustomRule(rule: ReconciliationRule): void {
    this.reconciliationRules.push(rule);
  }

  updateRule(ruleId: string, updates: Partial<ReconciliationRule>): void {
    const ruleIndex = this.reconciliationRules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      this.reconciliationRules[ruleIndex] = { ...this.reconciliationRules[ruleIndex], ...updates };
    }
  }
}

export const dataReconciliationService = DataReconciliationService.getInstance();
