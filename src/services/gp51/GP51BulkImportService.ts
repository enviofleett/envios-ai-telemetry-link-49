
import crypto from 'crypto';
import { supabase } from '@/integrations/supabase/client';

// Types based on API documentation
interface GP51LoginResponse {
  status: number;
  cause: string;
  token?: string;
}

interface GP51User {
  username: string;
  password: string;
  usertype: number; // 3: Sub Admin, 4: Company Admin, 11: End User, 99: Device
  multilogin: number; // 1: Allow, 0: Not Allow
  creater: string;
  showname?: string;
  companyname?: string;
  email?: string;
  phone?: string;
}

interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  creater: string;
  groupid?: number;
  calmileageway?: number; // 0: Auto, 1: Device Collect, 2: Platform Collect
  deviceenable?: number; // 1: Enable, 0: Disable
  loginenable?: number; // 1: Yes, 0: No
  timezone?: number; // Default GMT+8
}

interface GP51ImportData {
  users: GP51User[];
  devices: GP51Device[];
}

interface GP51ImportResult {
  success: boolean;
  message: string;
  results: {
    users: {
      total: number;
      successful: number;
      failed: number;
      errors: string[];
    };
    devices: {
      total: number;
      successful: number;
      failed: number;
      errors: string[];
    };
  };
}

export class GP51BulkImportService {
  private baseUrl: string;
  private token: string | null = null;
  private isAuthenticated = false;

  constructor(baseUrl: string = 'https://www.gps51.com/webapi') {
    this.baseUrl = baseUrl;
  }

