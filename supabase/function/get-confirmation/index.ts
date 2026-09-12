// Public endpoint used by confirm.html. No auth required — the random
// confirm_token in the URL is the capability. This is why it must NEVER
// return id_document_path, receipt_path, bank_name, account_holder,
// account_number, phone, email, or notes: those stay admin-only.
//
// Deploy with:
//   supabase functions deploy get-confirmation --no-verify-jwt
//
// Requires no extra secrets — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// are provided automatically in the Edge Function runtime.

import { createClient } from "jsr:@supabase/supabase-js@2";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Restricts browser access to SITE_URL (set via `supabase secrets set
// SITE_URL=https://yourdomain.com`). Falls back to "*" if it isn't set,
// so this still works out of the box, but setting SITE_URL is recommended:
// the anon key + a valid token are already enough to call this from a
// script, but locking CORS down stops it being trivially embedded/scraped
// from arbitrary third-party pages in a browser context.
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";

  if (!UUID_RE.test(token)) {
    return json({ error: "invalid_token" }, 400);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: row, error } = await supabaseAdmin
    .from("registration")
    .select("full_name, status, created_at, photo_path, approved")
    .eq("confirm_token", token)
    .maybeSingle();

  if (error) {
    console.error(error);
    return json({ error: "lookup_failed" }, 500);
  }
  if (!row) {
    return json({ error: "not_found" }, 404);
  }

  let photoUrl: string | null = null;
  if (row.photo_path && row.approved) {
    const { data: signed, error: signErr } = await supabaseAdmin
      .storage
      .from("registrations")
      .createSignedUrl(row.photo_path, 3600); // 1 hour, regenerated on every page load
    if (signErr) console.error(signErr);
    photoUrl = signed?.signedUrl ?? null;
  }

  return json({
    full_name: row.full_name,
    status: row.status,
    created_at: row.created_at,
    photo_url: photoUrl,
    approved: row.approved,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
