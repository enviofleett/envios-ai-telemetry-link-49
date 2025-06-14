
import { Md5 } from "https://deno.land/std@0.224.0/crypto/mod.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const GP51_API_URL = "https://www.gps51.com/webapi";

export function calculateMd5(input: string): string {
  const md5hasher = new Md5();
  md5hasher.update(input);
  return md5hasher.toString();
}

