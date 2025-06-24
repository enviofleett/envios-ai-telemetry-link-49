
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
      console.log('🔍 Getting enhanced GP51 preview with extended timeout...');
      
      // Notify that this might take longer
      console.log('⏳ Large dataset detected - this may take 2-5 minutes...');
      
      // Use the correct action name that matches the edge function
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'get_import_preview' }
      });

      if (error) {
        console.error('❌ Enhanced preview error:', error);
        
        // Handle timeout specifically
        if (error.message?.includes('timeout') || error.message?.includes('FunctionsHttpError')) {
          throw new Error(`Preview timeout: Large dataset is taking longer than expected. This is normal for 3000+ vehicles. Please try again or contact support if this persists.`);
        }
        
        throw new Error(`Preview failed: ${error.message}`);
      }

      // Safely handle response structure
      const responseData = data || {};
      
      if (responseData.success === false) {
        console.warn('⚠️ Preview service returned unsuccessful response:', responseData.error);
        
        // Handle timeout in response data
        if (responseData.error?.includes('timeout') || responseData.error?.includes('timed out')) {
          return {
            success: false,
            data: this.getEmptyPreviewData(),
            connectionStatus: { 
              connected: false, 
              error: 'Large dataset timeout - GP51 has 3000+ vehicles which requires extended processing time. The system is working but needs more time to process all data.' 
            },
            timestamp: responseData.timestamp || new Date().toISOString()
          };
        }
        
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
        users: responseData.data?.summary?.users || 0,
        processingTime: responseData.processingTime
      });

      return {
        success: true,
        data: responseData.data || this.getEmptyPreviewData(),
        connectionStatus: responseData.connectionStatus || { connected: true },
        timestamp: responseData.timestamp || new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Enhanced preview exception:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful timeout messaging
      let userFriendlyError = errorMessage;
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        userFriendlyError = 'GP51 data import is taking longer than expected due to large dataset (3000+ vehicles). Please wait a few minutes and try again.';
      }
      
      return {
        success: false,
        data: this.getEmptyPreviewData(),
        connectionStatus: { 
          connected: false, 
          error: userFriendlyError
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
      console.log('🔍 Validating GP51 connection with timeout handling...');
      
      const startTime = Date.now();
      const preview = await this.getEnhancedPreview();
      const latency = Date.now() - startTime;

      if (preview.success && preview.connectionStatus.connected) {
        return {
          healthy: true,
          latency: `${latency}ms`,
          issues: [],
          recommendations: latency > 30000 ? [
            'Large dataset detected - operations may take 2-5 minutes',
            'Consider scheduling imports during off-peak hours'
          ] : []
        };
      } else {
        const isTimeoutIssue = preview.connectionStatus.error?.includes('timeout');
        
        return {
          healthy: false,
          issues: [preview.connectionStatus.error || 'Connection failed'],
          recommendations: isTimeoutIssue ? [
            'Large dataset detected (3000+ vehicles)',
            'GP51 API needs more time to process - this is normal',
            'Try again in a few minutes',
            'Consider breaking import into smaller batches if available'
          ] : [
            'Check GP51 credentials in settings',
            'Verify GP51 service availability',
            'Ensure network connectivity'
          ]
        };
      }

    } catch (error) {
      console.error('❌ Connection validation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      const isTimeout = errorMessage.includes('timeout');
      
      return {
        healthy: false,
        issues: [errorMessage],
        recommendations: isTimeout ? [
          'Large dataset timeout is normal for 3000+ vehicles',
          'GP51 servers are processing your request',
          'Please wait 2-5 minutes and try again',
          'Contact support if timeouts persist'
        ] : [
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
