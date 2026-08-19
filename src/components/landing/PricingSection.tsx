import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// 결제 연동 전이라 신청 CTA는 구글폼으로 받고, 상담 후 수동으로 플랜을 승격한다.
const BETA_APPLY_URL = "https://forms.gle/oDYzStrZYhG6jJ7U7";

const PRICING_PLANS = [
  {
    name: "무료",
    price: "0원",
    originalPrice: null,
    period: "",
    description: "가볍게 한 번 열어볼 때",
    features: ["마켓 3개", "마켓당 참가자 10명"],
    cta: "무료로 시작하기",
    href: "/login",
    highlight: false,
  },
  {
    name: "스탠다드",
    price: "0원",
    originalPrice: "11,900원",
    period: "/월",
    description: "정기적으로 여러 행사를 운영할 때",
    features: [
      "마켓 10개",
      "마켓당 참가자 50명",
      "참여자 그룹 관리",
      "빠른 응답 지원",
    ],
    cta: "베타 신청하기",
    href: BETA_APPLY_URL,
    highlight: true,
  },
  {
    name: "프로",
    price: "0원",
    originalPrice: "39,900원",
    period: "/월",
    description: "규모 제한 없이 운영할 때",
    features: [
      "마켓 무제한",
      "참가자 무제한",
      "우선 응답 지원",
      "커스텀 브랜딩(로고·컬러)",
    ],
    cta: "베타 신청하기",
    href: BETA_APPLY_URL,
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-white dark:bg-gray-950 py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-sm font-medium text-primary">요금제</p>
        <h2 className="mt-2 text-balance text-center text-2xl font-bold sm:text-3xl">
          행사 규모에 맞게 선택하세요
        </h2>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          결제 연동은 준비 중입니다. 베타 신청 후 상담을 통해 플랜을
          적용해드려요.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="font-semibold">{plan.name}</p>
                {plan.originalPrice && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    베타 무료 오픈
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {plan.description}
              </p>
              <div className="mt-6">
                {plan.originalPrice && (
                  <p className="text-sm text-gray-400 line-through">
                    {plan.originalPrice}
                    {plan.period}
                  </p>
                )}
                <p className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-base font-medium text-gray-400">
                    {plan.period}
                  </span>
                </p>
              </div>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                render={<Link href={plan.href} />}
                nativeButton={false}
                variant={plan.highlight ? "default" : "outline"}
                className="mt-8 h-12"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
