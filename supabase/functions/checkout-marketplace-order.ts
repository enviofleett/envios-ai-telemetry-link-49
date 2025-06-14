
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
    const { product_id, vehicle_ids } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No Authorization header.");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user?.email || !user?.id) throw new Error("User not authenticated.");

    // Fetch product/billing config
    const { data: product, error: errProduct } = await supabase
      .from("marketplace_products")
      .select("*, merchant_id, price, connection_fee")
      .eq("id", product_id)
      .maybeSingle();

    if (!product || errProduct) throw new Error("Product not found.");

    // Fetch merchant's commission rate
    const { data: merchant, error: errMerchant } = await supabase
      .from("marketplace_merchants")
      .select("id, commission_rate")
      .eq("id", product.merchant_id)
      .maybeSingle();

    if (!merchant || errMerchant) throw new Error("Merchant config error.");

    const quantity = vehicle_ids.length;
    const perVehicleTotal = Number(product.price) + Number(product.connection_fee);
    const totalAmount = Math.round(perVehicleTotal * quantity * 100);

    // Stripe checkout
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: product.title, description: product.description },
            unit_amount: Math.round(perVehicleTotal * 100),
          },
          quantity,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/marketplace/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/marketplace/orders/canceled`,
      metadata: {
        product_id: product.id,
        merchant_id: product.merchant_id,
        user_id: user.id,
        vehicle_ids: vehicle_ids.join(","),
        commission: merchant.commission_rate
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
