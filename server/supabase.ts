import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "invoice-scraper-server" } },
  });
  console.log("[supabase] Connected");
} else {
  console.warn(
    "[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Cloud persistence is disabled."
  );
}

export const supabase = supabaseClient;
export const isSupabaseEnabled = supabaseClient !== null;

