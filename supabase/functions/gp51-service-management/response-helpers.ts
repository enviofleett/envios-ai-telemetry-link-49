
export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

export function errorResponse(message: string, status = 500) {
  console.error(`❌ Error (${status}):`, message);
  return jsonResponse({ 
    success: false, 
    error: message,
    timestamp: new Date().toISOString()
  }, status);
}

export function successResponse(data: any) {
  return jsonResponse({ 
    success: true, 
    ...data,
    timestamp: new Date().toISOString()
  });
}
