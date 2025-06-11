
import { supabase } from '@/integrations/supabase/client';
import { EnhancedErrorHandler } from './enhancedErrorHandler';
// Removed gp51SessionManager import as it's no longer available

export class ImportPreviewService {
  private errorHandler = new EnhancedErrorHandler();

  async generatePreview() {
    console.log('Import preview not available - GP51 integration is being rebuilt');
    return {
      success: false,
      error: 'GP51 integration service is being rebuilt'
    };
  }
}

export const importPreviewService = new ImportPreviewService();
