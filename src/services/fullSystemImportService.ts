
import { supabase } from '@/integrations/supabase/client';
import { EnhancedErrorHandler } from './systemImport/enhancedErrorHandler';

export interface SystemImportOptions {
  importType: 'complete_system' | 'users_only' | 'vehicles_only' | 'selective';
  performCleanup?: boolean;
  preserveAdminEmail?: string;
  batchSize?: number;
  selectedUsernames?: string[];
}

export interface ImportProgress {
  phase: string;
  percentage: number;
  message: string;
}

export class FullSystemImportService {
  private errorHandler = new EnhancedErrorHandler();
  private currentImportId: string | null = null;

  async startFullImport() {
    console.log('Full system import not available - GP51 integration is being rebuilt');
    return {
      success: false,
      error: 'GP51 integration service is being rebuilt'
    };
  }

  async startFullSystemImport(
    options: SystemImportOptions,
    onProgress?: (progress: ImportProgress) => void
  ) {
    console.log('Enhanced full system import not available - GP51 integration is being rebuilt');
    
    if (onProgress) {
      onProgress({
        phase: 'unavailable',
        percentage: 0,
        message: 'GP51 integration service is being rebuilt'
      });
    }

    return {
      success: false,
      error: 'GP51 integration service is being rebuilt',
      successfulUsers: 0,
      successfulVehicles: 0
    };
  }

  async getImportStatus() {
    return {
      status: 'unavailable',
      message: 'Import service is being rebuilt'
    };
  }

  getCurrentImportId(): string | null {
    return this.currentImportId;
  }

  getErrorSummary(): string {
    return this.errorHandler.formatErrorsForUser();
  }

  hasCriticalErrors(): boolean {
    return this.errorHandler.hasCriticalErrors();
  }

  async cancelImport(importId: string): Promise<void> {
    console.log('Cancel import not available - GP51 integration is being rebuilt');
    this.currentImportId = null;
  }

  async rollbackImport(importId: string): Promise<void> {
    console.log('Rollback import not available - GP51 integration is being rebuilt');
  }
}

export const fullSystemImportService = new FullSystemImportService();
