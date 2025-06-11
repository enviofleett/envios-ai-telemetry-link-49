
import { supabase } from '@/integrations/supabase/client';

export interface GP51UserData {
  username: string;
  password: string;
  showname: string;
  email?: string;
  usertype?: number;
  multilogin?: number;
}

export interface GP51UserResponse {
  success: boolean;
  data?: any;
  error?: string;
  gp51_username?: string;
}

export class GP51IntegrationService {
  
  /**
   * Create a user in GP51 system
   */
  static async createUser(userData: GP51UserData): Promise<GP51UserResponse> {
    try {
      console.log('🔄 GP51IntegrationService: Creating user', userData.username);
      
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'adduser',
          username: userData.username,
          password: userData.password,
          showname: userData.showname,
          email: userData.email || '',
          usertype: userData.usertype || 3,
          multilogin: userData.multilogin || 1
        }
      });

      if (error) {
        console.error('❌ GP51 user creation failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.success) {
        console.error('❌ GP51 user creation returned error:', data);
        return {
          success: false,
          error: data.error || 'GP51 user creation failed'
        };
      }

      console.log('✅ GP51 user created successfully:', userData.username);
      return {
        success: true,
        data: data.data,
        gp51_username: userData.username
      };

    } catch (error) {
      console.error('❌ GP51 user creation exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a user in GP51 system
   */
  static async updateUser(userData: {
    username: string;
    showname?: string;
    email?: string;
    usertype?: number;
  }): Promise<GP51UserResponse> {
    try {
      console.log('🔄 GP51IntegrationService: Updating user', userData.username);
      
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'edituser',
          ...userData
        }
      });

      if (error) {
        console.error('❌ GP51 user update failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ GP51 user updated successfully:', userData.username);
      return {
        success: true,
        data: data.data
      };

    } catch (error) {
      console.error('❌ GP51 user update exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a user from GP51 system
   */
  static async deleteUser(username: string): Promise<GP51UserResponse> {
    try {
      console.log('🔄 GP51IntegrationService: Deleting user', username);
      
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'deleteuser',
          usernames: username
        }
      });

      if (error) {
        console.error('❌ GP51 user deletion failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ GP51 user deleted successfully:', username);
      return {
        success: true,
        data: data.data
      };

    } catch (error) {
      console.error('❌ GP51 user deletion exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test if a user exists in GP51
   */
  static async testUserExists(username: string): Promise<{ exists: boolean; error?: string }> {
    try {
      console.log('🔄 GP51IntegrationService: Testing user existence', username);
      
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'test_user_creation',
          username
        }
      });

      if (error) {
        console.error('❌ GP51 user test failed:', error);
        return {
          exists: false,
          error: error.message
        };
      }

      return {
        exists: data.userExists || false
      };

    } catch (error) {
      console.error('❌ GP51 user test exception:', error);
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify GP51 integration is working
   */
  static async testIntegration(): Promise<{ working: boolean; error?: string; details?: any }> {
    try {
      console.log('🔄 GP51IntegrationService: Testing integration');
      
      const testUsername = `test_${Date.now()}`;
      
      // Test user creation
      const createResult = await this.createUser({
        username: testUsername,
        password: 'TestPass123!',
        showname: 'Test User'
      });

      if (!createResult.success) {
        return {
          working: false,
          error: `User creation failed: ${createResult.error}`,
          details: createResult
        };
      }

      // Test user deletion (cleanup)
      const deleteResult = await this.deleteUser(testUsername);
      
      if (!deleteResult.success) {
        console.warn('⚠️  Test user cleanup failed:', deleteResult.error);
      }

      return {
        working: true,
        details: {
          createResult,
          deleteResult
        }
      };

    } catch (error) {
      console.error('❌ GP51 integration test exception:', error);
      return {
        working: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
