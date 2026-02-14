import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client using the service role key.
 * Bypasses RLS — use only for trusted server code (e.g. API routes, Server Components).
 * For hackathon: we read from `games` with full access.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
