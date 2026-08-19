import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEV_LOGIN_COOKIE } from "@/lib/dev-login";
import { createClient } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase/service";

// local(NODE_ENV=development)에서는 그냥 통과. 그 외(prod 포함)에서는
// /api/dev/login/unlock에서 한 번 발급받은 쿠키가 있어야 통과한다 - 그 비밀
// 토큰은 로그인 페이지 HTML 어디에도 노출되지 않으므로, unlock URL을 직접
// 아는 사람만 이 엔드포인트를 켤 수 있다.
// Uses generateLink+verifyOtp (not signInWithPassword) so it isn't blocked by captcha protection on the password grant.
const DEV_EMAIL = "dev@local.test";
const DEV_LOGIN_SECRET = process.env.DEV_LOGIN_SECRET;

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    const unlocked = (await cookies()).get(DEV_LOGIN_COOKIE)?.value;
    if (!DEV_LOGIN_SECRET || unlocked !== DEV_LOGIN_SECRET) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  const { data: link, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: DEV_EMAIL,
    });
  if (linkError) return new NextResponse(linkError.message, { status: 500 });

  const ssrClient = await createClient();
  const { data: verified, error: verifyError } = await ssrClient.auth.verifyOtp(
    {
      token_hash: link.properties.hashed_token,
      type: "email",
    },
  );
  if (verifyError || !verified.user)
    return new NextResponse(verifyError?.message ?? "verify failed", {
      status: 500,
    });

  await supabase.from("users").upsert({
    id: verified.user.id,
    name: "개발자",
    real_name: "개발자",
    birth_date: "2000-01-01",
    gender: "male",
  });

  return NextResponse.redirect(new URL("/markets", req.url));
}
