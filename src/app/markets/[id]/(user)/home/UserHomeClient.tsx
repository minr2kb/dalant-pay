"use client";

import { useMutation, useQueries } from "@tanstack/react-query";
import { keyBy } from "es-toolkit";
import { ArrowRight, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSessionUserId } from "@/components/AuthGate";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { AdminAccessButton } from "@/components/market/AdminAccessButton";
import { NumberTicker } from "@/components/NumberTicker";
import { openPointLogDetail } from "@/components/points/PointLogDetailModal";
import { PointLogItem } from "@/components/points/PointLogItem";
import { TransferModal } from "@/components/points/TransferModal";
import { HomeScanButton } from "@/components/qr/HomeScanButton";
import { PayQRButton } from "@/components/qr/PayQRButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { openModal } from "@/lib/overlay";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { HomeSkeleton } from "./HomeSkeleton";

export function UserHomeClient({
  marketId,
  initialUserId,
}: {
  marketId: string;
  initialUserId: string | null;
}) {
  // useSessionUserId()는 클라이언트에서 로컬 세션을 다시 비동기로 확인한 뒤에야 값이 채워진다.
  // 그 확인이 끝나기 전엔 initialUserId(서버가 getClaims()로 이미 검증한 값)로 즉시 쿼리 키를
  // 맞춰서, 서버 prefetch가 채워둔 캐시를 첫 렌더부터 바로 쓴다. 세션이 실제로 무효하면
  // AuthGate가 별도로 리다이렉트하므로 보안 경계는 그대로 유지된다.
  const userId = useSessionUserId() ?? initialUserId;

  const { mutate: ensureJoined } = useMutation(
    participantsQuery.join({ invalidates: [participantsQuery.$key] }),
  );

  useEffect(() => {
    if (userId) ensureJoined({ marketId });
  }, [userId, marketId, ensureJoined]);

  const [{ data: market }, { data: participants }] = useQueries({
    queries: [
      { ...marketsQuery.get({ marketId }), enabled: !!userId },
      {
        ...participantsQuery.get({ marketId, userId: userId ?? "" }),
        enabled: !!userId,
      },
    ],
  });

  const recentLogs = useMemo(
    () => participants?.pointLogs.slice(0, 5) ?? [],
    [participants],
  );
  const orderMap = useMemo(
    () => keyBy(participants?.orders ?? [], (o) => o.id),
    [participants],
  );

  // isRestoring은 IndexedDB 복원 완료 여부만 본다 — 서버 prefetch(HydrationBoundary)로
  // 이미 데이터가 있으면 복원을 기다릴 이유가 없어 게이트에서 뺐다.
  if (!market || !participants) return <HomeSkeleton />;

  const user = participants.participant;

  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <InstallPwaBanner />

      <div className="sticky-header -mx-4 flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.user.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{user.user.realName.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {market.title}
            </p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.displayName}
            </h1>
          </div>
        </div>
        <AdminAccessButton marketId={marketId} compact />
      </div>

      <div className="rounded-3xl bg-emerald-500 p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium opacity-80">
              보유 {market.pointLabel}
            </p>
            <NumberTicker
              value={user.balance}
              className="text-4xl font-bold tabular-nums"
            />
            <p className="text-sm opacity-70">{market.pointLabel}</p>
          </div>
          <PayQRButton
            marketId={marketId}
            userId={user.user.id}
            userName={user.user.realName}
            compact
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          className="h-12 gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-800 rounded-2xl font-semibold"
          onClick={() =>
            openModal((close) => (
              <TransferModal
                marketId={marketId}
                userId={user.user.id}
                onClose={close}
              />
            ))
          }
        >
          <ArrowRightLeft className="h-4 w-4" />
          {market.pointLabel} 전송
        </Button>
        <HomeScanButton marketId={marketId} pointLabel={market.pointLabel} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            최근 내역
          </h2>
          <Link
            href={`/markets/${marketId}/history`}
            prefetch={false}
            className="flex items-center gap-1 text-xs text-emerald-500"
          >
            전체 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {recentLogs.map((log) => (
            <PointLogItem
              key={log.id}
              log={log}
              pointLabel={market.pointLabel}
              onClick={() =>
                openPointLogDetail({
                  log,
                  participantName: user.displayName,
                  pointLabel: market.pointLabel,
                  order: log.orderId ? orderMap[log.orderId] : undefined,
                })
              }
            />
          ))}
          {recentLogs.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">
              아직 내역이 없어요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
