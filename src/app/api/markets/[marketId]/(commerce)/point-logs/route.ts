import { err, marketRoleRoute, ok } from "@/lib/api/route-helpers";
import { listPointLogs } from "@/lib/data/point-logs";
import { STAFF_ROLES } from "@/types";

// 마켓 전체(또는 특정 유저)의 포인트 내역 — 현재 유일한 호출부는 admin 대시보드라 admin+owner 전용으로 제한.
export const GET = marketRoleRoute<{ marketId: string }>(
  STAFF_ROLES,
  async (req, { supabase, params }) => {
    const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
    try {
      return ok(await listPointLogs(supabase, params.marketId, { userId }));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);
