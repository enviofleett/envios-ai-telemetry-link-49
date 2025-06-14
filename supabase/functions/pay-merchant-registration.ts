
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { merchant_id } = await req.json();
    // Get merchant from DB
    const { data: merchant, error } = await supabase.from("marketplace_merchants").select().eq("id", merchant_id).maybeSingle();
    if (!merchant || error) throw new Error("Merchant not found.");

    // Get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No Authorization header.");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user?.email) throw new Error("User not authenticated.");

    // Stripe logic (create checkout for registration fee)
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Marketplace Merchant Registration (${merchant.org_name})` },
            unit_amount: Math.round(Number(merchant.registration_fee) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/merchant/onboarding/success`,
      cancel_url: `${req.headers.get("origin")}/merchant/onboarding/canceled`,
      metadata: { merchant_id: merchant.id }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400
    });
  }
});
