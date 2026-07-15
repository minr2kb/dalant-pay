"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { MarketParticipant } from "@/types";

export function GroupParticipantPicker({
  participants,
  selected,
  onToggle,
}: {
  participants: MarketParticipant[];
  selected: string[];
  onToggle: (userId: string) => void;
}) {
  return (
    <div className="max-h-44 overflow-y-auto space-y-2">
      {participants.map((p) => {
        const checked = selected.includes(p.user.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p.user.id)}
            className={`flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-medium transition-colors ${
              checked
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            <span>{p.user.realName}</span>
            {checked ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}
