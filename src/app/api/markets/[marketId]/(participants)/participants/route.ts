import {
  authRoute,
  err,
  marketParticipantRoute,
  ok,
} from "@/lib/api/route-helpers";
import { joinMarket, listParticipants } from "@/lib/data/participants";

// 랭킹 화면 등에서 마켓 참여자 전원이 서로의 잔액을 볼 수 있어야 하므로 admin 전용은
// 아니지만, 이 마켓 참여자가 아닌 로그인 유저까지 열어주면 안 된다 (IDOR).
export const GET = marketParticipantRoute<{ marketId: string }>(
  async (_req, { supabase, params }) => {
    try {
      return ok(await listParticipants(supabase, params.marketId));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);

export const POST = authRoute<{ marketId: string }>(
  async (_req, { supabase, params, userId }) => {
    try {
      const result = await joinMarket(supabase, params.marketId, userId);
      return ok(result);
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);
