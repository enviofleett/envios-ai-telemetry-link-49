import { supabase } from '@/integrations/supabase/client';
import type { GP51ImportOptions } from '@/types/system-import';

export interface UnifiedImportPreview {
  success: boolean;
  data: {
    summary: {
      vehicles: number;
      users: number;
      groups: number;
    };
    sampleData: {
      vehicles: any[];
      users: any[];
    };
    conflicts: {
      existingUsers: string[];
      existingDevices: string[];
      potentialDuplicates: number;
    };
    authentication: {
      connected: boolean;
      username?: string;
      error?: string;
    };
    estimatedDuration: string;
    warnings: string[];
  };
  connectionStatus: {
    connected: boolean;
    error?: string;
  };
  timestamp: string;
}

export interface UnifiedImportJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentPhase: string;
  startedAt: string;
  completedAt?: string;
  results?: {
    statistics: {
      usersImported: number;
      devicesImported: number;
      usersProcessed: number;
      devicesProcessed: number;
      conflicts: number;
    };
    message: string;
    duration: number;
  };
  errors: string[];
}

export interface ConnectionHealth {
  healthy: boolean;
  latency?: number;
  issues: string[];
  recommendations: string[];
}

class UnifiedImportService {
  async getEnhancedPreview(): Promise<UnifiedImportPreview> {
    try {
      console.log('📡 Calling enhanced-bulk-import edge function for preview...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'fetch_available_data',
          options: {
            includePreview: true,
            batchSize: 100
          }
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from edge function');
      }

      console.log('✅ Preview data received:', data);
      return data as UnifiedImportPreview;
    } catch (error) {
      console.error('❌ Preview service error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        data: {
          summary: { vehicles: 0, users: 0, groups: 0 },
          sampleData: { vehicles: [], users: [] },
          conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
          authentication: { connected: false, error: errorMessage },
          estimatedDuration: '0 minutes',
          warnings: [`Preview failed: ${errorMessage}`]
        },
        connectionStatus: { connected: false, error: errorMessage },
        timestamp: new Date().toISOString()
      };
    }
  }

  async startUnifiedImport(options: GP51ImportOptions): Promise<UnifiedImportJob> {
    try {
      console.log('🚀 Starting unified import with options:', options);
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start_import',
          options
        }
      });

      if (error) {
        console.error('❌ Import edge function error:', error);
        throw new Error(`Import failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from import service');
      }

      console.log('✅ Import started:', data);
      
      // Create import job record in database
      const jobRecord = await this.createImportJob(data);
      
      return {
        id: jobRecord.id,
        status: jobRecord.status as any,
        progress: jobRecord.progress_percentage || 0,
        currentPhase: jobRecord.current_phase || 'Starting',
        startedAt: jobRecord.created_at,
        completedAt: jobRecord.completed_at || undefined,
        results: data.results ? {
          statistics: {
            usersImported: data.results.statistics?.usersImported || 0,
            devicesImported: data.results.statistics?.devicesImported || 0,
            usersProcessed: data.results.statistics?.usersProcessed || 0,
            devicesProcessed: data.results.statistics?.devicesProcessed || 0,
            conflicts: data.results.statistics?.conflicts || 0
          },
          message: data.results.message || '',
          duration: data.results.duration || 0
        } : undefined,
        errors: Array.isArray(jobRecord.error_log) ? jobRecord.error_log : []
      };
    } catch (error) {
      console.error('❌ Import service error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        id: `failed_${Date.now()}`,
        status: 'failed',
        progress: 0,
        currentPhase: 'Failed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        errors: [errorMessage]
      };
    }
  }

  async validateConnection(): Promise<ConnectionHealth> {
    try {
      console.log('🔍 Validating GP51 connection...');
      
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'validate_connection'
        }
      });
      const latency = Date.now() - startTime;

      if (error) {
        return {
          healthy: false,
          latency,
          issues: [`Connection error: ${error.message}`],
          recommendations: ['Check GP51 credentials', 'Verify network connectivity']
        };
      }

      return {
        healthy: data?.healthy || false,
        latency,
        issues: data?.issues || [],
        recommendations: data?.recommendations || []
      };
    } catch (error) {
      console.error('❌ Connection validation error:', error);
      return {
        healthy: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Check service availability', 'Verify configuration']
      };
    }
  }

  private async createImportJob(importData: any) {
    const { data, error } = await supabase
      .from('gp51_system_imports')
      .insert({
        import_type: 'unified_import',
        status: importData.status || 'pending',
        current_phase: importData.currentPhase || 'Starting',
        progress_percentage: importData.progress || 0,
        total_users: importData.totalUsers || 0,
        successful_users: importData.successfulUsers || 0,
        total_devices: importData.totalDevices || 0,
        successful_devices: importData.successfulDevices || 0,
        error_log: importData.errors || [],
        import_results: importData.results || {}
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create import job record:', error);
      throw new Error(`Failed to create import job: ${error.message}`);
    }

    return data;
  }

  async getImportJob(jobId: string): Promise<UnifiedImportJob | null> {
    try {
      const { data, error } = await supabase
        .from('gp51_system_imports')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('❌ Failed to fetch import job:', error);
        return null;
      }

      return {
        id: data.id,
        status: data.status as any,
        progress: data.progress_percentage || 0,
        currentPhase: data.current_phase || 'Unknown',
        startedAt: data.created_at,
        completedAt: data.completed_at || undefined,
        results: data.import_results ? {
          statistics: {
            usersImported: data.successful_users || 0,
            devicesImported: data.successful_devices || 0,
            usersProcessed: data.total_users || 0,
            devicesProcessed: data.total_devices || 0,
            conflicts: 0
          },
          message: 'Import completed',
          duration: 0
        } : undefined,
        errors: Array.isArray(data.error_log) ? data.error_log : []
      };
    } catch (error) {
      console.error('❌ Error fetching import job:', error);
      return null;
    }
  }
}

export const unifiedImportService = new UnifiedImportService();
