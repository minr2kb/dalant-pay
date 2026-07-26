"use client";

import { useMutation } from "@tanstack/react-query";
import { Lock, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { openModal } from "@/lib/overlay";
import { adminQuery } from "@/lib/query/queries";

const STORAGE_KEY = "dalant_admin_granted";
const CODE_LENGTH = 4;

function AdminCodeForm({
  marketId,
  onClose,
  unmount,
}: {
  marketId: string;
  onClose: () => void;
  unmount: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const authMutation = useMutation(adminQuery.auth());

  function handleChange(val: string) {
    setCode(val);
    setError(false);
    if (val.length === CODE_LENGTH) {
      authMutation
        .mutateAsync({ marketId, code: val })
        .then((result) => {
          if (result.granted) {
            localStorage.setItem(STORAGE_KEY, "true");
            // onClose()(=history.back())를 부르면 뒤이은 router.push와
            // 내비게이션이 경쟁해서 뒤로가기가 이겨버릴 수 있다 — 페이지를
            // 아예 떠나므로 히스토리 조작 없이 즉시 언마운트만 한다.
            unmount();
            router.push(`/markets/${marketId}/admin/home`);
          } else {
            setError(true);
            setTimeout(() => setCode(""), 600);
          }
        })
        .catch(() => {
          setError(true);
          setTimeout(() => setCode(""), 600);
        });
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              관리자 인증
            </p>
            <h3 className="font-bold text-gray-900 dark:text-white">
              인증코드 입력
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <InputOTP
            maxLength={CODE_LENGTH}
            value={code}
            onChange={handleChange}
            disabled={authMutation.isPending}
            autoFocus
          >
            <InputOTPGroup className="gap-3">
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <InputOTPSlot
                  // biome-ignore lint/suspicious/noArrayIndexKey: renders a fixed CODE_LENGTH number of OTP slots in a static order that never reorders/inserts/deletes
                  key={i}
                  index={i}
                  className={`h-14 w-14 rounded-xl border text-xl font-bold first:rounded-l-xl first:border-l last:rounded-r-xl ${
                    error
                      ? "border-rose-400 bg-rose-50 text-rose-600 dark:border-rose-500 dark:bg-rose-900/30 dark:text-rose-400"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {error ? (
            <p className="text-xs text-rose-500">인증코드가 올바르지 않아요</p>
          ) : authMutation.isPending ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">확인 중…</p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              관리자에게 받은 4자리 코드를 입력하세요
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function AdminAccessButton({
  marketId,
  compact = false,
}: {
  marketId: string;
  compact?: boolean;
}) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (isAdmin) {
    return compact ? (
      <a
        href={`/markets/${marketId}/admin/home`}
        className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        관리자
      </a>
    ) : (
      <a
        href={`/markets/${marketId}/admin/home`}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 text-sm font-semibold text-purple-600 dark:text-purple-400 transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/30"
      >
        <ShieldCheck className="h-4 w-4" />
        관리자 화면
      </a>
    );
  }

  const handleOpen = () =>
    openModal((close, unmount) => (
      <AdminCodeForm marketId={marketId} onClose={close} unmount={unmount} />
    ));

  return compact ? (
    <button
      type="button"
      onClick={handleOpen}
      className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
    >
      <Lock className="h-3.5 w-3.5" />
      관리자
    </button>
  ) : (
    <button
      type="button"
      onClick={handleOpen}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <Lock className="h-4 w-4" />
      관리자 전환
    </button>
  );
}
