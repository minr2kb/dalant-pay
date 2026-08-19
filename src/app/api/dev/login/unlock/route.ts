import { NextResponse } from "next/server";
import { DEV_LOGIN_COOKIE } from "@/lib/dev-login";

// 이 URL을 직접 아는(?token=DEV_LOGIN_SECRET) 사람만 브라우저에 쿠키를 심어서
// /login 화면의 "개발자 로그인" 버튼(prod에서는 글씨색만 지워 안 보임)을 켠다.
// 토큰 자체는 어떤 HTML/JS 번들에도 나타나지 않는다.
const DEV_LOGIN_SECRET = process.env.DEV_LOGIN_SECRET;

export async function GET(req: Request) {
  if (!DEV_LOGIN_SECRET) return new NextResponse("Not Found", { status: 404 });

  const token = new URL(req.url).searchParams.get("token");
  if (token !== DEV_LOGIN_SECRET) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.set(DEV_LOGIN_COOKIE, DEV_LOGIN_SECRET, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
