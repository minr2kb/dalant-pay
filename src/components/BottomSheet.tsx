"use client";

import type { ReactNode } from "react";
import { Drawer } from "vaul";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      // vaul renders into a portal at document.body - always above nav (z-50)
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[70] bg-black/40" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-[70] flex flex-col rounded-t-3xl bg-white dark:bg-gray-900 focus:outline-none"
          style={{ maxHeight: "90dvh" }}
          aria-describedby={undefined}
        >
          {/* drag handle must sit outside the scroll container */}
          <div className="mx-auto mt-3 mb-1 h-1 w-10 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
