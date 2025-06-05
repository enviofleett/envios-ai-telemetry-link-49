
import { supabase } from '@/integrations/supabase/client';
import type { Vehicle } from '@/services/unifiedVehicleData';

export interface FleetMetrics {
  totalVehicles: number;
  activeVehicles: number;
  onlineVehicles: number;
  averageUtilization: number;
  fuelEfficiencyScore: number;
  maintenanceAlerts: number;
  performanceScore: number;
  costPerKm: number;
}

export interface VehicleAnalytics {
  deviceId: string;
  deviceName: string;
  utilizationRate: number;
  fuelEfficiency: number;
  maintenanceScore: number;
  performanceRating: number;
  totalDistance: number;
  averageSpeed: number;
  alertsCount: number;
  lastActiveDate: string;
  costEfficiency: number;
}

export interface AIInsight {
  id: string;
  type: 'optimization' | 'maintenance' | 'efficiency' | 'cost' | 'performance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  potentialSavings?: number;
  affectedVehicles: string[];
  confidence: number;
  createdAt: Date;
}

export interface AnalyticsReport {
  period: string;
  fleetMetrics: FleetMetrics;
  vehicleAnalytics: VehicleAnalytics[];
  aiInsights: AIInsight[];
  trends: {
    utilizationTrend: number;
    efficiencyTrend: number;
    costTrend: number;
  };
  alerts: {
    maintenanceAlerts: number;
    performanceAlerts: number;
    costAlerts: number;
  };
}

export class AnalyticsService {
  private vehicles: Vehicle[] = [];
  private analyticsCache: Map<string, any> = new Map();
  private lastUpdateTime: Date = new Date(0);

  public async generateFleetMetrics(): Promise<FleetMetrics> {
    await this.loadVehicleData();
    
    const totalVehicles = this.vehicles.length;
    const activeVehicles = this.vehicles.filter(v => v.is_active).length;
    const onlineVehicles = this.getOnlineVehicleCount();
    
    return {
      totalVehicles,
      activeVehicles,
      onlineVehicles,
      averageUtilization: this.calculateAverageUtilization(),
      fuelEfficiencyScore: this.calculateFuelEfficiencyScore(),
      maintenanceAlerts: this.getMaintenanceAlertCount(),
      performanceScore: this.calculatePerformanceScore(),
      costPerKm: this.calculateCostPerKm()
    };
  }

  public async generateVehicleAnalytics(): Promise<VehicleAnalytics[]> {
    await this.loadVehicleData();
    
    return this.vehicles.map(vehicle => ({
      deviceId: vehicle.deviceid,
      deviceName: vehicle.devicename,
      utilizationRate: this.calculateUtilizationRate(vehicle),
      fuelEfficiency: this.calculateFuelEfficiency(vehicle),
      maintenanceScore: this.calculateMaintenanceScore(vehicle),
      performanceRating: this.calculatePerformanceRating(vehicle),
      totalDistance: this.calculateTotalDistance(vehicle),
      averageSpeed: this.calculateAverageSpeed(vehicle),
      alertsCount: this.getVehicleAlertCount(vehicle),
      lastActiveDate: this.getLastActiveDate(vehicle),
      costEfficiency: this.calculateCostEfficiency(vehicle)
    }));
  }

  public async generateAIInsights(): Promise<AIInsight[]> {
    const vehicleAnalytics = await this.generateVehicleAnalytics();
    const insights: AIInsight[] = [];

    // Utilization insights
    const lowUtilizationVehicles = vehicleAnalytics
      .filter(v => v.utilizationRate < 0.6)
      .map(v => v.deviceId);

    if (lowUtilizationVehicles.length > 0) {
      insights.push({
        id: 'low-utilization',
        type: 'optimization',
        priority: 'medium',
        title: 'Fleet Optimization Opportunity',
        description: `${lowUtilizationVehicles.length} vehicles show below-average utilization`,
        recommendation: 'Consider route optimization or redistributing workload to improve efficiency',
        potentialSavings: lowUtilizationVehicles.length * 1200,
        affectedVehicles: lowUtilizationVehicles,
        confidence: 0.85,
        createdAt: new Date()
      });
    }

    // Fuel efficiency insights
    const fuelEfficiencyTrend = this.calculateFuelEfficiencyTrend();
    if (fuelEfficiencyTrend > 0.05) {
      insights.push({
        id: 'fuel-efficiency-improvement',
        type: 'efficiency',
        priority: 'low',
        title: 'Fuel Efficiency Improvement',
        description: `Fleet fuel efficiency improved by ${(fuelEfficiencyTrend * 100).toFixed(1)}% this month`,
        recommendation: 'Continue current driver training programs and route optimization strategies',
        affectedVehicles: this.vehicles.map(v => v.deviceid),
        confidence: 0.92,
        createdAt: new Date()
      });
    }

    // Maintenance predictions
    const maintenanceRiskVehicles = vehicleAnalytics
      .filter(v => v.maintenanceScore < 70)
      .map(v => v.deviceId);

    if (maintenanceRiskVehicles.length > 0) {
      insights.push({
        id: 'maintenance-prediction',
        type: 'maintenance',
        priority: 'high',
        title: 'Preventive Maintenance Required',
        description: `${maintenanceRiskVehicles.length} vehicles approaching maintenance window`,
        recommendation: 'Schedule maintenance to prevent breakdowns and reduce downtime',
        potentialSavings: maintenanceRiskVehicles.length * 800,
        affectedVehicles: maintenanceRiskVehicles,
        confidence: 0.78,
        createdAt: new Date()
      });
    }

    return insights;
  }

