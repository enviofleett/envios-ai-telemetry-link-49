
import { supabase } from '@/integrations/supabase/client';
import { GP51ApiValidator, GP51ApiResponse } from './GP51ApiValidator';

export interface GP51PerformanceMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastRequestTime: string;
  successRate: number;
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum: string;
  overduetime: number;
  expirenotifytime: number;
  remark: string;
  creater: string;
  videochannelcount: number;
  lastactivetime: number;
  isfree: number;
  allowedit: number;
  icon: number;
  stared: number;
  loginame: string;
  groupId?: string;
  groupName?: string;
  groupRemark?: string;
}

export class GP51DataService {
  private static instance: GP51DataService;
  private metrics: GP51PerformanceMetrics = {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    lastRequestTime: new Date().toISOString(),
    successRate: 0
  };

  static getInstance(): GP51DataService {
    if (!GP51DataService.instance) {
      GP51DataService.instance = new GP51DataService();
    }
    return GP51DataService.instance;
  }

  async fetchDeviceList(): Promise<{
    success: boolean;
    devices?: GP51Device[];
    error?: string;
    performance?: GP51PerformanceMetrics;
  }> {
    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      console.log('🚀 [GP51DataService] Fetching device list from GP51...');
      
      const { data, error } = await supabase.functions.invoke('gp51-device-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, !error);

      if (error) {
        console.error('❌ [GP51DataService] Error calling gp51-device-list function:', error);
        return {
          success: false,
          error: `Function call failed: ${error.message}`,
          performance: this.metrics
        };
      }

      // Validate the response using GP51ApiValidator
      if (!data) {
        console.error('❌ [GP51DataService] No data returned from function');
        return {
          success: false,
          error: 'No data returned from GP51 API',
          performance: this.metrics
        };
      }

      if (!data.success) {
        console.error('❌ [GP51DataService] Function returned error:', data.error || data);
        return {
          success: false,
          error: data.error || 'Unknown error from GP51 API',
          performance: this.metrics
        };
      }

      // Validate raw GP51 response if available
      if (data.rawData) {
        const validation = GP51ApiValidator.validateQueryMonitorListResponse(data.rawData);
        if (!validation.isValid) {
          console.error('❌ [GP51DataService] GP51 API response validation failed:', validation.error);
          return {
            success: false,
            error: `GP51 API validation failed: ${validation.error}`,
            performance: this.metrics
          };
        }
        console.log('✅ [GP51DataService] GP51 API response validation passed');
      }

      const devices = data.devices || [];
      console.log(`✅ [GP51DataService] Successfully fetched ${devices.length} devices`);
      console.log(`📊 [GP51DataService] Performance: ${responseTime}ms response time`);

      return {
        success: true,
        devices: devices,
        performance: this.metrics
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      console.error('❌ [GP51DataService] Critical error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        performance: this.metrics
      };
    }
  }

  private updateMetrics(responseTime: number, isSuccess: boolean): void {
    if (isSuccess) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }

    // Update average response time
    const totalRequests = this.metrics.successCount + this.metrics.errorCount;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;

    // Update success rate
    this.metrics.successRate = (this.metrics.successCount / this.metrics.requestCount) * 100;
    
    // Update last request time
    this.metrics.lastRequestTime = new Date().toISOString();

    console.log(`📊 [GP51DataService] Metrics updated:`, {
      responseTime: `${responseTime}ms`,
      successRate: `${this.metrics.successRate.toFixed(1)}%`,
      totalRequests: this.metrics.requestCount
    });
  }

  getMetrics(): GP51PerformanceMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastRequestTime: new Date().toISOString(),
      successRate: 0
    };
    console.log('📊 [GP51DataService] Metrics reset');
  }

  async validateDeviceStatus(device: GP51Device): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Validate device status
    if (!GP51ApiValidator.isDeviceActive(device)) {
      const statusText = GP51ApiValidator.getDeviceStatusText(device.isfree);
      issues.push(`Device is not active: ${statusText}`);
      
      if (device.isfree === 4) {
        recommendations.push('Service fee payment is overdue - contact billing');
      } else if (device.isfree === 5) {
        recommendations.push('Service has expired - renew subscription');
      } else if (device.isfree === 3) {
        recommendations.push('Device is disabled - contact support for reactivation');
      }
    }

    // Validate last activity
    const now = Date.now();
    const lastActivity = device.lastactivetime * 1000; // Convert to milliseconds
    const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);
    
    if (hoursSinceLastActivity > 24) {
      issues.push(`Device has been inactive for ${Math.round(hoursSinceLastActivity)} hours`);
      recommendations.push('Check device power and connectivity');
    }

    // Validate SIM number
    if (!device.simnum || device.simnum.trim() === '') {
      issues.push('No SIM number configured');
      recommendations.push('Configure SIM number for proper tracking');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  async getDeviceHealth(): Promise<{
    totalDevices: number;
    activeDevices: number;
    inactiveDevices: number;
    healthScore: number;
    topIssues: string[];
  }> {
    const result = await this.fetchDeviceList();
    
    if (!result.success || !result.devices) {
      return {
        totalDevices: 0,
        activeDevices: 0,
        inactiveDevices: 0,
        healthScore: 0,
        topIssues: ['Unable to fetch device data']
      };
    }

    const devices = result.devices;
    const activeDevices = devices.filter(device => GP51ApiValidator.isDeviceActive(device)).length;
    const inactiveDevices = devices.length - activeDevices;
    const healthScore = devices.length > 0 ? (activeDevices / devices.length) * 100 : 0;

    // Analyze common issues
    const issueCount: Record<string, number> = {};
    
    for (const device of devices) {
      const validation = await this.validateDeviceStatus(device);
      validation.issues.forEach(issue => {
        const issueType = issue.split(':')[0]; // Get issue category
        issueCount[issueType] = (issueCount[issueType] || 0) + 1;
      });
    }

    const topIssues = Object.entries(issueCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => `${issue} (${count} devices)`);

    return {
      totalDevices: devices.length,
      activeDevices,
      inactiveDevices,
      healthScore: Math.round(healthScore),
      topIssues
    };
  }
}

export const gp51DataService = GP51DataService.getInstance();
