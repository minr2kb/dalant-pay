import { createParser } from "@routar/core";
import { authRoute, err, ok, parseRequest } from "@/lib/api/route-helpers";
import { pushRouter } from "@/lib/api/router";

const subscribeParser = createParser(pushRouter.endpoints.subscribe);

// endpoint가 이미 다른 유저로 등록돼 있으면(기기 재로그인 등) 최신 유저로 덮어쓴다.
export const POST = authRoute(async (req, { supabase, userId }) => {
  const parsed = await parseRequest(subscribeParser.parseRequest, {
    body: await req.json(),
  });
  if (parsed instanceof Response) return parsed;
  const { body } = parsed;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) return err("구독 등록에 실패했어요", 500);

  return ok({ ok: true });
});
