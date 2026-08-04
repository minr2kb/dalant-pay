"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { orderBy } from "es-toolkit";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { participantsQuery } from "@/lib/query/queries";
import { firstChar } from "@/lib/utils";

export function AdminUsersClient({ marketId }: { marketId: string }) {
  const { data: participants } = useSuspenseQuery(
    participantsQuery.list({ marketId }),
  );
  const [search, setSearch] = useState("");

  const sorted = useMemo(
    () => orderBy(participants, [(p) => p.balance], ["desc"]),
    [participants],
  );

  const filtered = useMemo(
    () =>
      search
        ? sorted.filter((p) =>
            p.user.realName.toLowerCase().includes(search.toLowerCase()),
          )
        : sorted,
    [sorted, search],
  );

  return (
    <>
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
            <Link
              key={p.id}
              href={`/markets/${marketId}/admin/users/${p.user.id}`}
              className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage src={p.user.avatarUrl ?? undefined} alt="" />
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
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            검색 결과가 없어요
          </p>
        )}
      </div>
    </>
  );
}
