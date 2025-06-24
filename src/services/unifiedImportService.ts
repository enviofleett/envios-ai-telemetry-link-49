
import { supabase } from '@/integrations/supabase/client';
import { gp51ImportService } from './gp51/gp51ImportService';
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
      console.log('🔍 Starting enhanced GP51 preview...');

      // First test authentication
      const authStatus = await gp51ImportService.testAuthentication();
      
      if (!authStatus.connected) {
        return {
          success: false,
          data: {
            summary: { vehicles: 0, users: 0, groups: 0 },
            sampleData: { vehicles: [], users: [] },
            conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
            authentication: authStatus,
            estimatedDuration: '0 minutes',
            warnings: ['GP51 authentication failed']
          },
          connectionStatus: authStatus,
          timestamp: new Date().toISOString()
        };
      }

      // Get comprehensive preview data
      const previewData = await gp51ImportService.getImportPreview();
      
      return {
        success: true,
        data: previewData,
        connectionStatus: authStatus,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Enhanced preview failed:', error);
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
      console.log('🚀 Starting unified GP51 import...');

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

      // Start the actual import
      const importResult = await gp51ImportService.startImport(options);

      if (importResult.success) {
        job.status = 'completed';
        job.progress = 100;
        job.currentPhase = 'Completed';
        job.completedAt = new Date().toISOString();
        job.results = importResult;
      } else {
        job.status = 'failed';
        job.currentPhase = 'Failed';
        job.completedAt = new Date().toISOString();
        job.errors = importResult.errors || ['Import failed'];
      }

      return job;

    } catch (error) {
      console.error('❌ Unified import failed:', error);
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
      const authStatus = await gp51ImportService.testAuthentication();
      const endTime = Date.now();

      const issues: string[] = [];
      const recommendations: string[] = [];

      if (!authStatus.connected) {
        issues.push('GP51 authentication failed');
        recommendations.push('Check GP51 credentials in admin settings');
      }

      const latency = endTime - startTime;
      if (latency > 5000) {
        issues.push('High latency detected');
        recommendations.push('Check network connection to GP51 servers');
      }

      return {
        healthy: authStatus.connected && issues.length === 0,
        latency,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        healthy: false,
        issues: ['Connection validation failed'],
        recommendations: ['Check GP51 service availability']
      };
    }
  }

  /**
   * Get import job status
   */
  async getJobStatus(jobId: string): Promise<UnifiedImportJob | null> {
    // In a real implementation, this would query the database
    // For now, return mock data
    return {
      id: jobId,
      status: 'completed',
      progress: 100,
      currentPhase: 'Completed',
      startedAt: new Date(Date.now() - 60000).toISOString(),
      completedAt: new Date().toISOString(),
      errors: []
    };
  }
}

export const unifiedImportService = UnifiedImportService.getInstance();
