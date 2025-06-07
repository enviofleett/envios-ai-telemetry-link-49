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

  // Enhanced User Group Assignment Methods
  async assignUserToGroup(username: string, groupId: number): Promise<any> {
    console.log('Assigning user to group in GP51:', { username, groupId });
    
    try {
      const response = await this.callGP51Api('assignusertogroup', {
        username,
        groupid: groupId
      });
      
      if (response.status === 0) {
        console.log('User assigned to group successfully:', { username, groupId });
        
        // Update local database
        await this.syncUserGroupAssignment(username, groupId, 'assign');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to assign user to group:', error);
      throw error;
    }
  }

  async removeUserFromGroup(username: string, groupId: number): Promise<any> {
    console.log('Removing user from group in GP51:', { username, groupId });
    
    try {
      const response = await this.callGP51Api('removeuserfromgroup', {
        username,
        groupid: groupId
      });
      
      if (response.status === 0) {
        console.log('User removed from group successfully:', { username, groupId });
        
        // Update local database
        await this.syncUserGroupAssignment(username, groupId, 'remove');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to remove user from group:', error);
      throw error;
    }
  }

  async getUserGroups(username: string): Promise<any> {
    console.log('Getting user groups from GP51:', username);
    
    try {
      const response = await this.callGP51Api('getusergroups', { username });
      
      if (response.status === 0) {
        console.log('User groups retrieved successfully:', username);
        
        // Sync groups to local database
        if (response.groups) {
          await this.syncUserGroupsToLocal(username, response.groups);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Failed to get user groups:', error);
      throw error;
    }
  }

  // Vehicle Group Assignment Methods
  async assignVehicleToGroup(deviceId: string, groupId: number): Promise<any> {
    console.log('Assigning vehicle to group in GP51:', { deviceId, groupId });
    
    try {
      const response = await this.callGP51Api('assigndevicetogroup', {
        deviceid: deviceId,
        groupid: groupId
      });
      
      if (response.status === 0) {
        console.log('Vehicle assigned to group successfully:', { deviceId, groupId });
        
        // Update local database
        await this.syncVehicleGroupAssignment(deviceId, groupId, 'assign');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to assign vehicle to group:', error);
      throw error;
    }
  }

  async removeVehicleFromGroup(deviceId: string, groupId: number): Promise<any> {
    console.log('Removing vehicle from group in GP51:', { deviceId, groupId });
    
    try {
      const response = await this.callGP51Api('removedevicefromgroup', {
        deviceid: deviceId,
        groupid: groupId
      });
      
      if (response.status === 0) {
        console.log('Vehicle removed from group successfully:', { deviceId, groupId });
        
        // Update local database
        await this.syncVehicleGroupAssignment(deviceId, groupId, 'remove');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to remove vehicle from group:', error);
      throw error;
    }
  }

  // Enhanced Local Database Sync Methods
  private async syncUserGroupAssignment(username: string, groupId: number, action: 'assign' | 'remove'): Promise<void> {
    try {
      // Get the local user ID
      const { data: user } = await supabase
        .from('envio_users')
        .select('id')
        .eq('gp51_username', username)
        .single();

      if (!user) {
        console.warn(`User not found in local database: ${username}`);
        return;
      }

      // Get or create the user group
      const { data: userGroup } = await supabase
        .from('user_groups')
        .select('id')
        .eq('gp51_group_id', groupId)
        .maybeSingle();

      if (!userGroup) {
        console.warn(`User group not found in local database: ${groupId}`);
        return;
      }

      if (action === 'assign') {
        // Insert assignment if not exists
        await supabase
          .from('user_group_assignments')
          .upsert({
            user_id: user.id,
            user_group_id: userGroup.id
          });
      } else {
        // Remove assignment
        await supabase
          .from('user_group_assignments')
          .delete()
          .eq('user_id', user.id)
          .eq('user_group_id', userGroup.id);
      }

      console.log(`User group assignment ${action}ed successfully in local DB:`, { username, groupId });
    } catch (error) {
      console.error(`Failed to ${action} user group assignment in local DB:`, error);
    }
  }

  private async syncUserGroupsToLocal(username: string, groups: any[]): Promise<void> {
    try {
      // Sync user groups to local database
      for (const group of groups) {
        await supabase
          .from('user_groups')
          .upsert({
            gp51_group_id: group.groupid,
            name: group.groupname,
            description: group.description || '',
            updated_at: new Date().toISOString()
          });
      }

      console.log(`Synced ${groups.length} user groups to local database`);
    } catch (error) {
      console.error('Failed to sync user groups to local database:', error);
    }
  }

  private async syncVehicleGroupAssignment(deviceId: string, groupId: number, action: 'assign' | 'remove'): Promise<void> {
    try {
      // Get the device group
      const { data: deviceGroup } = await supabase
        .from('device_groups')
        .select('id')
        .eq('gp51_group_id', groupId)
        .maybeSingle();

      if (!deviceGroup) {
        console.warn(`Device group not found in local database: ${groupId}`);
        return;
      }

      if (action === 'assign') {
        // Insert assignment if not exists
        await supabase
          .from('device_group_assignments')
          .upsert({
            device_id: deviceId,
            device_group_id: deviceGroup.id
          });
      } else {
        // Remove assignment
        await supabase
          .from('device_group_assignments')
          .delete()
          .eq('device_id', deviceId)
          .eq('device_group_id', deviceGroup.id);
      }

      console.log(`Vehicle group assignment ${action}ed successfully in local DB:`, { deviceId, groupId });
    } catch (error) {
      console.error(`Failed to ${action} vehicle group assignment in local DB:`, error);
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
          gp51_user_type: user.usertype,
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
      if (user.usertype) updates.gp51_user_type = user.usertype;
      
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

  private async updateLocalUserGroup(username: string, groupId: number): Promise<void> {
    try {
      // This would typically update a user_groups table or similar
      // For now, we'll just log the action
      console.log(`Updated local user group assignment: ${username} -> group ${groupId}`);
    } catch (error) {
      console.error('Failed to update local user group:', error);
    }
  }

  private async removeLocalUserGroup(username: string, groupId: number): Promise<void> {
    try {
      // This would typically remove from a user_groups table or similar
      // For now, we'll just log the action
      console.log(`Removed local user group assignment: ${username} -> group ${groupId}`);
    } catch (error) {
      console.error('Failed to remove local user group:', error);
    }
  }

  private async updateLocalVehicleGroup(deviceId: string, groupId: number): Promise<void> {
    try {
      // Update the vehicles table with the group assignment
      await supabase
        .from('vehicles')
        .update({
          gp51_group_id: groupId,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', deviceId);
      
      console.log(`Updated local vehicle group assignment: ${deviceId} -> group ${groupId}`);
    } catch (error) {
      console.error('Failed to update local vehicle group:', error);
    }
  }

  private async removeLocalVehicleGroup(deviceId: string, groupId: number): Promise<void> {
    try {
      // Remove the group assignment from the vehicles table
      await supabase
        .from('vehicles')
        .update({
          gp51_group_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', deviceId);
      
      console.log(`Removed local vehicle group assignment: ${deviceId} from group ${groupId}`);
    } catch (error) {
      console.error('Failed to remove local vehicle group:', error);
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

  canManageGroups(usertype: 1 | 2 | 3 | 4): boolean {
    return usertype === 1 || usertype === 2; // Company Admin or Sub Admin
  }
}

export const gp51UserApi = new GP51UserManagementApi();
