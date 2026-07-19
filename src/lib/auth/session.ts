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

// 온보딩 폼 제출 전에는 auth.users만 생기고 public.users row는 없다 — 그 상태로
// 이탈했다 재접속하면 세션은 여전히 유효해서 계속 반쪽짜리 프로필로 앱에 들어오게 된다.
export async function hasOnboarded(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  return data !== null;
}
