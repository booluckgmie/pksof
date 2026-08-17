import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const configErrorMessage =
  "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Locally: copy .env.example to .env and fill in your Supabase project's values. On Netlify: add them under Site configuration -> Environment variables, then redeploy.";

const client: SupabaseClient | null = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseKey!) : null;

/** Throws a clear, catchable error instead of crashing at module load when env vars are missing. */
export function getSupabase(): SupabaseClient {
  if (!client) throw new Error(configErrorMessage);
  return client;
}
