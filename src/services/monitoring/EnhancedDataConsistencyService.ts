
import { supabase } from '@/integrations/supabase/client';

export interface DataDiscrepancy {
  type: 'missing_vehicle' | 'data_mismatch' | 'orphaned_record';
  entityType: 'vehicle' | 'user' | 'device';
  entityId: string;
  gp51Data?: any;
  localData?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConsistencyCheckResult {
  success: boolean;
  totalEntitiesChecked: number;
  discrepanciesFound: number;
  autoResolved: number;
  manualReviewRequired: number;
  consistencyScore: number;
  discrepancies: DataDiscrepancy[];
}

export class EnhancedDataConsistencyService {
  private static instance: EnhancedDataConsistencyService;

  static getInstance(): EnhancedDataConsistencyService {
    if (!EnhancedDataConsistencyService.instance) {
      EnhancedDataConsistencyService.instance = new EnhancedDataConsistencyService();
    }
    return EnhancedDataConsistencyService.instance;
  }

  async performFullConsistencyCheck(): Promise<ConsistencyCheckResult> {
    console.log('🔍 [DATA-CONSISTENCY] Starting full consistency check...');
    
    const monitoringId = await this.startMonitoring('full_sync');
    
    try {
      const result = await this.runConsistencyChecks();
      await this.recordDiscrepancies(result.discrepancies);
      await this.completeMonitoring(monitoringId, result);
      
      // Create alert if consistency score is low
      if (result.consistencyScore < 85) {
        await this.createConsistencyAlert(result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [DATA-CONSISTENCY] Check failed:', error);
      throw error;
    }
  }

  private async startMonitoring(checkType: string): Promise<string> {
    const { data, error } = await supabase
      .from('data_consistency_monitoring')
      .insert({
        check_type: checkType,
        status: 'running'
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  private async runConsistencyChecks(): Promise<ConsistencyCheckResult> {
    const discrepancies: DataDiscrepancy[] = [];
    let totalEntitiesChecked = 0;
    let autoResolved = 0;

    // Check vehicle data consistency
    const vehicleCheck = await this.checkVehicleConsistency();
    discrepancies.push(...vehicleCheck.discrepancies);
    totalEntitiesChecked += vehicleCheck.entitiesChecked;
    autoResolved += vehicleCheck.autoResolved;

    // Check user mapping consistency
    const userCheck = await this.checkUserMappingConsistency();
    discrepancies.push(...userCheck.discrepancies);
    totalEntitiesChecked += userCheck.entitiesChecked;
    autoResolved += userCheck.autoResolved;

    // Calculate consistency score
    const consistencyScore = totalEntitiesChecked > 0 
      ? Math.round(((totalEntitiesChecked - discrepancies.length) / totalEntitiesChecked) * 100)
      : 100;

    const manualReviewRequired = discrepancies.filter(d => 
      d.severity === 'high' || d.severity === 'critical'
    ).length;

    return {
      success: true,
      totalEntitiesChecked,
      discrepanciesFound: discrepancies.length,
      autoResolved,
      manualReviewRequired,
      consistencyScore,
      discrepancies
    };
  }

  private async checkVehicleConsistency(): Promise<{
    discrepancies: DataDiscrepancy[];
    entitiesChecked: number;
    autoResolved: number;
  }> {
    console.log('🚗 [DATA-CONSISTENCY] Checking vehicle consistency...');
    
    const discrepancies: DataDiscrepancy[] = [];
    let autoResolved = 0;

    // Get all local vehicles
    const { data: localVehicles, error } = await supabase
      .from('vehicles')
      .select('*');

    if (error) throw error;

    // Check for duplicate device IDs
    const deviceIdCounts = new Map<string, number>();
    localVehicles?.forEach(vehicle => {
      if (vehicle.gp51_device_id) {
        const count = deviceIdCounts.get(vehicle.gp51_device_id) || 0;
        deviceIdCounts.set(vehicle.gp51_device_id, count + 1);
      }
    });

    // Report duplicates
    deviceIdCounts.forEach((count, deviceId) => {
      if (count > 1) {
        discrepancies.push({
          type: 'data_mismatch',
          entityType: 'vehicle',
          entityId: deviceId,
          severity: 'high',
          localData: { duplicateCount: count }
        });
      }
    });

    // Check for vehicles without device IDs
    const vehiclesWithoutDeviceId = localVehicles?.filter(v => !v.gp51_device_id) || [];
    vehiclesWithoutDeviceId.forEach(vehicle => {
      discrepancies.push({
        type: 'missing_vehicle',
        entityType: 'vehicle',
        entityId: vehicle.id,
        severity: 'medium',
        localData: vehicle
      });
    });

    return {
      discrepancies,
      entitiesChecked: localVehicles?.length || 0,
      autoResolved
    };
  }

  private async checkUserMappingConsistency(): Promise<{
    discrepancies: DataDiscrepancy[];
    entitiesChecked: number;
    autoResolved: number;
  }> {
    console.log('👥 [DATA-CONSISTENCY] Checking user mapping consistency...');
    
    const discrepancies: DataDiscrepancy[] = [];
    let autoResolved = 0;

    // Get all GP51 sessions without user mappings
    const { data: orphanedSessions, error } = await supabase
      .from('gp51_sessions')
      .select('*')
      .is('envio_user_id', null);

    if (error) throw error;

    orphanedSessions?.forEach(session => {
      discrepancies.push({
        type: 'orphaned_record',
        entityType: 'user',
        entityId: session.username,
        severity: 'low',
        gp51Data: session
      });
    });

    return {
      discrepancies,
      entitiesChecked: orphanedSessions?.length || 0,
      autoResolved
    };
  }

  private async recordDiscrepancies(discrepancies: DataDiscrepancy[]): Promise<void> {
    if (discrepancies.length === 0) return;

    const discrepancyRecords = discrepancies.map(d => ({
      discrepancy_type: d.type,
      entity_type: d.entityType,
      entity_id: d.entityId,
      gp51_data: d.gp51Data,
      local_data: d.localData,
      severity: d.severity
    }));

    const { error } = await supabase
      .from('gp51_sync_discrepancies')
      .insert(discrepancyRecords);

    if (error) {
      console.error('❌ [DATA-CONSISTENCY] Failed to record discrepancies:', error);
    }
  }

  private async completeMonitoring(
    monitoringId: string,
    result: ConsistencyCheckResult
  ): Promise<void> {
    const { error } = await supabase
      .from('data_consistency_monitoring')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_entities_checked: result.totalEntitiesChecked,
        discrepancies_found: result.discrepanciesFound,
        auto_resolved: result.autoResolved,
        manual_review_required: result.manualReviewRequired,
        consistency_score: result.consistencyScore,
        detailed_results: {
          discrepancies: result.discrepancies
        },
        next_check_scheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', monitoringId);

    if (error) {
      console.error('❌ [DATA-CONSISTENCY] Failed to complete monitoring:', error);
    }
  }

  private async createConsistencyAlert(result: ConsistencyCheckResult): Promise<void> {
    const severity = result.consistencyScore < 70 ? 'critical' : 'warning';
    
    const { error } = await supabase
      .from('system_alerts')
      .insert({
        alert_type: 'data_inconsistency',
        severity,
        title: 'Data Consistency Issues Detected',
        message: `Consistency score: ${result.consistencyScore}%. Found ${result.discrepanciesFound} discrepancies.`,
        source_system: 'data_consistency',
        alert_data: {
          consistencyScore: result.consistencyScore,
          totalDiscrepancies: result.discrepanciesFound,
          manualReviewRequired: result.manualReviewRequired
        }
      });

    if (error) {
      console.error('❌ [DATA-CONSISTENCY] Failed to create alert:', error);
    }
  }
}

export const enhancedDataConsistencyService = EnhancedDataConsistencyService.getInstance();
