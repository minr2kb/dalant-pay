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
