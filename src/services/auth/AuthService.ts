import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { enhancedCachingService } from '@/services/performance/EnhancedCachingService';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isCheckingRole: boolean;
  isAdmin: boolean;
  userRole: string | null;
  isPlatformAdmin: boolean;
  platformAdminRoles: string[];
}

type AuthStateListener = (state: AuthState) => void;

class AuthService {
  private static instance: AuthService;

  private state: AuthState = {
    user: null,
    session: null,
    loading: true,
    isCheckingRole: true,
    isAdmin: false,
    userRole: null,
    isPlatformAdmin: false,
    platformAdminRoles: []
  };

  private listeners: Set<AuthStateListener> = new Set();
  private backgroundRefreshTimer: NodeJS.Timeout | null = null;
  private roleCheckTimeoutRef: NodeJS.Timeout | null = null;

  private constructor() {
    this.initialize();
    this.startBackgroundRefresh();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private setState(newState: Partial<AuthState>) {
    const oldStateJSON = JSON.stringify(this.state);
    this.state = { ...this.state, ...newState };
    const newStateJSON = JSON.stringify(this.state);

    if (oldStateJSON !== newStateJSON) {
      this.notifyListeners();
    }
  }

  public getState = (): AuthState => {
    return this.state;
  }

  public subscribe = (listener: AuthStateListener): (() => void) => {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.state));
  }

  private initialize = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.setState({ session, user: session?.user ?? null, loading: false });
      if (session?.user) {
        this.checkUserRole(session.user.id);
      } else {
        this.setState({ isCheckingRole: false, isPlatformAdmin: false, platformAdminRoles: [] });
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      this.setState({ session, user: session?.user ?? null, loading: false });
      
      if (event === 'SIGNED_IN' && session?.user) {
        this.checkUserRole(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.clearUserRole();
        if (this.roleCheckTimeoutRef) clearTimeout(this.roleCheckTimeoutRef);
      } else if (event === 'USER_UPDATED' && session?.user) {
        this.checkUserRole(session.user.id, { isBackground: true });
      }
    });
  }

  private startBackgroundRefresh = () => {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
    }
    this.backgroundRefreshTimer = setInterval(() => {
      if (this.state.user && document.visibilityState === 'visible') {
        this.refreshUser();
      }
    }, 5 * 60 * 1000); // every 5 minutes
  }

  public checkUserRole = async (userId: string, options: { isBackground?: boolean; retryCount?: number } = {}) => {
    const { isBackground = false, retryCount = 0 } = options;

    if (!isBackground && retryCount === 0) {
      this.setState({ isCheckingRole: true });
    }

    const cacheKey = `user-role-${userId}`;
    if (!isBackground) {
        const cachedRole = await enhancedCachingService.get<{ role: string, platformAdminRoles: string[] }>(cacheKey);
        if (cachedRole) {
            this.setState({
                userRole: cachedRole.role,
                isAdmin: cachedRole.role === 'admin',
                isCheckingRole: false,
                isPlatformAdmin: Array.isArray(cachedRole.platformAdminRoles) && cachedRole.platformAdminRoles.length > 0,
                platformAdminRoles: cachedRole.platformAdminRoles || []
            });
            return;
        }
    }

    try {
      // Query user_roles for 'admin'
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      // Query platform_admin_roles for any row for this user via their id in platform_admin_users
      let platformAdminRoles: string[] = [];
      let isPlatformAdmin = false;
      let userRole = roleData?.role || 'user';
      let isAdmin = userRole === 'admin';

      // Get platform_admin_users.id by user_id
      const { data: adminUser, error: adminUserError } = await supabase
        .from('platform_admin_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (adminUser?.id) {
        // Get all roles
        const { data: par, error: parError } = await supabase
          .from('platform_admin_roles')
          .select('role')
          .eq('admin_user_id', adminUser.id);

        if (par && Array.isArray(par)) {
          platformAdminRoles = par.map((r: { role: string }) => r.role);
          isPlatformAdmin = platformAdminRoles.length > 0;
        }
      }

      // Update cache for 10 minutes
      await enhancedCachingService.set(
        cacheKey, 
        { role: userRole, platformAdminRoles }, 
        10 * 60 * 1000
      );

      this.setState({
        userRole,
        isAdmin,
        isPlatformAdmin,
        platformAdminRoles,
      });
    } catch (error) {
       if (retryCount < 1) {
          this.roleCheckTimeoutRef = setTimeout(() => {
            this.checkUserRole(userId, { ...options, retryCount: retryCount + 1 });
          }, Math.pow(2, retryCount) * 1000);
          return;
       }
       this.setState({ userRole: 'user', isAdmin: false, isPlatformAdmin: false, platformAdminRoles: [] });
    } finally {
      if (!isBackground || retryCount >= 1) {
          this.setState({ isCheckingRole: false });
      }
    }
  }
  
  private clearUserRole = () => {
    if(this.state.user) {
        const cacheKey = `user-role-${this.state.user.id}`;
        enhancedCachingService.invalidateByTag(cacheKey);
    }
    this.setState({ isAdmin: false, userRole: null, isCheckingRole: false, isPlatformAdmin: false, platformAdminRoles: [] });
  }

  public refreshUser = async () => {
    const { data: { user } } = await supabase.auth.refreshSession();
    this.setState({ user });
    if (user) {
      await this.checkUserRole(user.id, { isBackground: true });
    }
  }

  public retryRoleCheck = async () => {
    if (this.state.user?.id) {
      const cacheKey = `user-role-${this.state.user.id}`;
      await enhancedCachingService.invalidateByPattern(new RegExp(cacheKey));
      await this.checkUserRole(this.state.user.id, { isBackground: false });
    }
  }

  public signOut = async () => {
    await supabase.auth.signOut();
    this.clearUserRole();
  }

  public signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  }

  public signUp = async (email: string, password: string, name?: string, packageType?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          package_type: packageType,
        },
      },
    });
    return { error };
  }
}

export const authService = AuthService.getInstance();
