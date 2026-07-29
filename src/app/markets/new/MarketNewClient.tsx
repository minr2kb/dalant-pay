"use client";

import { useMutation } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  MarketFormFields,
  type MarketFormValues,
} from "@/components/market/MarketFormFields";
import { Button } from "@/components/ui/button";
import { marketsQuery } from "@/lib/query/queries";

const initialValues: MarketFormValues = {
  title: "",
  description: "",
  pointLabel: "달란트",
  adminCode: "",
  startsAt: "",
  endsAt: "",
};

export function MarketNewClient() {
  const router = useRouter();
  const [values, setValues] = useState<MarketFormValues>(initialValues);

  function update(patch: Partial<MarketFormValues>) {
    setValues((v) => ({ ...v, ...patch }));
  }

  const { mutate: createMarket, isPending } = useMutation(
    marketsQuery.create({
      invalidates: [marketsQuery.$key],
      onSuccess: (data) => {
        router.push(`/markets/${data.marketId}/admin/home`);
      },
      onError: () => {
        toast.error("마켓 생성에 실패했어요");
      },
    }),
  );

  const canSubmit =
    values.title.trim().length > 0 &&
    values.pointLabel.trim().length > 0 &&
    values.adminCode.trim().length >= 4 &&
    values.startsAt.length > 0 &&
    values.endsAt.length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    createMarket({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      pointLabel: values.pointLabel.trim(),
      adminCode: values.adminCode.trim(),
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
    });
  }

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950">
      <div className="px-4 max-w-lg mx-auto space-y-6 pb-10">
        <div className="sticky-header -mx-4 flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-400 dark:text-gray-500"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            마켓 만들기
          </h1>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <MarketFormFields values={values} onChange={update} />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isPending}
          className="h-12 w-full rounded-full bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
        >
          {isPending ? "만드는 중…" : "마켓 만들기"}
        </Button>
      </div>
    </div>
  );
}