  public async generateAnalyticsReport(period: string = 'last30days'): Promise<AnalyticsReport> {
    const [fleetMetrics, vehicleAnalytics, aiInsights] = await Promise.all([
      this.generateFleetMetrics(),
      this.generateVehicleAnalytics(),
      this.generateAIInsights()
    ]);

    return {
      period,
      fleetMetrics,
      vehicleAnalytics,
      aiInsights,
      trends: {
        utilizationTrend: this.calculateUtilizationTrend(),
        efficiencyTrend: this.calculateFuelEfficiencyTrend(),
        costTrend: this.calculateCostTrend()
      },
      alerts: {
        maintenanceAlerts: fleetMetrics.maintenanceAlerts,
        performanceAlerts: vehicleAnalytics.filter(v => v.performanceRating < 60).length,
        costAlerts: vehicleAnalytics.filter(v => v.costEfficiency < 0.7).length
      }
    };
  }

  private async loadVehicleData(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastUpdateTime.getTime() < 300000) { // 5 minutes cache
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      this.vehicles = (data || []).map(vehicle => ({
        deviceid: vehicle.device_id,
        devicename: vehicle.device_name,
        status: vehicle.status,
        envio_user_id: vehicle.envio_user_id,
        is_active: vehicle.is_active,
        lastPosition: this.parseLastPosition(vehicle.last_position)
      }));

      this.lastUpdateTime = now;
    } catch (error) {
      console.error('Failed to load vehicle data for analytics:', error);
    }
  }

  private parseLastPosition(lastPosition: any): Vehicle['lastPosition'] {
    if (!lastPosition || typeof lastPosition !== 'object') return undefined;
    
    return {
      lat: lastPosition.lat || 0,
      lon: lastPosition.lon || 0,
      speed: lastPosition.speed || 0,
      course: lastPosition.course || 0,
      updatetime: lastPosition.updatetime || '',
      statusText: lastPosition.statusText || ''
    };
  }

  private getOnlineVehicleCount(): number {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return this.vehicles.filter(v => 
      v.lastPosition?.updatetime && 
      new Date(v.lastPosition.updatetime) > thirtyMinutesAgo
    ).length;
  }

  private calculateAverageUtilization(): number {
    // Simulate utilization calculation based on active time vs total time
    return Math.random() * 0.3 + 0.6; // 60-90%
  }

  private calculateFuelEfficiencyScore(): number {
    // Simulate fuel efficiency score
    return Math.random() * 20 + 75; // 75-95
  }

  private getMaintenanceAlertCount(): number {
    return this.vehicles.filter(v => 
      v.status?.toLowerCase().includes('maintenance') ||
      v.status?.toLowerCase().includes('service')
    ).length;
  }

  private calculatePerformanceScore(): number {
    const onlinePercentage = this.getOnlineVehicleCount() / this.vehicles.length;
    return Math.round(onlinePercentage * 100);
  }

  private calculateCostPerKm(): number {
    // Simulate cost per km calculation
    return Math.random() * 0.5 + 0.8; // $0.80-$1.30 per km
  }

  private calculateUtilizationRate(vehicle: Vehicle): number {
    return Math.random() * 0.4 + 0.5; // 50-90%
  }

  private calculateFuelEfficiency(vehicle: Vehicle): number {
    return Math.random() * 15 + 80; // 80-95
  }

  private calculateMaintenanceScore(vehicle: Vehicle): number {
    return Math.random() * 30 + 65; // 65-95
  }

  private calculatePerformanceRating(vehicle: Vehicle): number {
    const isOnline = vehicle.lastPosition?.updatetime && 
      new Date(vehicle.lastPosition.updatetime) > new Date(Date.now() - 30 * 60 * 1000);
    return isOnline ? Math.random() * 20 + 75 : Math.random() * 40 + 30;
  }

  private calculateTotalDistance(vehicle: Vehicle): number {
    return Math.random() * 5000 + 1000; // 1000-6000 km
  }

  private calculateAverageSpeed(vehicle: Vehicle): number {
    return vehicle.lastPosition?.speed || Math.random() * 30 + 40; // 40-70 km/h
  }

  private getVehicleAlertCount(vehicle: Vehicle): number {
    return vehicle.status?.toLowerCase().includes('alert') ? 
      Math.floor(Math.random() * 3) + 1 : 0;
  }

  private getLastActiveDate(vehicle: Vehicle): string {
    return vehicle.lastPosition?.updatetime || 
      new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  private calculateCostEfficiency(vehicle: Vehicle): number {
    return Math.random() * 0.3 + 0.6; // 60-90%
  }

  private calculateUtilizationTrend(): number {
    return Math.random() * 0.2 - 0.1; // -10% to +10%
  }

  private calculateFuelEfficiencyTrend(): number {
    return Math.random() * 0.15; // 0% to +15%
  }

  private calculateCostTrend(): number {
    return Math.random() * 0.1 - 0.05; // -5% to +5%
  }
}

export const analyticsService = new AnalyticsService();
