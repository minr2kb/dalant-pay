import type { Supabase } from "@/lib/api/route-helpers";

type IdempotentResult = { status: number; json: unknown };

// award_mission이 mission_logs UNIQUE(mission_id,user_id,slot)로 중복 인증을 막는 것과
// 같은 원리 — INSERT를 원자적 잠금으로 써서, 같은 키로 동시에 들어온 요청도 하나만
// 실제로 handler()를 실행하게 한다. key가 없으면(옵트인 안 한 호출자) 그냥 통과시킨다.
export async function withIdempotencyKey(
  supabase: Supabase,
  opts: {
    key: string | undefined;
    marketId: string;
    userId: string;
    endpoint: string;
  },
  handler: () => Promise<IdempotentResult>,
): Promise<IdempotentResult> {
  const { key, marketId, userId, endpoint } = opts;
  if (!key) return handler();

  const { error: claimError } = await supabase
    .from("idempotency_keys")
    .insert({ key, market_id: marketId, user_id: userId, endpoint });

  if (claimError) {
    if (claimError.code !== "23505") throw new Error(claimError.message);
    // 키 선점 실패 = 같은 요청이 이미 처리됐거나 처리 중 — 저장된 결과를 그대로 재생한다.
    const { data: existing } = await supabase
      .from("idempotency_keys")
      .select("status, response")
      .eq("key", key)
      .maybeSingle();
    if (existing?.status != null) {
      return { status: existing.status, json: existing.response };
    }
    return {
      status: 409,
      json: {
        error: "같은 요청이 이미 처리 중이에요. 잠시 후 다시 시도해주세요",
      },
    };
  }

  const result = await handler();
  await supabase
    .from("idempotency_keys")
    .update({ status: result.status, response: result.json })
    .eq("key", key);
  return result;
}
