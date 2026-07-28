import { createParser } from "@routar/core";
import { authRoute, err, ok, parseRequest } from "@/lib/api/route-helpers";
import { marketsRouter } from "@/lib/api/router";
import { canCreateMarket, listMarkets } from "@/lib/data/markets";
import { resolveDisplayName } from "@/lib/resolve-display-name";

export const dynamic = "force-dynamic";

export const GET = authRoute(async (_req, { supabase, userId }) => {
  try {
    return ok(await listMarkets(supabase, userId));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Error");
  }
});

const createMarketParser = createParser(marketsRouter.endpoints.create);

export const POST = authRoute(async (req, { supabase, userId }) => {
  const allowed = await canCreateMarket(supabase, userId);
  if (!allowed) return err("마켓을 생성할 권한이 없어요", 403);

  const parsed = await parseRequest(createMarketParser.parseRequest, {
    path: {},
    body: await req.json(),
  });
  if (parsed instanceof Response) return parsed;
  const { body } = parsed;

  const { data: userRow } = await supabase
    .from("users")
    .select("real_name")
    .eq("id", userId)
    .single();
  if (!userRow) return err("유저를 찾을 수 없어요", 404);

  const { displayName } = resolveDisplayName(
    userRow.real_name as string,
    new Set(),
  );

  const { data, error } = await supabase.rpc("create_market_with_owner", {
    p_title: body.title,
    p_description: body.description ?? "",
    p_point_label: body.pointLabel,
    p_admin_code: body.adminCode,
    p_starts_at: body.startsAt,
    p_ends_at: body.endsAt,
    p_owner_user_id: userId,
    p_owner_display_name: displayName,
  });

  if (error) return err(error.message);

  return ok({ marketId: (data as { marketId: string }).marketId }, 201);
});
