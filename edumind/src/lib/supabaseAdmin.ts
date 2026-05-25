// SERVER-ONLY Supabase client using the service-role key.
// The service role bypasses Row Level Security — this client must never be
// imported from a "use client" component or any code that ships to the browser.

if (typeof window !== "undefined") {
  throw new Error(
    "supabaseAdmin imported in browser context — this module is server-only " +
      "and exposes SUPABASE_SERVICE_ROLE_KEY. Use a fetch to an /api route instead."
  );
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
