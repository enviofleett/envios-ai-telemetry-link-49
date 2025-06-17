
export interface GP51DeviceData {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum?: string;
  creater: string;
  lastactivetime?: number;
  isfree: number;
  allowedit: number;
  overduetime: number;
  expirenotifytime: number;
  remark?: string;
  icon?: number;
  loginname?: string;
}

export interface ProcessedVehicleData {
  device_id: string;
  device_name: string;
  user_id: string;
  sim_number?: string;
  is_active: boolean;
  gp51_metadata: any;
  status: 'online' | 'offline' | 'unknown';
  created_at: string;
  updated_at: string;
}

export function processGP51DeviceData(
  devices: GP51DeviceData[], 
  userId: string
): ProcessedVehicleData[] {
  const now = new Date().toISOString();
  
  return devices.map((device) => {
    // Determine device status based on GP51 data
    let status: 'online' | 'offline' | 'unknown' = 'unknown';
    
    if (device.lastactivetime) {
      const lastActive = new Date(device.lastactivetime * 1000);
      const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
      status = hoursSinceActive < 1 ? 'online' : 'offline';
    }
    
    return {
      device_id: device.deviceid,
      device_name: device.devicename || `Device ${device.deviceid}`,
      user_id: userId,
      sim_number: device.simnum || null,
      is_active: device.isfree !== 0, // GP51: isfree 0 usually means inactive/expired
      gp51_metadata: device,
      status,
      created_at: now,
      updated_at: now
    };
  });
}

export function validateGP51Response(response: any): boolean {
  return (
    response &&
    typeof response.status === 'number' &&
    typeof response.cause === 'string' &&
    (response.status === 0 || response.cause !== 'OK')
  );
}

export function extractDevicesFromGroups(groups: any[]): GP51DeviceData[] {
  const allDevices: GP51DeviceData[] = [];
  
  for (const group of groups) {
    if (group.devices && Array.isArray(group.devices)) {
      allDevices.push(...group.devices);
    }
  }
  
  return allDevices;
}
