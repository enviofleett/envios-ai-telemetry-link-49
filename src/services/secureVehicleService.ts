
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

interface SecureVehicleCreationResult {
  success: boolean;
  vehicleId?: string;
  error?: string;
}

interface SecureVehicleCreationRequest {
  gp51_device_id: string;
  name: string;
  user_id: string;
  sim_number?: string;
}

export class SecureVehicleService {
  /**
   * Creates a vehicle in the database with proper security validation
   */
  static async createSecureVehicle(
    request: SecureVehicleCreationRequest
  ): Promise<SecureVehicleCreationResult> {
    try {
      console.log(`Creating secure vehicle: ${request.gp51_device_id}`);

      // Validate required fields
      if (!request.gp51_device_id || !request.name || !request.user_id) {
        return {
          success: false,
          error: 'Missing required fields: gp51_device_id, name, or user_id'
        };
      }

      // Check if device already exists
      const { data: existingVehicle, error: checkError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id')
        .eq('gp51_device_id', request.gp51_device_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing vehicle:', checkError);
        return {
          success: false,
          error: `Database check failed: ${checkError.message}`
        };
      }

      if (existingVehicle) {
        return {
          success: false,
          error: `Vehicle with device ID ${request.gp51_device_id} already exists`
        };
      }

      // Verify user exists
      const { data: user, error: userError } = await supabase
        .from('envio_users')
        .select('id')
        .eq('id', request.user_id)
        .single();

      if (userError) {
        console.error('Error verifying user:', userError);
        return {
          success: false,
          error: `User verification failed: ${userError.message}`
        };
      }

      if (!user) {
        return {
          success: false,
          error: `User with ID ${request.user_id} does not exist`
        };
      }

      // Create vehicle with correct schema
      const vehicleData = {
        gp51_device_id: request.gp51_device_id,
        name: request.name,
        user_id: request.user_id,
        sim_number: request.sim_number || null
      };

      const { data: newVehicle, error: insertError } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating vehicle:', insertError);
        return {
          success: false,
          error: `Vehicle creation failed: ${insertError.message}`
        };
      }

      if (!newVehicle) {
        return {
          success: false,
          error: 'Vehicle created but no data returned'
        };
      }

      console.log(`✅ Vehicle created successfully with ID: ${newVehicle.id}`);
      
      return {
        success: true,
        vehicleId: newVehicle.id
      };

    } catch (error) {
      console.error('Secure vehicle creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Updates a vehicle with security validation
   */
  static async updateSecureVehicle(
    vehicleId: string,
    updates: Partial<SecureVehicleCreationRequest>
  ): Promise<SecureVehicleCreationResult> {
    try {
      console.log(`Updating secure vehicle: ${vehicleId}`);

      // Check if vehicle exists
      const { data: existingVehicle, error: checkError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id')
        .eq('id', vehicleId)
        .single();

      if (checkError) {
        console.error('Error checking existing vehicle:', checkError);
        return {
          success: false,
          error: `Vehicle check failed: ${checkError.message}`
        };
      }

      if (!existingVehicle) {
        return {
          success: false,
          error: `Vehicle with ID ${vehicleId} does not exist`
        };
      }

      // Build update object with correct column names
      const updateData: any = {};
      if (updates.gp51_device_id) updateData.gp51_device_id = updates.gp51_device_id;
      if (updates.name) updateData.name = updates.name;
      if (updates.user_id) updateData.user_id = updates.user_id;
      if (updates.sim_number !== undefined) updateData.sim_number = updates.sim_number;

      // Update vehicle
      const { error: updateError } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (updateError) {
        console.error('Error updating vehicle:', updateError);
        return {
          success: false,
          error: `Vehicle update failed: ${updateError.message}`
        };
      }

      console.log(`✅ Vehicle updated successfully: ${vehicleId}`);
      
      return {
        success: true,
        vehicleId: vehicleId
      };

    } catch (error) {
      console.error('Secure vehicle update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Deletes a vehicle with security validation
   */
  static async deleteSecureVehicle(vehicleId: string): Promise<SecureVehicleCreationResult> {
    try {
      console.log(`Deleting secure vehicle: ${vehicleId}`);

      // Check if vehicle exists
      const { data: existingVehicle, error: checkError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id')
        .eq('id', vehicleId)
        .single();

      if (checkError) {
        console.error('Error checking existing vehicle:', checkError);
        return {
          success: false,
          error: `Vehicle check failed: ${checkError.message}`
        };
      }

      if (!existingVehicle) {
        return {
          success: false,
          error: `Vehicle with ID ${vehicleId} does not exist`
        };
      }

      // Delete vehicle
      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (deleteError) {
        console.error('Error deleting vehicle:', deleteError);
        return {
          success: false,
          error: `Vehicle deletion failed: ${deleteError.message}`
        };
      }

      console.log(`✅ Vehicle deleted successfully: ${vehicleId}`);
      
      return {
        success: true,
        vehicleId: vehicleId
      };

    } catch (error) {
      console.error('Secure vehicle deletion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
