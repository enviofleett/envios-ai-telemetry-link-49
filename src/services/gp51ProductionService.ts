
import { supabase } from '@/integrations/supabase/client';
import { VehicleData } from '@/types/vehicle';
import { enhancedGP51SessionValidator } from '@/services/gp51/enhancedGP51ApiService';
import { gp51ErrorReporter } from './gp51/errorReporter';

export interface DeviceHandshakeResult {
  success: boolean;
  deviceStatus: 'online' | 'offline' | 'error';
  error?: string;
  capabilities?: string[];
  responseTime?: number;
  signalStrength?: number;
}

export interface DeviceConfigurationParams {
  deviceId: string;
  serverEndpoint: string;
  reportingInterval: number;
  securityKey: string;
  operationalMode: string;
}

export interface ProductionVehicleCreationRequest {
  gp51Username: string;
  userId?: string;
}

export interface ProductionVehicleCreationResult {
  success: boolean;
  vehicle?: VehicleData;
  error?: string;
}

export class GP51ProductionService {
  private static instance: GP51ProductionService;
  private isInitialized = false;

  static getInstance(): GP51ProductionService {
    if (!GP51ProductionService.instance) {
      GP51ProductionService.instance = new GP51ProductionService();
    }
    return GP51ProductionService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const sessionResult = await enhancedGP51SessionValidator.validateGP51Session();

    if (!sessionResult.valid || !sessionResult.token || !sessionResult.username || !sessionResult.apiUrl) {
      console.warn('GP51 session is not valid. Cannot initialize GP51ProductionService.');
      return;
    }

    try {
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing GP51ProductionService:', error);
      gp51ErrorReporter.reportError({
        type: 'api',
        message: 'Failed to initialize GP51ProductionService',
        details: error,
        severity: 'critical'
      });
    }
  }

