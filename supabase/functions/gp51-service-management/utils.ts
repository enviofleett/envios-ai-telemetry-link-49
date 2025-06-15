
import { md5 } from "npm:js-md5";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const GP51_API_URL = "https://www.gps51.com/webapi";

export function calculateMd5(input: string): string {
  return md5(input);
}
