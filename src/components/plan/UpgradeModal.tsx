"use client";

import { X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { PlanCard } from "@/components/plan/PlanCard";
import { PRICING_PLANS } from "@/lib/pricing-plans";

interface UpgradeModalProps {
  reason: string;
  onClose: () => void;
}

export function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const upgradePlans = PRICING_PLANS.filter((plan) => plan.id !== "free");

  return (
    <Modal onClose={onClose}>
      <div className="px-6 pb-8 pt-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            플랜을 업그레이드해보세요
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {reason}
        </p>
        <div className="space-y-4">
          {upgradePlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </Modal>
  );
}
