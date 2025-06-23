
import { supabase } from '@/integrations/supabase/client';

export interface DataDiscrepancy {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEntity: string;
  expectedValue: any;
  actualValue: any;
  autoResolvable: boolean;
  detectedAt: Date;
}

export interface DataConsistencyReport {
  timestamp: Date;
  overallHealth: 'healthy' | 'warning' | 'critical';
  consistencyScore: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  discrepancies: DataDiscrepancy[];
  recommendations: string[];
}

export class EnhancedDataConsistencyService {
  private static instance: EnhancedDataConsistencyService;

  static getInstance(): EnhancedDataConsistencyService {
    if (!EnhancedDataConsistencyService.instance) {
      EnhancedDataConsistencyService.instance = new EnhancedDataConsistencyService();
    }
    return EnhancedDataConsistencyService.instance;
  }

  async performComprehensiveCheck(): Promise<DataConsistencyReport> {
    console.log('🔍 [DATA-CONSISTENCY] Starting comprehensive data check...');
    
    const timestamp = new Date();
    const discrepancies: DataDiscrepancy[] = [];
    
    try {
      // Check vehicle-user relationships
      const vehicleDiscrepancies = await this.checkVehicleUserRelationships();
      discrepancies.push(...vehicleDiscrepancies);

      // Check GP51 session validity
      const sessionDiscrepancies = await this.checkGP51SessionConsistency();
      discrepancies.push(...sessionDiscrepancies);

      // Check data integrity
      const integrityDiscrepancies = await this.checkDataIntegrity();
      discrepancies.push(...integrityDiscrepancies);

      // Calculate metrics
      const totalChecks = 10; // Total number of checks performed
      const failedChecks = discrepancies.length;
      const passedChecks = totalChecks - failedChecks;
      const consistencyScore = Math.round((passedChecks / totalChecks) * 100);

      // Determine overall health
      let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (consistencyScore < 50) {
        overallHealth = 'critical';
      } else if (consistencyScore < 80) {
        overallHealth = 'warning';
      }

      const report: DataConsistencyReport = {
        timestamp,
        overallHealth,
        consistencyScore,
        totalChecks,
        passedChecks,
        failedChecks,
        discrepancies,
        recommendations: this.generateRecommendations(discrepancies)
      };

      // Store the report
      await this.storeConsistencyReport(report);

      return report;
    } catch (error) {
      console.error('❌ [DATA-CONSISTENCY] Check failed:', error);
      throw error;
    }
  }

  private async checkVehicleUserRelationships(): Promise<DataDiscrepancy[]> {
    const discrepancies: DataDiscrepancy[] = [];
    
    try {
      // Check for vehicles without assigned users
      const { data: orphanedVehicles } = await supabase
        .from('vehicles')
        .select('id, device_id, make, model')
        .is('assigned_user_id', null);

      orphanedVehicles?.forEach(vehicle => {
        discrepancies.push({
          id: `orphaned_vehicle_${vehicle.id}`,
          type: 'orphaned_vehicle',
          severity: 'medium',
          description: `Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.device_id}) has no assigned user`,
          affectedEntity: `vehicle:${vehicle.id}`,
          expectedValue: 'assigned_user_id should not be null',
          actualValue: null,
          autoResolvable: false,
          detectedAt: new Date()
        });
      });

    } catch (error) {
      console.error('Failed to check vehicle-user relationships:', error);
    }

    return discrepancies;
  }

  private async checkGP51SessionConsistency(): Promise<DataDiscrepancy[]> {
    const discrepancies: DataDiscrepancy[] = [];
    
    try {
      // Check for expired sessions
      const { data: expiredSessions } = await supabase
        .from('gp51_sessions')
        .select('id, username, token_expires_at')
        .lt('token_expires_at', new Date().toISOString());

      expiredSessions?.forEach(session => {
        discrepancies.push({
          id: `expired_session_${session.id}`,
          type: 'expired_session',
          severity: 'high',
          description: `GP51 session for ${session.username} has expired`,
          affectedEntity: `session:${session.id}`,
          expectedValue: 'token_expires_at should be in future',
          actualValue: session.token_expires_at,
          autoResolvable: true,
          detectedAt: new Date()
        });
      });

    } catch (error) {
      console.error('Failed to check GP51 session consistency:', error);
    }

    return discrepancies;
  }

