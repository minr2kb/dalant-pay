"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  decideSessionAction,
  getLocalSession,
  hasOnboarded,
  verifySessionRemote,
} from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/client";

export function useOptimisticSession() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    function redirectToLogin() {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      router.replace(`/login?next=${next}`);
    }

    (async () => {
      const local = await getLocalSession(supabase);
      if (cancelled) return;
      setUserId(local?.userId ?? null);

      if (decideSessionAction(local !== null, "pending") === "redirect") {
        redirectToLogin();
        return;
      }

      const remoteStatus = await verifySessionRemote(supabase);
      if (cancelled) return;
      if (decideSessionAction(local !== null, remoteStatus) === "redirect") {
        redirectToLogin();
        return;
      }

      // 세션은 유효한데 온보딩 전에 이탈해 public.users가 없는 경우 —
      // 반쪽짜리 프로필로 계속 들어오게 두지 않고 세션을 지워 로그인부터 다시 타게 한다.
      if (local && !(await hasOnboarded(supabase, local.userId))) {
        if (cancelled) return;
        await supabase.auth.signOut();
        if (cancelled) return;
        redirectToLogin();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { userId: userId ?? null, isChecking: userId === undefined };
}
