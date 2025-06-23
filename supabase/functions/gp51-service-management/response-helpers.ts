
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function jsonResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

export function errorResponse(error: string, details?: any, status: number = 500): Response {
  return jsonResponse({
    success: false,
    error,
    details,
    timestamp: new Date().toISOString()
  }, status);
}
