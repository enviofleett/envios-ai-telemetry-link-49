
import { supabase } from '@/integrations/supabase/client';
import type { GP51ImportPreview, GP51ImportOptions, GP51ImportResult } from '@/types/system-import';

export interface UnifiedImportPreview {
  success: boolean;
  data: GP51ImportPreview;
  connectionStatus: {
    connected: boolean;
    username?: string;
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
  results?: GP51ImportResult;
  errors: string[];
}

class UnifiedImportService {
  private static instance: UnifiedImportService;

  static getInstance(): UnifiedImportService {
    if (!UnifiedImportService.instance) {
      UnifiedImportService.instance = new UnifiedImportService();
    }
    return UnifiedImportService.instance;
  }

  /**
   * Enhanced preview that validates connection and provides comprehensive data overview
   */
  async getEnhancedPreview(): Promise<UnifiedImportPreview> {
    try {
      console.log('🔍 Starting enhanced GP51 preview via edge function...');

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'fetch_available_data' }
      });

      if (error) {
        console.error('❌ Enhanced preview edge function error:', error);
        throw new Error(`Preview service error: ${error.message}`);
      }

      if (!data.success) {
        console.error('❌ GP51 enhanced preview failed:', data.error);
        return {
          success: false,
          data: {
            summary: { vehicles: 0, users: 0, groups: 0 },
            sampleData: { vehicles: [], users: [] },
            conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
            authentication: { connected: false, error: data.error },
            estimatedDuration: '0 minutes',
            warnings: [data.error || 'Preview failed']
          },
          connectionStatus: { connected: false, error: data.error },
          timestamp: new Date().toISOString()
        };
      }

      // Transform the response to match our interface
      const transformedPreview: GP51ImportPreview = {
        summary: data.summary || { vehicles: 0, users: 0, groups: 0 },
        sampleData: data.sampleData || { vehicles: [], users: [] },
        conflicts: data.conflicts || { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
        authentication: data.authentication || { connected: true },
        estimatedDuration: this.estimateImportDuration(data.summary?.vehicles || 0, data.summary?.users || 0),
        warnings: data.warnings || []
      };

      return {
        success: true,
        data: transformedPreview,
        connectionStatus: data.authentication || { connected: true },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Enhanced preview exception:', error);
      return {
        success: false,
        data: {
          summary: { vehicles: 0, users: 0, groups: 0 },
          sampleData: { vehicles: [], users: [] },
          conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
          authentication: { connected: false, error: error instanceof Error ? error.message : 'Unknown error' },
          estimatedDuration: '0 minutes',
          warnings: ['Preview generation failed']
        },
        connectionStatus: { connected: false, error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Start a unified import job with comprehensive monitoring
   */
  async startUnifiedImport(options: GP51ImportOptions): Promise<UnifiedImportJob> {
    try {
      console.log('🚀 Starting unified GP51 import via edge function...');

      const jobId = `import_${Date.now()}`;
      
      // Create import job record
      const job: UnifiedImportJob = {
        id: jobId,
        status: 'pending',
        progress: 0,
        currentPhase: 'Initializing',
        startedAt: new Date().toISOString(),
        errors: []
      };

      // Start the actual import via edge function
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start_import',
          options: {
            importUsers: options.importUsers,
            importDevices: options.importDevices,
            conflictResolution: options.conflictResolution,
            usernames: options.usernames,
            batchSize: options.batchSize || 50
          }
        }
      });

      if (error) {
        console.error('❌ Import edge function error:', error);
        throw new Error(`Import service error: ${error.message}`);
      }

      if (data.success) {
        job.status = 'completed';
        job.progress = 100;
        job.currentPhase = 'Completed';
        job.completedAt = new Date().toISOString();
        job.results = {
          success: true,
          statistics: data.statistics || {
            usersProcessed: 0,
            usersImported: 0,
            devicesProcessed: 0,
            devicesImported: 0,
            conflicts: 0
          },
          message: data.message || 'Import completed successfully',
          errors: data.errors || [],
          duration: data.duration || 0
        };
      } else {
        job.status = 'failed';
        job.currentPhase = 'Failed';
        job.completedAt = new Date().toISOString();
        job.errors = data.errors || [data.message || 'Import failed'];
      }

      return job;

    } catch (error) {
      console.error('❌ Unified import exception:', error);
      return {
        id: `import_${Date.now()}`,
        status: 'failed',
        progress: 0,
        currentPhase: 'Failed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validate GP51 connection health
   */
  async validateConnection(): Promise<{
    healthy: boolean;
    latency?: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const startTime = Date.now();
      
      // Test connection by attempting to get a preview
      const preview = await this.getEnhancedPreview();
      const endTime = Date.now();

      const issues: string[] = [];
      const recommendations: string[] = [];

      if (!preview.connectionStatus.connected) {
        issues.push('GP51 authentication failed');
        recommendations.push('Check GP51 credentials in admin settings');
      }

      const latency = endTime - startTime;
      if (latency > 10000) {
        issues.push('High latency detected');
        recommendations.push('Check network connection to GP51 servers');
      }

      return {
        healthy: preview.connectionStatus.connected && issues.length === 0,
        latency,
        issues,
        recommendations: issues.length > 0 ? recommendations : ['Connection is healthy']
      };

    } catch (error) {
      return {
        healthy: false,
        issues: ['Connection validation failed'],
        recommendations: ['Check GP51 service availability and network connection']
      };
    }
  }

  private estimateImportDuration(vehicles: number, users: number): string {
    const totalItems = vehicles + users;
    const itemsPerMinute = 100; // Conservative estimate
    const minutes = Math.ceil(totalItems / itemsPerMinute);
    
    if (minutes < 1) return '< 1 minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 1 && remainingMinutes === 0) return '1 hour';
    if (remainingMinutes === 0) return `${hours} hours`;
    
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get import job status from database
   */
  async getJobStatus(jobId: string): Promise<UnifiedImportJob | null> {
    try {
      const { data, error } = await supabase
        .from('gp51_system_imports')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !data) {
        console.error('Failed to fetch job status:', error);
        return null;
      }

      return {
        id: data.id,
        status: data.status as 'pending' | 'running' | 'completed' | 'failed',
        progress: data.progress_percentage || 0,
        currentPhase: data.current_phase || 'Unknown',
        startedAt: data.created_at,
        completedAt: data.completed_at || undefined,
        results: data.import_results ? {
          success: data.status === 'completed',
          statistics: data.import_results.statistics || {
            usersProcessed: data.total_users || 0,
            usersImported: data.successful_users || 0,
            devicesProcessed: data.total_devices || 0,
            devicesImported: data.successful_devices || 0,
            conflicts: 0
          },
          message: data.import_results.message || '',
          errors: Array.isArray(data.error_log) ? data.error_log.map((e: any) => e.error || e) : [],
          duration: 0
        } : undefined,
        errors: Array.isArray(data.error_log) ? data.error_log.map((e: any) => e.error || e) : []
      };
    } catch (error) {
      console.error('Exception fetching job status:', error);
      return null;
    }
  }
}

export const unifiedImportService = UnifiedImportService.getInstance();
