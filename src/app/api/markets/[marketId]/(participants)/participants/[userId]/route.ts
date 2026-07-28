import { authRoute, err, isStaffRole, ok } from "@/lib/api/route-helpers";
import { getParticipant } from "@/lib/data/participants";

// 잔액/실명/전체 거래내역이 실리는 상세 조회라 본인이거나 이 마켓 admin/owner일 때만 허용.
export const GET = authRoute<{ marketId: string; userId: string }>(
  async (_req, { supabase, params, userId: callerId }) => {
    if (callerId !== params.userId) {
      const { data: caller } = await supabase
        .from("market_participants")
        .select("role")
        .eq("market_id", params.marketId)
        .eq("user_id", callerId)
        .maybeSingle();
      if (!isStaffRole(caller?.role)) return err("Forbidden", 403);
    }
    try {
      return ok(await getParticipant(supabase, params.marketId, params.userId));
    } catch {
      return err("Not found", 404);
    }
  },
);
