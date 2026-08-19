import { err, marketParticipantRoute, ok } from "@/lib/api/route-helpers";
import { listEarnedTotals } from "@/lib/data/point-logs";

// 랭킹용 유저별 누적 획득량 - 마켓 참여자면 누구나 조회 가능 (admin 전용 아님).
export const GET = marketParticipantRoute<{ marketId: string }>(
  async (_req, { supabase, params }) => {
    try {
      return ok(await listEarnedTotals(supabase, params.marketId));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);
