
// Trigger re-deploy - 2025-06-15
import { GP51_API_URL, REQUEST_TIMEOUT, MAX_RETRIES } from "./constants.ts";
import type { GP51Session } from "./gp51_session_utils.ts";

interface CallGP51Result {
  success: boolean;
  response?: Response;
  error?: string;
  statusCode?: number;
}

async function callGP51WithRetry(
  url: string,
  body: string,
  attempt: number = 1,
): Promise<CallGP51Result> {
  try {
    console.log(`GP51 API call attempt ${attempt}/${MAX_RETRIES + 1}`);
    console.log('URL:', url);
    console.log('JSON Body:', body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0',
      },
      body: body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`GP51 API response: status=${response.status}`);

    return { success: true, response, statusCode: response.status };
  } catch (error) {
    console.error(`GP51 API attempt ${attempt} failed:`, error);

    if (attempt <= MAX_RETRIES) {
      const delay = attempt * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGP51WithRetry(url, body, attempt + 1);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      statusCode: 0,
    };
  }
}

export interface FetchGP51Options {
  action: string;
  session: GP51Session;
  additionalParams?: Record<string, string>;
}

export interface FetchGP51Response {
  data?: any;
  error?: string;
  status?: number;
  gp51_error?: any; // GP51 specific error structure
  raw?: string; // Raw response text if JSON parsing fails
}

export async function fetchFromGP51(
  options: FetchGP51Options,
  retryJsonParse: boolean = false
): Promise<FetchGP51Response> {
  const { action, session, additionalParams = {} } = options;

  if (!session.gp51_token) {
    console.error("❌ GP51 session is missing a token.");
    return { error: 'GP51 session is invalid (missing token)', status: 401 };
  }
  
  const url = `${GP51_API_URL}?action=${action}&token=${session.gp51_token}`;

  const body = JSON.stringify({
    username: session.username,
    ...additionalParams,
  });

  const result = await callGP51WithRetry(url, body);

  if (!result.success) {
    return { error: result.error || 'Network error after retries', status: result.statusCode || 502 };
  }

  const response = result.response!;

  if (!response.ok) {
    console.error(`❌ GP51 API HTTP error for ${action}: ${response.status} ${response.statusText}`);
    return { error: `HTTP ${response.status}: ${response.statusText}`, status: response.status };
  }

  const text = await response.text();
  console.log(`📊 Raw GP51 ${action} response (first 500 chars):`, text.substring(0, 500) + (text.length > 500 ? '...' : ''));

  try {
    const json = JSON.parse(text);

    if (json.status !== 0) {
      console.error(`🛑 GP51 API ${action} returned error status:`, json.cause || json.message, json);
      return {
        error: json.cause || json.message || `${action} failed`,
        status: response.status === 200 ? 400 : response.status, // If API returns 200 but GP51 status is error, use 400
        gp51_error: json,
      };
    }
    return { data: json, status: 200 };
  } catch (e) {
    if (!retryJsonParse) {
      console.warn(`🔁 Retry ${action} after JSON parse failure (response was not JSON):`, text.substring(0, 200));
      return await fetchFromGP51(options, true); // Retry once if JSON parsing failed
    }
    console.error(`❌ GP51 ${action} returned invalid JSON after retry:`, text.substring(0, 200));
    return { error: `Invalid GP51 ${action} response (not JSON)`, raw: text, status: 502 };
  }
}
