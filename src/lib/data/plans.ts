import type { SupabaseClient } from "@supabase/supabase-js";

export interface Plan {
  id: string;
  marketLimit: number | null;
  participantLimit: number | null;
  groupFeature: boolean;
}

function mapPlan(row: Record<string, unknown>): Plan {
  return {
    id: row.id as string,
    marketLimit: row.market_limit as number | null,
    participantLimit: row.participant_limit as number | null,
    groupFeature: row.group_feature as boolean,
  };
}

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string,
): Promise<Plan> {
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("plan_id")
    .eq("id", userId)
    .single();
  if (userError || !userRow) throw new Error("유저를 찾을 수 없어요");

  const { data: plan, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", userRow.plan_id as string)
    .single();
  if (error || !plan) throw new Error("플랜을 찾을 수 없어요");
  return mapPlan(plan as Record<string, unknown>);
}

// 마켓 owner의 플랜 - 참가자 정원, 그룹 기능처럼 마켓 단위로 게이트할 때 쓴다.
// 마켓은 owner가 여러 명일 수 있어서(promote-owner 참고) 그중 가장 관대한
// 플랜(sort_order 최고값)을 기준으로 삼는다 - 한 명이라도 업그레이드했으면
// 마켓 전체가 그 혜택을 받는 편이 "가장 낮은 owner 기준으로 막힌다"보다 낫다.
//
// PostgREST embed(`plans!plan_id(*)`)로 한 번에 조인하면 supabase-js가 제네릭
// Database 타입 없이는 to-one 관계를 array로 추론해 실제 런타임 응답 모양과
// 어긋나기 쉽다 - 얕은 쿼리 3번으로 나눠 그 모호함을 피한다.
export async function getMarketOwnerPlan(
  supabase: SupabaseClient,
  marketId: string,
): Promise<Plan> {
  const { data: owners } = await supabase
    .from("market_participants")
    .select("user_id")
    .eq("market_id", marketId)
    .eq("role", "owner");
  const ownerIds = (owners ?? []).map((o) => o.user_id as string);
  if (ownerIds.length === 0) throw new Error("플랜을 찾을 수 없어요");

  const { data: ownerUsers } = await supabase
    .from("users")
    .select("plan_id")
    .in("id", ownerIds);
  const planIds = [
    ...new Set((ownerUsers ?? []).map((u) => u.plan_id as string)),
  ];
  if (planIds.length === 0) throw new Error("플랜을 찾을 수 없어요");

  const { data: plan, error } = await supabase
    .from("plans")
    .select("*")
    .in("id", planIds)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  if (error || !plan) throw new Error("플랜을 찾을 수 없어요");
  return mapPlan(plan as Record<string, unknown>);
}
