import { useEffect, useState } from "react";

// 삼성 인터넷 다크모드는 prefers-color-scheme을 거짓으로 보고하는 경우가 있어
// (기본값으로 항상 light) 다크모드 여부 자체는 신뢰해서 감지할 수 없다.
// UA만으로 판단 — 다크모드가 꺼져 있는 삼성 인터넷 사용자에게도 뜨지만,
// 안내 문구 한 줄 정도는 과다포함이 안전한 쪽이다.
export function useSamsungInternet() {
  const [isSamsungInternet, setIsSamsungInternet] = useState(false);

  useEffect(() => {
    setIsSamsungInternet(navigator.userAgent.includes("SamsungBrowser"));
  }, []);

  return isSamsungInternet;
}
