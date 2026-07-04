"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { participantsQuery } from "@/lib/query/queries";

export function JoinButton({ marketId }: { marketId: string }) {
  const router = useRouter();
  const [conflict, setConflict] = useState<string | null>(null);

  const { mutate: joinMarket, isPending } = useMutation(
    participantsQuery.join({
      onSuccess: (data) => {
        if (data?.hasConflict && data?.displayName) {
          setConflict(data.displayName);

          return;
        }
        router.push(`/markets/${marketId}/home`);
      },
      // 로그인 안 한 방문자가 공유 링크로 들어와 눌렀을 때
      onError: () => router.push("/login"),
    }),
  );

  if (conflict) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 text-center space-y-1.5">
          <p className="text-sm font-semibold text-amber-800">
            이 마켓에 동명이인이 있어요
          </p>
          <p className="text-sm text-amber-700">
            <span className="font-bold">{conflict}</span>로 입장합니다
          </p>
        </div>
        <Button
          onClick={() => router.push(`/markets/${marketId}/home`)}
          className="w-full h-12 rounded-full bg-emerald-500 text-base font-medium text-white hover:bg-emerald-600"
        >
          확인하고 입장하기
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => joinMarket({ marketId })}
      disabled={isPending}
      className="w-full h-12 rounded-full bg-emerald-500 text-base font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
    >
      {isPending ? "입장 중…" : "마켓 참여하기"}
    </Button>
  );
}
