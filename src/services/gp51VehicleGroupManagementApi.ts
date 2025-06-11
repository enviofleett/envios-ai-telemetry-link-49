
import { supabase } from '@/integrations/supabase/client';
import { gp51UserApi } from './gp51UserManagementApi';

export interface VehicleGroupAssignment {
  deviceId: string;
  groupId: number;
  groupName?: string;
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  description?: string;
  parentgroupid?: number;
}

export class GP51VehicleGroupManagementApi {
  async assignVehicleToGroup(deviceId: string, groupId: number): Promise<void> {
    console.log('Assigning vehicle to group:', { deviceId, groupId });
    
    try {
      // Use the stub GP51 user management API
      const response = await gp51UserApi.assignVehicleToGroup(deviceId, groupId);
      
      if (response.status !== 0) {
        throw new Error(response.cause || 'Failed to assign vehicle to group');
      }
      
      console.log('Vehicle assigned to group successfully');
    } catch (error) {
      console.error('Failed to assign vehicle to group:', error);
      throw error;
    }
  }

  async removeVehicleFromGroup(deviceId: string, groupId: number): Promise<void> {
    console.log('Removing vehicle from group:', { deviceId, groupId });
    
    try {
      // Use the existing GP51 user management API for vehicle group operations
      const response = await gp51UserApi.removeVehicleFromGroup(deviceId, groupId);
      
      if (response.status !== 0) {
        throw new Error(response.cause || 'Failed to remove vehicle from group');
      }
      
      console.log('Vehicle removed from group successfully');
    } catch (error) {
      console.error('Failed to remove vehicle from group:', error);
      throw error;
    }
  }

  async getVehicleGroups(deviceId: string): Promise<GP51Group[]> {
    console.log('Getting vehicle groups:', deviceId);
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'getdevicegroups',
          deviceid: deviceId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.status === 0) {
        return data.groups || [];
      } else {
        throw new Error(data.cause || 'Failed to get vehicle groups');
      }
    } catch (error) {
      console.error('Failed to get vehicle groups:', error);
      throw error;
    }
  }

  async getAllGroups(): Promise<GP51Group[]> {
    console.log('Getting all groups from GP51');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'getallgroups'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.status === 0) {
        return data.groups || [];
      } else {
        throw new Error(data.cause || 'Failed to get all groups');
      }
    } catch (error) {
      console.error('Failed to get all groups:', error);
      throw error;
    }
  }

  async createGroup(groupName: string, description?: string, parentGroupId?: number): Promise<GP51Group> {
    console.log('Creating new group:', { groupName, description, parentGroupId });
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'addgroup',
          groupname: groupName,
          description: description || '',
          parentgroupid: parentGroupId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.status === 0) {
        const newGroup = {
          groupid: data.groupid,
          groupname: groupName,
          description,
          parentgroupid: parentGroupId
        };

        // Sync to local database
        await this.syncGroupToLocal(newGroup);
        
        return newGroup;
      } else {
        throw new Error(data.cause || 'Failed to create group');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  async updateGroup(groupId: number, groupName: string, description?: string): Promise<void> {
    console.log('Updating group:', { groupId, groupName, description });
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'editgroup',
          groupid: groupId,
          groupname: groupName,
          description: description || ''
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.status !== 0) {
        throw new Error(data.cause || 'Failed to update group');
      }

      // Update local database
      await this.updateLocalGroup(groupId, groupName, description);
      
      console.log('Group updated successfully');
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    }
  }

  async deleteGroup(groupId: number): Promise<void> {
    console.log('Deleting group:', groupId);
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'deletegroup',
          groupid: groupId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.status !== 0) {
        throw new Error(data.cause || 'Failed to delete group');
      }

      // Remove from local database
      await this.removeLocalGroup(groupId);
      
      console.log('Group deleted successfully');
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  }

  private async syncGroupToLocal(group: GP51Group): Promise<void> {
    try {
      await supabase
        .from('device_groups')
        .upsert({
          gp51_group_id: group.groupid,
          name: group.groupname,
          description: group.description,
          parent_group_id: group.parentgroupid ? 
            (await this.getLocalGroupByGP51Id(group.parentgroupid))?.id : null,
          updated_at: new Date().toISOString()
        });
      
      console.log('Group synced to local database:', group.groupid);
    } catch (error) {
      console.error('Failed to sync group to local database:', error);
    }
  }

  private async updateLocalGroup(groupId: number, groupName: string, description?: string): Promise<void> {
    try {
      await supabase
        .from('device_groups')
        .update({
          name: groupName,
          description: description,
          updated_at: new Date().toISOString()
        })
        .eq('gp51_group_id', groupId);
      
      console.log('Group updated in local database:', groupId);
    } catch (error) {
      console.error('Failed to update group in local database:', error);
    }
  }

  private async removeLocalGroup(groupId: number): Promise<void> {
    try {
      await supabase
        .from('device_groups')
        .delete()
        .eq('gp51_group_id', groupId);
      
      console.log('Group removed from local database:', groupId);
    } catch (error) {
      console.error('Failed to remove group from local database:', error);
    }
  }

  private async getLocalGroupByGP51Id(gp51GroupId: number): Promise<{ id: string } | null> {
    try {
      const { data } = await supabase
        .from('device_groups')
        .select('id')
        .eq('gp51_group_id', gp51GroupId)
        .single();
      
      return data;
    } catch (error) {
      console.error('Failed to get local group by GP51 ID:', error);
      return null;
    }
  }
}

export const gp51VehicleGroupApi = new GP51VehicleGroupManagementApi();
