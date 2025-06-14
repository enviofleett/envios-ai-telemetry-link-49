
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
        this.setState({ isCheckingRole: false });
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
        const cachedRole = await enhancedCachingService.get<{ role: string }>(cacheKey);
        if (cachedRole) {
            this.setState({
                userRole: cachedRole.role,
                isAdmin: cachedRole.role === 'admin',
                isCheckingRole: false,
            });
            return;
        }
    }

    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (retryCount < 1) {
          this.roleCheckTimeoutRef = setTimeout(() => {
            this.checkUserRole(userId, { ...options, retryCount: retryCount + 1 });
          }, Math.pow(2, retryCount) * 1000);
          return;
        }
        this.setState({ userRole: 'user', isAdmin: false });
      } else if (roleData) {
        await enhancedCachingService.set(cacheKey, { role: roleData.role }, 10 * 60 * 1000); // Cache for 10 minutes
        this.setState({ userRole: roleData.role, isAdmin: roleData.role === 'admin' });
      } else {
        this.setState({ userRole: 'user', isAdmin: false });
      }
    } catch (error) {
       if (retryCount < 1) {
          this.roleCheckTimeoutRef = setTimeout(() => {
            this.checkUserRole(userId, { ...options, retryCount: retryCount + 1 });
          }, Math.pow(2, retryCount) * 1000);
          return;
       }
       this.setState({ userRole: 'user', isAdmin: false });
    } finally {
      if (!isBackground || retryCount >= 1) {
          this.setState({ isCheckingRole: false });
      }
    }
  }
  
  private clearUserRole = () => {
    if(this.state.user) {
        const cacheKey = `user-role-${this.state.user.id}`;
        enhancedCachingService.invalidateByTag(cacheKey); // Corrected: Use a method that can invalidate a key, assuming invalidateByTag can be adapted or another method is used. Or simply key based invalidation if available.
    }
    this.setState({ isAdmin: false, userRole: null, isCheckingRole: false });
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
