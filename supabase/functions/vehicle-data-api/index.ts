
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenValidationResult {
  isValid: boolean;
  token?: any;
  subscription?: any;
  product?: any;
  authorizedVehicleIds: string[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    console.log(`Vehicle Data API: ${method} ${path}`);

    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Extracted token:', token.substring(0, 20) + '...');

    // Validate token
    const validation = await validateToken(supabase, token);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log API usage
    await logApiUsage(supabase, {
      tokenId: validation.token.id,
      userId: validation.token.user_id,
      endpoint: path,
      requestMethod: method,
      responseStatus: 200,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    });

    // Route requests
    if (path === '/telemetry' && method === 'GET') {
      return await handleTelemetryRequest(supabase, validation, url);
    } else if (path === '/vehicles' && method === 'GET') {
      return await handleVehicleListRequest(supabase, validation);
    } else if (path === '/subscription' && method === 'GET') {
      return await handleSubscriptionInfoRequest(validation);
    } else if (path === '/usage' && method === 'GET') {
      return await handleUsageStatsRequest(supabase, validation);
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Vehicle Data API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function validateToken(supabase: any, tokenString: string): Promise<TokenValidationResult> {
  try {
    const { data: tokenData, error } = await supabase
      .from('sharing_tokens')
      .select(`
        *,
        user_subscriptions!inner (
          *,
          data_sharing_products (*)
        )
      `)
      .eq('token', tokenString)
      .eq('is_active', true)
      .single();

    if (error || !tokenData) {
      console.log('Token validation error:', error);
      return {
        isValid: false,
        authorizedVehicleIds: [],
        error: 'Token not found or inactive'
      };
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now > expiresAt) {
      // Auto-revoke expired token
      await supabase
        .from('sharing_tokens')
        .update({ 
          is_active: false, 
          revoked_at: new Date().toISOString() 
        })
        .eq('id', tokenData.id);

      return {
        isValid: false,
        authorizedVehicleIds: [],
        error: 'Token expired'
      };
    }

    // Check if subscription is active
    if (tokenData.user_subscriptions.status !== 'active') {
      return {
        isValid: false,
        authorizedVehicleIds: [],
        error: 'Subscription not active'
      };
    }

    // Update last used timestamp and usage count
    await supabase
      .from('sharing_tokens')
      .update({ 
        last_used_at: new Date().toISOString(),
        usage_count: tokenData.usage_count + 1
      })
      .eq('id', tokenData.id);

    return {
      isValid: true,
      token: tokenData,
      subscription: tokenData.user_subscriptions,
      product: tokenData.user_subscriptions.data_sharing_products,
      authorizedVehicleIds: tokenData.vehicle_ids
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      isValid: false,
      authorizedVehicleIds: [],
      error: 'Validation failed'
    };
  }
}

async function handleTelemetryRequest(supabase: any, validation: TokenValidationResult, url: URL) {
  const vehicleIds = url.searchParams.get('vehicle_ids');
  const dataPoints = url.searchParams.get('data_points');

  // Parse vehicle IDs
  let requestedVehicleIds: string[] = [];
  if (vehicleIds) {
    requestedVehicleIds = vehicleIds.split(',').map(id => id.trim());
  } else {
    requestedVehicleIds = validation.authorizedVehicleIds;
  }

  // Ensure requested vehicles are authorized
  const authorizedVehicleIds = requestedVehicleIds.filter(id => 
    validation.authorizedVehicleIds.includes(id)
  );

  if (authorizedVehicleIds.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No authorized vehicles found' }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Parse data points
  let requestedDataPoints: string[] = [];
  if (dataPoints) {
    requestedDataPoints = dataPoints.split(',').map(point => point.trim());
  } else {
    requestedDataPoints = validation.product?.data_points_included || [];
  }

  // Ensure requested data points are included in the product
  const allowedDataPoints = requestedDataPoints.filter(point =>
    validation.product?.data_points_included?.includes(point)
  );

  // Check rate limits
  const rateLimitPassed = await checkRateLimit(
    supabase, 
    validation.token.id, 
    '/telemetry', 
    validation.product?.features?.rate_limit_per_hour || 100
  );

  if (!rateLimitPassed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { 
        status: 429, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Fetch vehicle telemetry data
  const telemetryData = await getVehicleTelemetryData(supabase, authorizedVehicleIds, allowedDataPoints);

  return new Response(
    JSON.stringify({
      vehicles: telemetryData,
      data_points: allowedDataPoints,
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleVehicleListRequest(supabase: any, validation: TokenValidationResult) {
  // Get basic vehicle information for authorized vehicles
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('id, make, model, year, license_plate, created_at')
    .in('id', validation.authorizedVehicleIds);

  if (error) {
    console.error('Error fetching vehicles:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch vehicles' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({
      vehicles: vehicles || [],
      count: vehicles?.length || 0
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleSubscriptionInfoRequest(validation: TokenValidationResult) {
  return new Response(
    JSON.stringify({
      subscription: {
        id: validation.subscription?.id,
        status: validation.subscription?.status,
        start_date: validation.subscription?.start_date,
        end_date: validation.subscription?.end_date,
        product: {
          name: validation.product?.name,
          category: validation.product?.category,
          data_points_included: validation.product?.data_points_included,
          features: validation.product?.features
        }
      },
      token: {
        expires_at: validation.token?.expires_at,
        usage_count: validation.token?.usage_count,
        authorized_vehicles: validation.authorizedVehicleIds
      }
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleUsageStatsRequest(supabase: any, validation: TokenValidationResult) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days

  const { data: usageLogs, error } = await supabase
    .from('api_usage_logs')
    .select('endpoint, response_status, response_time_ms, created_at')
    .eq('token_id', validation.token.id)
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('Error fetching usage stats:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch usage stats' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const logs = usageLogs || [];
  const totalRequests = logs.length;
  const successfulRequests = logs.filter(log => log.response_status >= 200 && log.response_status < 300).length;
  const failedRequests = totalRequests - successfulRequests;
  
  const responseTimes = logs
    .filter(log => log.response_time_ms !== null)
    .map(log => log.response_time_ms);
  
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

  return new Response(
    JSON.stringify({
      period: '30_days',
      stats: {
        total_requests: totalRequests,
        successful_requests: successfulRequests,
        failed_requests: failedRequests,
        average_response_time: Math.round(averageResponseTime),
        top_endpoints: topEndpoints
      }
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function getVehicleTelemetryData(supabase: any, vehicleIds: string[], dataPoints: string[]) {
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      last_position,
      total_mileage,
      last_updated,
      voltage,
      fuel_level
    `)
    .in('id', vehicleIds);

  if (error) {
    console.error('Failed to fetch vehicle telemetry:', error);
    throw new Error(`Failed to fetch telemetry: ${error.message}`);
  }

  return (vehicles || []).map((vehicle: any) => {
    const telemetry: any = {
      vehicle_id: vehicle.id,
      last_updated: vehicle.last_updated || new Date().toISOString()
    };

    // Add requested data points
    if (dataPoints.includes('location') && vehicle.last_position) {
      const position = typeof vehicle.last_position === 'string' 
        ? JSON.parse(vehicle.last_position) 
        : vehicle.last_position;
      
      if (position.latitude && position.longitude) {
        telemetry.location = {
          latitude: position.latitude,
          longitude: position.longitude,
          timestamp: position.timestamp || vehicle.last_updated
        };
      }
    }

    if (dataPoints.includes('speed') && vehicle.last_position) {
      const position = typeof vehicle.last_position === 'string' 
        ? JSON.parse(vehicle.last_position) 
        : vehicle.last_position;
      telemetry.speed = position.speed || 0;
    }

    if (dataPoints.includes('mileage')) {
      telemetry.mileage = {
        daily: 0, // Would need implementation based on position history
        total: vehicle.total_mileage || 0
      };
    }

    if (dataPoints.includes('fuel_consumption')) {
      telemetry.fuel_consumption = vehicle.fuel_level || 0;
    }

    if (dataPoints.includes('voltage')) {
      telemetry.voltage = vehicle.voltage || 0;
    }

    return telemetry;
  });
}

async function checkRateLimit(supabase: any, tokenId: string, endpoint: string, rateLimitPerHour: number): Promise<boolean> {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const { data, error } = await supabase
    .from('api_usage_logs')
    .select('id')
    .eq('token_id', tokenId)
    .eq('endpoint', endpoint)
    .gte('created_at', oneHourAgo.toISOString());

  if (error) {
    console.error('Failed to check rate limit:', error);
    return false; // Allow request if we can't check
  }

  const currentUsage = data?.length || 0;
  return currentUsage < rateLimitPerHour;
}

async function logApiUsage(supabase: any, params: {
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
