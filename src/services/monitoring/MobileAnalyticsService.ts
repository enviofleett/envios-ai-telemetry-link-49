
import { supabase } from '@/integrations/supabase/client';

export interface MobileUsageMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  crashRate: number;
  topFeatures: Array<{ feature: string; usage: number }>;
  platformDistribution: Record<string, number>;
  performanceMetrics: {
    averageLoadTime: number;
    averageResponseTime: number;
  };
}

export interface MobileCrashReport {
  id: string;
  sessionId?: string;
  userId?: string;
  appVersion: string;
  platform: string;
  crashType: string;
  errorMessage?: string;
  stackTrace?: string;
  deviceInfo: any;
  occurredAt: Date;
  resolved: boolean;
  severity?: string;
}

export interface MobilePerformanceMetric {
  id: string;
  sessionId?: string;
  metricType: string;
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  platform: string;
  appVersion?: string;
  deviceInfo: any;
  recordedAt: Date;
}

export class MobileAnalyticsService {
  private static instance: MobileAnalyticsService;

  static getInstance(): MobileAnalyticsService {
    if (!MobileAnalyticsService.instance) {
      MobileAnalyticsService.instance = new MobileAnalyticsService();
    }
    return MobileAnalyticsService.instance;
  }

  async getMobileUsageMetrics(): Promise<MobileUsageMetrics> {
    try {
      // Get session data
      const { data: sessions, error: sessionsError } = await supabase
        .from('mobile_app_sessions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (sessionsError) {
        console.error('Failed to fetch mobile sessions:', sessionsError);
        throw sessionsError;
      }

      // Get crash data
      const { data: crashes, error: crashesError } = await supabase
        .from('mobile_app_crashes')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (crashesError) {
        console.error('Failed to fetch mobile crashes:', crashesError);
        throw crashesError;
      }

      // Calculate metrics
      const totalSessions = sessions?.length || 0;
      const totalCrashes = crashes?.length || 0;
      
      const averageSessionDuration = sessions?.reduce((acc, session) => {
        return acc + (session.duration_minutes || 0);
      }, 0) / totalSessions || 0;

      const crashRate = totalSessions > 0 ? (totalCrashes / totalSessions) * 100 : 0;

      // Platform distribution
      const platformDistribution: Record<string, number> = {};
      sessions?.forEach(session => {
        platformDistribution[session.platform] = (platformDistribution[session.platform] || 0) + 1;
      });

      // Top features (from features_used array)
      const featureUsage: Record<string, number> = {};
      sessions?.forEach(session => {
        session.features_used?.forEach((feature: string) => {
          featureUsage[feature] = (featureUsage[feature] || 0) + 1;
        });
      });

      const topFeatures = Object.entries(featureUsage)
        .map(([feature, usage]) => ({ feature, usage }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 5);

      return {
        totalSessions,
        averageSessionDuration,
        crashRate,
        topFeatures,
        platformDistribution,
        performanceMetrics: {
          averageLoadTime: 0, // Would be calculated from performance metrics
          averageResponseTime: 0
        }
      };
    } catch (error) {
      console.error('Failed to get mobile usage metrics:', error);
      throw error;
    }
  }

  async recordCrash(crashData: {
    sessionId?: string;
    userId?: string;
    appVersion: string;
    platform: string;
    crashType: string;
    errorMessage?: string;
    stackTrace?: string;
    deviceInfo?: any;
    severity?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('mobile_app_crashes')
        .insert({
          session_id: crashData.sessionId,
          user_id: crashData.userId,
          app_version: crashData.appVersion,
          platform: crashData.platform,
          crash_type: crashData.crashType,
          error_message: crashData.errorMessage,
          stack_trace: crashData.stackTrace,
          device_info: crashData.deviceInfo || {},
          severity: crashData.severity || 'medium'
        });

      if (error) {
        console.error('Failed to record crash:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to record mobile crash:', error);
      throw error;
    }
  }

  async getSessionAnalytics(): Promise<any> {
    try {
      const { data: sessions, error } = await supabase
        .from('mobile_app_sessions')
        .select(`
          id,
          app_version,
          platform,
          platform_version,
          device_model,
          session_start,
          session_end,
          duration_minutes,
          features_used,
          crash_count,
          performance_metrics
        `)
        .order('session_start', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to fetch session analytics:', error);
        throw error;
      }

      return sessions?.map(session => ({
        id: session.id,
        appVersion: session.app_version,
        platform: session.platform,
        platformVersion: session.platform_version,
        deviceModel: session.device_model,
        sessionStart: session.session_start,
        sessionEnd: session.session_end,
        duration: session.duration_minutes,
        featuresUsed: session.features_used,
        crashCount: session.crash_count,
        performanceMetrics: session.performance_metrics
      })) || [];
    } catch (error) {
      console.error('Failed to get session analytics:', error);
      throw error;
    }
  }

  async recordUsageEvent(eventData: {
    userId?: string;
    sessionId?: string;
    eventType: string;
    eventCategory: string;
    eventData?: any;
    platform: string;
    appVersion?: string;
    deviceInfo?: any;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('mobile_usage_analytics')
        .insert({
          user_id: eventData.userId,
          session_id: eventData.sessionId,
          event_type: eventData.eventType,
          event_category: eventData.eventCategory,
          event_data: eventData.eventData || {},
          platform: eventData.platform,
          app_version: eventData.appVersion,
          device_info: eventData.deviceInfo || {}
        });

      if (error) {
        console.error('Failed to record usage event:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to record mobile usage event:', error);
      throw error;
    }
  }

  async recordPerformanceMetric(metricData: {
    sessionId?: string;
    metricType: string;
    metricName: string;
    metricValue: number;
    metricUnit?: string;
    platform: string;
    appVersion?: string;
    deviceInfo?: any;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('mobile_performance_metrics')
        .insert({
          session_id: metricData.sessionId,
          metric_type: metricData.metricType,
          metric_name: metricData.metricName,
          metric_value: metricData.metricValue,
          metric_unit: metricData.metricUnit,
          platform: metricData.platform,
          app_version: metricData.appVersion,
          device_info: metricData.deviceInfo || {}
        });

      if (error) {
        console.error('Failed to record performance metric:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to record mobile performance metric:', error);
      throw error;
    }
  }

  async getCrashAnalytics(): Promise<MobileCrashReport[]> {
    try {
      const { data: crashes, error } = await supabase
        .from('mobile_app_crashes')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to fetch crash analytics:', error);
        throw error;
      }

      return crashes?.map(crash => ({
        id: crash.id,
        sessionId: crash.session_id,
        userId: crash.user_id,
        appVersion: crash.app_version,
        platform: crash.platform,
        crashType: crash.crash_type,
        errorMessage: crash.error_message,
        stackTrace: crash.stack_trace,
        deviceInfo: crash.device_info,
        occurredAt: new Date(crash.occurred_at),
        resolved: crash.resolved,
        severity: crash.severity
      })) || [];
    } catch (error) {
      console.error('Failed to get crash analytics:', error);
      throw error;
    }
  }

  async getPerformanceAnalytics(): Promise<MobilePerformanceMetric[]> {
    try {
      const { data: metrics, error } = await supabase
        .from('mobile_performance_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to fetch performance metrics:', error);
        throw error;
      }

      return metrics?.map(metric => ({
        id: metric.id,
        sessionId: metric.session_id,
        metricType: metric.metric_type,
        metricName: metric.metric_name,
        metricValue: metric.metric_value,
        metricUnit: metric.metric_unit,
        platform: metric.platform,
        appVersion: metric.app_version,
        deviceInfo: metric.device_info,
        recordedAt: new Date(metric.recorded_at)
      })) || [];
    } catch (error) {
      console.error('Failed to get performance analytics:', error);
      throw error;
    }
  }
}

export const mobileAnalyticsService = MobileAnalyticsService.getInstance();
