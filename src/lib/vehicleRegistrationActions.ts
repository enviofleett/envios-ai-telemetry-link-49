
import { supabase } from '@/integrations/supabase/client';
import type { VehicleDbRecord } from '@/types/vehicle';

export interface VehicleRegistrationData {
  deviceId: string;
  deviceName: string;
  userId: string;
  simNumber?: string;
}

export interface RegistrationResult {
  success: boolean;
  vehicleId?: string;
  error?: string;
}

export class VehicleRegistrationActions {
  /**
   * Register a new vehicle in the database
   */
  static async registerVehicle(data: VehicleRegistrationData): Promise<RegistrationResult> {
    try {
      console.log('Registering vehicle:', data);

      // Validate required fields
      if (!data.deviceId || !data.deviceName || !data.userId) {
        return {
          success: false,
          error: 'Missing required fields: deviceId, deviceName, or userId'
        };
      }

      // Check if device already exists
      const { data: existingVehicle, error: checkError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('gp51_device_id', data.deviceId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing vehicle:', checkError);
        return {
          success: false,
          error: `Database check failed: ${checkError.message}`
        };
      }

      if (existingVehicle) {
        return {
          success: false,
          error: `Vehicle with device ID ${data.deviceId} already exists`
        };
      }

      // Insert new vehicle using correct column names
      const vehicleData = {
        gp51_device_id: data.deviceId,
        name: data.deviceName,
        user_id: data.userId,
        sim_number: data.simNumber || null,
      };

      const { data: insertedVehicle, error: insertError } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select('id')
        .single();

      if (insertError) {
        console.error('Error inserting vehicle:', insertError);
        return {
          success: false,
          error: `Failed to register vehicle: ${insertError.message}`
        };
      }

      console.log('Vehicle registered successfully:', insertedVehicle);
      return {
        success: true,
        vehicleId: insertedVehicle.id
      };

    } catch (error) {
      console.error('Unexpected error in vehicle registration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update vehicle information
   */
  static async updateVehicle(vehicleId: string, updates: Partial<VehicleRegistrationData>): Promise<RegistrationResult> {
    try {
      const updateData: any = {};
      
      if (updates.deviceId) updateData.gp51_device_id = updates.deviceId;
      if (updates.deviceName) updateData.name = updates.deviceName;
      if (updates.userId) updateData.user_id = updates.userId;
      if (updates.simNumber !== undefined) updateData.sim_number = updates.simNumber;

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Error updating vehicle:', error);
        return {
          success: false,
          error: `Failed to update vehicle: ${error.message}`
        };
      }

      return {
        success: true,
        vehicleId
      };

    } catch (error) {
      console.error('Unexpected error in vehicle update:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get vehicle by device ID
   */
  static async getVehicleByDeviceId(deviceId: string): Promise<VehicleDbRecord | null> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('gp51_device_id', deviceId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching vehicle:', error);
        return null;
      }

      return data as VehicleDbRecord;

    } catch (error) {
      console.error('Unexpected error fetching vehicle:', error);
      return null;
    }
  }

  /**
   * Delete vehicle
   */
  static async deleteVehicle(vehicleId: string): Promise<RegistrationResult> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) {
        console.error('Error deleting vehicle:', error);
        return {
          success: false,
          error: `Failed to delete vehicle: ${error.message}`
        };
      }

      return {
        success: true,
        vehicleId
      };

    } catch (error) {
      console.error('Unexpected error in vehicle deletion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all vehicles
   */
  static async getVehicles(): Promise<VehicleDbRecord[]> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        return [];
      }

      return data as VehicleDbRecord[] || [];
    } catch (error) {
      console.error('Unexpected error fetching vehicles:', error);
      return [];
    }
  }
}

export const registerVehicle = VehicleRegistrationActions.registerVehicle;
export const getVehicles = VehicleRegistrationActions.getVehicles;
