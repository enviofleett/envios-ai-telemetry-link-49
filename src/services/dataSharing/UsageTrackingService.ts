
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
      .select('*')
      .eq('token_id', tokenId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Failed to fetch token usage stats:', error);
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
    
    const responseTimes = logs.filter(log => log.response_time_ms).map(log => log.response_time_ms);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Calculate top endpoints
    const endpointCounts = logs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
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

    // Get usage logs for user
    const { data: logs, error: logsError } = await supabase
      .from('api_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    // Get active tokens count
    const { data: tokens, error: tokensError } = await supabase
      .from('sharing_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (logsError || tokensError) {
      console.error('Failed to fetch user usage stats:', logsError || tokensError);
      return {
        totalRequests: 0,
        activeTokens: 0,
        topVehicles: []
      };
    }

    const totalRequests = logs?.length || 0;
    const activeTokens = tokens?.length || 0;

    // Calculate top vehicles
    const vehicleCounts = (logs || [])
      .filter(log => log.vehicle_id)
      .reduce((acc, log) => {
        acc[log.vehicle_id] = (acc[log.vehicle_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topVehicles = Object.entries(vehicleCounts)
      .map(([vehicle_id, count]) => ({ vehicle_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      activeTokens,
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

    // Get total requests
    const { data: logs, error: logsError } = await supabase
      .from('api_usage_logs')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Get unique users count
    const { data: users, error: usersError } = await supabase
      .from('sharing_tokens')
      .select('user_id')
      .eq('is_active', true);

    // Get total active tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('sharing_tokens')
      .select('id')
      .eq('is_active', true);

    if (logsError || usersError || tokensError) {
      console.error('Failed to fetch system usage stats:', logsError || usersError || tokensError);
      return {
        totalRequests: 0,
        totalUsers: 0,
        totalTokens: 0,
        requestsByDay: []
      };
    }

    const totalRequests = logs?.length || 0;
    const uniqueUsers = [...new Set(users?.map(u => u.user_id) || [])];
    const totalUsers = uniqueUsers.length;
    const totalTokens = tokens?.length || 0;

    // Calculate requests by day
    const requestsByDay = (logs || []).reduce((acc, log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByDayArray = Object.entries(requestsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      totalUsers,
      totalTokens,
      requestsByDay: requestsByDayArray
    };
  }
}

export const usageTrackingService = new UsageTrackingService();
