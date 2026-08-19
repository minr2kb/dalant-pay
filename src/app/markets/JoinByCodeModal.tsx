"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JoinByCodeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit() {
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/markets/${trimmed}`);
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            코드로 참여하기
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            공유받은 마켓 링크의 코드를 입력해주세요
          </p>
        </div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="마켓 코드"
          className="h-12"
          autoFocus
        />
        <Button
          onClick={handleSubmit}
          disabled={!code.trim()}
          className="w-full h-12 rounded-full bg-emerald-500 text-base font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          참여하기
        </Button>
      </div>
    </Modal>
  );
}
