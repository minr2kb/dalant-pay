// 서버(프로덕션 런타임 기본 UTC)와 클라이언트(브라우저 로컬 = KST) timezone이 달라서
// 같은 텍스트가 다르게 렌더되면 hydration mismatch(React #418)가 난다. 이 서비스는
// 한국 오프라인 모임 전용이라 timezone은 항상 KST로 고정한다.
export function formatKST(
  date: Date | string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Date(date).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    ...options,
  });
}

// <input type="date"> 값(YYYY-MM-DD, KST 캘린더 날짜) ↔ timestamptz 변환.
// 한국은 DST가 없어 UTC+9 고정이라 오프셋을 문자열에 그대로 붙이면 된다.
export function kstDateToStartOfDayISO(dateStr: string) {
  return `${dateStr}T00:00:00+09:00`;
}

export function kstDateToEndOfDayISO(dateStr: string) {
  return `${dateStr}T23:59:59+09:00`;
}

// timestamptz -> KST 기준 YYYY-MM-DD (en-CA 로케일이 ISO 형식을 출력하는 걸 이용)
export function toKSTDateInputValue(date: Date | string) {
  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("ko", {
  numeric: "always",
});

// 상대 시각(초/분/시간/일 전) — 절대 시각과 달리 두 시점의 차이라 timezone 영향이 없다.
export function formatRelative(date: Date | string) {
  const diffSec = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return "방금 전";
  if (abs < 3600)
    return relativeTimeFormatter.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400)
    return relativeTimeFormatter.format(Math.round(diffSec / 3600), "hour");
  return relativeTimeFormatter.format(Math.round(diffSec / 86400), "day");
}
