
import { supabase } from '@/integrations/supabase/client';
import { EnhancedErrorHandler } from './enhancedErrorHandler';

export interface ImportPreviewData {
  users: {
    total: number;
    new: number;
    conflicts: number;
    userList: Array<{
      username: string;
      email: string;
      conflict: boolean;
    }>;
  };
  vehicles: {
    total: number;
    new: number;
    conflicts: number;
    vehicleList: Array<{
      deviceId: string;
      deviceName: string;
      username: string;
      conflict: boolean;
    }>;
  };
  conflicts: any[];
  summary: {
    totalUsers: number;
    totalVehicles: number;
    potentialConflicts: number;
    totalRecords: number;
    newRecords: number;
    conflicts: number;
    estimatedDuration: string;
    warnings: string[];
  };
}

export class ImportPreviewService {
  private errorHandler = new EnhancedErrorHandler();

  async generatePreview(options?: any): Promise<ImportPreviewData> {
    try {
      console.log('🔍 Generating GP51 import preview...');

      // Call the enhanced bulk import service for preview
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'get_import_preview' }
      });

      if (error) {
        console.error('❌ Preview service error:', error);
        throw new Error(`Preview failed: ${error.message}`);
      }

      // Handle different response structures safely
      const responseData = data?.data || data || {};
      const summary = responseData.summary || { vehicles: 0, users: 0, groups: 0 };
      const sampleData = responseData.sampleData || { vehicles: [], users: [] };
      const conflicts = responseData.conflicts || { existingUsers: [], existingDevices: [], potentialDuplicates: 0 };
      const warnings = responseData.warnings || [];

      console.log('✅ Preview data processed successfully:', {
        vehicles: summary.vehicles,
        users: summary.users,
        hasWarnings: warnings.length > 0
      });

      return {
        users: {
          total: summary.users || 0,
          new: summary.users || 0,
          conflicts: conflicts.existingUsers?.length || 0,
          userList: (sampleData.users || []).map((user: any) => ({
            username: user.username || 'Unknown',
            email: user.email || `${user.username}@example.com`,
            conflict: false
          }))
        },
        vehicles: {
          total: summary.vehicles || 0,
          new: summary.vehicles || 0,
          conflicts: conflicts.existingDevices?.length || 0,
          vehicleList: (sampleData.vehicles || []).map((vehicle: any) => ({
            deviceId: vehicle.deviceId || 'unknown',
            deviceName: vehicle.deviceName || 'Unnamed Device',
            username: vehicle.creator || 'unknown',
            conflict: false
          }))
        },
        conflicts: [],
        summary: {
          totalUsers: summary.users || 0,
          totalVehicles: summary.vehicles || 0,
          potentialConflicts: conflicts.potentialDuplicates || 0,
          totalRecords: (summary.users || 0) + (summary.vehicles || 0),
          newRecords: (summary.users || 0) + (summary.vehicles || 0),
          conflicts: (conflicts.existingUsers?.length || 0) + (conflicts.existingDevices?.length || 0),
          estimatedDuration: responseData.estimatedDuration || '0 minutes',
          warnings: warnings.length > 0 ? warnings : []
        }
      };

    } catch (error) {
      console.error('❌ Import preview generation failed:', error);
      
      // Return safe fallback data structure
      return {
        users: {
          total: 0,
          new: 0,
          conflicts: 0,
          userList: []
        },
        vehicles: {
          total: 0,
          new: 0,
          conflicts: 0,
          vehicleList: []
        },
        conflicts: [],
        summary: {
          totalUsers: 0,
          totalVehicles: 0,
          potentialConflicts: 0,
          totalRecords: 0,
          newRecords: 0,
          conflicts: 0,
          estimatedDuration: '0 minutes',
          warnings: [
            'Failed to connect to GP51 or generate preview',
            error instanceof Error ? error.message : 'Unknown error'
          ]
        }
      };
    }
  }
}

export const importPreviewService = new ImportPreviewService();
