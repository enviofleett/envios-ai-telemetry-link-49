
import { supabase } from '@/integrations/supabase/client';
import { gp51SessionManager } from './gp51SessionManager';
import { importLogger } from './importLogger';

export interface ImportPreviewData {
  users: {
    total: number;
    new: number;
    conflicts: number;
    userList: Array<{
      username: string;
      email?: string;
      conflict: boolean;
      conflictReason?: string;
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
      conflictReason?: string;
    }>;
  };
  summary: {
    totalRecords: number;
    newRecords: number;
    conflicts: number;
    estimatedDuration: string;
    warnings: string[];
  };
}

export interface ImportPreviewOptions {
  importType: 'users_only' | 'vehicles_only' | 'complete_system' | 'selective';
  selectedUsernames?: string[];
  performCleanup?: boolean;
  batchSize?: number;
}

class ImportPreviewService {
  private async generateCacheKey(options: ImportPreviewOptions): Promise<string> {
    const optionsStr = JSON.stringify(options);
    const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute cache
    return `preview_${btoa(optionsStr)}_${timestamp}`;
  }

  private async getCachedPreview(cacheKey: string): Promise<ImportPreviewData | null> {
    try {
      const { data, error } = await supabase
        .from('import_preview_cache')
        .select('preview_data')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;
      return data.preview_data as unknown as ImportPreviewData;
    } catch (error) {
      importLogger.debug('preview', 'Cache miss or error', { error });
      return null;
    }
  }

