
import { supabase } from '@/integrations/supabase/client';

export interface MobileSession {
  deviceId: string;
  sessionId: string;
  appVersion: string;
  platform: 'ios' | 'android';
  platformVersion?: string;
  deviceModel?: string;
  networkType?: 'wifi' | 'cellular' | 'offline';
}

export interface CrashReport {
  sessionId: string;
  errorMessage: string;
  errorStack?: string;
  screenName?: string;
  userActionBeforeCrash?: string;
  memoryUsageMb?: number;
  batteryLevel?: number;
  networkStatus?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  crashDetails?: Record<string, any>;
}

export interface UsageEvent {
  sessionId: string;
  eventType: 'screen_view' | 'button_click' | 'api_call' | 'feature_usage';
  eventName: string;
  screenName?: string;
  eventProperties?: Record<string, any>;
  responseTimeMs?: number;
  success?: boolean;
  errorDetails?: string;
  userJourneyStep?: number;
}

export interface PerformanceMetric {
  sessionId: string;
  metricType: 'app_load_time' | 'api_response_time' | 'screen_render_time';
  metricValue: number;
  metricUnit: 'ms' | 'seconds' | 'mb';
  screenName?: string;
  apiEndpoint?: string;
  networkType?: string;
}

export class MobileAnalyticsService {
  private static instance: MobileAnalyticsService;

  static getInstance(): MobileAnalyticsService {
    if (!MobileAnalyticsService.instance) {
      MobileAnalyticsService.instance = new MobileAnalyticsService();
    }
    return MobileAnalyticsService.instance;
  }

  async startSession(userId: string, session: MobileSession): Promise<string> {
    console.log('📱 [MOBILE-ANALYTICS] Starting session:', session.sessionId);

    const { data, error } = await supabase
      .from('mobile_app_sessions')
      .insert({
        user_id: userId,
        device_id: session.deviceId,
        session_id: session.sessionId,
        app_version: session.appVersion,
        platform: session.platform,
        platform_version: session.platformVersion,
        device_model: session.deviceModel,
        network_type: session.networkType
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to start session:', error);
      throw error;
    }

    return data.id;
  }

  async endSession(sessionId: string, screensVisited: string[], actionsPerformed: string[]): Promise<void> {
    console.log('📱 [MOBILE-ANALYTICS] Ending session:', sessionId);

    // Get session start time to calculate duration
    const { data: session, error: fetchError } = await supabase
      .from('mobile_app_sessions')
      .select('session_start')
      .eq('session_id', sessionId)
      .single();

    if (fetchError) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to fetch session:', fetchError);
      return;
    }

    const sessionDuration = session 
      ? Math.floor((Date.now() - new Date(session.session_start).getTime()) / 1000)
      : 0;

    const { error } = await supabase
      .from('mobile_app_sessions')
      .update({
        session_end: new Date().toISOString(),
        session_duration_seconds: sessionDuration,
        screens_visited: screensVisited,
        actions_performed: actionsPerformed
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to end session:', error);
    }
  }

  async reportCrash(userId: string, crash: CrashReport): Promise<void> {
    console.log('💥 [MOBILE-ANALYTICS] Reporting crash:', crash.errorMessage);

    // Get session UUID from session_id
    const { data: session, error: sessionError } = await supabase
      .from('mobile_app_sessions')
      .select('id, app_version, platform, platform_version, device_model')
      .eq('session_id', crash.sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to find session for crash:', sessionError);
      return;
    }

    const { error } = await supabase
      .from('mobile_app_crashes')
      .insert({
        user_id: userId,
        session_id: session.id,
        app_version: session.app_version,
        platform: session.platform,
        platform_version: session.platform_version,
        device_model: session.device_model,
        error_message: crash.errorMessage,
        error_stack: crash.errorStack,
        screen_name: crash.screenName,
        user_action_before_crash: crash.userActionBeforeCrash,
        memory_usage_mb: crash.memoryUsageMb,
        battery_level: crash.batteryLevel,
        network_status: crash.networkStatus,
        crash_details: crash.crashDetails,
        severity: crash.severity
      });

    if (error) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to report crash:', error);
      return;
    }

    // Create system alert for critical crashes
    if (crash.severity === 'critical') {
      await this.createCrashAlert(crash);
    }
  }

