import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative bg-[url('/landing/case_scan.png')] bg-cover bg-center object-center">
      <div className="relative z-20 mx-auto flex flex-col items-center gap-6 px-6 py-28 text-center ">
        <h2 className="text-balance text-2xl font-bold sm:text-3xl">
          다음 행사, 마켓 하나로 바로 준비하세요
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          MT·워크숍·수련회·컨퍼런스까지, 마켓 생성만으로 그 자리에서 운영을
          시작할 수 있습니다.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
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
            샘플 체험하기
          </Button>
        </div>
      </div>
      <div
        className="absolute inset-0 dark:bg-black/60 bg-white/50 pointer-events-none z-10 backdrop-blur-xs"
        aria-hidden="true"
      />
    </section>
  );
}
