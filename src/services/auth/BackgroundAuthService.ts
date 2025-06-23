import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isAgent: boolean;
  userRole: string | null;
  isPlatformAdmin: boolean;
  platformAdminRoles: string[];
}

type AuthStateCallback = (state: AuthState) => void;

class BackgroundAuthService {
  private subscribers: Set<AuthStateCallback> = new Set();
  private cachedState: AuthState | null = null;
  private isRefreshing = false;
  private cacheExpiry = 0;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  constructor() {
    this.initializeAuthListener();
    this.loadFromLocalStorage();
  }

  private initializeAuthListener() {
    try {
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 [BackgroundAuthService] Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          this.clearCache();
          this.notifySubscribers({
            user: null,
            isAdmin: false,
            isAgent: false,
            userRole: null,
            isPlatformAdmin: false,
            platformAdminRoles: []
          });
        } else if (session?.user) {
          this.refreshInBackground();
        }
      });
    } catch (error) {
      console.error('❌ [BackgroundAuthService] Failed to initialize auth listener:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem('auth_state_cache');
      const expiry = localStorage.getItem('auth_cache_expiry');
      
      if (cached && expiry && Date.now() < parseInt(expiry)) {
        this.cachedState = JSON.parse(cached);
        this.cacheExpiry = parseInt(expiry);
        console.log('📦 [BackgroundAuthService] Loaded cached auth state');
      } else {
        console.log('⏰ [BackgroundAuthService] Cache expired or missing, will refresh');
        this.refreshInBackground();
      }
    } catch (error) {
      console.error('❌ [BackgroundAuthService] Failed to load from localStorage:', error);
      this.refreshInBackground();
    }
  }

  private saveToLocalStorage(state: AuthState) {
    try {
      localStorage.setItem('auth_state_cache', JSON.stringify(state));
      localStorage.setItem('auth_cache_expiry', (Date.now() + this.CACHE_DURATION).toString());
    } catch (error) {
      console.error('❌ [BackgroundAuthService] Failed to save to localStorage:', error);
    }
  }

  private clearCache() {
    try {
      this.cachedState = null;
      this.cacheExpiry = 0;
      localStorage.removeItem('auth_state_cache');
      localStorage.removeItem('auth_cache_expiry');
      console.log('🗑️ [BackgroundAuthService] Cache cleared');
    } catch (error) {
      console.error('❌ [BackgroundAuthService] Failed to clear cache:', error);
    }
  }

  async refreshInBackground() {
    if (this.isRefreshing) {
      console.log('⏭️ [BackgroundAuthService] Refresh already in progress, skipping');
      return;
    }

    this.isRefreshing = true;
    console.log('🔄 [BackgroundAuthService] Refreshing auth state in background...');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('👤 [BackgroundAuthService] No authenticated user found');
        const emptyState: AuthState = {
          user: null,
          isAdmin: false,
          isAgent: false,
          userRole: null,
          isPlatformAdmin: false,
          platformAdminRoles: []
        };
        
        this.cachedState = emptyState;
        this.saveToLocalStorage(emptyState);
        this.notifySubscribers(emptyState);
        return;
      }

      // Get user role from user_roles table
      let userRole = null;
      let isAdmin = false;
      let isAgent = false;
      let isPlatformAdmin = false;
      let platformAdminRoles: string[] = [];

      try {
        // Query user roles from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!roleError && roleData) {
          userRole = roleData.role;
          isAdmin = userRole === 'admin';
          isAgent = userRole === 'agent';
        } else {
          console.warn('⚠️ [BackgroundAuthService] Could not fetch user role:', roleError?.message || 'No role data');
        }

        // Check for platform admin roles
        const { data: platformAdminData, error: platformAdminError } = await supabase
          .from('platform_admin_users')
          .select(`
            platform_admin_roles (
              role
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (!platformAdminError && platformAdminData?.platform_admin_roles) {
          const roles = Array.isArray(platformAdminData.platform_admin_roles) 
            ? platformAdminData.platform_admin_roles 
            : [platformAdminData.platform_admin_roles];
          
          platformAdminRoles = roles.map((r: any) => r.role).filter(Boolean);
          isPlatformAdmin = platformAdminRoles.length > 0;
        }

      } catch (roleError) {
        console.error('❌ [BackgroundAuthService] Error fetching user roles:', roleError);
      }

      const newState: AuthState = {
        user,
        isAdmin,
        isAgent,
        userRole,
        isPlatformAdmin,
        platformAdminRoles
      };

      this.cachedState = newState;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      this.saveToLocalStorage(newState);
      this.notifySubscribers(newState);
      
      console.log('✅ [BackgroundAuthService] Auth state refreshed successfully');

    } catch (error) {
      console.error('❌ [BackgroundAuthService] Failed to refresh auth state:', error);
      
      // If we have cached state, keep using it
      if (this.cachedState) {
        console.log('📦 [BackgroundAuthService] Using cached state due to refresh error');
        this.notifySubscribers(this.cachedState);
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  private notifySubscribers(state: AuthState) {
    this.subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('❌ [BackgroundAuthService] Error in subscriber callback:', error);
      }
    });
  }

  subscribe(callback: AuthStateCallback): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current state if available
    if (this.cachedState) {
      try {
        callback(this.cachedState);
      } catch (error) {
        console.error('❌ [BackgroundAuthService] Error in initial callback:', error);
      }
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  getCachedState(): AuthState | null {
    if (this.cachedState && Date.now() < this.cacheExpiry) {
      return this.cachedState;
    }
    return null;
  }
}

export const backgroundAuthService = new BackgroundAuthService();