  // Step 1: Authentication (Required before any import)
  async authenticate(username: string, password: string): Promise<boolean> {
    try {
      // Password must be MD5 encrypted according to API docs
      const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
      
      const loginData = {
        username,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      };

      const response = await fetch(`${this.baseUrl}?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });

      const result: GP51LoginResponse = await response.json();
      
      if (result.status === 0 && result.token) {
        this.token = result.token;
        this.isAuthenticated = true;
        return true;
      } else {
        console.error('GP51 Authentication failed:', result.cause);
        return false;
      }
    } catch (error) {
      console.error('GP51 Authentication error:', error);
      return false;
    }
  }

  // Step 2: Query existing devices to avoid duplicates
  async getExistingDevices(): Promise<string[]> {
    if (!this.isAuthenticated || !this.token) {
      throw new Error('Must authenticate first');
    }

    try {
      const response = await fetch(`${this.baseUrl}?action=querymonitorlist&token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Empty body as per API docs
      });

      const result = await response.json();
      
      if (result.status === 0 && result.groups) {
        const deviceIds: string[] = [];
        result.groups.forEach((group: any) => {
          if (group.devices) {
            group.devices.forEach((device: any) => {
              if (device.deviceid) {
                deviceIds.push(device.deviceid);
              }
            });
          }
        });
        return deviceIds;
      }
      return [];
    } catch (error) {
      console.error('Error fetching existing devices:', error);
      return [];
    }
  }

  // Step 3: Import users and sync to Supabase
  async importUsers(users: GP51User[]): Promise<{ successful: number; failed: number; errors: string[] }> {
    if (!this.isAuthenticated || !this.token) {
      throw new Error('Must authenticate first');
    }

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        // Hash password for GP51
        const hashedPassword = crypto.createHash('md5').update(user.password).digest('hex');
        
        const userData = {
          ...user,
          password: hashedPassword
        };

        const response = await fetch(`${this.baseUrl}?action=adduser&token=${this.token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        });

        const result = await response.json();
        
        if (result.status === 0) {
          successful++;
          
          // Sync to Supabase envio_users table
          await this.syncUserToSupabase(user);
        } else {
          failed++;
          errors.push(`User ${user.username}: ${result.cause || 'Unknown error'}`);
        }
      } catch (error) {
        failed++;
        errors.push(`User ${user.username}: ${error instanceof Error ? error.message : 'Network error'}`);
      }

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { successful, failed, errors };
  }

  // Step 4: Import devices and sync to Supabase
  async importDevices(devices: GP51Device[]): Promise<{ successful: number; failed: number; errors: string[] }> {
    if (!this.isAuthenticated || !this.token) {
      throw new Error('Must authenticate first');
    }

    // Get existing devices to avoid duplicates
    const existingDeviceIds = await this.getExistingDevices();
    
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const device of devices) {
      try {
        // Check if device already exists
        if (existingDeviceIds.includes(device.deviceid)) {
          failed++;
          errors.push(`Device ${device.deviceid}: Already exists`);
          continue;
        }

        const response = await fetch(`${this.baseUrl}?action=adddevice&token=${this.token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(device)
        });

        const result = await response.json();
        
        if (result.status === 0) {
          successful++;
          
          // Sync to Supabase vehicles table
          await this.syncDeviceToSupabase(device);
        } else if (result.status === 1) {
          failed++;
          errors.push(`Device ${device.deviceid}: Device already exists`);
        } else {
          failed++;
          errors.push(`Device ${device.deviceid}: ${result.cause || 'Unknown error'}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Device ${device.deviceid}: ${error instanceof Error ? error.message : 'Network error'}`);
      }

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { successful, failed, errors };
  }

  // Sync user to Supabase
  private async syncUserToSupabase(user: GP51User): Promise<void> {
    try {
      const { error } = await supabase
        .from('envio_users')
        .upsert({
          name: user.showname || user.username,
          email: user.email || `${user.username}@imported.gp51`,
          phone_number: user.phone,
          gp51_username: user.username,
          gp51_user_type: user.usertype,
          registration_status: 'active',
          registration_type: 'gp51_import',
          is_gp51_imported: true,
          import_source: 'bulk_import',
          needs_password_set: true
        }, {
          onConflict: 'gp51_username'
        });

      if (error) {
        console.error('Error syncing user to Supabase:', error);
      }
    } catch (error) {
      console.error('Error syncing user to Supabase:', error);
    }
  }

  // Sync device to Supabase
  private async syncDeviceToSupabase(device: GP51Device): Promise<void> {
    try {
      // First, find the user to assign this vehicle to
      const { data: userData } = await supabase
        .from('envio_users')
        .select('id')
        .eq('gp51_username', device.creater)
        .single();

      const { error } = await supabase
        .from('vehicles')
        .upsert({
          gp51_device_id: device.deviceid,
          name: device.devicename,
          user_id: userData?.id || null,
          device_type: device.devicetype.toString(),
          status: device.deviceenable === 1 ? 'active' : 'inactive',
          is_gp51_synced: true,
          last_gp51_sync: new Date().toISOString()
        }, {
          onConflict: 'gp51_device_id'
        });

      if (error) {
        console.error('Error syncing device to Supabase:', error);
      }
    } catch (error) {
      console.error('Error syncing device to Supabase:', error);
    }
  }

  // Main bulk import function
  async performBulkImport(importData: GP51ImportData): Promise<GP51ImportResult> {
    try {
      // Validate that we have authentication
      if (!this.isAuthenticated || !this.token) {
        throw new Error('Must authenticate before importing');
      }

      console.log('Starting GP51 bulk import...');
      
      // Import users first
      console.log(`Importing ${importData.users.length} users...`);
      const userResults = await this.importUsers(importData.users);
      
      // Then import devices
      console.log(`Importing ${importData.devices.length} devices...`);
      const deviceResults = await this.importDevices(importData.devices);

      const result: GP51ImportResult = {
        success: true,
        message: `Import completed. Users: ${userResults.successful}/${importData.users.length} successful. Devices: ${deviceResults.successful}/${importData.devices.length} successful.`,
        results: {
          users: {
            total: importData.users.length,
            successful: userResults.successful,
            failed: userResults.failed,
            errors: userResults.errors
          },
          devices: {
            total: importData.devices.length,
            successful: deviceResults.successful,
            failed: deviceResults.failed,
            errors: deviceResults.errors
          }
        }
      };

      return result;
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: {
          users: { total: 0, successful: 0, failed: 0, errors: [] },
          devices: { total: 0, successful: 0, failed: 0, errors: [] }
        }
      };
    }
  }

  // Parse CSV data to GP51 format
  static parseImportData(csvData: any[]): GP51ImportData {
    const users: GP51User[] = [];
    const devices: GP51Device[] = [];

    csvData.forEach((row) => {
      // If row has user data
      if (row.username && row.password) {
        users.push({
          username: row.username,
          password: row.password,
          usertype: parseInt(row.usertype) || 11, // Default to End User
          multilogin: parseInt(row.multilogin) || 0, // Default to not allow
          creater: row.creater || 'admin',
          showname: row.showname,
          companyname: row.companyname,
          email: row.email,
          phone: row.phone
        });
      }

      // If row has device data
      if (row.deviceid && row.devicename) {
        devices.push({
          deviceid: row.deviceid,
          devicename: row.devicename,
          devicetype: parseInt(row.devicetype) || 92, // Default to VG Series
          creater: row.creater || 'admin',
          groupid: row.groupid ? parseInt(row.groupid) : undefined,
          calmileageway: row.calmileageway ? parseInt(row.calmileageway) : 0,
          deviceenable: row.deviceenable ? parseInt(row.deviceenable) : 1,
          loginenable: row.loginenable ? parseInt(row.loginenable) : 0,
          timezone: row.timezone ? parseInt(row.timezone) : 8 // GMT+8
        });
      }
    });

    return { users, devices };
  }

  // Logout when done
  async logout(): Promise<void> {
    if (this.isAuthenticated && this.token) {
      try {
        await fetch(`${this.baseUrl}?action=logout&token=${this.token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.token = null;
        this.isAuthenticated = false;
      }
    }
  }
}

// Usage in your dashboard component
export class GP51ImportManager {
  private importService: GP51BulkImportService;

  constructor() {
    this.importService = new GP51BulkImportService();
  }

  async runImport(csvData: any[], credentials: { username: string; password: string }): Promise<GP51ImportResult> {
    try {
      // Step 1: Authenticate
      const authenticated = await this.importService.authenticate(credentials.username, credentials.password);
      
      if (!authenticated) {
        return {
          success: false,
          message: 'Authentication failed. Please check your GP51 credentials.',
          results: {
            users: { total: 0, successful: 0, failed: 0, errors: ['Authentication failed'] },
            devices: { total: 0, successful: 0, failed: 0, errors: ['Authentication failed'] }
          }
        };
      }

      // Step 2: Parse data
      const importData = GP51BulkImportService.parseImportData(csvData);
      
      if (importData.users.length === 0 && importData.devices.length === 0) {
        return {
          success: false,
          message: 'No valid users or devices found in import data.',
          results: {
            users: { total: 0, successful: 0, failed: 0, errors: ['No users found'] },
            devices: { total: 0, successful: 0, failed: 0, errors: ['No devices found'] }
          }
        };
      }

      // Step 3: Perform import
      const result = await this.importService.performBulkImport(importData);

      // Step 4: Logout
      await this.importService.logout();

      return result;
    } catch (error) {
      await this.importService.logout();
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: {
          users: { total: 0, successful: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] },
          devices: { total: 0, successful: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] }
        }
      };
    }
  }
}
