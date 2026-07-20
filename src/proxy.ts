/** biome-ignore-all lint/style/noNonNullAssertion: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are required env vars set at build/deploy time and must fail loudly if missing */
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;
  // (user) 라우트 그룹 경로 — 인증 낙관적 렌더링(AuthGate, src/components/AuthGate.tsx)이
  // 클라이언트에서 세션을 확인하므로 미들웨어에서는 우회시킨다.
  // 이 목록과 실제로 AuthGate가 감싸는 라우트 그룹((user)/layout.tsx)은 항상 같이 움직여야 한다.
  const OPTIMISTIC_AUTH_ROUTES =
    /^\/markets\/[^/]+\/(home|missions|history|mypage|ranking)(\/.*)?$/;
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.webmanifest" ||
    // 마켓 QR 랜딩(공유 페이지)은 미가입자·링크 미리보기 봇도 봐야 하므로 공개.
    // 그 외 하위 경로(/home 등)는 제외. og:image는 정적 파일이라 미들웨어 matcher에서 이미 제외됨.
    /^\/markets\/[^/]+$/.test(pathname) ||
    // 마켓별 PWA manifest도 브라우저가 로그인 세션 없이 직접 fetch하므로 공개.
    /^\/markets\/[^/]+\/manifest\.webmanifest$/.test(pathname) ||
    OPTIMISTIC_AUTH_ROUTES.test(pathname) ||
    // 마켓 목록 — 루트 PWA(start_url: "/")가 /login을 거쳐 결국 도착하는 화면이라
    // AuthGate가 낙관적으로 처리하도록 우회. (user) 그룹과 달리 marketId가 없는
    // 최상위 라우트라 별도 정확 매치로 둔다.
    pathname === "/markets";

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next");
    // "/"로 시작하고 "//"(프로토콜-상대 URL)는 아닌 내부 경로만 허용 — 오픈 리다이렉트 방지.
    const target =
      next?.startsWith("/") && !next.startsWith("//") ? next : "/markets";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // /admin/* 페이지는 로그인만 확인되고 role은 안 걸러져서, 일반 유저도 URL을 직접
  // 치면 화면 자체는 보였다(액션은 marketAdminRoute가 403으로 막지만) — 여기서 role도 같이 검증.
  const adminMatch = pathname.match(/^\/markets\/([^/]+)\/admin(\/.*)?$/);
  if (user && adminMatch) {
    const marketId = adminMatch[1];
    const { data: participant } = await supabase
      .from("market_participants")
      .select("role")
      .eq("market_id", marketId)
      .eq("user_id", user.sub)
      .maybeSingle();
    if (participant?.role !== "admin") {
      return NextResponse.redirect(
        new URL(`/markets/${marketId}/home`, request.url),
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
