
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface CachedAuthState {
  user: User | null;
  isAdmin: boolean;
  isAgent: boolean;
  userRole: string | null;
  isPlatformAdmin: boolean;
  platformAdminRoles: string[];
  timestamp: number;
  expiresAt: number;
}

interface AuthUpdateCallback {
  (state: CachedAuthState): void;
}

class BackgroundAuthService {
  private static instance: BackgroundAuthService;
  private cache: CachedAuthState | null = null;
  private callbacks: Set<AuthUpdateCallback> = new Set();
  private refreshPromise: Promise<void> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_RETRIES = 3;
  private retryCount = 0;

  private constructor() {
    this.initializeCache();
    this.startBackgroundRefresh();
  }

  static getInstance(): BackgroundAuthService {
    if (!BackgroundAuthService.instance) {
      BackgroundAuthService.instance = new BackgroundAuthService();
    }
    return BackgroundAuthService.instance;
  }

  // Get cached state immediately (no delays)
  getCachedState(): CachedAuthState | null {
    if (this.cache && this.isCacheValid()) {
      return this.cache;
    }
    return null;
  }

  // Subscribe to auth state updates
  subscribe(callback: AuthUpdateCallback): () => void {
    this.callbacks.add(callback);
    
    // Send current state immediately
    const cachedState = this.getCachedState();
    if (cachedState) {
      callback(cachedState);
    }

    return () => {
      this.callbacks.delete(callback);
    };
  }

  // Force refresh in background (non-blocking)
  async refreshInBackground(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async initializeCache(): Promise<void> {
    console.log('🔄 Initializing auth cache...');
    
    // Try to load from localStorage first
    const cachedData = this.loadFromLocalStorage();
    if (cachedData && this.isCacheValid(cachedData)) {
      this.cache = cachedData;
      this.notifyCallbacks();
    }

    // Start background refresh immediately
    this.refreshInBackground();
  }

  private async performRefresh(): Promise<void> {
    try {
      console.log('🔄 Refreshing auth state in background...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      const user = session?.user || null;
      
      if (!user) {
        this.updateCache({
          user: null,
          isAdmin: false,
          isAgent: false,
          userRole: null,
          isPlatformAdmin: false,
          platformAdminRoles: [],
          timestamp: Date.now(),
          expiresAt: Date.now() + this.CACHE_DURATION
        });
        return;
      }

      // Batch all role queries together for better performance
      const [roleResult, platformAdminResult] = await Promise.allSettled([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle(),
        this.getPlatformAdminRoles(user.id)
      ]);

      // Process role data
      let userRole = 'user';
      let isAdmin = false;
      let isAgent = false;

      if (roleResult.status === 'fulfilled' && roleResult.value.data) {
        userRole = roleResult.value.data.role;
        isAdmin = userRole === 'admin';
        isAgent = userRole === 'agent';
      }

      // Process platform admin data
      let isPlatformAdmin = false;
      let platformAdminRoles: string[] = [];

      if (platformAdminResult.status === 'fulfilled') {
        platformAdminRoles = platformAdminResult.value;
        isPlatformAdmin = platformAdminRoles.length > 0;
      }

      const newState: CachedAuthState = {
        user,
        isAdmin,
        isAgent,
        userRole,
        isPlatformAdmin,
        platformAdminRoles,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      };

      this.updateCache(newState);
      this.retryCount = 0; // Reset retry count on success
      console.log('✅ Auth state refreshed successfully');

    } catch (error) {
      console.error('❌ Auth refresh failed:', error);
      await this.handleRefreshError();
    }
  }

  private async getPlatformAdminRoles(userId: string): Promise<string[]> {
    try {
      // Get platform admin user first
      const { data: adminUser } = await supabase
        .from('platform_admin_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!adminUser?.id) {
        return [];
      }

      // Get roles
      const { data: roles } = await supabase
        .from('platform_admin_roles')
        .select('role')
        .eq('admin_user_id', adminUser.id);

      return roles?.map(r => r.role) || [];
    } catch (error) {
      console.error('Error fetching platform admin roles:', error);
      return [];
    }
  }

  private async handleRefreshError(): Promise<void> {
    this.retryCount++;
    
    if (this.retryCount < this.MAX_RETRIES) {
      // Exponential backoff
      const delay = Math.pow(2, this.retryCount) * 1000;
      console.log(`🔄 Retrying auth refresh in ${delay}ms (attempt ${this.retryCount}/${this.MAX_RETRIES})`);
      
      setTimeout(() => {
        this.refreshInBackground();
      }, delay);
    } else {
      console.error('❌ Max retries reached for auth refresh');
      this.retryCount = 0;
    }
  }

  private updateCache(newState: CachedAuthState): void {
    this.cache = newState;
    this.saveToLocalStorage(newState);
    this.notifyCallbacks();
  }

  private notifyCallbacks(): void {
    if (this.cache) {
      this.callbacks.forEach(callback => {
        try {
          callback(this.cache!);
        } catch (error) {
          console.error('Error in auth state callback:', error);
        }
      });
    }
  }

  private isCacheValid(state?: CachedAuthState): boolean {
    const targetState = state || this.cache;
    return targetState ? Date.now() < targetState.expiresAt : false;
  }

  private startBackgroundRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.refreshInBackground();
    }, this.REFRESH_INTERVAL);
  }

  private loadFromLocalStorage(): CachedAuthState | null {
    try {
      const cached = localStorage.getItem('auth_cache');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to load auth cache from localStorage:', error);
      return null;
    }
  }

  private saveToLocalStorage(state: CachedAuthState): void {
    try {
      localStorage.setItem('auth_cache', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save auth cache to localStorage:', error);
    }
  }

  public clearCache(): void {
    this.cache = null;
    localStorage.removeItem('auth_cache');
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  public destroy(): void {
    this.clearCache();
    this.callbacks.clear();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
}

export const backgroundAuthService = BackgroundAuthService.getInstance();
