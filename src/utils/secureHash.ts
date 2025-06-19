
// Secure hashing utility to replace MD5
import { supabase } from '@/integrations/supabase/client';

export interface HashResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export class SecureHashManager {
  // Use Supabase edge function for secure server-side hashing
  static async hashPassword(password: string): Promise<HashResult> {
    try {
      const { data, error } = await supabase.functions.invoke('secure-hash', {
        body: { action: 'hash', password }
      });

      if (error) {
        console.error('Hash error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, hash: data.hash };
    } catch (error) {
      console.error('Hash exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Hash operation failed' 
      };
    }
  }

  static async verifyPassword(password: string, hash: string): Promise<{ success: boolean; valid?: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('secure-hash', {
        body: { action: 'verify', password, hash }
      });

      if (error) {
        console.error('Verify error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, valid: data.valid };
    } catch (error) {
      console.error('Verify exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      };
    }
  }

  // Fallback for client-side operations (less secure, for non-critical use)
  static async clientSideHash(input: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.warn('Crypto API failed, using fallback:', error);
      }
    }
    
    // Simple fallback for compatibility
    let hash = 0;
    if (input.length === 0) return hash.toString(16);
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(16);
  }
}
