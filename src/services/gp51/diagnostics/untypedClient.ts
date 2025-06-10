
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bjkqxmvjuewshomihjqm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa3F4bXZqdWV3c2hvbWloanFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMzk4MzEsImV4cCI6MjA2NDYxNTgzMX0.VbyYBsPAp_a699yZ3xHtGGzljIQPm24EnwXLaGcsJb0";

// Create an untyped Supabase client to avoid deep type inference issues
export const untypedSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
