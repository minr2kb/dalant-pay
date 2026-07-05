"use client";

import { useMutation, useSuspenseQueries } from "@tanstack/react-query";
import { CheckCircle2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { QRScanner } from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { parseQR } from "@/lib/qr";
import {
  marketsQuery,
  missionsQuery,
  participantsQuery,
} from "@/lib/query/queries";
import type { MarketParticipant, Mission } from "@/types";

type ScanState =
  | "idle"
  | "picking_mission"
  | "picking_user"
  | "confirm"
  | "group"
  | "done";

function ScanInner({ marketId }: { marketId: string }) {
  const router = useRouter();

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

  const verifyMutation = useMutation(
    missionsQuery.verify({
      invalidates: [missionsQuery.$key, participantsQuery.$key],
    }),
  );

  const [state, setState] = useState<ScanState>("idle");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedUser, setSelectedUser] = useState<MarketParticipant | null>(
    null,
  );
  const [groupUsers, setGroupUsers] = useState<string[]>([]);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [rawToken, setRawToken] = useState<string | null>(null);

  function handleScan(val: string) {
    const qr = parseQR(val);
    if (!qr) return;

    if (qr.type === "pay") {
      toast.error("결제 QR이에요", { description: "POS 화면을 이용해주세요" });
      return;
    }

    if (qr.type === "mission") {
      const participant = participants.find((p) => p.user.id === qr.userId);
      if (participant) setSelectedUser(participant);
      const mission = scannableMissions.find((m) => m.id === qr.missionId);
      if (mission && participant) {
        setSelectedMission(mission);
        setRawToken(qr.token);
        setState("confirm");
        loadPendingPhoto(mission, qr.userId);
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
    }

    setRawToken(null);
    setState("picking_mission");
  }

  async function loadPendingPhoto(mission: Mission, targetUserId: string) {
    setPendingPhotoUrl(null);
    if (mission.type !== "upload") return;
    const res = await fetch(
      `/api/markets/${marketId}/missions/${mission.id}?userId=${targetUserId}`,
    );
    const { data } = (await res.json()) as {
      data: {
        slots?: { verifiedAt: string | null; photoUrl: string | null }[];
      };
    };
    const pendingSlot = data.slots?.find((s) => s.verifiedAt === null);
    setPendingPhotoUrl(pendingSlot?.photoUrl ?? null);
  }

  function selectMission(mission: Mission) {
    setSelectedMission(mission);
    if (selectedUser) {
      setState("confirm");
      loadPendingPhoto(mission, selectedUser.user.id);
    } else {
      setState("picking_user");
    }
  }

  function selectUser(participant: MarketParticipant) {
    setSelectedUser(participant);
    setState("confirm");
    if (selectedMission) loadPendingPhoto(selectedMission, participant.user.id);
  }

  function toggleGroupUser(uid: string) {
    setGroupUsers((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid],
    );
  }

  async function confirmVerify(extraUserIds: string[] = []) {
    if (!selectedMission || !selectedUser) return;
    const results = await Promise.allSettled([
      verifyMutation.mutateAsync({
        marketId,
        missionId: selectedMission.id,
        ...(rawToken ? { token: rawToken } : { userId: selectedUser.user.id }),
      }),
      ...extraUserIds.map((uid) =>
        verifyMutation.mutateAsync({
          marketId,
          missionId: selectedMission.id,
          userId: uid,
        }),
      ),
    ]);
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      const reason = (failed[0] as PromiseRejectedResult).reason;
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const msg = (reason as any)?.body?.error ?? "알 수 없는 오류";
      toast.error(`${failed.length}명 적립 실패`, { description: msg });
    }
    if (results.some((r) => r.status === "fulfilled")) {
      setState("done");
    }
  }

  function reset() {
    setState("idle");
    setSelectedMission(null);
    setSelectedUser(null);
    setGroupUsers([]);
    setPendingPhotoUrl(null);
    setRawToken(null);
  }

  const otherParticipants = participants.filter(
    (p) => p.user.id !== selectedUser?.user.id,
  );

  return (
    <QRScanner
      open
      title="QR 스캔"
      hint="미션 인증 QR을 화면 중앙에 맞춰주세요"
      onScan={handleScan}
      onClose={() => router.back()}
    >
      {state === "picking_mission" && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <p className="text-sm font-semibold text-gray-700">
              어떤 미션인가요?
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scannableMissions.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">
                  활성 미션이 없어요
                </p>
              ) : (
                scannableMissions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectMission(m)}
                    className="flex h-14 w-full items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 text-left hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      {m.title}
                    </span>
                    <span className="text-sm font-bold text-emerald-500">
                      +{m.reward}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {state === "picking_user" && selectedMission && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <div>
              <p className="text-sm font-semibold text-gray-700">
                누구의 QR인가요?
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedMission.title} · +{selectedMission.reward} {pointLabel}
              </p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {participants.map((p) => (
                <button
                  key={p.user.id}
                  type="button"
                  onClick={() => selectUser(p)}
                  className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 text-left hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                    {p.user.realName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {p.user.realName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.balance} {pointLabel} 보유
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {state === "confirm" && selectedMission && selectedUser && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-5">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-400">
                미션 인증 요청
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                {selectedMission.title}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedUser.user.realName} · +{selectedMission.reward}{" "}
                {pointLabel}
              </p>
            </div>
            {selectedMission.type === "upload" &&
              (pendingPhotoUrl ? (
                // biome-ignore lint/performance/noImgElement: <explanation>
                <img
                  src={pendingPhotoUrl}
                  alt=""
                  className="mx-auto aspect-square w-40 rounded-xl object-cover"
                />
              ) : (
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
                  <p className="text-sm text-amber-700">
                    업로드된 인증 사진이 없어요
                  </p>
                </div>
              ))}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={reset}
                className="h-12 flex-1 rounded-full text-sm font-semibold"
              >
                취소
              </Button>
              <Button
                onClick={() =>
                  selectedMission.isGroup ? setState("group") : confirmVerify()
                }
                className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {state === "group" && selectedMission && selectedUser && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-gray-900">
                단체 미션: 함께한 참여자
              </h3>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-2">
              {otherParticipants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleGroupUser(p.user.id)}
                  className={`flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-medium transition-colors ${
                    groupUsers.includes(p.user.id)
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>{p.user.realName}</span>
                  {groupUsers.includes(p.user.id) && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
            <Button
              onClick={() => confirmVerify(groupUsers)}
              className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              {groupUsers.length > 0
                ? `${groupUsers.length + 1}명 적립`
                : "본인만 적립"}
            </Button>
          </div>
        </div>
      )}

      {state === "done" && selectedMission && selectedUser && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <CheckCircle2 className="h-20 w-20 text-emerald-400" />
          <div>
            <p className="text-xl font-bold text-white">적립 완료!</p>
            <p className="mt-1 text-sm text-white/60">
              {selectedMission.title} · +{selectedMission.reward} {pointLabel}
            </p>
          </div>
          <Button
            onClick={reset}
            className="mt-4 h-12 w-full max-w-xs rounded-full bg-white text-sm font-semibold text-gray-900 hover:bg-white/90"
          >
            다음 스캔
          </Button>
        </div>
      )}
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
