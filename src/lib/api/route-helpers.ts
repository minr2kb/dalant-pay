import type { RequestShape } from "@routar/core";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createSsrClient } from "@/lib/supabase/server"; // session auth only
import { supabase } from "@/lib/supabase/service"; // service role — bypasses RLS for trusted server code

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

// 세 라우트 래퍼(authRoute/marketParticipantRoute/marketAdminRoute) 공통 부분 —
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

export function marketAdminRoute<P extends { marketId: string }>(
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
      .single();
    if (p?.role !== "admin") return err("Forbidden", 403);
    return fn(req, { supabase, params, userId });
  };
}
