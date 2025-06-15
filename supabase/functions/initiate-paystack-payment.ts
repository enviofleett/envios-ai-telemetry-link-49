
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

function log(...args: any[]) {
  console.log("[initiate-paystack-payment]", ...args);
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Server keys (for event logging only; Paystack calls are direct)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  let user_id: string | null = null;
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No Authorization" }), { status: 401, headers: corsHeaders });
  }
  try {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace(/Bearer\s+/i, ""));
    if (!user || !user.id) throw new Error("Not authenticated");
    user_id = user.id;
  } catch (err) {
    log("Auth failed", err);
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: corsHeaders });
  }

  // Parse data
  let payload: any = {};
  try {
    payload = await req.json();
  } catch (e) {
    log("Bad payload", e);
    return new Response(JSON.stringify({ error: "Invalid request JSON" }), { status: 400, headers: corsHeaders });
  }
  const { order_id, merchant_id, amount, email } = payload;
  if (!order_id || !merchant_id || !amount || !email) {
    return new Response(JSON.stringify({ error: "Missing required arguments" }), { status: 400, headers: corsHeaders });
  }

  // Find admin/merchant paystack config
  let paystackPublicKey = "";
  let environment = "test";
  try {
    // Only one paystack_settings table row is supported (per user), generally store one
    const { data: settings } = await supabase
      .from("paystack_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (!settings || !settings.public_key) {
      return new Response(JSON.stringify({ error: "Paystack not configured" }), { status: 500, headers: corsHeaders });
    }
    paystackPublicKey = settings.public_key;
    environment = settings.environment ?? "test";
  } catch (err) {
    log("Loading settings failed", err);
    return new Response(JSON.stringify({ error: "Settings load error" }), { status: 500, headers: corsHeaders });
  }

  // Paystack API endpoint
  const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
  const paystackBase = environment === "live" ? "https://api.paystack.co" : "https://api.paystack.co";
  if (!PAYSTACK_SECRET_KEY) {
    log("PAYSTACK_SECRET_KEY is not set");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers: corsHeaders });
  }

  // Generate unique reference for matching
  const reference = `fleetapp_${order_id}_${Date.now()}`;

  // Prepare initialize endpoint
  try {
    // Prepare Paystack amount (kobo)
    const paystackAmount = Math.round(Number(amount) * 100);

    // Create transaction in Paystack
    const paystackRes = await fetch(`${paystackBase}/transaction/initialize`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: paystackAmount,
        reference,
        callback_url: `${req.headers.get("origin") ?? "https://bjkqxmvjuewshomihjqm.lovable.app"}/marketplace/orders/success`,
        metadata: { order_id, merchant_id }
      })
    });
    const paystackData = await paystackRes.json();
    if (!paystackRes.ok || !paystackData.data?.authorization_url) {
      log("Error calling Paystack:", paystackData);
      return new Response(JSON.stringify({ error: paystackData.message || "Failed to initialize Paystack payment" }), { status: 500, headers: corsHeaders });
    }

    // Log escrow transaction before payment started
    await supabase
      .from("marketplace_escrow_transactions")
      .insert({
        order_id,
        buyer_id: user_id,
        merchant_id,
        amount,
        status: "pending",
        paystack_reference: reference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ url: paystackData.data.authorization_url, reference }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    log("Paystack error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
