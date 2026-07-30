import { err, marketRoleRoute, ok } from "@/lib/api/route-helpers";
import { sendPushToUsers } from "@/lib/push/send";
import { STAFF_ROLES } from "@/types";

export const POST = marketRoleRoute<{ marketId: string; logId: string }>(
  STAFF_ROLES,
  async (_req, { supabase, params, userId: voidedBy }) => {
    const { marketId, logId } = params;

    const { data, error } = await supabase.rpc("revoke_point_log", {
      p_market_id: marketId,
      p_log_id: logId,
      p_voided_by: voidedBy,
    });

    if (error) {
      if (error.message.includes("log not found"))
        return err("내역을 찾을 수 없어요", 404);
      if (error.message.includes("not revocable"))
        return err("철회할 수 없는 내역이에요", 422);
      if (error.message.includes("already voided"))
        return err("이미 철회된 내역이에요", 409);
      return err("철회에 실패했어요", 500);
    }

    const newBalance = (data as { newBalance: number }).newBalance;

    // ponytail: 알림은 부가 기능 — 실패해도 철회 자체는 이미 성공했으니 무시
    try {
      const [{ data: log }, { data: market }] = await Promise.all([
        supabase
          .from("point_logs")
          .select("user_id, amount, reason_type, mission_title, memo")
          .eq("id", logId)
          .maybeSingle(),
        supabase
          .from("markets")
          .select("point_label")
          .eq("id", marketId)
          .maybeSingle(),
      ]);
      if (log) {
        const label =
          log.reason_type === "mission"
            ? (log.mission_title as string | null)
            : (log.memo as string | null);
        await sendPushToUsers([log.user_id as string], {
          title: "지급이 철회됐어요",
          body: `${label ?? "지급"} ${Math.abs(log.amount as number)}${market?.point_label ?? "포인트"}이 철회됐어요`,
          url: `/markets/${marketId}/history`,
        });
      }
    } catch {}

    return ok({ id: logId, newBalance });
  },
);
