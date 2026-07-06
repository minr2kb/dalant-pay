/** biome-ignore-all lint/style/noNonNullAssertion: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are required env vars set at build/deploy time and must fail loudly if missing */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/markets";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  // Check if user has completed onboarding
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existingUser) {
    const onboardingUrl = new URL("/onboarding", origin);
    onboardingUrl.searchParams.set("next", next);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.redirect(new URL(next, origin));
}
