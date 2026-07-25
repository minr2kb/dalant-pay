"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3;

const YEARS = Array.from({ length: 66 }, (_, i) => String(2015 - i));
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

const selectClass =
  "h-12 w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-base text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [saving, setSaving] = useState(false);

  const birthDate =
    birthYear && birthMonth && birthDay
      ? `${birthYear}-${birthMonth}-${birthDay}`
      : "";

  async function handleNext() {
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const kakaoName =
      (user.user_metadata?.name as string | undefined) ??
      (user.user_metadata?.full_name as string | undefined) ??
      name;
    const providerAvatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null;

    const { error } = await supabase.from("users").insert({
      id: user.id,
      name: kakaoName,
      real_name: name,
      birth_date: birthDate,
      gender,
      avatar_url: providerAvatarUrl,
    });

    setSaving(false);
    if (!error) {
      const next = new URLSearchParams(location.search).get("next");
      router.push(next || "/markets");
    }
  }

  const canProceed =
    (step === 1 && name.trim().length > 0) ||
    (step === 2 && birthDate.length === 10) ||
    (step === 3 && gender !== null);

  return (
    <div className="flex min-h-svh flex-col bg-white dark:bg-gray-950 px-6 pt-4">
      <div className="mb-8 space-y-4">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
        )}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-emerald-500" : "bg-gray-100 dark:bg-gray-800"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">{step} / 3</p>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              본명을 입력해주세요
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              실명으로 등록해야 미션 인증에 이름이 표시돼요
            </p>
          </div>
          <Input
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border-gray-200"
            autoFocus
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              생일을 선택해주세요
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              생일월 미션 인증에 활용돼요
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className={selectClass}
            >
              <option value="">년도</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              className={selectClass}
            >
              <option value="">월</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {Number(m)}월
                </option>
              ))}
            </select>
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              className={selectClass}
            >
              <option value="">일</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {Number(d)}일
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              성별을 선택해주세요
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              미션 매칭에 활용돼요
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`rounded-2xl border-2 py-6 text-base font-medium transition-colors ${
                  gender === g
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300"
                }`}
              >
                {g === "male" ? "남자" : "여자"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pb-10 pt-8">
        <Button
          onClick={handleNext}
          disabled={!canProceed || saving}
          className="w-full rounded-full bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
        >
          {saving ? "저장 중…" : step === 3 ? "완료하고 시작하기" : "다음"}
        </Button>
      </div>
    </div>
  );
}
