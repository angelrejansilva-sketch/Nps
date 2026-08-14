import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Bypasses RLS — server-only, used exclusively by the machine-to-machine
 * /api/sync/* routes (no logged-in user session exists for those calls).
 * Never import this from client components or any code reachable from the browser.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada neste ambiente.");
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
