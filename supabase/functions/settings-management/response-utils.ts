
import { corsHeaders } from './cors.ts';
import type { ApiResponse } from './types.ts';

export function createResponse(data: ApiResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export function createErrorResponse(error: string, details?: string, status: number = 500, latency?: number): Response {
  return createResponse({
    success: false,
    error,
    details,
    latency
  }, status);
}

export function createSuccessResponse(message: string, data?: any, latency?: number): Response {
  return createResponse({
    success: true,
    message,
    ...data,
    latency
  });
}

export function calculateLatency(startTime: number): number {
  return Date.now() - startTime;
}
