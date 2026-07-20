import { err, marketAdminRoute, ok } from "@/lib/api/route-helpers";

export const POST = marketAdminRoute<{ marketId: string; logId: string }>(
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
    return ok({ id: logId, newBalance });
  },
);
