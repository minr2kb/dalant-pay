"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { gmarketSans } from "@/fonts/gmarket-sans";
import { createClient } from "@/lib/supabase/client";

const LAST_PROVIDER_KEY = "dalant-last-login-provider";

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [lastProvider, setLastProvider] = useState<string | null>(null);

  useEffect(() => {
    setLastProvider(localStorage.getItem(LAST_PROVIDER_KEY));
  }, []);

  async function signInWithProvider(provider: "kakao" | "google") {
    setPending(true);
    localStorage.setItem(LAST_PROVIDER_KEY, provider);
    const supabase = createClient();
    const next = new URLSearchParams(location.search).get("next");
    const baseOrigin = process.env.NEXT_PUBLIC_SITE_URL || location.origin;
    const callbackUrl = new URL("/auth/callback", baseOrigin);
    if (next) callbackUrl.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
    if (error) setPending(false);
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
        <div className="relative mx-auto w-full max-w-sm">
          {lastProvider === "kakao" && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-3 py-1 text-xs text-white after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-black/70">
              최근에 사용한 로그인
            </span>
          )}
          <button
            type="button"
            onClick={() => signInWithProvider("kakao")}
            disabled={pending}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-[#FEE500] font-semibold text-[#3C1E1E] transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-default"
          >
            {pending ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
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
            )}
            {pending ? "이동 중..." : "카카오로 시작하기"}
          </button>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          {lastProvider === "google" && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-3 py-1 text-xs text-white after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-black/70">
              최근에 사용한 로그인
            </span>
          )}
          <button
            type="button"
            onClick={() => signInWithProvider("google")}
            disabled={pending}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-white font-semibold text-[#3C4043] transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-default"
          >
            {pending ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.8741 2.6836-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.5404-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.71c-.18-.5404-.2822-1.1181-.2822-1.71s.1023-1.1695.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"
                />
              </svg>
            )}
            {pending ? "이동 중..." : "Google로 시작하기"}
          </button>
        </div>
        <p className="text-center text-xs text-white/60">
          로그인시 이용약관에 동의합니다
        </p>
        <a
          href="/sample/home"
          className="block text-center text-xs text-white/70 underline"
        >
          샘플 마켓 둘러보기
        </a>
        <a
          href="/api/dev/login"
          className={`block text-center text-xs underline ${
            process.env.NODE_ENV === "development"
              ? "text-white/50"
              : "text-transparent"
          }`}
        >
          개발자 로그인 (로컬 전용)
        </a>
      </div>
    </div>
  );
}
