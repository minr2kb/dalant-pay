"use client";

import { overlay } from "overlay-kit";
import { type ReactNode, useEffect, useRef } from "react";

// 중첩 모달(모달 위에 또 모달)에서 popstate 하나가 열려있는 모든 인스턴스에
// 브로드캐스트되는 걸 막기 위한 스택 — 가장 최근에 열린(스택 최상단) 것만
// 자기 차례에 반응해서 닫히게 한다. 아니면 안쪽 모달을 닫을 때 바깥쪽까지
// 같이 닫혀버린다(뒤로가기 1번에 리스너 전부가 반응하므로).
const overlayStack: symbol[] = [];

function HistoryAwareModal({
  close,
  unmount,
  render,
}: {
  close: () => void;
  unmount: () => void;
  render: (close: () => void, unmount: () => void) => ReactNode;
}) {
  const idRef = useRef<symbol | null>(null);
  if (idRef.current === null) idRef.current = Symbol();

  useEffect(() => {
    const id = idRef.current as symbol;
    overlayStack.push(id);
    window.history.pushState({ overlay: true }, "");

    const handlePop = () => {
      if (overlayStack[overlayStack.length - 1] !== id) return;
      overlayStack.pop();
      close();
      unmount();
    };
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
      const idx = overlayStack.lastIndexOf(id);
      if (idx !== -1) overlayStack.splice(idx, 1);
    };
  }, [close, unmount]);

  // 뒤로가기로 닫기(X 버튼/배경 클릭용) — 실제 close/unmount는 popstate 핸들러가
  // 스택 최상단인지 확인한 뒤에 처리한다.
  function closeViaBack() {
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
