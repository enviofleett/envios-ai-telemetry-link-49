
import { GP51UnifiedDataService } from './GP51UnifiedDataService';

// Enhanced Service with Advanced Features
export class GP51EnhancedDataService extends GP51UnifiedDataService {
  private websocket: WebSocket | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private subscribers: Map<string, (data: any) => void> = new Map();

  // ==========================================================================
  // REAL-TIME UPDATES WITH WEBSOCKET SIMULATION
  // ==========================================================================
  
  startRealTimeUpdates(interval = 30000) {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      try {
        // Fetch latest positions
        const positions = await this.getLastPositions();
        
        if (positions.status === 0) {
          // Notify all subscribers of position updates
          this.notifySubscribers('position_update', positions.records);
          
          // Check for alerts and status changes
          await this.checkForAlerts(positions.records);
        }
      } catch (error) {
        console.error('Real-time update failed:', error);
      }
    }, interval);
  }

  stopRealTimeUpdates() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Subscribe to real-time updates
  subscribe(eventType: string, callback: (data: any) => void): string {
    const id = `${eventType}_${Date.now()}_${Math.random()}`;
    this.subscribers.set(id, callback);
    return id;
  }

  unsubscribe(subscriptionId: string) {
    this.subscribers.delete(subscriptionId);
  }

  private notifySubscribers(eventType: string, data: any) {
    this.subscribers.forEach((callback, id) => {
      if (id.startsWith(eventType)) {
        callback(data);
      }
    });
  }

  // ==========================================================================
  // ALERT SYSTEM
  // ==========================================================================
  
  private async checkForAlerts(positions: any[]) {
    const alerts: Array<{
      deviceid: string;
      devicename: string;
      alertType: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      timestamp: Date;
    }> = [];

    // Get device names for alerts
    const deviceTree = await this.getDeviceTree();
    const deviceNameMap = new Map();
    
    if (deviceTree.status === 0) {
      deviceTree.groups.forEach(group => {
        group.devices.forEach(device => {
          deviceNameMap.set(device.deviceid, device.devicename);
        });
      });
    }

    positions.forEach(position => {
      const deviceName = deviceNameMap.get(position.deviceid) || position.deviceid;

      // Speed alerts
      if (position.currentoverspeedstate === 1) {
        alerts.push({
          deviceid: position.deviceid,
          devicename: deviceName,
          alertType: 'overspeeding',
          message: `Vehicle exceeding speed limit at ${position.speed} km/h`,
          severity: 'high',
          timestamp: new Date(position.updatetime)
        });
      }

      // Alarm alerts
      if (position.alarm > 0) {
        alerts.push({
          deviceid: position.deviceid,
          devicename: deviceName,
          alertType: 'alarm',
          message: position.stralarmsen || position.stralarm || 'Active alarm',
          severity: 'critical',
          timestamp: new Date(position.updatetime)
        });
      }

      // Low battery alerts
      if (position.voltagepercent < 20 && position.voltagepercent > 0) {
        alerts.push({
          deviceid: position.deviceid,
          devicename: deviceName,
          alertType: 'low_battery',
          message: `Low battery: ${position.voltagepercent}%`,
          severity: 'medium',
          timestamp: new Date(position.updatetime)
        });
      }

      // Temperature alerts
      [position.temp1, position.temp2, position.temp3, position.temp4].forEach((temp: number, index: number) => {
        if (temp && (temp > 800 || temp < -200)) { // Assuming 1/10°C format
          alerts.push({
            deviceid: position.deviceid,
            devicename: deviceName,
            alertType: 'temperature',
            message: `Temperature sensor ${index + 1}: ${temp/10}°C`,
            severity: 'medium',
            timestamp: new Date(position.updatetime)
          });
        }
      });

      // Offline alerts (no update for > 24 hours)
      const hoursOffline = (Date.now() - position.updatetime) / (1000 * 60 * 60);
      if (hoursOffline > 24) {
        alerts.push({
          deviceid: position.deviceid,
          devicename: deviceName,
          alertType: 'offline',
          message: `Vehicle offline for ${Math.round(hoursOffline)} hours`,
          severity: 'low',
          timestamp: new Date(position.updatetime)
        });
      }
    });

    if (alerts.length > 0) {
      this.notifySubscribers('alerts', alerts);
    }
  }

  // ==========================================================================
  // HISTORICAL DATA INTEGRATION
  // ==========================================================================
  
  async getVehicleHistory(deviceId: string, startTime: Date, endTime: Date): Promise<{
    success: boolean;
    data: Array<{
      timestamp: Date;
      latitude: number;
      longitude: number;
      speed: number;
      heading: number;
      status: string;
      mileage: number;
    }>;
    error?: string;
  }> {
    if (!this.token) {
      throw new Error('Must authenticate first');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?action=querytracks&token=${this.token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceid: deviceId,
            begintime: startTime.toISOString().replace('T', ' ').slice(0, 19),
            endtime: endTime.toISOString().replace('T', ' ').slice(0, 19),
            timezone: 8 // GMT+8 as default
          })
        }
      );

      const result = await response.json();
      
      if (result.status !== 0) {
        return {
          success: false,
          data: [],
          error: result.cause
        };
      }

      const historyData = (result.records || []).map((record: any) => ({
        timestamp: new Date(record.updatetime),
        latitude: record.callat,
        longitude: record.callon,
        speed: record.speed,
        heading: record.course,
        status: record.strstatusen || record.strstatus,
        mileage: record.totaldistance
      }));

      return {
        success: true,
        data: historyData
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch history'
      };
    }
  }

  // ==========================================================================
  // ADVANCED REPORTING
  // ==========================================================================
  
  async generateFleetReport(options: {
    startDate: Date;
    endDate: Date;
    groupIds?: number[];
    reportType: 'summary' | 'detailed' | 'mileage' | 'alerts';
    includeCharts?: boolean;
  }): Promise<{
    success: boolean;
    report: {
      metadata: {
        generatedAt: Date;
        reportType: string;
        period: { start: Date; end: Date };
        vehicleCount: number;
      };
      summary: {
        totalDistance: number;
        totalAlerts: number;
        averageSpeed: number;
        onlineTime: number;
        fuelConsumption?: number;
      };
      vehicleDetails?: Array<{
        deviceid: string;
        devicename: string;
        distance: number;
        averageSpeed: number;
        alerts: number;
        onlineTime: number;
      }>;
      alerts?: Array<{
        timestamp: Date;
        vehicle: string;
        type: string;
        message: string;
        severity: string;
      }>;
      chartData?: {
        dailyDistance: Array<{ date: string; distance: number }>;
        speedDistribution: Array<{ range: string; count: number }>;
        alertsByType: Array<{ type: string; count: number }>;
      };
    };
    error?: string;
  }> {
    try {
      // Get current fleet data
      const fleetData = await this.getCompleteFleetData({
        includePositions: true,
        groupFilter: options.groupIds
      });

      if (!fleetData.success) {
        return {
          success: false,
          report: this.getEmptyReport(options),
          error: fleetData.error
        };
      }

      const vehicles = fleetData.data.groups.flatMap(g => g.devices);
      const reportData = {
        metadata: {
          generatedAt: new Date(),
          reportType: options.reportType,
          period: { start: options.startDate, end: options.endDate },
          vehicleCount: vehicles.length
        },
        summary: {
          totalDistance: vehicles.reduce((sum, v) => sum + (v.stats?.totalDistance || 0), 0),
          totalAlerts: vehicles.reduce((sum, v) => sum + (v.alerts?.length || 0), 0),
          averageSpeed: vehicles.length > 0 ? 
            vehicles.reduce((sum, v) => sum + (v.position?.speed || 0), 0) / vehicles.length : 0,
          onlineTime: vehicles.filter(v => v.connectionStatus !== 'offline').length / vehicles.length * 100
        }
      };

      // Add detailed data based on report type
      if (options.reportType === 'detailed' || options.reportType === 'mileage') {
        (reportData as any).vehicleDetails = vehicles.map(vehicle => ({
          deviceid: vehicle.deviceid,
          devicename: vehicle.devicename,
          distance: vehicle.stats?.totalDistance || 0,
          averageSpeed: vehicle.position?.speed || 0,
          alerts: vehicle.alerts?.length || 0,
          onlineTime: vehicle.connectionStatus !== 'offline' ? 100 : 0
        }));
      }

      if (options.reportType === 'alerts') {
        (reportData as any).alerts = vehicles
          .filter(v => v.alerts && v.alerts.length > 0)
          .flatMap(v => v.alerts!.map(alert => ({
            timestamp: v.lastSeen,
            vehicle: v.devicename,
            type: alert,
            message: alert,
            severity: 'medium'
          })));
      }

      // Generate chart data if requested
      if (options.includeCharts) {
        (reportData as any).chartData = {
          dailyDistance: this.generateDailyDistanceChart(vehicles, options.startDate, options.endDate),
          speedDistribution: this.generateSpeedDistributionChart(vehicles),
          alertsByType: this.generateAlertsByTypeChart(vehicles)
        };
      }

      return {
        success: true,
        report: reportData as any
      };
    } catch (error) {
      return {
        success: false,
        report: this.getEmptyReport(options),
        error: error instanceof Error ? error.message : 'Report generation failed'
      };
    }
  }

  // ==========================================================================
  // GEOFENCING INTEGRATION
  // ==========================================================================
  
  async getGeofences(): Promise<{
    success: boolean;
    fences: Array<{
      id: number;
      name: string;
      type: 'circle' | 'polygon' | 'area' | 'route';
      coordinates: any;
      alerts: boolean;
      devices: string[];
    }>;
    error?: string;
  }> {
    if (!this.token) {
      throw new Error('Must authenticate first');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?action=querygeosystemrecords&token=${this.token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }
      );

      const result = await response.json();
      
      if (result.status !== 0) {
        return {
          success: false,
          fences: [],
          error: result.cause
        };
      }

      const fences = (result.categorys || []).flatMap((category: any) => 
        (category.records || []).map((fence: any) => ({
          id: fence.geosystemrecordid,
          name: fence.name,
          type: this.mapFenceType(fence.type),
          coordinates: this.extractCoordinates(fence),
          alerts: fence.triggerevent > 0,
          devices: [] // Would need additional API call to get associated devices
        }))
      );

      return {
        success: true,
        fences
      };
    } catch (error) {
      return {
        success: false,
        fences: [],
        error: error instanceof Error ? error.message : 'Failed to fetch geofences'
      };
    }
  }

  // ==========================================================================
  // UTILITY METHODS FOR ADVANCED FEATURES
  // ==========================================================================

  private mapFenceType(type: number): 'circle' | 'polygon' | 'area' | 'route' {
    switch (type) {
      case 1: return 'circle';
      case 2: return 'polygon';
      case 3: return 'area';
      case 5: return 'route';
      default: return 'circle';
    }
  }

  private extractCoordinates(fence: any) {
    if (fence.type === 1) {
      // Circle
      return {
        center: { lat: fence.lat1, lng: fence.lon1 },
        radius: fence.radius1
      };
    } else if (fence.type === 2) {
      // Polygon
      return {
        points: fence.points2 || []
      };
    }
    return {};
  }

  private generateDailyDistanceChart(vehicles: any[], startDate: Date, endDate: Date) {
    // Mock implementation - would need historical data
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push({
        date: current.toISOString().split('T')[0],
        distance: Math.random() * 1000 + 500 // Mock data
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }

  private generateSpeedDistributionChart(vehicles: any[]) {
    const ranges = [
      { range: '0-30', count: 0 },
      { range: '31-60', count: 0 },
      { range: '61-90', count: 0 },
      { range: '91+', count: 0 }
    ];

    vehicles.forEach(vehicle => {
      const speed = vehicle.position?.speed || 0;
      if (speed <= 30) ranges[0].count++;
      else if (speed <= 60) ranges[1].count++;
      else if (speed <= 90) ranges[2].count++;
      else ranges[3].count++;
    });

    return ranges;
  }

  private generateAlertsByTypeChart(vehicles: any[]) {
    const alertCounts: { [key: string]: number } = {};
    
    vehicles.forEach(vehicle => {
      if (vehicle.alerts) {
        vehicle.alerts.forEach((alert: string) => {
          alertCounts[alert] = (alertCounts[alert] || 0) + 1;
        });
      }
    });

    return Object.entries(alertCounts).map(([type, count]) => ({ type, count }));
  }

  private getEmptyReport(options: any) {
    return {
      metadata: {
        generatedAt: new Date(),
        reportType: options.reportType,
        period: { start: options.startDate, end: options.endDate },
        vehicleCount: 0
      },
      summary: {
        totalDistance: 0,
        totalAlerts: 0,
        averageSpeed: 0,
        onlineTime: 0
      }
    };
  }
}
