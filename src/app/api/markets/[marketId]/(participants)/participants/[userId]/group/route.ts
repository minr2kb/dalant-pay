import { createParser } from "@routar/core";
import {
  err,
  marketRoleRoute,
  ok,
  parseRequest,
} from "@/lib/api/route-helpers";
import { participantsRouter } from "@/lib/api/router";
import { mapParticipant } from "@/lib/data/mappers";
import { STAFF_ROLES } from "@/types";

const assignGroupParser = createParser(
  participantsRouter.endpoints.assignGroup,
);

export const PATCH = marketRoleRoute<{ marketId: string; userId: string }>(
  STAFF_ROLES,
  async (req, { supabase, params }) => {
    const parsed = await parseRequest(assignGroupParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const { data, error } = await supabase
      .from("market_participants")
      .update({ group_id: body.groupId })
      .eq("market_id", params.marketId)
      .eq("user_id", params.userId)
      .select("*, user:users!user_id(*), group:groups(name)")
      .maybeSingle();

    if (error) return err("그룹 배정에 실패했어요", 500);
    if (!data) return err("참여자를 찾을 수 없어요", 404);
    return ok(mapParticipant(data));
  },
);
