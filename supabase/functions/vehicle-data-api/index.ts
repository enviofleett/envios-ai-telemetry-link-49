
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface TokenValidationResult {
  isValid: boolean;
  token?: any;
  subscription?: any;
  product?: any;
  authorizedVehicleIds: string[];
  error?: string;
}

interface VehicleTelemetryData {
  vehicle_id: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  speed?: number;
  mileage?: {
    daily: number;
    total: number;
  };
  fuel_consumption?: number;
  engine_data?: Record<string, any>;
  voltage?: number;
  last_updated: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url);
    const pathname = url.pathname;
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required. Please provide x-api-key header.' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate token and get authorization details
    const tokenValidation = await validateToken(supabaseClient, apiKey);
    
    if (!tokenValidation.isValid) {
      return new Response(
        JSON.stringify({ error: tokenValidation.error || 'Invalid API key' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const startTime = Date.now();
    let response: Response;
    let vehicleId: string | undefined;

    // Route requests
    if (pathname === '/vehicle-data-api/v1/user') {
      response = await handleUserProfileRequest(supabaseClient, tokenValidation);
    } else if (pathname === '/vehicle-data-api/v1/vehicles') {
      response = await handleVehicleListRequest(supabaseClient, tokenValidation);
    } else if (pathname.startsWith('/vehicle-data-api/v1/vehicles/')) {
      vehicleId = pathname.split('/').pop();
      response = await handleVehicleTelemetryRequest(supabaseClient, tokenValidation, vehicleId);
    } else if (pathname === '/vehicle-data-api/v1/telemetry') {
      response = await handleBulkTelemetryRequest(supabaseClient, tokenValidation, url);
    } else {
      response = new Response(
        JSON.stringify({ 
          error: 'Endpoint not found',
          available_endpoints: [
            '/vehicle-data-api/v1/user',
            '/vehicle-data-api/v1/vehicles',
            '/vehicle-data-api/v1/vehicles/{id}',
            '/vehicle-data-api/v1/telemetry'
          ]
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log API usage
    const responseTime = Date.now() - startTime;
    await logApiUsage(supabaseClient, {
      tokenId: tokenValidation.token.id,
      userId: tokenValidation.token.user_id,
      endpoint: pathname,
      vehicleId,
      requestMethod: req.method,
      responseStatus: response.status,
      responseTimeMs: responseTime,
      ipAddress: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent')
    });

    return response;

  } catch (error) {
    console.error('API Gateway Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})

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

    // Update last used timestamp
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

async function handleUserProfileRequest(supabase: any, tokenValidation: TokenValidationResult): Promise<Response> {
  const { data: user, error } = await supabase
    .from('envio_users')
    .select('id, name, email, phone_number')
    .eq('id', tokenValidation.token.user_id)
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: 'User not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone_number,
      subscription: {
        product: tokenValidation.product.name,
        expires_at: tokenValidation.subscription.end_date,
        status: tokenValidation.subscription.status
      }
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleVehicleListRequest(supabase: any, tokenValidation: TokenValidationResult): Promise<Response> {
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('id, vehicle_name, make, model, year, device_id, last_updated')
    .in('id', tokenValidation.authorizedVehicleIds);

  if (error) {
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
      total_count: (vehicles || []).length,
      authorized_vehicle_ids: tokenValidation.authorizedVehicleIds
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleVehicleTelemetryRequest(
  supabase: any, 
  tokenValidation: TokenValidationResult, 
  vehicleId?: string
): Promise<Response> {
  if (!vehicleId) {
    return new Response(
      JSON.stringify({ error: 'Vehicle ID required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  if (!tokenValidation.authorizedVehicleIds.includes(vehicleId)) {
    return new Response(
      JSON.stringify({ error: 'Access denied for this vehicle' }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      vehicle_name,
      last_position,
      total_mileage,
      last_updated,
      voltage,
      fuel_level
    `)
    .eq('id', vehicleId)
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Vehicle not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const telemetryData = buildTelemetryData(vehicle, tokenValidation.product.data_points_included);

  return new Response(
    JSON.stringify(telemetryData),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleBulkTelemetryRequest(
  supabase: any, 
  tokenValidation: TokenValidationResult, 
  url: URL
): Promise<Response> {
  const vehicleIds = url.searchParams.get('vehicle_ids')?.split(',') || tokenValidation.authorizedVehicleIds;
  const unauthorizedVehicles = vehicleIds.filter(id => !tokenValidation.authorizedVehicleIds.includes(id));
  
  if (unauthorizedVehicles.length > 0) {
    return new Response(
      JSON.stringify({ 
        error: 'Access denied for vehicles', 
        unauthorized_vehicles: unauthorizedVehicles 
      }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      vehicle_name,
      last_position,
      total_mileage,
      last_updated,
      voltage,
      fuel_level
    `)
    .in('id', vehicleIds);

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch vehicle data' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const telemetryData = (vehicles || []).map(vehicle => 
    buildTelemetryData(vehicle, tokenValidation.product.data_points_included)
  );

  return new Response(
    JSON.stringify({
      vehicles: telemetryData,
      total_count: telemetryData.length,
      requested_vehicle_ids: vehicleIds
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

function buildTelemetryData(vehicle: any, dataPoints: string[]): VehicleTelemetryData {
  const telemetry: VehicleTelemetryData = {
    vehicle_id: vehicle.id,
    last_updated: vehicle.last_updated || new Date().toISOString()
  };

  // Add requested data points
  if (dataPoints.includes('location') && vehicle.last_position) {
    const position = typeof vehicle.last_position === 'string' 
      ? JSON.parse(vehicle.last_position) 
      : vehicle.last_position;
    
    if (position.latitude && position.longitude)>
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
      daily: 0, // Would need to calculate from position history
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
}

async function logApiUsage(supabase: any, params: {
  tokenId: string;
  userId: string;
  endpoint: string;
  vehicleId?: string;
  requestMethod: string;
  responseStatus: number;
  responseTimeMs?: number;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await supabase
      .from('api_usage_logs')
      .insert({
        token_id: params.tokenId,
        user_id: params.userId,
        endpoint: params.endpoint,
        vehicle_id: params.vehicleId,
        request_method: params.requestMethod,
        response_status: params.responseStatus,
        response_time_ms: params.responseTimeMs,
        ip_address: params.ipAddress,
        user_agent: params.userAgent
      });
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}
