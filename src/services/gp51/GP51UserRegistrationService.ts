
import { supabase } from '@/integrations/supabase/client';

export interface GP51UserCreationData {
  username: string;
  password: string;
  usertype?: number;
  groupid?: string;
  showname?: string;
  email?: string;
  multilogin?: number;
}

export interface GP51UserCreationResult {
  success: boolean;
  gp51UserId?: string;
  username?: string;
  error?: string;
  errorCode?: string;
}

export class GP51UserRegistrationService {
  private static readonly DEFAULT_USER_TYPE = 3; // End user
  private static readonly DEFAULT_MULTILOGIN = 0; // Single login

  static async createGP51User(userData: GP51UserCreationData): Promise<GP51UserCreationResult> {
    try {
      console.log('🔄 Creating GP51 user:', userData.username);

      // Validate required fields
      if (!userData.username || !userData.password) {
        return {
          success: false,
          error: 'Username and password are required',
          errorCode: 'INVALID_INPUT'
        };
      }

      // Prepare GP51 user creation data
      const gp51UserData = {
        username: userData.username.trim(),
        password: userData.password,
        usertype: userData.usertype || this.DEFAULT_USER_TYPE,
        showname: userData.showname || userData.username,
        email: userData.email || '',
        multilogin: userData.multilogin || this.DEFAULT_MULTILOGIN,
        groupid: userData.groupid || undefined
      };

      // Call the GP51 user registration edge function
      const { data, error } = await supabase.functions.invoke('gp51-user-registration', {
        body: {
          action: 'create_user',
          ...gp51UserData
        }
      });

      if (error) {
        console.error('❌ GP51 user registration edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to call GP51 user registration service',
          errorCode: 'EDGE_FUNCTION_ERROR'
        };
      }

      if (!data.success) {
        console.error('❌ GP51 user creation failed:', data.error);
        return {
          success: false,
          error: data.error || 'GP51 user creation failed',
          errorCode: data.errorCode || 'GP51_API_ERROR'
        };
      }

      console.log('✅ GP51 user created successfully:', data.gp51UserId);
      
      return {
        success: true,
        gp51UserId: data.gp51UserId,
        username: userData.username
      };

    } catch (error) {
      console.error('❌ GP51 user registration service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during GP51 user creation',
        errorCode: 'SERVICE_ERROR'
      };
    }
  }

  static async validateUserData(userData: GP51UserCreationData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Username validation
    if (!userData.username) {
      errors.push('Username is required');
    } else if (userData.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    } else if (userData.username.length > 50) {
      errors.push('Username must be less than 50 characters');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(userData.username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }

    // Password validation
    if (!userData.password) {
      errors.push('Password is required');
    } else if (userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    // Email validation (if provided)
    if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Invalid email format');
    }

    // User type validation
    if (userData.usertype !== undefined && ![0, 1, 2, 3].includes(userData.usertype)) {
      errors.push('Invalid user type. Must be 0 (super admin), 1 (admin), 2 (operator), or 3 (end user)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static async checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    try {
      console.log('🔍 Checking GP51 username availability:', username);

      const { data, error } = await supabase.functions.invoke('gp51-user-registration', {
        body: {
          action: 'check_username',
          username: username.trim()
        }
      });

      if (error) {
        console.error('❌ Username availability check error:', error);
        return {
          available: false,
          error: 'Failed to check username availability'
        };
      }

      return {
        available: data.available || false
      };

    } catch (error) {
      console.error('❌ Username availability check service error:', error);
      return {
        available: false,
        error: 'Service error during username availability check'
      };
    }
  }
}
