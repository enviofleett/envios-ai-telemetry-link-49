
import { md5 } from 'js-md5';

// =============================================================================
// CORE DATA TYPES (Based on GP51 API Documentation)
// =============================================================================

interface GP51AuthResult {
  status: number;
  cause: string;
  token?: string;
}

interface GP51DeviceTreeResponse {
  status: number;
  cause: string;
  groups: GP51Group[];
}

interface GP51Group {
  groupid: number;
  groupname: string;
  remark?: string;
  devices: GP51Device[];
}

interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum?: string;
  overduetime?: number;
  expirenotifytime?: number;
  remark?: string;
  creater: string;
  videochannelcount?: number;
  lastactivetime?: number;
  isfree: number; // 1: normal, 2: experiencing, 3: disabled, 4: service fee overdue, 5: time expired
  allowedit: number;
  icon: number;
  stared: number;
  loginame?: string;
}

interface GP51LastPositionResponse {
  status: number;
  cause: string;
  lastquerypositiontime: number;
  records: GP51Position[];
}

interface GP51Position {
  deviceid: string;
  devicetime: number;
  arrivedtime: number;
  updatetime: number;
  validpoistiontime: number;
  callat: number; // latitude
  callon: number; // longitude
  altitude: number;
  radius: number;
  speed: number;
  course: number;
  totaldistance: number;
  status: number;
  strstatus: string;
  strstatusen: string;
  alarm: number;
  stralarm: string;
  stralarmsen: string;
  gotsrc: string; // "gps", "wifi", "LBS"
  rxlevel: number;
  gpsvalidnum: number;
  exvoltage: number;
  voltagev: number;
  voltagepercent: number;
  moving: number; // 0: static, 1: moving
  parklat: number;
  parklon: number;
  parktime: number;
  parkduration: number;
  temp1: number;
  temp2: number;
  temp3: number;
  temp4: number;
  iostatus: number;
  currentoverspeedstate: number;
  rotatestatus: number;
  loadstatus: number;
  weight: number;
  reportmode: number;
}

// =============================================================================
// UNIFIED DATA SERVICE - Single Source of Truth
// =============================================================================

export class GP51UnifiedDataService {
  private baseUrl = 'https://www.gps51.com/webapi';
  private token: string | null = null;
  private lastPositionQueryTime = 0;
  private cache: {
    deviceTree: GP51DeviceTreeResponse | null;
    positions: GP51Position[];
    lastUpdate: number;
  } = {
    deviceTree: null,
    positions: [],
    lastUpdate: 0
  };

  // ==========================================================================
  // AUTHENTICATION - Foundation for all operations
  // ==========================================================================
  
  async authenticate(username: string, password: string): Promise<GP51AuthResult> {
    try {
      // Password must be MD5 hashed (32 digits lowercase) per API docs
      const hashedPassword = md5(password);
      
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
        // Reset cache on new authentication
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

  // ==========================================================================
  // PRIMARY DATA SOURCE - querydevicestree as Source of Truth
  // ==========================================================================
  
  async getDeviceTree(forceRefresh = false): Promise<GP51DeviceTreeResponse> {
    if (!this.token) {
      throw new Error('Must authenticate first');
    }

    // Use cache if available and recent (unless force refresh)
    if (!forceRefresh && this.cache.deviceTree && 
        Date.now() - this.cache.lastUpdate < 30000) { // 30 second cache
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
        // Cache successful response
        this.cache.deviceTree = result;
        this.cache.lastUpdate = Date.now();
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to fetch device tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==========================================================================
  // ENHANCED DATA WITH POSITIONS - Combine tree with real-time data
  // ==========================================================================
  
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
            deviceids: deviceIds || [], // Empty array means all devices for this user
            lastquerypositiontime: this.lastPositionQueryTime
          })
        }
      );

      const result: GP51LastPositionResponse = await response.json();
      
      if (result.status === 0) {
        // Update query time for next request
        this.lastPositionQueryTime = result.lastquerypositiontime;
        // Cache positions
        this.cache.positions = result.records || [];
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to fetch positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==========================================================================
  // UNIFIED DATA RETRIEVAL - Combined tree + positions
  // ==========================================================================
  
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
      // Get device tree structure
      const deviceTree = await this.getDeviceTree(options.forceRefresh);
      
      if (deviceTree.status !== 0) {
        return {
          success: false,
          data: this.getEmptyFleetData(),
          error: deviceTree.cause
        };
      }

      // Get positions if requested
      let positions: GP51Position[] = [];
      if (options.includePositions) {
        const positionResponse = await this.getLastPositions();
        if (positionResponse.status === 0) {
          positions = positionResponse.records || [];
        }
      }

      // Create position lookup map
      const positionMap = new Map(positions.map(p => [p.deviceid, p]));

      // Process groups and devices
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

      // Calculate summary
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

  // ==========================================================================
  // SPECIFIC USE CASE METHODS - Built on top of unified data
  // ==========================================================================

  // For Dashboard Summary Cards
  async getDashboardSummary() {
    const fleetData = await this.getCompleteFleetData({ includePositions: true });
    return fleetData.success ? fleetData.data.summary : null;
  }

  // For Fleet Management Page
  async getFleetManagementData(groupId?: number) {
    const fleetData = await this.getCompleteFleetData({ 
      includePositions: true,
      groupFilter: groupId ? [groupId] : undefined
    });
    return fleetData.success ? fleetData.data : null;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  private isDeviceActive(device: GP51Device): boolean {
    // Based on isfree field: 1: normal, 2: experiencing, 3: disabled, 4: service fee overdue, 5: time expired
    return device.isfree === 1 || device.isfree === 2;
  }

  private enrichDeviceData(device: GP51Device, position?: GP51Position) {
    // Determine device status based on isfree field
    let status: 'active' | 'inactive' | 'expired' | 'overdue';
    switch (device.isfree) {
      case 1: status = 'active'; break;
      case 2: status = 'active'; break; // experiencing but still active
      case 3: status = 'inactive'; break;
      case 4: status = 'overdue'; break;
      case 5: status = 'expired'; break;
      default: status = 'inactive';
    }

    // Determine connection status
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

    // Build alerts array
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

  private clearCache() {
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

// Create and export singleton instance
export const gp51UnifiedDataService = new GP51UnifiedDataService();
