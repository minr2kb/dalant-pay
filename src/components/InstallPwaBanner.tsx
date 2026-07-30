"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  isAndroid,
  isInAppBrowser,
  isIOS as isIOSBrowser,
  isKakao,
} from "@/lib/user-agent";

const SNOOZE_KEY = "pwa-install-snooze-until";
const INSTALLED_KEY = "pwa-installed";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isSnoozed() {
  const until = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
  return Date.now() < until;
}

/** 카카오톡은 공식 탈출 스킴이 있고, 안드로이드는 intent://로 크롬을 강제 지정할 수 있다.
 * iOS의 카카오톡 이외 인앱 브라우저는 OS 차원에서 강제 이동이 불가하다. */
function escapeInAppBrowser() {
  const url = window.location.href;
  if (isKakao()) {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
    return;
  }
  if (isAndroid()) {
    const withoutScheme = url.replace(/^https?:\/\//, "");
    window.location.href = `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;end`;
  }
}

export function InstallPwaBanner() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [canEscape, setCanEscape] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(INSTALLED_KEY) === "true") return;
    if (isStandalone() || isSnoozed()) return;

    setIsIOS(isIOSBrowser());
    setIsInApp(isInAppBrowser());
    setCanEscape(isKakao() || isAndroid());
    setDismissed(false);

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      localStorage.setItem(INSTALLED_KEY, "true");
      setDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    setDismissed(true);
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") localStorage.setItem(INSTALLED_KEY, "true");
    setPromptEvent(null);
    setDismissed(true);
  }

  if (dismissed || (!promptEvent && !isIOS && !isInApp)) return null;

  const showEscapeButton = isInApp && canEscape;

  return (
    <div className="pt-4">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-900/20 px-4 py-3.5 animate-in fade-in-0 slide-in-from-top-2 duration-300 fill-mode-both">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            홈 화면에 추가하세요
          </p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">
            {isInApp
              ? "다른 브라우저로 열어야 설치할 수 있어요"
              : isIOS
                ? "공유 버튼을 누르고 '홈 화면에 추가'를 선택하세요"
                : "앱처럼 더 빠르게 이용할 수 있어요"}
          </p>
        </div>
        {showEscapeButton && (
          <Button
            onClick={escapeInAppBrowser}
            className="h-10 shrink-0 rounded-full bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            다른 브라우저로 열기
          </Button>
        )}
        {isInApp && !canEscape && (
          <p className="shrink-0 text-[11px] text-emerald-600/70 dark:text-emerald-400/60">
            우측 상단 메뉴에서 선택
          </p>
        )}
        {!isIOS && !isInApp && (
          <Button
            onClick={install}
            className="h-10 shrink-0 rounded-full bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            설치
          </Button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="닫기"
          className="shrink-0 rounded-full p-1.5 text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
