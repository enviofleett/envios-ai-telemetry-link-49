
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedImportPreview {
  success: boolean;
  data: {
    summary: {
      vehicles: number;
      users: number;
      groups: number;
    };
    sampleData: {
      vehicles: Array<{
        id: string;
        name: string;
        status: string;
        lastSeen?: string;
      }>;
      users: Array<{
        id: string;
        name: string;
        email: string;
        vehicleCount: number;
      }>;
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
    username?: string;
    error?: string;
  };
  timestamp: string;
}

export interface UnifiedImportJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentPhase: string;
  startedAt: string;
  completedAt?: string;
  results?: {
    statistics: {
      usersImported: number;
      devicesImported: number;
      groupsImported: number;
      errorsEncountered: number;
    };
    conflicts: {
      duplicateUsers: number;
      duplicateDevices: number;
      resolvedConflicts: number;
    };
  };
  errors: string[];
}

export interface ValidationHealth {
  healthy: boolean;
  issues: string[];
  recommendations: string[];
  latency?: string;
}

class UnifiedImportService {
  private static instance: UnifiedImportService;

  static getInstance(): UnifiedImportService {
    if (!UnifiedImportService.instance) {
      UnifiedImportService.instance = new UnifiedImportService();
    }
    return UnifiedImportService.instance;
  }

