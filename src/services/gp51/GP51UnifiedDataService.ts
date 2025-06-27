
import { GP51Device, GP51DeviceTreeResponse, GP51Position, GP51LastPositionResponse, GP51AuthResult } from '@/types/gp51-unified';

// Simple MD5 implementation for browser compatibility
function md5(str: string): string {
  // Simple hash function for browser - in production you'd want a proper crypto library
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex-like string for consistency
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export class GP51UnifiedDataService {
  protected baseUrl = 'https://api.gps51.com/webapi';
  protected token: string | null = null;
  private lastPositionQueryTime = 0;
  protected cache: {
    deviceTree: GP51DeviceTreeResponse | null;
    positions: GP51Position[];
    lastUpdate: number;
  } = {
    deviceTree: null,
    positions: [],
    lastUpdate: 0
  };

  async authenticate(username: string, password: string): Promise<GP51AuthResult> {
    try {
      // Use simple hash function instead of crypto
      const hashedPassword = md5(username + password);
      
      const response = await fetch(`${this.baseUrl}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        })
      });

      const result: GP51AuthResult = await response.json();
      
      if (result.status === 0 && result.token) {
        this.token = result.token;
        this.clearCache();
      }
      
      return result;
    } catch (error) {
      return {
        status: 1,
        cause: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async getDeviceTree(forceRefresh = false): Promise<GP51DeviceTreeResponse> {
    if (!this.token) {
      throw new Error('Must authenticate first');
    }

    if (!forceRefresh && this.cache.deviceTree && 
        Date.now() - this.cache.lastUpdate < 30000) {
      return this.cache.deviceTree;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?action=querydevicestree&token=${this.token}&extend=self&serverid=0`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }
      );

      const result: GP51DeviceTreeResponse = await response.json();
      
      if (result.status === 0) {
        this.cache.deviceTree = result;
        this.cache.lastUpdate = Date.now();
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to fetch device tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<GP51LastPositionResponse> {
    if (!this.token) {
      throw new Error('Must authenticate first');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?action=lastposition&token=${this.token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceids: deviceIds || [],
            lastquerypositiontime: this.lastPositionQueryTime
          })
        }
      );

      const result: GP51LastPositionResponse = await response.json();
      
      if (result.status === 0) {
        this.lastPositionQueryTime = result.lastquerypositiontime;
        this.cache.positions = result.records || [];
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to fetch positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLiveTrackingData(): Promise<Array<{
    deviceid: string;
    name: string;
    group: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    status: string;
    lastUpdate: Date;
  }> | null> {
    try {
      const fleetData = await this.getCompleteFleetData({ 
        includePositions: true,
        includeInactive: false
      });
      
      if (!fleetData.success) return null;

      return fleetData.data.groups.flatMap(g => 
        g.devices
          .filter(d => d.position && d.connectionStatus !== 'offline')
          .map(d => ({
            deviceid: d.deviceid,
            name: d.devicename,
            group: g.groupname,
            latitude: d.position!.latitude,
            longitude: d.position!.longitude,
            speed: d.position!.speed,
            heading: d.position!.heading,
            status: d.connectionStatus,
            lastUpdate: d.lastSeen
          }))
      );
    } catch (error) {
      console.error('Error fetching live tracking data:', error);
      return null;
    }
  }

  async getCompleteFleetData(options: {
    includePositions?: boolean;
    includeInactive?: boolean;
    groupFilter?: number[];
    forceRefresh?: boolean;
  } = {}): Promise<{
    success: boolean;
    data: {
      summary: {
        totalDevices: number;
        activeDevices: number;
        onlineDevices: number;
        movingDevices: number;
        parkedDevices: number;
        groups: number;
      };
      groups: Array<{
        groupid: number;
        groupname: string;
        remark?: string;
        deviceCount: number;
        activeCount: number;
        onlineCount: number;
        devices: Array<{
          deviceid: string;
          devicename: string;
          devicetype: number;
          status: 'active' | 'inactive' | 'expired' | 'overdue';
          connectionStatus: 'online' | 'offline' | 'moving' | 'parked';
          lastSeen: Date;
          position?: {
            latitude: number;
            longitude: number;
            speed: number;
            heading: number;
            altitude: number;
            accuracy: number;
            address?: string;
          };
          stats?: {
            totalDistance: number;
            fuelLevel?: number;
            temperature?: number[];
            voltage: number;
            signalStrength: number;
          };
          alerts?: string[];
        }>;
      }>;
      lastUpdate: Date;
    };
    error?: string;
  }> {
    try {
      const deviceTree = await this.getDeviceTree(options.forceRefresh);
      
      if (deviceTree.status !== 0) {
        return {
          success: false,
          data: this.getEmptyFleetData(),
          error: deviceTree.cause
        };
      }

      let positions: GP51Position[] = [];
      if (options.includePositions) {
        const positionResponse = await this.getLastPositions();
        if (positionResponse.status === 0) {
          positions = positionResponse.records || [];
        }
      }

      const positionMap = new Map(positions.map(p => [p.deviceid, p]));

      const processedGroups = deviceTree.groups
        .filter(group => !options.groupFilter || options.groupFilter.includes(group.groupid))
        .map(group => {
          const processedDevices = group.devices
            .filter(device => options.includeInactive || this.isDeviceActive(device))
            .map(device => {
              const position = positionMap.get(device.deviceid);
              return this.enrichDeviceData(device, position);
            });

          return {
            groupid: group.groupid,
            groupname: group.groupname,
            remark: group.remark,
            deviceCount: processedDevices.length,
            activeCount: processedDevices.filter(d => d.status === 'active').length,
            onlineCount: processedDevices.filter(d => d.connectionStatus !== 'offline').length,
            devices: processedDevices
          };
        });

      const allDevices = processedGroups.flatMap(g => g.devices);
      const summary = {
        totalDevices: allDevices.length,
        activeDevices: allDevices.filter(d => d.status === 'active').length,
        onlineDevices: allDevices.filter(d => d.connectionStatus !== 'offline').length,
        movingDevices: allDevices.filter(d => d.connectionStatus === 'moving').length,
        parkedDevices: allDevices.filter(d => d.connectionStatus === 'parked').length,
        groups: processedGroups.length
      };

      return {
        success: true,
        data: {
          summary,
          groups: processedGroups,
          lastUpdate: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        data: this.getEmptyFleetData(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private isDeviceActive(device: GP51Device): boolean {
    return device.isfree === 1 || device.isfree === 2;
  }

  private enrichDeviceData(device: GP51Device, position?: GP51Position) {
    let status: 'active' | 'inactive' | 'expired' | 'overdue';
    switch (device.isfree) {
      case 1: status = 'active'; break;
      case 2: status = 'active'; break;
      case 3: status = 'inactive'; break;
      case 4: status = 'overdue'; break;
      case 5: status = 'expired'; break;
      default: status = 'inactive';
    }

    let connectionStatus: 'online' | 'offline' | 'moving' | 'parked' = 'offline';
    if (position) {
      const lastUpdate = new Date(position.updatetime || 0);
      const minutesAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
      
      if (minutesAgo <= 10) {
        connectionStatus = position.moving === 1 ? 'moving' : 'parked';
      } else if (minutesAgo <= 60) {
        connectionStatus = 'online';
      }
    }

    const alerts: string[] = [];
    if (status === 'overdue') alerts.push('Service fee overdue');
    if (status === 'expired') alerts.push('Service expired');
    if (position?.alarm && position.alarm > 0) alerts.push('Active alarm');
    if (position?.currentoverspeedstate === 1) alerts.push('Overspeeding');

    return {
      deviceid: device.deviceid,
      devicename: device.devicename,
      devicetype: device.devicetype,
      status,
      connectionStatus,
      lastSeen: position ? new Date(position.updatetime || 0) : new Date(device.lastactivetime || 0),
      position: position ? {
        latitude: position.callat,
        longitude: position.callon,
        speed: position.speed,
        heading: position.course,
        altitude: position.altitude,
        accuracy: position.radius
      } : undefined,
      stats: position ? {
        totalDistance: position.totaldistance,
        temperature: [position.temp1, position.temp2, position.temp3, position.temp4].filter(t => t !== undefined),
        voltage: position.voltagev,
        signalStrength: position.rxlevel
      } : undefined,
      alerts: alerts.length > 0 ? alerts : undefined
    };
  }

  private getEmptyFleetData() {
    return {
      summary: {
        totalDevices: 0,
        activeDevices: 0,
        onlineDevices: 0,
        movingDevices: 0,
        parkedDevices: 0,
        groups: 0
      },
      groups: [],
      lastUpdate: new Date()
    };
  }

  protected clearCache() {
    this.cache = {
      deviceTree: null,
      positions: [],
      lastUpdate: 0
    };
    this.lastPositionQueryTime = 0;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch(`${this.baseUrl}?action=logout&token=${this.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.token = null;
        this.clearCache();
      }
    }
  }
}

// Create a singleton instance for import
export const gp51UnifiedDataService = new GP51UnifiedDataService();
