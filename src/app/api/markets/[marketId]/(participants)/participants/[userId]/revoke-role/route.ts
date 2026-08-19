import { err, marketRoleRoute, ok } from "@/lib/api/route-helpers";
import { mapParticipant } from "@/lib/data/mappers";

// 소유자만 호출 가능, admin/owner 구분 없이 role을 'user'로 되돌린다.
// 마지막 남은 소유자는 스스로도 못 내려놓게 막는다 - 그러면 이 마켓을 아무도
// 설정할 수 없는 상태(소유자 지정 권한 자체가 소유자 전용)로 굳어버린다.
export const POST = marketRoleRoute<{ marketId: string; userId: string }>(
  ["owner"],
  async (_req, { supabase, params }) => {
    const { marketId, userId } = params;

    const { data: target } = await supabase
      .from("market_participants")
      .select("role")
      .eq("market_id", marketId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!target) return err("참여자를 찾을 수 없어요", 404);
    if (target.role === "user") return err("이미 일반 참여자예요", 422);

    if (target.role === "owner") {
      const { count } = await supabase
        .from("market_participants")
        .select("id", { count: "exact", head: true })
        .eq("market_id", marketId)
        .eq("role", "owner");
      if ((count ?? 0) <= 1)
        return err("마지막 남은 소유자는 권한을 내려놓을 수 없어요", 422);
    }

    const { data, error } = await supabase
      .from("market_participants")
      .update({ role: "user" })
      .eq("market_id", marketId)
      .eq("user_id", userId)
      .select("*, user:users!user_id(*), group:groups(name)")
      .maybeSingle();

    if (error) return err("권한 박탈에 실패했어요", 500);
    if (!data) return err("참여자를 찾을 수 없어요", 404);

    return ok(mapParticipant(data));
  },
);