  async getEnhancedPreview(): Promise<UnifiedImportPreview> {
    console.log('🔍 UnifiedImportService: Getting enhanced preview...');
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'fetch_available_data' }
      });

      if (error) {
        console.error('❌ Enhanced preview error:', error);
        throw new Error(error.message || 'Failed to fetch enhanced preview');
      }

      if (!data.success) {
        console.error('❌ Enhanced preview failed:', data.error);
        return {
          success: false,
          data: {
            summary: { vehicles: 0, users: 0, groups: 0 },
            sampleData: { vehicles: [], users: [] },
            conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
            authentication: { connected: false, error: data.error || 'Unknown error' },
            estimatedDuration: '0 minutes',
            warnings: data.error ? [data.error] : ['Failed to fetch preview data']
          },
          connectionStatus: { connected: false, error: data.error || 'Unknown error' },
          timestamp: new Date().toISOString()
        };
      }

      // Transform the response to match our interface
      const transformedData: UnifiedImportPreview = {
        success: true,
        data: {
          summary: {
            vehicles: data.preview?.vehicles?.length || 0,
            users: data.preview?.users?.length || 0,
            groups: data.preview?.groups?.length || 0
          },
          sampleData: {
            vehicles: (data.preview?.vehicles || []).slice(0, 5).map((v: any) => ({
              id: v.id || v.device_id || 'unknown',
              name: v.name || v.device_name || 'Unknown Device',
              status: v.status || 'active',
              lastSeen: v.last_seen || v.updated_at
            })),
            users: (data.preview?.users || []).slice(0, 5).map((u: any) => ({
              id: u.id || 'unknown',
              name: u.name || u.username || 'Unknown User',
              email: u.email || 'unknown@example.com',
              vehicleCount: u.vehicle_count || 0
            }))
          },
          conflicts: {
            existingUsers: Array.isArray(data.conflicts?.existing_users) 
              ? (data.conflicts.existing_users as any[]).map(u => String(u)) 
              : [],
            existingDevices: Array.isArray(data.conflicts?.existing_devices) 
              ? (data.conflicts.existing_devices as any[]).map(d => String(d)) 
              : [],
            potentialDuplicates: data.conflicts?.potential_duplicates || 0
          },
          authentication: {
            connected: data.authentication?.connected || false,
            username: data.authentication?.username,
            error: data.authentication?.error
          },
          estimatedDuration: data.estimated_duration || '5-10 minutes',
          warnings: Array.isArray(data.warnings) 
            ? (data.warnings as any[]).map(w => String(w))
            : []
        },
        connectionStatus: {
          connected: data.authentication?.connected || false,
          username: data.authentication?.username,
          error: data.authentication?.error
        },
        timestamp: new Date().toISOString()
      };

      console.log('✅ Enhanced preview successful:', transformedData);
      return transformedData;

    } catch (error) {
      console.error('❌ Enhanced preview exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        data: {
          summary: { vehicles: 0, users: 0, groups: 0 },
          sampleData: { vehicles: [], users: [] },
          conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
          authentication: { connected: false, error: errorMessage },
          estimatedDuration: '0 minutes',
          warnings: [errorMessage]
        },
        connectionStatus: { connected: false, error: errorMessage },
        timestamp: new Date().toISOString()
      };
    }
  }

  async startUnifiedImport(options: any): Promise<UnifiedImportJob> {
    console.log('🚀 UnifiedImportService: Starting unified import...');
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start_import',
          options: options
        }
      });

      if (error) {
        console.error('❌ Import start error:', error);
        throw new Error(error.message || 'Failed to start import');
      }

      if (!data.success) {
        console.error('❌ Import start failed:', data.error);
        return {
          id: `failed_${Date.now()}`,
          status: 'failed',
          progress: 0,
          currentPhase: 'Failed to start',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          errors: [data.error || 'Unknown error occurred']
        };
      }

      // Create a database record to track the import
      const { data: importRecord, error: dbError } = await supabase
        .from('gp51_system_imports')
        .insert({
          import_type: 'unified_import',
          status: 'running',
          current_phase: 'Starting import',
          progress_percentage: 0,
          total_users: data.job?.total_users || 0,
          total_devices: data.job?.total_devices || 0
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database record creation failed:', dbError);
      }

      // Transform the response to match our interface
      const transformedJob: UnifiedImportJob = {
        id: importRecord?.id || data.job?.id || `import_${Date.now()}`,
        status: data.job?.status || 'running',
        progress: data.job?.progress || 0,
        currentPhase: data.job?.current_phase || 'Starting import',
        startedAt: data.job?.started_at || new Date().toISOString(),
        completedAt: data.job?.completed_at,
        results: data.job?.results ? {
          statistics: {
            usersImported: data.job.results.users_imported || 0,
            devicesImported: data.job.results.devices_imported || 0,
            groupsImported: data.job.results.groups_imported || 0,
            errorsEncountered: data.job.results.errors_encountered || 0
          },
          conflicts: {
            duplicateUsers: data.job.results.duplicate_users || 0,
            duplicateDevices: data.job.results.duplicate_devices || 0,
            resolvedConflicts: data.job.results.resolved_conflicts || 0
          }
        } : undefined,
        errors: Array.isArray(data.job?.errors) 
          ? (data.job.errors as any[]).map(e => String(e))
          : []
      };

      console.log('✅ Import started successfully:', transformedJob);
      return transformedJob;

    } catch (error) {
      console.error('❌ Import start exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        id: `failed_${Date.now()}`,
        status: 'failed',
        progress: 0,
        currentPhase: 'Failed to start',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        errors: [errorMessage]
      };
    }
  }

  async validateConnection(): Promise<ValidationHealth> {
    console.log('🔍 UnifiedImportService: Validating connection...');
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'validate_connection' }
      });

      if (error) {
        console.error('❌ Connection validation error:', error);
        return {
          healthy: false,
          issues: [error.message || 'Connection validation failed'],
          recommendations: ['Check GP51 credentials and network connectivity']
        };
      }

      return {
        healthy: data.healthy || false,
        issues: Array.isArray(data.issues) 
          ? (data.issues as any[]).map(i => String(i))
          : [],
        recommendations: Array.isArray(data.recommendations) 
          ? (data.recommendations as any[]).map(r => String(r))
          : [],
        latency: data.latency
      };

    } catch (error) {
      console.error('❌ Connection validation exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        healthy: false,
        issues: [errorMessage],
        recommendations: ['Check GP51 service availability and credentials']
      };
    }
  }
}

export const unifiedImportService = UnifiedImportService.getInstance();
