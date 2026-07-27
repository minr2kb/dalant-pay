"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { QRScanner } from "@/components/qr/QRScanner";
import { openModal } from "@/lib/overlay";
import { parseQR } from "@/lib/qr";
import {
  marketsQuery,
  missionsQuery,
  participantsQuery,
} from "@/lib/query/queries";
import type { MarketParticipant, Mission } from "@/types";
import { ScanFlowModal } from "./ScanFlowModal";

function ScanInner({ marketId }: { marketId: string }) {
  const router = useRouter();
  const [locked, setLocked] = useState(false);

  const [{ data: missions }, { data: participants }, { data: market }] =
    useSuspenseQueries({
      queries: [
        missionsQuery.list({ marketId }),
        participantsQuery.list({ marketId }),
        marketsQuery.get({ marketId }),
      ],
    });
  const scannableMissions = missions.filter(
    (m) => m.isActive && (m.type === "admin_qr" || m.type === "upload"),
  );
  const pointLabel = market.pointLabel;

  function openFlow(initial: {
    mission?: Mission;
    user?: MarketParticipant;
    token?: string;
  }) {
    setLocked(true);
    openModal((close) => (
      <ScanFlowModal
        marketId={marketId}
        pointLabel={pointLabel}
        missions={scannableMissions}
        participants={participants}
        initialMission={initial.mission}
        initialUser={initial.user}
        initialToken={initial.token}
        onClose={() => {
          setLocked(false);
          close();
        }}
      />
    ));
  }

  function handleScan(val: string) {
    if (locked) return;
    const qr = parseQR(val);
    if (!qr) return;

    if (qr.type === "pay") {
      toast.error("결제 QR이에요", { description: "POS 화면을 이용해주세요" });
      return;
    }

    if (qr.type === "mission") {
      const participant = participants.find((p) => p.user.id === qr.userId);
      const mission = scannableMissions.find((m) => m.id === qr.missionId);
      if (mission && participant) {
        openFlow({ mission, user: participant, token: qr.token });
        return;
      }
      const anyMission = missions.find((m) => m.id === qr.missionId);
      if (anyMission?.type === "user_qr") {
        toast.error("유저 간 인증 미션이에요", {
          description: "다른 참여자가 스캔해야 해요",
        });
        return;
      }
      if (!participant) {
        toast.error("이 마켓의 참여자 QR이 아니에요");
        return;
      }
      openFlow({ user: participant });
      return;
    }

    openFlow({});
  }

  return (
    <QRScanner
      open
      title="QR 스캔"
      hint="미션 인증 QR을 화면 중앙에 맞춰주세요"
      onScan={handleScan}
      onClose={() => router.back()}
      footer={
        <button
          type="button"
          disabled={locked}
          onClick={() => openFlow({})}
          className="h-10 rounded-full bg-white/20 px-4 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 disabled:opacity-40"
        >
          수동인증
        </button>
      }
    >
      {/* ponytail: QRScanner only restarts its camera stream when this
          children/hasOverlay flag toggles — an empty placeholder while
          locked forces that toggle so scanning resumes once the flow modal closes */}
      {locked && <div />}
    </QRScanner>
  );
}

export function ScanContent({ marketId }: { marketId: string }) {
  return (
    <Suspense
      fallback={
        <p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>
      }
    >
      <ScanInner marketId={marketId} />
    </Suspense>
  );
}
