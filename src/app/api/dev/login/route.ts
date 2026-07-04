import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

// ponytail: local-only auth bypass, gated at build time by NODE_ENV — never reachable in a production build.
// Uses generateLink+verifyOtp (not signInWithPassword) so it isn't blocked by captcha protection on the password grant.
const DEV_EMAIL = "dev@local.test";

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: DEV_EMAIL,
  });
  if (linkError) return new NextResponse(linkError.message, { status: 500 });

  const ssrClient = await createClient();
  const { data: verified, error: verifyError } = await ssrClient.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "email",
  });
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
