import type { SupabaseClient } from "@supabase/supabase-js";

export type RemoteSessionStatus = "pending" | "valid" | "invalid";
export type SessionAction = "render" | "redirect";

export function decideSessionAction(
  hasLocalSession: boolean,
  remoteStatus: RemoteSessionStatus,
): SessionAction {
  if (!hasLocalSession) return "redirect";
  if (remoteStatus === "invalid") return "redirect";
  return "render";
}

export async function getLocalSession(
  supabase: SupabaseClient,
): Promise<{ userId: string } | null> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  return userId ? { userId } : null;
}

export async function verifySessionRemote(
  supabase: SupabaseClient,
): Promise<"valid" | "invalid"> {
  const { data, error } = await supabase.auth.getClaims();
  return !error && data ? "valid" : "invalid";
}
