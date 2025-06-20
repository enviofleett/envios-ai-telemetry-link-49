
import { supabase } from '@/integrations/supabase/client';
import type { ApiUsageLog } from '@/types/data-sharing';

export class UsageTrackingService {
  async logApiUsage(params: {
    tokenId: string;
    userId: string;
    endpoint: string;
    vehicleId?: string;
    requestMethod: string;
    responseStatus: number;
    responseTimeMs?: number;
    requestData?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_usage_logs')
        .insert({
          token_id: params.tokenId,
          user_id: params.userId,
          endpoint: params.endpoint,
          vehicle_id: params.vehicleId,
          request_method: params.requestMethod,
          response_status: params.responseStatus,
          response_time_ms: params.responseTimeMs,
          request_data: params.requestData,
          ip_address: params.ipAddress,
          user_agent: params.userAgent
        });

      if (error) {
        console.error('Failed to log API usage:', error);
      }
    } catch (error) {
      console.error('Error logging API usage:', error);
    }
  }

  async getTokenUsageStats(tokenId: string, days: number = 30): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    topEndpoints: { endpoint: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('endpoint, response_status, response_time_ms')
      .eq('token_id', tokenId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Failed to fetch usage stats:', error);
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        topEndpoints: []
      };
    }

    const logs = data || [];
    const totalRequests = logs.length;
    const successfulRequests = logs.filter(log => log.response_status >= 200 && log.response_status < 300).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = logs
      .filter(log => log.response_time_ms !== null)
      .map(log => log.response_time_ms!);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Calculate top endpoints
    const endpointCounts = logs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      topEndpoints
    };
  }

  async getUserUsageStats(userId: string, days: number = 30): Promise<{
    totalRequests: number;
    activeTokens: number;
    topVehicles: { vehicle_id: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: usageLogs, error: usageError } = await supabase
      .from('api_usage_logs')
      .select('vehicle_id')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    const { data: activeTokens, error: tokensError } = await supabase
      .from('sharing_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (usageError || tokensError) {
      console.error('Failed to fetch user usage stats:', usageError || tokensError);
      return {
        totalRequests: 0,
        activeTokens: 0,
        topVehicles: []
      };
    }

    const logs = usageLogs || [];
    const totalRequests = logs.length;
    const activeTokensCount = (activeTokens || []).length;

    // Calculate top vehicles
    const vehicleCounts = logs.reduce((acc, log) => {
      if (log.vehicle_id) {
        acc[log.vehicle_id] = (acc[log.vehicle_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topVehicles = Object.entries(vehicleCounts)
      .map(([vehicle_id, count]) => ({ vehicle_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests,
      activeTokens: activeTokensCount,
      topVehicles
    };
  }

  async getSystemUsageStats(days: number = 30): Promise<{
    totalRequests: number;
    totalUsers: number;
    totalTokens: number;
    requestsByDay: { date: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: usageLogs, error } = await supabase
      .from('api_usage_logs')
      .select('created_at, user_id')
      .gte('created_at', startDate.toISOString());

    const { data: activeTokens, error: tokensError } = await supabase
      .from('sharing_tokens')
      .select('id')
      .eq('is_active', true);

    if (error || tokensError) {
      console.error('Failed to fetch system usage stats:', error || tokensError);
      return {
        totalRequests: 0,
        totalUsers: 0,
        totalTokens: 0,
        requestsByDay: []
      };
    }

    const logs = usageLogs || [];
    const totalRequests = logs.length;
    const uniqueUsers = new Set(logs.map(log => log.user_id)).size;
    const totalTokens = (activeTokens || []).length;

    // Calculate requests by day
    const requestsByDay = logs.reduce((acc, log) => {
      const date = log.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByDayArray = Object.entries(requestsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      totalUsers: uniqueUsers,
      totalTokens,
      requestsByDay: requestsByDayArray
    };
  }
}

export const usageTrackingService = new UsageTrackingService();
