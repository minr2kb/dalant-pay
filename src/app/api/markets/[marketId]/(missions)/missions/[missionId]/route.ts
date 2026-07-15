import { createParser } from "@routar/core";
import {
  err,
  marketAdminRoute,
  ok,
  parseRequest,
  route,
} from "@/lib/api/route-helpers";
import { missionsRouter } from "@/lib/api/router";
import { getMission } from "@/lib/data/missions";
import { mapMission } from "@/lib/db";

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

export const PATCH = marketAdminRoute<{ marketId: string; missionId: string }>(
  async (req, { supabase, params }) => {
    const parsed = await parseRequest(updateMissionParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const update: Record<string, unknown> = {};
    if ("title" in body) update.title = body.title;
    if ("description" in body) update.description = body.description;
    if ("type" in body) update.type = body.type;
    if ("isGroup" in body) update.is_group = body.isGroup;
    if ("reward" in body) update.reward = body.reward;
    if ("limitCount" in body) update.limit_count = body.limitCount;
    if ("activeFrom" in body) update.active_from = body.activeFrom;
    if ("activeUntil" in body) update.active_until = body.activeUntil;
    if ("isActive" in body) update.is_active = body.isActive;
    if ("sortOrder" in body) update.sort_order = body.sortOrder;

    const { data, error } = await supabase
      .from("missions")
      .update(update)
      .eq("id", params.missionId)
      .select()
      .single();

    if (error || !data) return err(error?.message ?? "Not found", 404);
    return ok(mapMission(data as Record<string, unknown>));
  },
);

export const DELETE = marketAdminRoute<{ marketId: string; missionId: string }>(
  async (_req, { supabase, params }) => {
    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", params.missionId);
    if (error) return err(error.message, 404);
    return ok({ id: params.missionId });
  },
);
