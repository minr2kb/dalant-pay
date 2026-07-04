"use client";

import localFont from "next/font/local";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const gmarketSans = localFont({
  src: [
    { path: "../../fonts/GmarketSansMedium.woff", weight: "500" },
    { path: "../../fonts/GmarketSansBold.woff", weight: "700" },
  ],
});

export default function LoginPage() {
  async function handleKakaoLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex min-h-svh flex-col bg-primary">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative h-44 w-44 animate-in zoom-in-75 fade-in-0 duration-700">
          <Image
            src="/logo_w.svg"
            alt="달란트페이"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
          <h1
            className={`${gmarketSans.className} text-3xl font-bold text-white`}
          >
            Dalant Pay
          </h1>
          <p className="mt-2 text-sm text-white/70">
            오프라인 모임을 위한 미션 인증 · 결제 서비스
          </p>
        </div>
      </div>

      <div className="space-y-3 px-8 pb-16 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-[350ms] fill-mode-both">
        <button
          type="button"
          onClick={handleKakaoLogin}
          className="flex h-14 w-full max-w-sm mx-auto items-center justify-center gap-2.5 rounded-full bg-[#FEE500] font-semibold text-[#3C1E1E] transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 2C5.582 2 2 4.686 2 8c0 2.13 1.338 4.002 3.352 5.126L4.6 16.23a.25.25 0 0 0 .37.27l3.74-2.48A9.19 9.19 0 0 0 10 14c4.418 0 8-2.686 8-6s-3.582-6-8-6z"
              fill="#3C1E1E"
            />
          </svg>
          카카오로 시작하기
        </button>
        <p className="text-center text-xs text-white/60">
          로그인시 이용약관에 동의합니다
        </p>
        {process.env.NODE_ENV === "development" && (
          <a
            href="/api/dev/login"
            className="block text-center text-xs text-white/50 underline"
          >
            개발자 로그인 (로컬 전용)
          </a>
        )}
      </div>
    </div>
  );
}
