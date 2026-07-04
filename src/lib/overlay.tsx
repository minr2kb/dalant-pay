"use client";

import { overlay } from "overlay-kit";
import { type ReactNode, useEffect } from "react";

function HistoryAwareModal({
  close,
  unmount,
  render,
}: {
  close: () => void;
  unmount: () => void;
  render: (close: () => void, unmount: () => void) => ReactNode;
}) {
  useEffect(() => {
    window.history.pushState({ overlay: true }, "");
    const handlePop = () => {
      close();
      unmount();
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [close, unmount]);

  // 뒤로가기로 닫기(X 버튼/배경 클릭용) — 열 때 쌓은 히스토리 엔트리를 정리한다.
  function closeViaBack() {
    close();
    unmount();
    window.history.back();
  }

  // router.push 등으로 다른 라우트로 완전히 떠날 때는 history.back()을 같이
  // 부르면 안 된다 — 비동기 back()이 뒤이은 push()와 경쟁해서 이동을
  // 취소시킬 수 있다. 이 경우엔 언마운트만 즉시 하고 내비게이션은 맡긴다.
  return <>{render(closeViaBack, unmount)}</>;
}

export function openModal(
  render: (close: () => void, unmount: () => void) => ReactNode,
) {
  overlay.open(({ close, unmount }) => (
    <HistoryAwareModal close={close} unmount={unmount} render={render} />
  ));
}
