// UA 문자열 기반 브라우저/환경 감지 — 전부 순수 함수, 호출 시점의 navigator를 그대로 읽는다.
// SSR에는 navigator가 없으니 클라이언트에서만(마운트 후, 이벤트 핸들러 등) 호출할 것.

// 삼성 인터넷 다크모드는 prefers-color-scheme을 거짓으로 보고하는 경우가 있어
// (기본값으로 항상 light) 다크모드 여부 자체는 신뢰해서 감지할 수 없다.
// UA만으로 판단 — 다크모드가 꺼져 있는 삼성 인터넷 사용자에게도 뜨지만,
// 안내 문구 한 줄 정도는 과다포함이 안전한 쪽이다.
export function isSamsungInternetBrowser() {
  return navigator.userAgent.includes("SamsungBrowser");
}

export function isKakao() {
  return /KAKAOTALK/i.test(navigator.userAgent);
}

export function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isInAppBrowser() {
  return /KAKAOTALK|NAVER\(|Instagram|FBAN|FBAV|Line\//i.test(
    navigator.userAgent,
  );
}
