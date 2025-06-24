
import { supabase } from '@/integrations/supabase/client';
import type { GP51ImportOptions } from '@/types/system-import';

// Standardized response interfaces
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
  errors: string[];
  results?: {
    statistics: {
      usersProcessed: number;
      usersImported: number;
      devicesProcessed: number;
      devicesImported: number;
      conflicts: number;
    };
    message: string;
    duration: number;
  };
}

export interface ConnectionValidation {
  healthy: boolean;
  latency?: string;
  issues: string[];
  recommendations: string[];
}

class UnifiedImportService {
  async getEnhancedPreview(): Promise<UnifiedImportPreview> {
    try {
      console.log('🔍 Getting enhanced GP51 preview...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'get_import_preview' }
      });

      if (error) {
        console.error('❌ Enhanced preview error:', error);
        throw new Error(`Preview failed: ${error.message}`);
      }

      // Safely handle response structure
      const responseData = data || {};
      
      if (responseData.success === false) {
        console.warn('⚠️ Preview service returned unsuccessful response:', responseData.error);
        
        // Return structured failed response
        return {
          success: false,
          data: responseData.data || this.getEmptyPreviewData(),
          connectionStatus: responseData.connectionStatus || { 
            connected: false, 
            error: responseData.error || 'Unknown error' 
          },
          timestamp: responseData.timestamp || new Date().toISOString()
        };
      }

      console.log('✅ Enhanced preview successful:', {
        vehicles: responseData.data?.summary?.vehicles || 0,
        users: responseData.data?.summary?.users || 0
      });

      return {
        success: true,
        data: responseData.data || this.getEmptyPreviewData(),
        connectionStatus: responseData.connectionStatus || { connected: true },
        timestamp: responseData.timestamp || new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Enhanced preview exception:', error);
      
      return {
        success: false,
        data: this.getEmptyPreviewData(),
        connectionStatus: { 
          connected: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  async startUnifiedImport(options: GP51ImportOptions): Promise<UnifiedImportJob> {
    try {
      console.log('🚀 Starting unified import...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start_import',
          options
        }
      });

      if (error) {
        console.error('❌ Import start error:', error);
        throw new Error(`Import failed: ${error.message}`);
      }

      const jobId = `import_${Date.now()}`;
      const startTime = new Date().toISOString();

      if (data?.success) {
        return {
          id: jobId,
          status: 'completed',
          progress: 100,
          currentPhase: 'Completed',
          startedAt: startTime,
          completedAt: new Date().toISOString(),
          errors: data.errors || [],
          results: {
            statistics: data.statistics || {
              usersProcessed: 0,
              usersImported: 0,
              devicesProcessed: 0,
              devicesImported: 0,
              conflicts: 0
            },
            message: data.message || 'Import completed',
            duration: data.duration || 0
          }
        };
      } else {
        return {
          id: jobId,
          status: 'failed',
          progress: 0,
          currentPhase: 'Failed',
          startedAt: startTime,
          completedAt: new Date().toISOString(),
          errors: [data?.message || 'Import failed']
        };
      }

    } catch (error) {
      console.error('❌ Import exception:', error);
      
      return {
        id: `failed_${Date.now()}`,
        status: 'failed',
        progress: 0,
        currentPhase: 'Failed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async validateConnection(): Promise<ConnectionValidation> {
    try {
      console.log('🔍 Validating GP51 connection...');
      
      const startTime = Date.now();
      const preview = await this.getEnhancedPreview();
      const latency = Date.now() - startTime;

      if (preview.success && preview.connectionStatus.connected) {
        return {
          healthy: true,
          latency: `${latency}ms`,
          issues: [],
          recommendations: []
        };
      } else {
        return {
          healthy: false,
          issues: [preview.connectionStatus.error || 'Connection failed'],
          recommendations: [
            'Check GP51 credentials in settings',
            'Verify GP51 service availability',
            'Ensure network connectivity'
          ]
        };
      }

    } catch (error) {
      console.error('❌ Connection validation failed:', error);
      
      return {
        healthy: false,
        issues: [error instanceof Error ? error.message : 'Validation failed'],
        recommendations: [
          'Check GP51 service availability',
          'Verify authentication credentials',
          'Contact support if issue persists'
        ]
      };
    }
  }

  private getEmptyPreviewData() {
    return {
      summary: { vehicles: 0, users: 0, groups: 0 },
      sampleData: { vehicles: [], users: [] },
      conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
      authentication: { connected: false, error: 'No data available' },
      estimatedDuration: '0 minutes',
      warnings: ['No preview data available']
    };
  }
}

export const unifiedImportService = new UnifiedImportService();
