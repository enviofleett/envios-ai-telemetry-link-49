
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { createHmac } from "https://deno.land/std@0.190.0/hash/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
  "Content-Type": "application/json"
};

function log(...args: any[]) {
  console.log("[paystack-webhook]", ...args);
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let body: any;
  let rawBodyStr: string;
  try {
    rawBodyStr = await req.text();
    body = JSON.parse(rawBodyStr);
  } catch (err) {
    log("Invalid JSON body", err);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  // Read Paystack secret from env
  const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!PAYSTACK_SECRET_KEY) {
    log("PAYSTACK_SECRET_KEY is not set");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers: corsHeaders });
  }

  // Verify HMAC signature
  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    log("Missing signature");
    return new Response(JSON.stringify({ error: "Signature missing" }), { status: 400, headers: corsHeaders });
  }

  const localHmac = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PAYSTACK_SECRET_KEY),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"]
  );
  const signData = new TextEncoder().encode(rawBodyStr);
  const hmacBuffer = await crypto.subtle.sign("HMAC", localHmac, signData);
  const localSignature = Array.from(new Uint8Array(hmacBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

  if (localSignature !== signature) {
    log("Signature mismatch", localSignature, "vs", signature);
    return new Response(JSON.stringify({ error: "Signature mismatch" }), { status: 401, headers: corsHeaders });
  }

  // Supabase client (service role for event log)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Always: log this event
  const event_type = body?.event ?? "unknown";
  const reference = body?.data?.reference ?? null;

  const { error: logError } = await supabase.from("marketplace_webhook_events").insert({
    type: "paystack",
    event: event_type,
    reference: reference,
    payload: body,
    status: "received",
    received_at: new Date().toISOString(),
    processed_at: null
  });
  if (logError) log("Failed to log webhook event:", logError);

  // Handle main event
  try {
    if (event_type === "charge.success" && body.data.status === "success") {
      // Find escrow tx by paystack_reference
      const ref = body.data.reference;
      if (ref) {
        const { data: escrowTx, error: escrowQueryError } = await supabase
          .from("marketplace_escrow_transactions")
          .select("*")
          .eq("paystack_reference", ref)
          .maybeSingle();

        if (!escrowQueryError && escrowTx && escrowTx.status !== "released") {
          // Update escrow to 'held'/'released', as per business logic
          const { error: updateError } = await supabase
            .from("marketplace_escrow_transactions")
            .update({
              status: "held",
              updated_at: new Date().toISOString(),
              released_at: null,
              paystack_reference: ref,
            })
            .eq("id", escrowTx.id);

          if (!updateError) {
            // Optionally update order
            if (escrowTx.order_id) {
              await supabase
                .from("marketplace_orders")
                .update({
                  payment_status: "completed",
                  escrow_status: "held",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", escrowTx.order_id);
            }
          }
        }
      }
    }

    // Mark processed
    await supabase.from("marketplace_webhook_events").update({
      status: "processed",
      processed_at: new Date().toISOString()
    }).eq("reference", reference).eq("type", "paystack");
  } catch (err) {
    log("Error processing webhook event", err);
    // log processing failure
    await supabase.from("marketplace_webhook_events").update({
      status: "error",
      error_message: String(err)
    }).eq("reference", reference).eq("type", "paystack");
    return new Response(JSON.stringify({ error: "Processing failed" }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
});
