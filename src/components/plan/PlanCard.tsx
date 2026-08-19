import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PricingPlan } from "@/lib/pricing-plans";

export function PlanCard({ plan }: { plan: PricingPlan }) {
  return (
    <div
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
  );
}
