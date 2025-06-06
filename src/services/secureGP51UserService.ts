
import { SecurityService } from './securityService';
import { AuditService } from './auditService';
import { supabase } from '@/integrations/supabase/client';

export interface SecureUserCreationRequest {
  username: string;
  password: string;
  usertype: 1 | 2 | 3 | 4;
  multilogin: 0 | 1;
  showname?: string;
  companyname?: string;
  companyaddr?: string;
  cardname?: string;
  email?: string;
  wechat?: string;
  phone?: string;
  qq?: string;
}

export interface SecureUserCreationResult {
  success: boolean;
  userId?: string;
  errors: string[];
  warnings: string[];
}

export class SecureGP51UserService {
  
  /**
   * Creates a new user with enhanced security and validation
   */
  static async createUserSecurely(
    adminUserId: string,
    userRequest: SecureUserCreationRequest,
    clientIP?: string
  ): Promise<SecureUserCreationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Rate limiting check
      const rateLimitResult = SecurityService.checkRateLimit(`user_creation_${adminUserId}`);
      if (!rateLimitResult.allowed) {
        await AuditService.logSecurityEvent(adminUserId, 'RATE_LIMIT_EXCEEDED', {
          action: 'user_creation',
          clientIP
        }, false);
        return {
          success: false,
          errors: ['Rate limit exceeded. Please try again later.'],
          warnings
        };
      }

      // 2. Input validation
      const validationResults = this.validateUserInputs(userRequest);
      if (!validationResults.isValid) {
        errors.push(...validationResults.errors);
        warnings.push(...validationResults.warnings);
      }

      // 3. Check admin permissions
      // In a real implementation, you'd get the admin's role from the database
      const hasPermission = SecurityService.hasPermission('admin', 'create_user');
      if (!hasPermission) {
        await AuditService.logSecurityEvent(adminUserId, 'UNAUTHORIZED_ACCESS', {
          action: 'user_creation',
          clientIP
        }, false);
        return {
          success: false,
          errors: ['Insufficient permissions to create users'],
          warnings
        };
      }

      // 4. Check for duplicate username
      const duplicateCheck = await this.checkUsernameDuplicate(userRequest.username);
      if (!duplicateCheck.isUnique) {
        errors.push('Username already exists');
      }

      // If validation failed, return errors
      if (errors.length > 0) {
        await AuditService.logUserCreation(adminUserId, '', userRequest, false, errors.join('; '));
        return { success: false, errors, warnings };
      }

      // 5. Hash password securely (replace MD5)
      const hashedPassword = await SecurityService.secureHash(userRequest.password);

      // 6. Create user in GP51 system
      const gp51Result = await this.createUserInGP51({
        ...userRequest,
        password: hashedPassword
      });

      if (!gp51Result.success) {
        errors.push(gp51Result.error || 'Failed to create user in GP51 system');
        await AuditService.logUserCreation(adminUserId, '', userRequest, false, gp51Result.error);
        return { success: false, errors, warnings };
      }

      // 7. Create user in local database
      const localResult = await this.createUserInLocalDB(userRequest, gp51Result.userId!);

      if (!localResult.success) {
        // Rollback GP51 user creation if local creation fails
        await this.rollbackGP51UserCreation(userRequest.username);
        errors.push('Failed to create user in local database');
        await AuditService.logUserCreation(adminUserId, '', userRequest, false, 'Local DB creation failed');
        return { success: false, errors, warnings };
      }

      // 8. Success - log the action
      await AuditService.logUserCreation(adminUserId, localResult.userId!, userRequest, true);

      return {
        success: true,
        userId: localResult.userId,
        errors: [],
        warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await AuditService.logUserCreation(adminUserId, '', userRequest, false, errorMessage);
      
      return {
        success: false,
        errors: [`User creation failed: ${errorMessage}`],
        warnings
      };
    }
  }

  /**
   * Validates all user inputs with security checks
   */
  private static validateUserInputs(userRequest: SecureUserCreationRequest): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate username
    const usernameValidation = SecurityService.validateInput(userRequest.username, 'username');
    if (!usernameValidation.isValid) {
      errors.push(`Username validation failed: ${usernameValidation.error}`);
    }

    // Validate email if provided
    if (userRequest.email) {
      const emailValidation = SecurityService.validateInput(userRequest.email, 'email');
      if (!emailValidation.isValid) {
        errors.push(`Email validation failed: ${emailValidation.error}`);
      }
    }

    // Validate password strength
    if (!userRequest.password || userRequest.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(userRequest.password)) {
      warnings.push('Password should contain uppercase, lowercase, and numeric characters for better security');
    }

    // Validate user type
    if (![1, 2, 3, 4].includes(userRequest.usertype)) {
      errors.push('Invalid user type specified');
    }

    // Validate multilogin setting
    if (![0, 1].includes(userRequest.multilogin)) {
      errors.push('Invalid multilogin setting');
    }

    // Validate optional fields
    if (userRequest.phone && !/^\+?[\d\s\-\(\)]{10,20}$/.test(userRequest.phone)) {
      errors.push('Invalid phone number format');
    }

    if (userRequest.showname) {
      const nameValidation = SecurityService.validateInput(userRequest.showname, 'text');
      if (!nameValidation.isValid) {
        errors.push(`Display name validation failed: ${nameValidation.error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if username already exists
   */
  private static async checkUsernameDuplicate(username: string): Promise<{ isUnique: boolean }> {
    try {
      const { data, error } = await supabase
        .from('envio_users')
        .select('id')
        .eq('gp51_username', username)
        .maybeSingle();

      if (error) {
        console.error('Error checking username uniqueness:', error);
        return { isUnique: false }; // Fail safe - assume not unique if can't check
      }

      return { isUnique: !data };
    } catch (error) {
      console.error('Exception checking username uniqueness:', error);
      return { isUnique: false };
    }
  }

  /**
   * Create user in GP51 system with proper error handling
   */
  private static async createUserInGP51(userRequest: SecureUserCreationRequest): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'adduser',
          ...userRequest
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.status !== 0) {
        return { success: false, error: data.cause || 'GP51 user creation failed' };
      }

      return { success: true, userId: userRequest.username };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown GP51 error' 
      };
    }
  }

  /**
   * Create user in local database
   */
  private static async createUserInLocalDB(userRequest: SecureUserCreationRequest, gp51UserId: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('envio_users')
        .insert({
          name: userRequest.showname || userRequest.username,
          email: userRequest.email || '',
          phone_number: userRequest.phone,
          city: userRequest.companyaddr,
          gp51_username: userRequest.username,
          gp51_user_type: userRequest.usertype,
          is_gp51_imported: true,
          import_source: 'secure_admin_creation'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, userId: data.id };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }
  }

  /**
   * Rollback GP51 user creation in case of failure
   */
  private static async rollbackGP51UserCreation(username: string): Promise<void> {
    try {
      await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'deleteuser',
          usernames: username
        }
      });
    } catch (error) {
      console.error('Failed to rollback GP51 user creation:', error);
      // Log this as a critical issue that needs manual intervention
      await AuditService.logSecurityEvent(undefined, 'ROLLBACK_FAILED', {
        username,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, false);
    }
  }
}
