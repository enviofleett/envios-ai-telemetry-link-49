
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400', // 24 hours
  'Access-Control-Allow-Credentials': 'true'
};

export function handleCorsPreflightRequest(): Response {
  console.log('🌐 CORS preflight request handled with standard headers');
  return new Response(null, {
    status: 204, // Changed from 200 to 204 (proper HTTP standard for preflight)
    headers: corsHeaders
  });
}

export function createResponse(data: any, status: number = 200): Response {
  console.log(`📤 Creating response with status ${status}:`, {
    success: data?.success,
    error: data?.error,
    code: data?.code
  });
  
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