  static async performRealDeviceHandshake(deviceId: string, username: string): Promise<DeviceHandshakeResult> {
    try {
      // Simulate device handshake - replace with actual GP51 API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        deviceStatus: 'online',
        capabilities: ['tracking', 'alerts'],
        responseTime: 800,
        signalStrength: 85
      };
    } catch (error) {
      return {
        success: false,
        deviceStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async verifyDeviceCommunication(deviceId: string, username: string): Promise<{
    isConnected: boolean;
    responseTime: number;
    signalStrength?: number;
    error?: string;
  }> {
    try {
      // Simulate device communication check - replace with actual GP51 API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        isConnected: true,
        responseTime: 650,
        signalStrength: 78
      };
    } catch (error) {
      return {
        isConnected: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Communication failed'
      };
    }
  }

  static async configureDevice(params: DeviceConfigurationParams, username: string): Promise<{
    success: boolean;
    configurationId?: string;
    error?: string;
  }> {
    try {
      // Simulate device configuration - replace with actual GP51 API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      return {
        success: true,
        configurationId: `config_${params.deviceId}_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration failed'
      };
    }
  }

  static async startDeviceHealthMonitoring(deviceId: string): Promise<void> {
    console.log(`Starting health monitoring for device: ${deviceId}`);
    // Implement actual monitoring logic here
  }

  static stopDeviceHealthMonitoring(deviceId: string): void {
    console.log(`Stopping health monitoring for device: ${deviceId}`);
    // Implement actual monitoring stop logic here
  }

  async createVehicle(request: ProductionVehicleCreationRequest): Promise<ProductionVehicleCreationResult> {
    await this.initialize();

    try {
      const { gp51Username, userId } = request;

      // Simulate vehicle creation - replace with actual implementation
      const enhancedVehicle = await this.createEnhancedVehicleRecord({
        deviceid: `device_${Date.now()}`,
        devicename: `Vehicle for ${gp51Username}`,
        lat: 0,
        lng: 0,
        speed: 0,
        course: 0,
        lastupdate: new Date().toISOString()
      }, gp51Username, userId);

      // Insert into database
      const { data, error: dbError } = await supabase
        .from('vehicles')
        .insert([
          {
            gp51_device_id: enhancedVehicle.device_id,
            name: enhancedVehicle.device_name,
            sim_number: enhancedVehicle.sim_number,
            user_id: enhancedVehicle.user_id,
            created_at: enhancedVehicle.created_at,
            updated_at: enhancedVehicle.updated_at,
            gp51_username: gp51Username,
            is_active: true,
          }
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Error inserting vehicle into database:', dbError);
        return { success: false, error: `Database insertion error: ${dbError.message}` };
      }

      return { success: true, vehicle: enhancedVehicle };
    } catch (error) {
      console.error('Error creating vehicle:', error);
      return { success: false, error: `Creation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private determineVehicleStatus(deviceData: any): VehicleData['status'] {
    if (!deviceData) return 'offline';

    const speed = Number(deviceData.speed) || 0;
    const isMoving = speed > 0;
    const isOnline = this.isDeviceOnline(deviceData);

    if (!isOnline) return 'offline';
    if (isMoving) return 'moving';

    return 'idle';
  }

  private isDeviceOnline(deviceData: any): boolean {
    if (!deviceData || !deviceData.lastupdate) return false;

    const lastUpdate = new Date(deviceData.lastupdate).getTime();
    const now = Date.now();
    const offlineDelay = deviceData.offline_delay || 300;
    const maxAcceptableDelay = offlineDelay * 1000 * 1.2;

    return (now - lastUpdate) <= maxAcceptableDelay;
  }

  private async createEnhancedVehicleRecord(
    deviceData: any,
    gp51Username: string,
    userId?: string
  ): Promise<VehicleData> {
    console.log('Creating enhanced vehicle record for device:', deviceData.deviceid);

    try {
      const enhancedVehicle: VehicleData = {
        id: `temp-${deviceData.deviceid}-${Date.now()}`,
        device_id: deviceData.deviceid?.toString() || '',
        device_name: deviceData.devicename || `Device ${deviceData.deviceid}`,
        user_id: userId || undefined,
        sim_number: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vin: undefined,
        license_plate: undefined,
        is_active: true,
        last_position: deviceData.lat && deviceData.lng ? {
          latitude: Number(deviceData.lat) || 0,
          longitude: Number(deviceData.lng) || 0,
          speed: Number(deviceData.speed) || 0,
          course: Number(deviceData.course) || 0,
          timestamp: deviceData.lastupdate || new Date().toISOString()
        } : undefined,
        status: this.determineVehicleStatus(deviceData),
        isOnline: this.isDeviceOnline(deviceData),
        isMoving: (Number(deviceData.speed) || 0) > 0,
        alerts: [],
        lastUpdate: new Date(deviceData.lastupdate || Date.now()),
        envio_users: userId ? { name: gp51Username, email: '' } : undefined,
        speed: Number(deviceData.speed) || 0,
        course: Number(deviceData.course) || 0,
        driver: undefined,
        fuel: Number(deviceData.oil) || 0,
        mileage: undefined,
        plateNumber: undefined,
        model: undefined,
        gp51_metadata: {
          devicetype: deviceData.devicetype,
          groupid: deviceData.groupid,
          username: gp51Username,
          devicestatus: deviceData.devicestatus,
          overduetime: deviceData.overduetime,
          timezone: deviceData.timezone,
          icontype: deviceData.icontype,
          offline_delay: deviceData.offline_delay,
          acc: deviceData.acc,
          temperature: deviceData.temperature,
          gsm: deviceData.gsm,
          gps: deviceData.gps
        },
        image_urls: undefined,
        fuel_tank_capacity_liters: undefined,
        manufacturer_fuel_consumption_100km_l: undefined,
        insurance_expiration_date: undefined,
        license_expiration_date: undefined,
        location: deviceData.lat && deviceData.lng ? {
          latitude: Number(deviceData.lat) || 0,
          longitude: Number(deviceData.lng) || 0,
          address: undefined
        } : undefined
      };

      return enhancedVehicle;
    } catch (error) {
      console.error('Error creating enhanced vehicle record:', error);
      throw error;
    }
  }
}

export class ProductionVehicleService {
  private gp51Service: GP51ProductionService | null = null;
  private apiUrl: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const sessionResult = await enhancedGP51SessionValidator.validateGP51Session();

    if (!sessionResult.valid || !sessionResult.token || !sessionResult.username || !sessionResult.apiUrl) {
      console.warn('GP51 session is not valid. Cannot initialize ProductionVehicleService.');
      return;
    }

    try {
      this.gp51Service = GP51ProductionService.getInstance();
      this.apiUrl = sessionResult.apiUrl;
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing ProductionVehicleService:', error);
      gp51ErrorReporter.reportError({
        type: 'api',
        message: 'Failed to initialize ProductionVehicleService',
        details: error,
        severity: 'critical'
      });
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
      if (!this.isInitialized) {
        throw new Error('ProductionVehicleService not properly initialized.');
      }
    }
  }

  async createVehicle(request: ProductionVehicleCreationRequest): Promise<ProductionVehicleCreationResult> {
    await this.ensureInitialized();

    if (!this.gp51Service) {
      return { success: false, error: 'GP51 Service not initialized' };
    }

    try {
      const { gp51Username, userId } = request;

      // Fetch vehicles from GP51
      const { success, vehicles, error } = await this.gp51Service.fetchVehicles();

      if (!success || !vehicles) {
        return { success: false, error: error || 'Failed to fetch vehicles from GP51' };
      }

      // Find the device by username
      const deviceData = vehicles.find(v => v.username === gp51Username);

      if (!deviceData) {
        return { success: false, error: `Device with username ${gp51Username} not found in GP51` };
      }

      // Create enhanced vehicle record
      const enhancedVehicle = await this.createEnhancedVehicleRecord(deviceData, gp51Username, userId);

      // Insert into database
      const { data, error: dbError } = await supabase
        .from('vehicles')
        .insert([
          {
            gp51_device_id: enhancedVehicle.device_id,
            name: enhancedVehicle.device_name,
            sim_number: enhancedVehicle.sim_number,
            user_id: enhancedVehicle.user_id,
            created_at: enhancedVehicle.created_at,
            updated_at: enhancedVehicle.updated_at,
            gp51_username: gp51Username,
            is_active: true,
          }
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Error inserting vehicle into database:', dbError);
        return { success: false, error: `Database insertion error: ${dbError.message}` };
      }

      if (!data) {
        return { success: false, error: 'No data returned from database insertion' };
      }

      return { success: true, vehicle: enhancedVehicle };
    } catch (error) {
      console.error('Error creating vehicle:', error);
      return { success: false, error: `Creation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private determineVehicleStatus(deviceData: any): VehicleData['status'] {
    if (!deviceData) return 'offline';

    const speed = Number(deviceData.speed) || 0;
    const isMoving = speed > 0;
    const isOnline = this.isDeviceOnline(deviceData);

    if (!isOnline) return 'offline';
    if (isMoving) return 'moving';

    return 'idle';
  }

  private isDeviceOnline(deviceData: any): boolean {
    if (!deviceData || !deviceData.lastupdate) return false;

    const lastUpdate = new Date(deviceData.lastupdate).getTime();
    const now = Date.now();
    const offlineDelay = deviceData.offline_delay || 300; // Default to 5 minutes
    const maxAcceptableDelay = offlineDelay * 1000 * 1.2; // Add 20% buffer

    return (now - lastUpdate) <= maxAcceptableDelay;
  }

  private async createEnhancedVehicleRecord(
    deviceData: any,
    gp51Username: string,
    userId?: string
  ): Promise<VehicleData> {
    console.log('Creating enhanced vehicle record for device:', deviceData.deviceid);

    try {
      // Create the enhanced vehicle data with explicit property assignment
      // This avoids deep type instantiation by being explicit about each property
      const enhancedVehicle: VehicleData = {
        id: `temp-${deviceData.deviceid}-${Date.now()}`,
        device_id: deviceData.deviceid?.toString() || '',
        device_name: deviceData.devicename || `Device ${deviceData.deviceid}`,
        user_id: userId || undefined,
        sim_number: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vin: undefined,
        license_plate: undefined,
        is_active: true,
        // Explicitly construct last_position to avoid deep type issues
        last_position: deviceData.lat && deviceData.lng ? {
          latitude: Number(deviceData.lat) || 0,
          longitude: Number(deviceData.lng) || 0,
          speed: Number(deviceData.speed) || 0,
          course: Number(deviceData.course) || 0,
          timestamp: deviceData.lastupdate || new Date().toISOString()
        } : undefined,
        status: this.determineVehicleStatus(deviceData),
        isOnline: this.isDeviceOnline(deviceData),
        isMoving: (Number(deviceData.speed) || 0) > 0,
        alerts: [],
        lastUpdate: new Date(deviceData.lastupdate || Date.now()),
        envio_users: userId ? { name: gp51Username, email: '' } : undefined,
        // Additional properties with safe defaults
        speed: Number(deviceData.speed) || 0,
        course: Number(deviceData.course) || 0,
        driver: undefined,
        fuel: Number(deviceData.oil) || 0,
        mileage: undefined,
        plateNumber: undefined,
        model: undefined,
        gp51_metadata: {
          devicetype: deviceData.devicetype,
          groupid: deviceData.groupid,
          username: gp51Username,
          devicestatus: deviceData.devicestatus,
          overduetime: deviceData.overduetime,
          timezone: deviceData.timezone,
          icontype: deviceData.icontype,
          offline_delay: deviceData.offline_delay,
          acc: deviceData.acc,
          temperature: deviceData.temperature,
          gsm: deviceData.gsm,
          gps: deviceData.gps
        },
        image_urls: undefined,
        fuel_tank_capacity_liters: undefined,
        manufacturer_fuel_consumption_100km_l: undefined,
        insurance_expiration_date: undefined,
        license_expiration_date: undefined,
        location: deviceData.lat && deviceData.lng ? {
          latitude: Number(deviceData.lat) || 0,
          longitude: Number(deviceData.lng) || 0,
          address: undefined
        } : undefined
      };

      return enhancedVehicle;
    } catch (error) {
      console.error('Error creating enhanced vehicle record:', error);
      throw error;
    }
  }
}
