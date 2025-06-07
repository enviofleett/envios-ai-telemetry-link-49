
import { supabase } from '@/integrations/supabase/client';
import { unifiedGP51SessionManager } from '../unifiedGP51SessionManager';
import { GP51Vehicle, GP51Position } from './types';

export class GP51ApiService {
  static async fetchVehicleList(): Promise<GP51Vehicle[]> {
    const session = await unifiedGP51SessionManager.validateAndEnsureSession();
    
    const { data: vehicleListData, error: listError } = await supabase.functions.invoke('gp51-service-management', {
      body: { 
        action: 'querymonitorlist',
        username: session.username
      }
    });

    if (listError || vehicleListData?.status !== 0) {
      throw new Error(`Failed to get vehicle list: ${listError?.message || vehicleListData?.cause}`);
    }

    return vehicleListData.records || vehicleListData.monitors || [];
  }

  static async fetchPositions(deviceIds: number[]): Promise<GP51Position[]> {
    if (deviceIds.length === 0) return [];

    const { data: positionData } = await supabase.functions.invoke('gp51-service-management', {
      body: { 
        action: 'lastposition',
        deviceids: deviceIds
      }
    });

    return positionData?.status === 0 ? (positionData.positions || []) : [];
  }
}
