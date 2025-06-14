
import { GP51_API_URL, REQUEST_TIMEOUT, MAX_RETRIES } from "./constants.ts";
import { md5_sync } from "./crypto_utils.ts"; // Changed import name
import type { GP51Session } from "./gp51_session_utils.ts";

interface CallGP51Result {
  success: boolean;
  response?: Response;
  error?: string;
  statusCode?: number;
}

async function callGP51WithRetry(
  formData: URLSearchParams,
  attempt: number = 1,
): Promise<CallGP51Result> {
  try {
    console.log(`GP51 API call attempt ${attempt}/${MAX_RETRIES + 1}`);
    console.log('Form data:', Object.fromEntries(formData.entries()));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(GP51_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0',
      },
      body: formData.toString(),
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
      return callGP51WithRetry(formData, attempt + 1);
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
  const hashedPassword = md5_sync(session.password_hash); // Changed to synchronous call

  const formData = new URLSearchParams({
    action,
    username: session.username,
    password: hashedPassword,
    from: 'WEB',
    type: 'USER',
    ...additionalParams,
  });

  const result = await callGP51WithRetry(formData);

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

