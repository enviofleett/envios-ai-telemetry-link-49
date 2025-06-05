
import { supabase } from '@/integrations/supabase/client';

export interface MapAnalyticsEvent {
  session_id: string;
  action_type: 'zoom' | 'pan' | 'marker_click' | 'search' | 'filter' | 'load' | 'cluster_expand';
  action_data?: Record<string, any>;
  zoom_level?: number;
  center_lat?: number;
  center_lng?: number;
  viewport_bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface MapPerformanceMetric {
  session_id: string;
  metric_type: 'load_time' | 'render_time' | 'marker_count' | 'error' | 'cluster_time';
  metric_value: number;
  metadata?: Record<string, any>;
  api_config_id?: string;
}

class MapAnalyticsService {
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeUser();
  }

  private generateSessionId(): string {
    return `map_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeUser() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
  }

  async trackEvent(event: MapAnalyticsEvent) {
    try {
      if (!this.userId) {
        await this.initializeUser();
      }

      await supabase.from('map_usage_analytics').insert({
        session_id: event.session_id || this.sessionId,
        user_id: this.userId,
        action_type: event.action_type,
        action_data: event.action_data || {},
        zoom_level: event.zoom_level,
        center_lat: event.center_lat,
        center_lng: event.center_lng,
        viewport_bounds: event.viewport_bounds
      });
    } catch (error) {
      console.error('Failed to track map analytics event:', error);
    }
  }

  async trackPerformance(metric: MapPerformanceMetric) {
    try {
      await supabase.from('map_performance_metrics').insert({
        session_id: metric.session_id || this.sessionId,
        metric_type: metric.metric_type,
        metric_value: metric.metric_value,
        metadata: metric.metadata || {},
        api_config_id: metric.api_config_id
      });
    } catch (error) {
      console.error('Failed to track map performance metric:', error);
    }
  }

  async getAnalytics(dateRange: { start: Date; end: Date }) {
    try {
      const { data, error } = await supabase
        .from('map_usage_analytics')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch map analytics:', error);
      return [];
    }
  }

  async getPerformanceMetrics(dateRange: { start: Date; end: Date }) {
    try {
      const { data, error } = await supabase
        .from('map_performance_metrics')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      return [];
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const mapAnalyticsService = new MapAnalyticsService();
