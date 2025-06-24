
import { supabase } from '@/integrations/supabase/client';
import type { GP51ImportPreview, GP51ImportOptions, GP51ImportResult } from '@/types/system-import';

export class GP51ImportService {
  private static instance: GP51ImportService;

  static getInstance(): GP51ImportService {
    if (!GP51ImportService.instance) {
      GP51ImportService.instance = new GP51ImportService();
    }
    return GP51ImportService.instance;
  }

  /**
   * Get a lightweight preview of available data for import
   */
  async getImportPreview(): Promise<GP51ImportPreview> {
    try {
      console.log('🔍 Getting GP51 import preview...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'get_import_preview' }
      });

      if (error) {
        console.error('❌ Preview fetch error:', error);
        throw new Error(`Preview failed: ${error.message}`);
      }

      if (!data.success) {
        console.error('❌ GP51 preview failed:', data.error);
        return {
          summary: { vehicles: 0, users: 0, groups: 0 },
          sampleData: { vehicles: [], users: [] },
          conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
          authentication: { connected: false, error: data.error },
          estimatedDuration: '0 minutes',
          warnings: [data.error || 'Preview failed']
        };
      }

      return {
        summary: data.summary || { vehicles: 0, users: 0, groups: 0 },
        sampleData: data.sampleData || { vehicles: [], users: [] },
        conflicts: data.conflicts || { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
        authentication: data.authenticationStatus || { connected: true },
        estimatedDuration: this.estimateImportDuration(data.summary?.vehicles || 0, data.summary?.users || 0),
        warnings: data.warnings || []
      };

    } catch (error) {
      console.error('❌ GP51 preview exception:', error);
      return {
        summary: { vehicles: 0, users: 0, groups: 0 },
        sampleData: { vehicles: [], users: [] },
        conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
        authentication: { connected: false, error: error instanceof Error ? error.message : 'Unknown error' },
        estimatedDuration: '0 minutes',
        warnings: ['Failed to connect to GP51 or fetch preview data']
      };
    }
  }

  /**
   * Start the actual import process
   */
  async startImport(options: GP51ImportOptions): Promise<GP51ImportResult> {
    try {
      console.log('🚀 Starting GP51 import with options:', options);
      
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
        console.error('❌ Import error:', error);
        throw new Error(`Import failed: ${error.message}`);
      }

      if (!data.success) {
        console.error('❌ GP51 import failed:', data.message);
        return {
          success: false,
          statistics: {
            usersProcessed: 0,
            usersImported: 0,
            devicesProcessed: 0,
            devicesImported: 0,
            conflicts: 0
          },
          message: data.message || 'Import failed',
          errors: data.errors || [],
          duration: 0
        };
      }

      return {
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

    } catch (error) {
      console.error('❌ GP51 import exception:', error);
      return {
        success: false,
        statistics: {
          usersProcessed: 0,
          usersImported: 0,
          devicesProcessed: 0,
          devicesImported: 0,
          conflicts: 0
        },
        message: error instanceof Error ? error.message : 'Import failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: 0
      };
    }
  }

  /**
   * Test GP51 authentication without importing
   */
  async testAuthentication(): Promise<{ connected: boolean; username?: string; error?: string }> {
    try {
      const preview = await this.getImportPreview();
      return preview.authentication;
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Authentication test failed'
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
}

export const gp51ImportService = GP51ImportService.getInstance();
