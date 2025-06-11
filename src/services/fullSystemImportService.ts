
import { supabase } from '@/integrations/supabase/client';
import { EnhancedErrorHandler } from './systemImport/enhancedErrorHandler';
// Removed gp51SessionManager import as it's no longer available

export class FullSystemImportService {
  private errorHandler = new EnhancedErrorHandler();

  async startFullImport() {
    console.log('Full system import not available - GP51 integration is being rebuilt');
    return {
      success: false,
      error: 'GP51 integration service is being rebuilt'
    };
  }

  async getImportStatus() {
    return {
      status: 'unavailable',
      message: 'Import service is being rebuilt'
    };
  }
}

export const fullSystemImportService = new FullSystemImportService();
