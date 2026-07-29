import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.QR_SECRET as string;
if (!SECRET) throw new Error("QR_SECRET env var is not set");

export function signMissionQR(
  marketId: string,
  missionId: string,
  userId: string,
  ttlMs = 5 * 60 * 1000,
): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = `dalant:m:${marketId}:${missionId}:${userId}:${expiresAt}`;
  const sig = createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16);
  return `${payload}:${sig}`;
}

export function verifyMissionQR(
  token: string,
): { marketId: string; missionId: string; userId: string } | null {
  const parts = token.split(":");
  if (parts.length !== 7 || parts[0] !== "dalant" || parts[1] !== "m")
    return null;
  const [, , marketId, missionId, userId, expiresAtStr, sig] = parts;
  if (Date.now() > Number(expiresAtStr)) return null;
  const payload = parts.slice(0, 6).join(":");
  const expected = createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16);
  // 타이밍 공격 방지 — 문자열 비교(!==)는 앞에서부터 다른 바이트가 나오는 순간
  // 멈춰서 응답 시간으로 서명을 바이트 단위로 추측할 수 있다. 길이가 다르면
  // timingSafeEqual이 바로 throw하니 길이 체크를 먼저 한다.
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  return { marketId, missionId, userId };
}
