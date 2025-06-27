
import { GP51EnhancedDataService } from './GP51EnhancedDataService';

// =============================================================================
// COMPLETE API REPLACEMENT LAYER
// =============================================================================

export class GP51CompleteAPIController {
  private enhancedService = new GP51EnhancedDataService();

  // ==========================================================================
  // DASHBOARD ENDPOINTS
  // ==========================================================================

  async login(req: any, res: any) {
    try {
      const { username, password } = req.body;
      
      const authResult = await this.enhancedService.authenticate(username, password);
      
      if (authResult.status === 0) {
        // Start real-time updates for this session
        this.enhancedService.startRealTimeUpdates();
        
        // Get initial dashboard data
        const dashboardData = await this.enhancedService.getCompleteFleetData({ 
          includePositions: true 
        });
        
        res.json({
          success: true,
          token: authResult.token,
          dashboard: dashboardData.data
        });
      } else {
        res.status(401).json({
          success: false,
          error: authResult.cause
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  async getDashboard(req: any, res: any) {
    try {
      const fleetData = await this.enhancedService.getCompleteFleetData({ 
        includePositions: true 
      });
      
      res.json(fleetData);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  }

  // ==========================================================================
  // FLEET MANAGEMENT ENDPOINTS
  // ==========================================================================

  async getFleetOverview(req: any, res: any) {
    try {
      const { groupId, includeInactive } = req.query;
      
      const fleetData = await this.enhancedService.getCompleteFleetData({
        includePositions: true,
        includeInactive: includeInactive === 'true',
        groupFilter: groupId ? [parseInt(groupId)] : undefined
      });
      
      res.json({
        success: fleetData.success,
        fleet: fleetData.data,
        error: fleetData.error
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch fleet overview'
      });
    }
  }

  async getVehicleDetails(req: any, res: any) {
    try {
      const { deviceId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Get current vehicle status
      const fleetData = await this.enhancedService.getCompleteFleetData({ 
        includePositions: true 
      });
      
      const vehicle = fleetData.data?.groups
        .flatMap(g => g.devices)
        .find(d => d.deviceid === deviceId);
      
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      // Get historical data if date range provided
      let history = null;
      if (startDate && endDate) {
        const historyResult = await this.enhancedService.getVehicleHistory(
          deviceId,
          new Date(startDate),
          new Date(endDate)
        );
        history = historyResult.success ? historyResult.data : null;
      }

      res.json({
        success: true,
        vehicle,
        history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vehicle details'
      });
    }
  }

  // ==========================================================================
  // MOBILE/FLUTTER ENDPOINTS
  // ==========================================================================

  async getMobileFleet(req: any, res: any) {
    try {
      const { userId } = req.params;
      const { lite } = req.query; // Lite version for reduced data usage
      
      const fleetData = await this.enhancedService.getCompleteFleetData({ 
        includePositions: !lite 
      });
      
      if (!fleetData.success) {
        return res.status(500).json({
          success: false,
          error: fleetData.error
        });
      }

      // Optimize for mobile
      const mobileResponse = {
        user: userId,
        fleet: {
          summary: fleetData.data.summary,
          vehicles: fleetData.data.groups.flatMap(g => 
            g.devices.map(d => ({
              id: d.deviceid,
              name: d.devicename,
              group: g.groupname,
              status: d.connectionStatus,
              position: lite ? null : d.position,
              lastSeen: d.lastSeen.toISOString(),
              alerts: d.alerts?.length || 0
            }))
          ),
          groups: fleetData.data.groups.map(g => ({
            id: g.groupid,
            name: g.groupname,
            count: g.deviceCount,
            online: g.onlineCount
          }))
        },
        timestamp: fleetData.data.lastUpdate.toISOString()
      };
      
      res.json(mobileResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch mobile fleet data'
      });
    }
  }

  // ==========================================================================
  // LIVE TRACKING ENDPOINTS
  // ==========================================================================

  async getLiveTracking(req: any, res: any) {
    try {
      const { bounds, zoom } = req.query;
      
      const trackingData = await this.enhancedService.getLiveTrackingData();
      
      // Filter by map bounds if provided
      let filteredData = trackingData;
      if (bounds) {
        const [sw_lat, sw_lng, ne_lat, ne_lng] = bounds.split(',').map(Number);
        filteredData = trackingData?.filter(vehicle => 
          vehicle.latitude >= sw_lat && vehicle.latitude <= ne_lat &&
          vehicle.longitude >= sw_lng && vehicle.longitude <= ne_lng
        ) || [];
      }

      res.json({
        success: true,
        vehicles: filteredData,
        timestamp: new Date().toISOString(),
        count: filteredData?.length || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live tracking data'
      });
    }
  }

  // ==========================================================================
  // REPORTING ENDPOINTS
  // ==========================================================================

  async generateReport(req: any, res: any) {
    try {
      const { 
        startDate, 
        endDate, 
        reportType, 
        groupIds, 
        includeCharts 
      } = req.body;
      
      const report = await this.enhancedService.generateFleetReport({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reportType,
        groupIds,
        includeCharts
      });
      
      res.json(report);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate report'
      });
    }
  }

  // ==========================================================================
  // GEOFENCING ENDPOINTS
  // ==========================================================================

  async getGeofences(req: any, res: any) {
    try {
      const geofences = await this.enhancedService.getGeofences();
      res.json(geofences);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch geofences'
      });
    }
  }

  // ==========================================================================
  // WEBSOCKET/SSE FOR REAL-TIME UPDATES
  // ==========================================================================

  setupRealTimeEndpoints(app: any) {
    // Server-Sent Events for real-time updates
    app.get('/api/events/stream', (req: any, res: any) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Subscribe to position updates
      const subscriptionId = this.enhancedService.subscribe('position_update', (data) => {
        res.write(`data: ${JSON.stringify({ type: 'position_update', data })}\n\n`);
      });

      // Subscribe to alerts
      const alertSubscriptionId = this.enhancedService.subscribe('alerts', (data) => {
        res.write(`data: ${JSON.stringify({ type: 'alerts', data })}\n\n`);
      });

      // Cleanup on connection close
      req.on('close', () => {
        this.enhancedService.unsubscribe(subscriptionId);
        this.enhancedService.unsubscribe(alertSubscriptionId);
      });

      // Send initial connection confirmation
      res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);
    });
  }

  async logout(req: any, res: any) {
    try {
      this.enhancedService.stopRealTimeUpdates();
      await this.enhancedService.logout();
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }
}
