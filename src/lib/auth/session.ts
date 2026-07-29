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

const LAST_USER_KEY = "dp-last-user-id";

// marketsQuery.list() 등은 유저별로 다른 결과를 반환하는데, 캐시(인메모리 +
// IndexedDB)는 유저 구분 없이 origin 전체에 하나다. 로그아웃 버튼을 거치지 않고
// (기기 재사용, 세션 강제 교체 등) 다른 계정으로 바뀐 경우까지 잡으려고, "마지막으로
// 이 기기에서 로그인했던 유저"를 localStorage에 남겨 매번 대조한다.
export function didUserChange(userId: string): boolean {
  if (typeof window === "undefined") return false;
  const lastUserId = localStorage.getItem(LAST_USER_KEY);
  return lastUserId !== null && lastUserId !== userId;
}

export function rememberUserId(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_USER_KEY, userId);
}
