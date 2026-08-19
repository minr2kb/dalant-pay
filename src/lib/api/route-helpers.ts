import type { RequestShape } from "@routar/core";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createSsrClient } from "@/lib/supabase/server"; // session auth only
import { supabase } from "@/lib/supabase/service"; // service role - bypasses RLS for trusted server code
import { isStaffRole, type Role } from "@/types";

export { isStaffRole };

export type Supabase = typeof supabase;

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Runs a `createParser(spec).parseRequest` against the raw request envelope,
 * returning the validated data or a 400 response. Route handlers check
 * `if (parsed instanceof Response) return parsed;` before using the result.
 */
export async function parseRequest<T>(
  parse: (raw: RequestShape) => Promise<T>,
  raw: RequestShape,
): Promise<T | Response> {
  try {
    return await parse(raw);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Invalid request", 400);
  }
}

type RouteCtx<P> = { supabase: Supabase; params: P };
type AuthRouteCtx<P> = RouteCtx<P> & { userId: string };

export function route<P = Record<string, string>>(
  fn: (req: NextRequest, ctx: RouteCtx<P>) => Promise<Response>,
) {
  return async (req: NextRequest, props: { params: Promise<P> }) => {
    const params = await props.params;
    return fn(req, { supabase, params });
  };
}

// 세 라우트 래퍼(authRoute/marketParticipantRoute/marketRoleRoute) 공통 부분 -
// params와 세션 클라이언트를 병렬로 받아온 뒤 claims를 확인한다. 실패 시 401 Response를 돌려준다.
async function authenticate<P>(props: { params: Promise<P> }) {
  const [params, ssrClient] = await Promise.all([
    props.params,
    createSsrClient(),
  ]);
  const { data } = await ssrClient.auth.getClaims();
  if (!data) return err("Unauthorized", 401);
  return { params, userId: data.claims.sub };
}

export function authRoute<P = Record<string, string>>(
  fn: (req: NextRequest, ctx: AuthRouteCtx<P>) => Promise<Response>,
) {
  return async (req: NextRequest, props: { params: Promise<P> }) => {
    const auth = await authenticate(props);
    if (auth instanceof Response) return auth;
    return fn(req, { supabase, ...auth });
  };
}

export function marketParticipantRoute<P extends { marketId: string }>(
  fn: (req: NextRequest, ctx: AuthRouteCtx<P>) => Promise<Response>,
) {
  return async (req: NextRequest, props: { params: Promise<P> }) => {
    const auth = await authenticate(props);
    if (auth instanceof Response) return auth;
    const { params, userId } = auth;
    const { data: p } = await supabase
      .from("market_participants")
      .select("id")
      .eq("market_id", params.marketId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!p) return err("Forbidden", 403);
    return fn(req, { supabase, params, userId });
  };
}

export function marketRoleRoute<P extends { marketId: string }>(
  allowedRoles: Role[],
  fn: (req: NextRequest, ctx: AuthRouteCtx<P>) => Promise<Response>,
) {
  return async (req: NextRequest, props: { params: Promise<P> }) => {
    const auth = await authenticate(props);
    if (auth instanceof Response) return auth;
    const { params, userId } = auth;
    const { data: p } = await supabase
      .from("market_participants")
      .select("role")
      .eq("market_id", params.marketId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!p || !allowedRoles.includes(p.role as Role))
      return err("Forbidden", 403);
    return fn(req, { supabase, params, userId });
  };
}

// transfer/orders/미션 인증/포인트 지급/참여(join) 라우트가 공통으로 쓰는 마켓
// 활성기간 체크 - 예전엔 transfer 라우트에만 있었다. 마켓 종료(ends_at을
// 현재로 설정)가 모든 거래를 막으려면 이 체크가 해당 라우트 전부에 있어야 한다.
export async function assertMarketActive(
  marketId: string,
): Promise<Response | null> {
  const { data: market, error } = await supabase
    .from("markets")
    .select("starts_at, ends_at, deleted_at")
    .eq("id", marketId)
    .single();
  // 없는 마켓/조회 실패는 fail-closed - 통과시키면 종료된 마켓에서 거래가 열린다.
  if (error || !market) return err("마켓을 찾을 수 없습니다", 404);
  if (market.deleted_at) return err("삭제된 마켓입니다", 403);
  const now = new Date();
  if (market.starts_at && new Date(market.starts_at as string) > now)
    return err("마켓이 아직 시작되지 않았습니다", 403);
  if (market.ends_at && new Date(market.ends_at as string) < now)
    return err("마켓이 종료되었습니다", 403);
  return null;
}
