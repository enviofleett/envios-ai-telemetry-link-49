
import { supabase } from '@/integrations/supabase/client';
import { BulkEmailOperation } from './types';

export class BulkOperationsManager {
  async createBulkEmailOperation(operationData: Partial<BulkEmailOperation>): Promise<BulkEmailOperation> {
    const { data, error } = await (supabase as any)
      .from('bulk_email_operations')
      .insert({
        ...operationData,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        status: 'pending',
        processed_items: 0,
        successful_items: 0,
        failed_items: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data as BulkEmailOperation;
  }

  async getBulkOperations(): Promise<BulkEmailOperation[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('bulk_email_operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BulkEmailOperation[] || [];
    } catch (error) {
      console.warn('Bulk operations not available:', error);
      return [];
    }
  }

  async getBulkOperation(id: string): Promise<BulkEmailOperation | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('bulk_email_operations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as BulkEmailOperation;
    } catch (error) {
      console.warn('Bulk operation not found:', error);
      return null;
    }
  }

  async updateOperation(id: string, updates: Partial<BulkEmailOperation>): Promise<void> {
    const { error } = await (supabase as any)
      .from('bulk_email_operations')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  async cancelBulkOperation(id: string): Promise<void> {
    await this.updateOperation(id, { 
      status: 'cancelled',
      completed_at: new Date().toISOString()
    });
  }
}
