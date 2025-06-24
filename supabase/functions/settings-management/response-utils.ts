
export function createResponse(data: any, latency?: number, status: number = 200): Response {
  const responseBody = {
    ...data,
    ...(latency !== undefined && { latency: `${latency}ms` }),
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(responseBody), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  });
}

export function createErrorResponse(
  message: string, 
  details?: string, 
  status: number = 400, 
  latency?: number,
  metadata?: any
): Response {
  const errorBody = {
    success: false,
    error: message,
    ...(details && { details }),
    ...(latency !== undefined && { latency: `${latency}ms` }),
    ...(metadata && { metadata }),
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  });
}

export function calculateLatency(startTime: number): number {
  return Date.now() - startTime;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
