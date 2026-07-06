/** biome-ignore-all lint/style/noNonNullAssertion: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are required env vars set at build/deploy time and must fail loudly if missing */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
