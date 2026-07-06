"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  decideSessionAction,
  getLocalSession,
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { userId: userId ?? null, isChecking: userId === undefined };
}
