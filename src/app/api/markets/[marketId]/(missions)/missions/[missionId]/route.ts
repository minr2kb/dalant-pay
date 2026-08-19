import { createParser } from "@routar/core";
import {
  err,
  marketRoleRoute,
  ok,
  parseRequest,
  route,
} from "@/lib/api/route-helpers";
import { missionsRouter } from "@/lib/api/router";
import { mapMission } from "@/lib/data/mappers";
import { getMission } from "@/lib/data/missions";
import { sendPushToMarketParticipants } from "@/lib/push/send";
import { STAFF_ROLES } from "@/types";

const updateMissionParser = createParser(missionsRouter.endpoints.update);

export const GET = route<{ missionId: string }>(
  async (req, { supabase, params }) => {
    const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
    try {
      return ok(await getMission(supabase, params.missionId, { userId }));
    } catch (e) {
      console.error("[GET mission]", e);
      return err("Not found", 404);
    }
  },
);

export const PATCH = marketRoleRoute<{ marketId: string; missionId: string }>(
  STAFF_ROLES,
  async (req, { supabase, params }) => {
    const parsed = await parseRequest(updateMissionParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    if ("rewardMin" in body || "rewardMax" in body) {
      const minIsNull = (body.rewardMin ?? null) === null;
      const maxIsNull = (body.rewardMax ?? null) === null;
      if (minIsNull !== maxIsNull)
        return err("차등지급은 최소/최대 금액을 모두 입력해야 해요", 400);
      if (
        !minIsNull &&
        !maxIsNull &&
        (body.rewardMax as number) < (body.rewardMin as number)
      )
        return err("최대 금액이 최소 금액보다 작아요", 400);
    }

    const update: Record<string, unknown> = {};
    if ("title" in body) update.title = body.title;
    if ("description" in body) update.description = body.description;
    if ("type" in body) update.type = body.type;
    if ("isGroup" in body) update.is_group = body.isGroup;
    if ("reward" in body) update.reward = body.reward;
    if ("rewardMin" in body) update.reward_min = body.rewardMin ?? null;
    if ("rewardMax" in body) update.reward_max = body.rewardMax ?? null;
    if (body.rewardMin != null) update.reward = body.rewardMin;
    if ("limitCount" in body) update.limit_count = body.limitCount;
    if ("activeFrom" in body) update.active_from = body.activeFrom;
    if ("activeUntil" in body) update.active_until = body.activeUntil;
    if ("isActive" in body) update.is_active = body.isActive;
    if ("sortOrder" in body) update.sort_order = body.sortOrder;

    // 새로 활성화되는 순간만 알림감 - 이미 활성 중인 미션을 다른 이유로 수정할 때마다
    // 매번 재알림하면 스팸이 되니, 꺼져있다가 켜지는 전환에만 보낸다.
    let wasInactive = false;
    if (update.is_active === true) {
      const { data: before } = await supabase
        .from("missions")
        .select("is_active")
        .eq("id", params.missionId)
        .maybeSingle();
      wasInactive = before?.is_active === false;
    }

    const { data, error } = await supabase
      .from("missions")
      .update(update)
      .eq("id", params.missionId)
      .select()
      .single();

    if (error || !data) return err(error?.message ?? "Not found", 404);

    // ponytail: 알림은 부가 기능 - 실패해도 활성화 자체는 이미 성공했으니 무시
    if (wasInactive) {
      try {
        await sendPushToMarketParticipants(params.marketId, {
          title: "새 미션이 열렸어요",
          body: `${data.title as string} 미션을 확인해보세요`,
          url: `/markets/${params.marketId}/missions/${params.missionId}`,
        });
      } catch {}
    }

    return ok(mapMission(data as Record<string, unknown>));
  },
);

export const DELETE = marketRoleRoute<{ marketId: string; missionId: string }>(
  STAFF_ROLES,
  async (_req, { supabase, params }) => {
    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", params.missionId);
    if (error) return err(error.message, 404);
    return ok({ id: params.missionId });
  },
);
