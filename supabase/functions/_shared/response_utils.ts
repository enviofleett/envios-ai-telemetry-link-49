
import { CORS_HEADERS } from "./cors.ts";

export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown,
  code?: string,
): Response {
  const errorPayload: { success: boolean; error: string; code?: string; details?: unknown } = {
    success: false,
    error: message,
  };
  if (code) errorPayload.code = code;
  if (details) errorPayload.details = details;
  
  return new Response(JSON.stringify(errorPayload), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
