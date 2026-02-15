import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Request timeout so we fail fast instead of hanging 8–10s on missing env or network issues. */
const SUPABASE_FETCH_TIMEOUT_MS = 12_000;

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), SUPABASE_FETCH_TIMEOUT_MS);
  return fetch(input, {
    ...init,
    signal: init?.signal ?? controller.signal,
  }).finally(() => clearTimeout(id));
}

/**
 * Server-side Supabase client using the service role key.
 * Bypasses RLS use only for trusted server code (e.g. API routes, Server Components).
 * Uses a 12s fetch timeout so missing env or network issues fail fast instead of hanging.
 */
function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: { fetch: fetchWithTimeout },
  });
}

export const supabase = createSupabaseClient();
