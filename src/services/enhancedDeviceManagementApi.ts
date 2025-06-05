
import { supabase } from '@/integrations/supabase/client';
import { 
  DeviceType, 
  DeviceGroup, 
  DeviceTag, 
  DeviceConfiguration, 
  DeviceHistory, 
  BulkOperationRequest,
  DeviceFilter 
} from '@/types/device-management';
import { gp51DeviceApi } from './gp51DeviceManagementApi';

export class EnhancedDeviceManagementApi {
  // Device Types Management
  async syncDeviceTypes(): Promise<DeviceType[]> {
    try {
      // Fetch from GP51 API
      const gp51DeviceTypes = await gp51DeviceApi.queryDeviceTypes();
      
      if (gp51DeviceTypes?.devicetypes) {
        // Sync to local database
        for (const deviceType of gp51DeviceTypes.devicetypes) {
          await supabase
            .from('device_types')
            .upsert({
              gp51_device_type_id: deviceType.devicetypeid,
              type_name: deviceType.typename,
              type_code: deviceType.typecode,
              default_id_length: deviceType.defaultidlength,
              default_offline_delay: deviceType.defaultofflinedelay,
              functions: deviceType.functions,
              functions_long: deviceType.functionslong,
              price_1_year: deviceType.price,
              price_3_year: deviceType.price3,
              price_5_year: deviceType.price5,
              price_10_year: deviceType.price10,
              features: {},
              remark: deviceType.remark,
              remark_en: deviceType.remarken,
              is_active: true,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'gp51_device_type_id'
            });
        }
      }

      // Return local data
      const { data, error } = await supabase
        .from('device_types')
        .select('*')
        .eq('is_active', true)
        .order('type_name');

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        features: item.features as Record<string, any>
      }));
    } catch (error) {
      console.error('Failed to sync device types:', error);
      throw error;
    }
  }

  async getDeviceTypes(): Promise<DeviceType[]> {
    const { data, error } = await supabase
      .from('device_types')
      .select('*')
      .eq('is_active', true)
      .order('type_name');

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      features: item.features as Record<string, any>
    }));
  }

  // Device Groups Management
  async getDeviceGroups(): Promise<DeviceGroup[]> {
    const { data, error } = await supabase
      .from('device_groups')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async createDeviceGroup(group: Omit<DeviceGroup, 'id' | 'created_at' | 'updated_at'>): Promise<DeviceGroup> {
    const { data, error } = await supabase
      .from('device_groups')
      .insert(group)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDeviceGroup(id: string, updates: Partial<DeviceGroup>): Promise<DeviceGroup> {
    const { data, error } = await supabase
      .from('device_groups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDeviceGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from('device_groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Device Tags Management
  async getDeviceTags(): Promise<DeviceTag[]> {
    const { data, error } = await supabase
      .from('device_tags')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async createDeviceTag(tag: Omit<DeviceTag, 'id' | 'created_at'>): Promise<DeviceTag> {
    const { data, error } = await supabase
      .from('device_tags')
      .insert(tag)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDeviceTag(id: string, updates: Partial<DeviceTag>): Promise<DeviceTag> {
    const { data, error } = await supabase
      .from('device_tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDeviceTag(id: string): Promise<void> {
    const { error } = await supabase
      .from('device_tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Device Tag Assignments
  async getDeviceTagAssignments(deviceId: string): Promise<DeviceTag[]> {
    const { data, error } = await supabase
      .from('device_tag_assignments')
      .select('device_tags(*)')
      .eq('device_id', deviceId);

    if (error) throw error;
    return data?.map(item => item.device_tags).filter(Boolean) || [];
  }

  async assignTagsToDevice(deviceId: string, tagIds: string[]): Promise<void> {
    // Remove existing assignments
    await supabase
      .from('device_tag_assignments')
      .delete()
      .eq('device_id', deviceId);

    // Add new assignments
    if (tagIds.length > 0) {
      const assignments = tagIds.map(tagId => ({
        device_id: deviceId,
        tag_id: tagId
      }));

      const { error } = await supabase
        .from('device_tag_assignments')
        .insert(assignments);

      if (error) throw error;
    }
  }

  // Device History
  async getDeviceHistory(deviceId: string, limit: number = 50): Promise<DeviceHistory[]> {
    const { data, error } = await supabase
      .from('device_history')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      old_values: item.old_values as Record<string, any>,
      new_values: item.new_values as Record<string, any>
    }));
  }

  // Bulk Operations
  async performBulkOperation(request: BulkOperationRequest): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const deviceId of request.device_ids) {
      try {
        switch (request.operation) {
          case 'enable':
            await supabase
              .from('vehicles')
              .update({ is_active: true })
              .eq('device_id', deviceId);
            break;

          case 'disable':
            await supabase
              .from('vehicles')
              .update({ is_active: false })
              .eq('device_id', deviceId);
            break;

          case 'delete':
            await gp51DeviceApi.deleteDevice(deviceId);
            break;

          case 'update':
            if (request.data) {
              await supabase
                .from('vehicles')
                .update(request.data)
                .eq('device_id', deviceId);
            }
            break;

          case 'assign_tags':
            if (request.data?.tagIds) {
              await this.assignTagsToDevice(deviceId, request.data.tagIds);
            }
            break;

          default:
            throw new Error(`Unknown operation: ${request.operation}`);
        }
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Device ${deviceId}: ${error.message}`);
      }
    }

    return results;
  }

  // Enhanced Device Filtering
  async getFilteredDevices(filter: DeviceFilter) {
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        device_tag_assignments(
          device_tags(*)
        )
      `);

    if (filter.search) {
      query = query.or(`device_name.ilike.%${filter.search}%,device_id.ilike.%${filter.search}%`);
    }

    if (filter.device_type) {
      query = query.eq('gp51_metadata->>devicetype', filter.device_type.toString());
    }

    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    if (filter.is_active !== undefined) {
      query = query.eq('is_active', filter.is_active);
    }

    const { data, error } = await query.order('device_name');

    if (error) throw error;
    return data || [];
  }

  // Device Configuration Management
  async getDeviceConfigurations(deviceId: string): Promise<DeviceConfiguration[]> {
    const { data, error } = await supabase
      .from('device_configurations')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      configuration_data: item.configuration_data as Record<string, any>
    }));
  }

  async saveDeviceConfiguration(config: Omit<DeviceConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<DeviceConfiguration> {
    const { data, error } = await supabase
      .from('device_configurations')
      .insert(config)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      configuration_data: data.configuration_data as Record<string, any>
    };
  }

  async updateDeviceConfiguration(id: string, updates: Partial<DeviceConfiguration>): Promise<DeviceConfiguration> {
    const { data, error } = await supabase
      .from('device_configurations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      configuration_data: data.configuration_data as Record<string, any>
    };
  }

  async deleteDeviceConfiguration(id: string): Promise<void> {
    const { error } = await supabase
      .from('device_configurations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const enhancedDeviceApi = new EnhancedDeviceManagementApi();