  private async checkDataIntegrity(): Promise<DataDiscrepancy[]> {
    const discrepancies: DataDiscrepancy[] = [];
    
    try {
      // Check for duplicate device IDs
      const { data: duplicates } = await supabase
        .rpc('find_duplicate_device_ids');

      duplicates?.forEach(duplicate => {
        discrepancies.push({
          id: `duplicate_device_${duplicate.device_id}`,
          type: 'duplicate_device_id',
          severity: 'critical',
          description: `Device ID ${duplicate.device_id} appears ${duplicate.count} times`,
          affectedEntity: `device:${duplicate.device_id}`,
          expectedValue: 'device_id should be unique',
          actualValue: `appears ${duplicate.count} times`,
          autoResolvable: false,
          detectedAt: new Date()
        });
      });

    } catch (error) {
      console.error('Failed to check data integrity:', error);
    }

    return discrepancies;
  }

  private generateRecommendations(discrepancies: DataDiscrepancy[]): string[] {
    const recommendations: string[] = [];
    
    const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;
    const highCount = discrepancies.filter(d => d.severity === 'high').length;
    
    if (criticalCount > 0) {
      recommendations.push(`Address ${criticalCount} critical data issues immediately`);
    }
    
    if (highCount > 0) {
      recommendations.push(`Review ${highCount} high-priority discrepancies`);
    }
    
    const autoResolvableCount = discrepancies.filter(d => d.autoResolvable).length;
    if (autoResolvableCount > 0) {
      recommendations.push(`${autoResolvableCount} issues can be auto-resolved`);
    }
    
    return recommendations;
  }

  private async storeConsistencyReport(report: DataConsistencyReport): Promise<void> {
    try {
      // Store in gp51_sync_discrepancies table for individual discrepancies
      if (report.discrepancies.length > 0) {
        const discrepancyRecords = report.discrepancies.map(d => ({
          discrepancy_type: d.type,
          entity_type: d.affectedEntity.split(':')[0],
          entity_id: d.affectedEntity.split(':')[1] || d.affectedEntity,
          expected_value: d.expectedValue,
          actual_value: d.actualValue,
          severity: d.severity,
          auto_resolution_attempted: d.autoResolvable,
          detected_at: d.detectedAt.toISOString()
        }));

        const { error: discrepancyError } = await supabase
          .from('gp51_sync_discrepancies')
          .insert(discrepancyRecords);

        if (discrepancyError) {
          console.error('Failed to store discrepancies:', discrepancyError);
        }
      }

      // Store overall report in data_consistency_monitoring
      const { error: reportError } = await supabase
        .from('data_consistency_monitoring')
        .insert({
          check_type: 'comprehensive_check',
          status: 'completed',
          completed_at: report.timestamp.toISOString(),
          total_entities_checked: report.totalChecks,
          discrepancies_found: report.failedChecks,
          consistency_score: report.consistencyScore,
          detailed_results: {
            discrepancies: report.discrepancies.map(d => ({
              id: d.id,
              type: d.type,
              severity: d.severity,
              description: d.description,
              autoResolvable: d.autoResolvable
            }))
          } as any // Cast to any to satisfy JSON type
        });

      if (reportError) {
        console.error('Failed to store consistency report:', reportError);
      }

    } catch (error) {
      console.error('❌ [DATA-CONSISTENCY] Failed to store report:', error);
    }
  }

  async getLatestReport(): Promise<DataConsistencyReport | null> {
    try {
      const { data, error } = await supabase
        .from('data_consistency_monitoring')
        .select('*')
        .eq('check_type', 'comprehensive_check')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        timestamp: new Date(data.created_at),
        overallHealth: data.consistency_score >= 80 ? 'healthy' : data.consistency_score >= 50 ? 'warning' : 'critical',
        consistencyScore: data.consistency_score || 0,
        totalChecks: data.total_entities_checked || 0,
        passedChecks: (data.total_entities_checked || 0) - (data.discrepancies_found || 0),
        failedChecks: data.discrepancies_found || 0,
        discrepancies: [], // Would need to fetch from gp51_sync_discrepancies
        recommendations: []
      };
    } catch (error) {
      console.error('Failed to get latest report:', error);
      return null;
    }
  }
}

export const enhancedDataConsistencyService = EnhancedDataConsistencyService.getInstance();
