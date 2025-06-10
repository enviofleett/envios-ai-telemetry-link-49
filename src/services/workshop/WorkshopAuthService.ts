
import { supabase } from '@/integrations/supabase/client';
import { AuditLogger } from '@/services/auditLogging/AuditLogger';

export interface WorkshopAuthResult {
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
  requiresEmailVerification?: boolean;
}

export interface CreateWorkshopUserData {
  workshopId: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'technician' | 'inspector';
  permissions: string[];
  password: string;
}

export class WorkshopAuthService {
  static async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    try {
      const { data, error } = await supabase.rpc('hash_workshop_password', {
        password
      });

      if (error) throw error;
      return { hash: data.hash, salt: data.salt };
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  static async verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('verify_workshop_password', {
        password,
        stored_hash: storedHash,
        stored_salt: storedSalt
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  static async createWorkshopUser(userData: CreateWorkshopUserData): Promise<WorkshopAuthResult> {
    try {
      // Hash the password
      const { hash, salt } = await this.hashPassword(userData.password);

      // Create workshop user
      const { data: user, error } = await supabase
        .from('workshop_users')
        .insert({
          workshop_id: userData.workshopId,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          permissions: userData.permissions,
          password_hash: hash,
          password_salt: salt,
          email_verified: false
        })
        .select()
        .single();

      if (error) throw error;

      // Generate email verification token
      const { data: token, error: tokenError } = await supabase.rpc('generate_workshop_verification_token', {
        workshop_user_id: user.id
      });

      if (tokenError) {
        console.warn('Failed to generate verification token:', tokenError);
      }

      // Log the creation
      await AuditLogger.logAdminAction({
        actionType: 'user_role_change',
        targetEntityType: 'workshop_user',
        targetEntityId: user.id,
        actionDetails: {
          action: 'created',
          workshopId: userData.workshopId,
          role: userData.role,
          permissions: userData.permissions
        }
      });

      return {
        success: true,
        user,
        requiresEmailVerification: true
      };
    } catch (error: any) {
      console.error('Workshop user creation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create workshop user'
      };
    }
  }

  static async authenticateWorkshopUser(email: string, password: string, workshopId: string): Promise<WorkshopAuthResult> {
    try {
      // Find user by email and workshop
      const { data: user, error } = await supabase
        .from('workshop_users')
        .select('*')
        .eq('email', email)
        .eq('workshop_id', workshopId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        // Log failed login attempt
        await AuditLogger.logSecurityEvent({
          actionType: 'failed_login',
          resourceType: 'workshop_user',
          requestDetails: { email, workshopId },
          success: false,
          errorMessage: 'Invalid credentials'
        });

        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return {
          success: false,
          error: 'Account is temporarily locked. Please try again later.'
        };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password_hash, user.password_salt);

      if (!isValidPassword) {
        // Increment failed login attempts
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // Lock for 30 minutes after 5 failed attempts

        await supabase
          .from('workshop_users')
          .update({
            failed_login_attempts: failedAttempts,
            locked_until: lockUntil?.toISOString()
          })
          .eq('id', user.id);

        await AuditLogger.logSecurityEvent({
          actionType: 'failed_login',
          resourceType: 'workshop_user',
          resourceId: user.id,
          requestDetails: { email, workshopId, failedAttempts },
          success: false,
          riskLevel: failedAttempts >= 3 ? 'high' : 'medium'
        });

        return {
          success: false,
          error: lockUntil ? 'Too many failed attempts. Account locked for 30 minutes.' : 'Invalid credentials'
        };
      }

      // Check email verification
      if (!user.email_verified) {
        return {
          success: false,
          error: 'Please verify your email before logging in',
          requiresEmailVerification: true
        };
      }

      // Reset failed login attempts and update last login
      await supabase
        .from('workshop_users')
        .update({
          failed_login_attempts: 0,
          locked_until: null,
          last_login: new Date().toISOString()
        })
        .eq('id', user.id);

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('workshop_sessions')
        .insert({
          workshop_user_id: user.id,
          workshop_id: user.workshop_id,
          expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Log successful login
      await AuditLogger.logSecurityEvent({
        actionType: 'login',
        resourceType: 'workshop_user',
        resourceId: user.id,
        requestDetails: { email, workshopId },
        success: true
      });

      return {
        success: true,
        user: { ...user, password_hash: undefined, password_salt: undefined },
        session
      };
    } catch (error: any) {
      console.error('Workshop authentication failed:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }

  static async verifyEmailToken(token: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('verify_workshop_email', { token });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Email verification failed:', error);
      return false;
    }
  }

  static async resendVerificationEmail(userId: string): Promise<boolean> {
    try {
      const { data: token, error } = await supabase.rpc('generate_workshop_verification_token', {
        workshop_user_id: userId
      });

      if (error) throw error;
      
      // In a real implementation, you would send the email here
      console.log('Verification token generated:', token);
      return true;
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      return false;
    }
  }
}
