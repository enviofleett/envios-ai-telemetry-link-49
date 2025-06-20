
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
          user_subscriptions (
            *,
            data_sharing_products (*)
          )
        `)
        .eq('token', tokenString)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !tokenData) {
        return {
          isValid: false,
          authorizedVehicleIds: [],
          error: 'Invalid or expired token'
        };
      }

      // Update last used timestamp using the custom function
      await this.updateTokenUsage(tokenData.id);

      // Type guard to ensure proper data structure
      const subscriptionData = tokenData.user_subscriptions as any;
      const productData = subscriptionData?.data_sharing_products as any;

      return {
        isValid: true,
        token: tokenData as SharingToken,
        subscription: subscriptionData as UserSubscription,
        product: productData as DataSharingProduct,
        authorizedVehicleIds: tokenData.vehicle_ids || []
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
    // Use the custom increment function
    const { error } = await supabase.rpc('increment_usage_count', {
      token_id_param: tokenId
    });

    if (error) {
      console.error('Failed to update token usage:', error);
    }
  }

  async getUserTokens(userId: string): Promise<SharingToken[]> {
    const { data, error } = await supabase
      .from('sharing_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch user tokens:', error);
      return [];
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
    const { data: oldToken, error: fetchError } = await supabase
      .from('sharing_tokens')
      .select('*')
      .eq('id', oldTokenId)
      .single();

    if (fetchError || !oldToken) {
      throw new Error('Token not found');
    }

    // Revoke old token
    await this.revokeToken(oldTokenId);

    // Generate new token with same settings
    return this.generateSharingToken(oldToken.subscription_id, oldToken.vehicle_ids);
  }
}

export const tokenManagementService = new TokenManagementService();
