
import { supabase } from '@/integrations/supabase/client';
import { DiagnosticResult } from './types';

export class GP51DiagnosticLogger {
  async logDiagnosticResults(results: DiagnosticResult[]): Promise<void> {
    try {
      const summary = {
        total: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        warnings: results.filter(r => r.status === 'warning').length,
      };

      console.log('🔍 GP51 Diagnostic Results Summary:', summary);
      results.forEach(result => {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        console.log(`${icon} ${result.test}: ${result.message}`);
        if (result.details) {
          console.log('   Details:', result.details);
        }
      });

      // Store diagnostic results in database for historical tracking
      await supabase.from('gp51_health_metrics').insert({
        success: summary.failed === 0,
        latency: 0, // Not applicable for diagnostic
        error_details: summary.failed > 0 ? results.filter(r => r.status === 'fail').map(r => r.message).join('; ') : null
      });
    } catch (error) {
      console.error('Failed to log diagnostic results:', error);
    }
  }
}
