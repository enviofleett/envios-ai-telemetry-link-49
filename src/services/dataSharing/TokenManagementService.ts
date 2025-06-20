
import { supabase } from '@/integrations/supabase/client';
import type { SharingToken, TokenValidationResult, UserSubscription, DataSharingProduct } from '@/types/data-sharing';

export class TokenManagementService {
  async generateSharingToken(subscriptionId: string, vehicleIds: string[]): Promise<SharingToken> {
    // Get subscription details to determine expiry
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found');
    }

    // Generate secure token
    const token = this.generateSecureToken();

    const { data: sharingToken, error } = await supabase
      .from('sharing_tokens')
      .insert({
        token,
        subscription_id: subscriptionId,
        user_id: subscription.user_id,
        vehicle_ids: vehicleIds,
        expires_at: subscription.end_date,
        is_active: true,
        usage_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create sharing token:', error);
      throw new Error(`Failed to create token: ${error.message}`);
    }

    return sharingToken as SharingToken;
  }

  async validateToken(tokenString: string): Promise<TokenValidationResult> {
    try {
      const { data: tokenData, error } = await supabase
        .from('sharing_tokens')
        .select(`
          *,
          user_subscriptions!inner (
            *,
            data_sharing_products (*)
          )
        `)
        .eq('token', tokenString)
        .eq('is_active', true)
        .single();

      if (error || !tokenData) {
        return {
          isValid: false,
          authorizedVehicleIds: [],
          error: 'Token not found or inactive'
        };
      }

      const token = tokenData as SharingToken & {
        user_subscriptions: UserSubscription & {
          data_sharing_products: DataSharingProduct;
        };
      };

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(token.expires_at);
      
      if (now > expiresAt) {
        // Auto-revoke expired token
        await this.revokeToken(token.id);
        return {
          isValid: false,
          authorizedVehicleIds: [],
          error: 'Token expired'
        };
      }

      // Check if subscription is active
      if (token.user_subscriptions.status !== 'active') {
        return {
          isValid: false,
          authorizedVehicleIds: [],
          error: 'Subscription not active'
        };
      }

      // Update last used timestamp
      await this.updateTokenUsage(token.id);

      return {
        isValid: true,
        token,
        subscription: token.user_subscriptions,
        product: token.user_subscriptions.data_sharing_products,
        authorizedVehicleIds: token.vehicle_ids
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        isValid: false,
        authorizedVehicleIds: [],
        error: 'Validation failed'
      };
    }
  }

  async revokeToken(tokenId: string): Promise<void> {
    const { error } = await supabase
      .from('sharing_tokens')
      .update({ 
        is_active: false, 
        revoked_at: new Date().toISOString() 
      })
      .eq('id', tokenId);

    if (error) {
      console.error('Failed to revoke token:', error);
      throw new Error(`Failed to revoke token: ${error.message}`);
    }
  }

  async updateTokenUsage(tokenId: string): Promise<void> {
    const { error } = await supabase
      .from('sharing_tokens')
      .update({ 
        last_used_at: new Date().toISOString(),
        usage_count: supabase.sql`usage_count + 1`
      })
      .eq('id', tokenId);

    if (error) {
      console.error('Failed to update token usage:', error);
    }
  }

  async getUserTokens(userId: string): Promise<SharingToken[]> {
    const { data, error } = await supabase
      .from('sharing_tokens')
      .select(`
        *,
        user_subscriptions (
          product_id,
          status,
          data_sharing_products (name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch user tokens:', error);
      throw new Error(`Failed to fetch tokens: ${error.message}`);
    }

    return (data || []) as SharingToken[];
  }

  private generateSecureToken(): string {
    // Generate a secure random token (UUID + random string)
    const uuid = crypto.randomUUID();
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    
    return `dst_${uuid.replace(/-/g, '')}_${randomString}`;
  }

  async regenerateToken(oldTokenId: string): Promise<SharingToken> {
    // Get old token details
    const { data: oldToken, error } = await supabase
      .from('sharing_tokens')
      .select('*')
      .eq('id', oldTokenId)
      .single();

    if (error || !oldToken) {
      throw new Error('Token not found');
    }

    // Revoke old token
    await this.revokeToken(oldTokenId);

    // Generate new token with same parameters
    return this.generateSharingToken(oldToken.subscription_id, oldToken.vehicle_ids);
  }
}

export const tokenManagementService = new TokenManagementService();
