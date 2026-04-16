import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    // Auto-checkout visitors still checked_in from previous days
    const { error: checkoutError, count: checkoutCount } = await supabase
      .from("visits")
      .update({
        status: "checked_out",
        check_out_time: new Date().toISOString(),
      })
      .eq("status", "checked_in")
      .lt("scheduled_date", today);

    // Expire pending/approved visits from previous days
    const { error: expireError, count: expireCount } = await supabase
      .from("visits")
      .update({ status: "expired" })
      .in("status", ["pending", "approved"])
      .lt("scheduled_date", today);

    if (checkoutError) console.error("Checkout error:", checkoutError);
    if (expireError) console.error("Expire error:", expireError);

    return new Response(
      JSON.stringify({
        success: true,
        checkedOut: checkoutCount ?? 0,
        expired: expireCount ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("Daily reset error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
