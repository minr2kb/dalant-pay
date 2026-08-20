import Image from "next/image";
import { cn } from "@/lib/utils";

const REVIEW_CASES = [
  {
    title: "소모품 낭비 감소 → 운영비 절감",
    description:
      "내 포인트로 산 물건이라는 감각에, 마시다 만 음료를 여기저기 버리는 일이 줄고, 필요한 재고 수가 줄어들어 예산 절감 효과를 가져왔습니다.",
    shot: "/landing/review-1.png",
  },
  {
    title: "쉬는 시간에도 끊이지 않는 참여",
    description:
      "미션완수가 주로 자유시간(오후 1~3시)·취침 전(밤 11시)에 몰렸습니다. 리워드/랭킹이라는 동기를 바탕으로 자발적 네트워킹이 일어납니다.",
    shot: "/landing/review-2.png",
  },
  {
    title: "고가 아이템 하나가 만들어낸 팀 협력",
    description:
      "평균 잔액 30포인트 안팎인 마켓에 50포인트짜리 아이템을 심자, 팀원 간의 협력을 촉진하여 팀 활동이 활성화되는 효과를 가져왔습니다.",
    shot: "/landing/review-3.png",
  },
  {
    title: "사진 미션으로 자연스럽게 남은 활동 기록",
    description:
      "조별 포즈샷, 셀카 등 업로드형 미션 인증 과정에서 참가자별 활동 사진 아카이브가 자연스럽게 쌓였습니다.",
    shot: "/landing/review-4.png",
  },
];

// ponytail: 진짜 무작위(Math.random)는 SSR 하이드레이션 mismatch를 일으키니,
// 카드마다 고정된 회전/오프셋 값으로 "제어된 무작위" 느낌만 낸다.
const CARD_TILT = [
  "rotate-[-1.5deg] sm:-translate-y-3",
  "rotate-[1deg] sm:translate-y-4",
  "rotate-[1.5deg] sm:-translate-y-2",
  "rotate-[-1deg] sm:translate-y-5",
];

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="scroll-mt-24 bg-white py-24 dark:bg-gray-950"
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-sm font-medium text-primary">
          실사용 사례
        </p>
        <h2 className="mt-2 text-balance text-center text-2xl font-bold sm:text-3xl">
          실제 4박 5일 수련회 사용 후기
        </h2>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400 break-keep">
          * 물을 제외한 커피, 간식류를 포인트로 판매하는 마켓 방식 운영
        </p>

        <div className="mt-16 grid gap-x-6 gap-y-10 sm:grid-cols-2">
          {REVIEW_CASES.map(({ title, description, shot }, i) => (
            <div
              key={title}
              style={{ animationDelay: `${i * 150}ms` }}
              className={cn(
                "flex animate-in flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-all fade-in-0 slide-in-from-bottom-4 fill-mode-both duration-700 hover:translate-y-0 hover:rotate-0 hover:shadow-lg dark:bg-gray-900 sm:flex-row",
                CARD_TILT[i],
              )}
            >
              <div className="relative aspect-3/4 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-32">
                <Image
                  src={shot}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 128px, 100vw"
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 break-keep">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          참가자 27명 · 등록 미션 18개 · 포인트 로그 531건
        </p>
      </div>
    </section>
  );
}
