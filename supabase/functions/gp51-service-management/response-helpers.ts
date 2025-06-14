
import { corsHeaders } from "./utils.ts";

export function jsonResponse(body: Record<string, any>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function optionsResponse() {
  return new Response(null, { headers: corsHeaders });
}

export function errorResponse(message: string, status = 500, additionalDetails: Record<string, any> = {}) {
  console.error(`Error Response: ${message}`, additionalDetails);
  return jsonResponse({
    status: 'critical', // Or derive from additionalDetails.status if provided
    isValid: false,
    errorMessage: message,
    ...additionalDetails,
  }, status);
}
