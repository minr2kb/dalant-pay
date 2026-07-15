"use client";

import { useEffect } from "react";

export function useModalHistory(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    window.history.pushState(null, "");
    window.addEventListener("popstate", onClose);
    return () => window.removeEventListener("popstate", onClose);
  }, [open, onClose]);
}
