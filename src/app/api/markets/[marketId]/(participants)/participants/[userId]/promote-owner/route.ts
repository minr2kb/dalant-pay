import { err, marketRoleRoute, ok } from "@/lib/api/route-helpers";
import { mapParticipant } from "@/lib/data/mappers";

// 소유자만 다른 참여자를 소유자로 지정할 수 있다 — 위임이 아니라 추가 지정이라
// 여러 명이 동시에 소유자일 수 있다(admin이 여러 명일 수 있는 것과 동일한 모델).
export const POST = marketRoleRoute<{ marketId: string; userId: string }>(
  ["owner"],
  async (_req, { supabase, params }) => {
    const { marketId, userId } = params;

    const { data, error } = await supabase
      .from("market_participants")
      .update({ role: "owner" })
      .eq("market_id", marketId)
      .eq("user_id", userId)
      .select("*, user:users!user_id(*), group:groups(name)")
      .maybeSingle();

    if (error) return err("소유자 지정에 실패했어요", 500);
    if (!data) return err("참여자를 찾을 수 없어요", 404);

    return ok(mapParticipant(data));
  },
);
