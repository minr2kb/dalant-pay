"use client";

import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { firstChar } from "@/lib/utils";
import { SAMPLE_ME, SAMPLE_PARTICIPANTS } from "../../data";

function tryOnly() {
  toast("샘플 마켓에서는 체험만 가능해요");
}

const ALL_PARTICIPANTS = [SAMPLE_ME, ...SAMPLE_PARTICIPANTS].sort(
  (a, b) => b.balance - a.balance,
);

export default function SampleAdminUsersPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      search
        ? ALL_PARTICIPANTS.filter((p) =>
            p.user.realName.toLowerCase().includes(search.toLowerCase()),
          )
        : ALL_PARTICIPANTS,
    [search],
  );

  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="sticky-header -mx-4 flex items-center justify-between px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          유저 관리
        </h1>
        <button
          type="button"
          onClick={tryOnly}
          className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Users className="h-3.5 w-3.5" />
          그룹 관리
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="search"
          placeholder="이름으로 검색"
          className="rounded-xl pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filtered.map((p) => {
          const hasAlias = p.displayName !== p.user.realName;
          return (
            <button
              key={p.id}
              type="button"
              onClick={tryOnly}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback>{firstChar(p.user.realName)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {p.user.realName}
                    </p>
                    {hasAlias && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({p.displayName})
                      </span>
                    )}
                    {p.role === "owner" && (
                      <span className="rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                        소유자
                      </span>
                    )}
                    {p.role === "admin" && (
                      <span className="rounded-full bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                        관리자
                      </span>
                    )}
                    {p.groupName && (
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                        {p.groupName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-base font-bold tabular-nums text-emerald-500">
                {p.balance}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            검색 결과가 없어요
          </p>
        )}
      </div>
    </div>
  );
}
