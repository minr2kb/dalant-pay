import { createParser } from "@routar/core";
import { authRoute, err, ok, parseRequest } from "@/lib/api/route-helpers";
import { adminRouter } from "@/lib/api/router";

const adminAuthParser = createParser(adminRouter.endpoints.auth);

const attempts = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export const POST = authRoute<{ marketId: string }>(
  async (req, { supabase, params, userId }) => {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    if (!rateLimit(ip)) return err("Too many attempts", 429);

    const parsed = await parseRequest(adminAuthParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const { data: market } = await supabase
      .from("markets")
      .select("admin_code")
      .eq("id", params.marketId)
      .single();

    if (!market || market.admin_code !== body.code)
      return err("Invalid code", 403);

    const { error } = await supabase
      .from("market_participants")
      .update({ role: "admin" })
      .eq("market_id", params.marketId)
      .eq("user_id", userId);

    if (error) return err(error.message);
    return ok({ granted: true });
  },
);