  private async setCachedPreview(cacheKey: string, previewData: ImportPreviewData): Promise<void> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await supabase
      .from('import_preview_cache')
      .upsert({
        cache_key: cacheKey,
        preview_data: previewData as unknown as any,
        expires_at: expiresAt.toISOString()
      });
  }

  public async generatePreview(options: ImportPreviewOptions): Promise<ImportPreviewData> {
    const cacheKey = await this.generateCacheKey(options);
    
    // Check cache first
    const cached = await this.getCachedPreview(cacheKey);
    if (cached) {
      importLogger.info('preview', 'Using cached preview data');
      return cached;
    }

    importLogger.info('preview', 'Generating new preview', options);

    try {
      // Ensure valid GP51 session
      const session = await gp51SessionManager.ensureValidSession();
      
      // Get current system data for conflict detection
      const [existingUsers, existingVehicles] = await Promise.all([
        this.getExistingUsers(),
        this.getExistingVehicles()
      ]);

      // Fetch GP51 data based on import type
      let gp51Data;
      if (options.importType === 'selective' && options.selectedUsernames) {
        gp51Data = await this.fetchSelectiveGP51Data(options.selectedUsernames);
      } else {
        gp51Data = await this.fetchAllGP51Data(options.importType);
      }

      // Analyze conflicts and generate preview
      const userAnalysis = this.analyzeUserConflicts(gp51Data.users, existingUsers);
      const vehicleAnalysis = this.analyzeVehicleConflicts(gp51Data.vehicles, existingVehicles);

      const previewData: ImportPreviewData = {
        users: userAnalysis,
        vehicles: vehicleAnalysis,
        summary: this.generateSummary(userAnalysis, vehicleAnalysis, options)
      };

      // Cache the preview
      await this.setCachedPreview(cacheKey, previewData);
      
      importLogger.info('preview', 'Preview generated successfully', {
        totalUsers: userAnalysis.total,
        totalVehicles: vehicleAnalysis.total,
        conflicts: userAnalysis.conflicts + vehicleAnalysis.conflicts
      });

      return previewData;

    } catch (error) {
      importLogger.error('preview', `Preview generation failed: ${error.message}`, { error, options });
      throw error;
    }
  }

  private async getExistingUsers(): Promise<Array<{username: string; email: string}>> {
    const { data, error } = await supabase
      .from('envio_users')
      .select('gp51_username, email')
      .not('gp51_username', 'is', null);

    if (error) throw error;
    return data.map(user => ({ username: user.gp51_username!, email: user.email }));
  }

  private async getExistingVehicles(): Promise<Array<{deviceId: string; username: string}>> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('device_id, gp51_username')
      .not('gp51_username', 'is', null);

    if (error) throw error;
    return data.map(vehicle => ({ deviceId: vehicle.device_id, username: vehicle.gp51_username! }));
  }

  private async fetchSelectiveGP51Data(usernames: string[]): Promise<{users: any[], vehicles: any[]}> {
    // This would call GP51 API to fetch specific users and their vehicles
    const { data, error } = await supabase.functions.invoke('gp51-service-management', {
      body: {
        action: 'preview_selective_data',
        usernames
      }
    });

    if (error) throw error;
    return data;
  }

  private async fetchAllGP51Data(importType: string): Promise<{users: any[], vehicles: any[]}> {
    // This would call GP51 API to fetch all available data
    const { data, error } = await supabase.functions.invoke('gp51-service-management', {
      body: {
        action: 'preview_all_data',
        importType
      }
    });

    if (error) throw error;
    return data;
  }

  private analyzeUserConflicts(gp51Users: any[], existingUsers: Array<{username: string; email: string}>) {
    const existingUserMap = new Map(existingUsers.map(u => [u.username, u]));
    let conflicts = 0;
    
    const userList = gp51Users.map(gp51User => {
      const existing = existingUserMap.get(gp51User.username);
      const conflict = existing && existing.email !== gp51User.email;
      
      if (conflict) conflicts++;
      
      return {
        username: gp51User.username,
        email: gp51User.email,
        conflict: !!conflict,
        conflictReason: conflict ? `Email mismatch: existing (${existing.email}) vs new (${gp51User.email})` : undefined
      };
    });

    return {
      total: gp51Users.length,
      new: gp51Users.length - (userList.length - conflicts),
      conflicts,
      userList
    };
  }

  private analyzeVehicleConflicts(gp51Vehicles: any[], existingVehicles: Array<{deviceId: string; username: string}>) {
    const existingVehicleMap = new Map(existingVehicles.map(v => [v.deviceId, v]));
    let conflicts = 0;
    
    const vehicleList = gp51Vehicles.map(gp51Vehicle => {
      const existing = existingVehicleMap.get(gp51Vehicle.deviceid);
      const conflict = existing && existing.username !== gp51Vehicle.username;
      
      if (conflict) conflicts++;
      
      return {
        deviceId: gp51Vehicle.deviceid,
        deviceName: gp51Vehicle.devicename || gp51Vehicle.deviceid,
        username: gp51Vehicle.username,
        conflict: !!conflict,
        conflictReason: conflict ? `Owner mismatch: existing (${existing.username}) vs new (${gp51Vehicle.username})` : undefined
      };
    });

    return {
      total: gp51Vehicles.length,
      new: gp51Vehicles.length - (vehicleList.length - conflicts),
      conflicts,
      vehicleList
    };
  }

  private generateSummary(userAnalysis: any, vehicleAnalysis: any, options: ImportPreviewOptions) {
    const totalRecords = userAnalysis.total + vehicleAnalysis.total;
    const totalConflicts = userAnalysis.conflicts + vehicleAnalysis.conflicts;
    const newRecords = userAnalysis.new + vehicleAnalysis.new;
    
    // Estimate duration based on batch size and total records
    const batchSize = options.batchSize || 10;
    const estimatedBatches = Math.ceil(totalRecords / batchSize);
    const estimatedMinutes = estimatedBatches * 0.5; // 30 seconds per batch
    const estimatedDuration = estimatedMinutes < 1 ? '< 1 minute' : 
                             estimatedMinutes < 60 ? `${Math.round(estimatedMinutes)} minutes` :
                             `${Math.round(estimatedMinutes / 60)} hours`;

    const warnings: string[] = [];
    if (totalConflicts > 0) {
      warnings.push(`${totalConflicts} conflicts detected that need resolution`);
    }
    if (options.performCleanup) {
      warnings.push('Existing data will be cleaned before import');
    }
    if (totalRecords > 1000) {
      warnings.push('Large import detected - consider using smaller batches');
    }

    return {
      totalRecords,
      newRecords,
      conflicts: totalConflicts,
      estimatedDuration,
      warnings
    };
  }

  public async clearCache(): Promise<void> {
    await supabase
      .from('import_preview_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
  }
}

export const importPreviewService = new ImportPreviewService();
