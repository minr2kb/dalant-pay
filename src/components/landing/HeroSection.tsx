import { CheckCircle2, Coins } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-[10vw] top-0 size-[clamp(12rem,30vw,30rem)] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-[50vh] size-[clamp(16rem,40vw,40rem)] rounded-full bg-primary/10 blur-3xl" />

      {/* 모바일: 1행(1fr)에 타이틀을 세로 중앙 정렬하고, 2행(auto)에 크롭된 이미지를
      둬서 100vh 하단에 딱 붙게 한다. lg부터는 원래대로 좌우 2단 + 전체 중앙 정렬. */}
      <div className="relative z-10 mx-auto grid h-svh w-full max-w-6xl grid-rows-[1fr_auto] px-6 pt-24 lg:h-auto lg:min-h-svh lg:grid-cols-2 lg:grid-rows-none lg:content-center lg:gap-8 lg:py-20">
        <div className="flex h-full flex-col items-center justify-center gap-6 text-center lg:order-2 lg:h-auto lg:items-start lg:text-left">
          <p className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            오프라인 행사를 위한 미션 리워딩
          </p>
          <h1 className="text-3xl font-bold tracking-normal text-balance sm:text-5xl">
            종이 미션표, 점수판 없이
            <br />
            스마트폰 하나로
          </h1>
          <p className="max-w-xl md:text-lg text-gray-600 dark:text-gray-400">
            미션 인증 → 포인트 적립 → 사용까지, 오프라인 행사의 포인트
            이코노미를 하나로 연결합니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              size="lg"
              className="h-12 px-6 text-base"
            >
              지금 시작하기
            </Button>
            <Button
              render={<Link href="/sample/home" />}
              nativeButton={false}
              variant="outline"
              size="lg"
              className="h-12 px-6 text-base"
            >
              데모 체험하기
            </Button>
          </div>
        </div>

        <div className="relative flex justify-center lg:order-1">
          <div className="relative w-full max-w-150 animate-in fade-in-0 slide-in-from-left-8 duration-700 lg:max-w-100">
            {/* 모바일에서는 폰 목업을 위쪽 절반만 노출해 히어로가 100vh 안에 들어오게
            한다 - 원본 비율(915:1024)의 절반 높이(915:512)로 잘라낸다. lg부터는
            2단 레이아웃으로 바뀌어 세로 공간이 넉넉해지므로 크롭을 해제한다. */}
            <div className="h-[40vh] overflow-hidden lg:aspect-auto lg:overflow-visible">
              <Image
                src="/dp_mock.png"
                alt="달란트페이 앱 목업 - 미션 화면과 홈 화면"
                width={915}
                height={1024}
                priority
                className="w-full"
              />
            </div>

            <div
              className="absolute -right-2 top-[18%] animate-float sm:-right-4 sm:top-[20%]"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex animate-in items-center gap-1.5 rounded-2xl border border-border bg-white px-3 py-2 shadow-lg delay-300 fade-in-0 slide-in-from-right-4 fill-mode-both duration-700 sm:px-4 sm:py-3 dark:bg-gray-900">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                <span className="text-xs font-semibold sm:text-sm">
                  미션 인증 완료
                </span>
              </div>
            </div>
            <div
              className="absolute -left-2 bottom-[26%] animate-float sm:-left-8 sm:bottom-[30%]"
              style={{ animationDelay: "1.1s", animationDuration: "3.6s" }}
            >
              <div className="flex animate-in items-center gap-1.5 rounded-2xl border border-border bg-white px-3 py-2 shadow-lg delay-500 fade-in-0 slide-in-from-left-4 fill-mode-both duration-700 sm:px-4 sm:py-3 dark:bg-gray-900">
                <Coins className="size-4 shrink-0 text-primary" />
                <span className="text-xs font-semibold sm:text-sm">
                  +3 포인트
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