  async trackUsageEvent(userId: string, event: UsageEvent): Promise<void> {
    // Get session UUID from session_id
    const { data: session, error: sessionError } = await supabase
      .from('mobile_app_sessions')
      .select('id')
      .eq('session_id', event.sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to find session for event:', sessionError);
      return;
    }

    const { error } = await supabase
      .from('mobile_usage_analytics')
      .insert({
        user_id: userId,
        session_id: session.id,
        event_type: event.eventType,
        event_name: event.eventName,
        screen_name: event.screenName,
        event_properties: event.eventProperties,
        response_time_ms: event.responseTimeMs,
        success: event.success,
        error_details: event.errorDetails,
        user_journey_step: event.userJourneyStep
      });

    if (error) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to track event:', error);
    }
  }

  async recordPerformanceMetric(userId: string, metric: PerformanceMetric): Promise<void> {
    // Get session UUID from session_id
    const { data: session, error: sessionError } = await supabase
      .from('mobile_app_sessions')
      .select('id')
      .eq('session_id', metric.sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to find session for metric:', sessionError);
      return;
    }

    const { error } = await supabase
      .from('mobile_performance_metrics')
      .insert({
        session_id: session.id,
        metric_type: metric.metricType,
        metric_value: metric.metricValue,
        metric_unit: metric.metricUnit,
        screen_name: metric.screenName,
        api_endpoint: metric.apiEndpoint,
        network_type: metric.networkType
      });

    if (error) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to record metric:', error);
    }
  }

  async getCrashAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalCrashes: number;
    criticalCrashes: number;
    topCrashCauses: Array<{ error: string; count: number }>;
    crashRate: number;
  }> {
    const daysBack = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: crashes, error } = await supabase
      .from('mobile_app_crashes')
      .select('error_message, severity')
      .gte('crash_timestamp', startDate.toISOString());

    if (error) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to get crash analytics:', error);
      return { totalCrashes: 0, criticalCrashes: 0, topCrashCauses: [], crashRate: 0 };
    }

    const totalCrashes = crashes?.length || 0;
    const criticalCrashes = crashes?.filter(c => c.severity === 'critical').length || 0;

    // Group by error message
    const errorCounts = new Map<string, number>();
    crashes?.forEach(crash => {
      const count = errorCounts.get(crash.error_message) || 0;
      errorCounts.set(crash.error_message, count + 1);
    });

    const topCrashCauses = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get total sessions for crash rate calculation
    const { data: sessions, error: sessionError } = await supabase
      .from('mobile_app_sessions')
      .select('id')
      .gte('session_start', startDate.toISOString());

    const totalSessions = sessions?.length || 0;
    const crashRate = totalSessions > 0 ? (totalCrashes / totalSessions) * 100 : 0;

    return {
      totalCrashes,
      criticalCrashes,
      topCrashCauses,
      crashRate: Math.round(crashRate * 100) / 100
    };
  }

  private async createCrashAlert(crash: CrashReport): Promise<void> {
    const { error } = await supabase
      .from('system_alerts')
      .insert({
        alert_type: 'mobile_crash',
        severity: 'critical',
        title: 'Critical Mobile App Crash Detected',
        message: `Critical crash on ${crash.screenName || 'unknown screen'}: ${crash.errorMessage}`,
        source_system: 'mobile_analytics',
        alert_data: {
          sessionId: crash.sessionId,
          errorMessage: crash.errorMessage,
          screenName: crash.screenName,
          userAction: crash.userActionBeforeCrash
        }
      });

    if (error) {
      console.error('❌ [MOBILE-ANALYTICS] Failed to create crash alert:', error);
    }
  }
}

export const mobileAnalyticsService = MobileAnalyticsService.getInstance();
