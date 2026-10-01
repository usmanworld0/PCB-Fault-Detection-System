import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ejlsltjncguqggajpmlt.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

let serverClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (!serverClient) {
    serverClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serverClient;
}
