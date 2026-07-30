import { createParser } from "@routar/core";
import { authRoute, err, ok, parseRequest } from "@/lib/api/route-helpers";
import { pushRouter } from "@/lib/api/router";

const unsubscribeParser = createParser(pushRouter.endpoints.unsubscribe);

export const POST = authRoute(async (req, { supabase, userId }) => {
  const parsed = await parseRequest(unsubscribeParser.parseRequest, {
    body: await req.json(),
  });
  if (parsed instanceof Response) return parsed;
  const { body } = parsed;

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", body.endpoint);
  if (error) return err("구독 해제에 실패했어요", 500);

  return ok({ ok: true });
});
