import { err, marketParticipantRoute, ok } from "@/lib/api/route-helpers";
import { listRecentMissionLogs } from "@/lib/data/point-logs";

// 다른 참여자의 최근 미션 인증 피드 — 마켓 참여자면 누구나 조회 가능 (admin 전용 아님).
export const GET = marketParticipantRoute<{ marketId: string }>(
  async (req, { supabase, params }) => {
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    try {
      return ok(await listRecentMissionLogs(supabase, params.marketId, limit));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);
