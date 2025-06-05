
import { supabase } from '@/integrations/supabase/client';
import { 
  CreateUserRequest, 
  EditUserRequest, 
  GP51User, 
  CreateUserResponse, 
  QueryUserResponse, 
  DeleteUserResponse 
} from '@/types/gp51-user';

export class GP51UserManagementApi {
  private async callGP51Api(action: string, payload: any): Promise<any> {
    const { data, error } = await supabase.functions.invoke('gp51-user-management', {
      body: { action, ...payload }
    });

    if (error) {
      console.error('GP51 User Management API error:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    console.log('Creating GP51 user:', request.username);
    
    try {
      const response = await this.callGP51Api('adduser', request);
      
      if (response.status === 0) {
        console.log('User created successfully:', request.username);
        
        // Store user in local database for hierarchy tracking
        await this.syncUserToLocal(request);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async queryUserDetails(username: string): Promise<QueryUserResponse> {
    console.log('Querying GP51 user details:', username);
    
    try {
      const response = await this.callGP51Api('queryuserdetail', { username });
      
      if (response.status === 0) {
        console.log('User details retrieved successfully:', username);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to query user details:', error);
      throw error;
    }
  }

  async editUser(request: EditUserRequest): Promise<CreateUserResponse> {
    console.log('Editing GP51 user:', request.username);
    
    try {
      const response = await this.callGP51Api('edituser', request);
      
      if (response.status === 0) {
        console.log('User edited successfully:', request.username);
        
        // Update local database
        await this.updateLocalUser(request);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to edit user:', error);
      throw error;
    }
  }

  async deleteUsers(usernames: string[]): Promise<DeleteUserResponse> {
    console.log('Deleting GP51 users:', usernames);
    
    try {
      const response = await this.callGP51Api('deleteuser', { 
        usernames: usernames.join(',') 
      });
      
      if (response.status === 0) {
        console.log('Users deleted successfully:', usernames);
        
        // Remove from local database
        await this.removeLocalUsers(usernames);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to delete users:', error);
      throw error;
    }
  }

  private async syncUserToLocal(user: CreateUserRequest): Promise<void> {
    try {
      await supabase
        .from('envio_users')
        .upsert({
          name: user.showname || user.username,
          email: user.email || '',
          gp51_username: user.username,
          is_gp51_imported: true,
          import_source: 'gp51_user_api'
        });
    } catch (error) {
      console.error('Failed to sync user to local database:', error);
    }
  }

  private async updateLocalUser(user: EditUserRequest): Promise<void> {
    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };
      
      if (user.showname) updates.name = user.showname;
      if (user.email) updates.email = user.email;
      
      await supabase
        .from('envio_users')
        .update(updates)
        .eq('gp51_username', user.username);
    } catch (error) {
      console.error('Failed to update local user:', error);
    }
  }

  private async removeLocalUsers(usernames: string[]): Promise<void> {
    try {
      await supabase
        .from('envio_users')
        .delete()
        .in('gp51_username', usernames);
    } catch (error) {
      console.error('Failed to remove local users:', error);
    }
  }

  getUserTypeLabel(usertype: 1 | 2 | 3 | 4): string {
    const labels = {
      1: 'Company Admin',
      2: 'Sub Admin', 
      3: 'End User',
      4: 'Device User'
    };
    return labels[usertype];
  }

  canManageUsers(usertype: 1 | 2 | 3 | 4): boolean {
    return usertype === 1 || usertype === 2; // Company Admin or Sub Admin
  }

  canManageDevices(usertype: 1 | 2 | 3 | 4): boolean {
    return usertype === 1 || usertype === 2 || usertype === 3; // Not Device User
  }
}

export const gp51UserApi = new GP51UserManagementApi();
