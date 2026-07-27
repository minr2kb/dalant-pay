import { createParser } from "@routar/core";
import {
  err,
  marketAdminRoute,
  ok,
  parseRequest,
  route,
} from "@/lib/api/route-helpers";
import { missionsRouter } from "@/lib/api/router";
import { listMissions } from "@/lib/data/missions";
import { mapMission } from "@/lib/db";

const createMissionParser = createParser(missionsRouter.endpoints.create);

export const GET = route<{ marketId: string }>(
  async (req, { supabase, params }) => {
    const status = req.nextUrl.searchParams.get("status") as
      | "active"
      | "upcoming"
      | "past"
      | null;
    const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
    try {
      return ok(
        await listMissions(supabase, params.marketId, {
          userId,
          status: status ?? undefined,
        }),
      );
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);

export const POST = marketAdminRoute<{ marketId: string }>(
  async (req, { supabase, params }) => {
    const parsed = await parseRequest(createMissionParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const { data: last } = await supabase
      .from("missions")
      .select("sort_order")
      .eq("market_id", params.marketId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextSortOrder = ((last?.sort_order as number | undefined) ?? 0) + 1;

    const rewardMin = body.rewardMin ?? null;
    const rewardMax = body.rewardMax ?? null;
    if ((rewardMin === null) !== (rewardMax === null))
      return err("차등지급은 최소/최대 금액을 모두 입력해야 해요", 400);
    if (rewardMin !== null && rewardMax !== null && rewardMax < rewardMin)
      return err("최대 금액이 최소 금액보다 작아요", 400);

    const { data, error } = await supabase
      .from("missions")
      .insert({
        market_id: params.marketId,
        title: body.title,
        description: body.description ?? null,
        type: body.type,
        is_group: body.isGroup,
        reward: rewardMin ?? body.reward,
        reward_min: rewardMin,
        reward_max: rewardMax,
        limit_count: body.limitCount,
        active_from: body.activeFrom,
        active_until: body.activeUntil,
        is_active: false,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error || !data) return err(error?.message ?? "Error");
    return ok(mapMission(data as Record<string, unknown>), 201);
  },
);
