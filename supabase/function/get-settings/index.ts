// Public endpoint used by whatsapp-button.js on every page. No auth
// required — this only ever returns non-sensitive display settings.
//
// Deploy with:
//   supabase functions deploy get-settings --no-verify-jwt
//
// Requires no extra secrets — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// are provided automatically in the Edge Function runtime.

import { createClient } from "jsr:@supabase/supabase-js@2";

// See get-confirmation for why this defaults to "*" but SITE_URL is recommended.
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: row, error } = await supabaseAdmin
    .from("r_site_settings")
    .select("whatsapp_number, payment_bank_name, payment_account_name, payment_account_number")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error(error);
    return json({ error: "lookup_failed" }, 500);
  }

  return json({
    whatsapp_number: row?.whatsapp_number ?? null,
    payment_bank_name: row?.payment_bank_name ?? null,
    payment_account_name: row?.payment_account_name ?? null,
    payment_account_number: row?.payment_account_number ?? null,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
