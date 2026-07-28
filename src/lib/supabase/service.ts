/** biome-ignore-all lint/style/noNonNullAssertion: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are required env vars set at build/deploy time and must fail loudly if missing */
import { createClient } from "@supabase/supabase-js";

// API routes (server-side) use service role key to bypass RLS.
// Client-side code uses the SSR clients in src/lib/supabase/client.ts and server.ts.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey,
);
