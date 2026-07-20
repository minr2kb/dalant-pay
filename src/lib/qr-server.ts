import { createHmac } from "node:crypto";

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
  if (sig !== expected) return null;
  return { marketId, missionId, userId };
}
