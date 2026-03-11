import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for use in Server Components / Route Handlers.
 * Uses the public anon key — safe for read-only public queries.
 * A new client is created per call (no shared singleton, safe for concurrent requests).
 */
export function getSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  return createClient(url, anonKey, { auth: { persistSession: false } });
}
