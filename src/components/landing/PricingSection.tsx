import { PlanCard } from "@/components/plan/PlanCard";
import { PRICING_PLANS } from "@/lib/pricing-plans";

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
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
