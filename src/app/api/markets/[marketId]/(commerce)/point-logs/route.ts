import { authRoute, err, isStaffRole, ok } from "@/lib/api/route-helpers";
import { listPointLogs } from "@/lib/data/point-logs";

// 마켓 전체 내역 조회는 admin/owner 전용, 본인 내역만 조회하는 건 일반 유저도
// 허용 — history 페이지가 자기 userId로 페이지네이션 요청을 보낸다.
export const GET = authRoute<{ marketId: string }>(
  async (req, { supabase, params, userId: callerId }) => {
    const { marketId } = params;
    const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
    const page = req.nextUrl.searchParams.get("page");
    const pageSize = req.nextUrl.searchParams.get("pageSize");

    if (userId !== callerId) {
      const { data: caller } = await supabase
        .from("market_participants")
        .select("role")
        .eq("market_id", marketId)
        .eq("user_id", callerId)
        .maybeSingle();
      if (!isStaffRole(caller?.role)) return err("Forbidden", 403);
    }

    try {
      return ok(
        await listPointLogs(supabase, marketId, {
          userId,
          page: page ? Number(page) : undefined,
          pageSize: pageSize ? Number(pageSize) : undefined,
        }),
      );
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);
