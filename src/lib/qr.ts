export function encodePayQR(marketId: string, userId: string) {
  return `dalant:p:${marketId}:${userId}`;
}

export type ParsedQR =
  | {
      type: "mission";
      marketId: string;
      missionId: string;
      userId: string;
      token: string;
    }
  | { type: "pay"; marketId: string; userId: string }
  | null;

export function parseQR(value: string): ParsedQR {
  const parts = value.split(":");
  if (parts[0] !== "dalant") return null;
  if (parts[1] === "m" && parts.length === 7)
    return {
      type: "mission",
      marketId: parts[2],
      missionId: parts[3],
      userId: parts[4],
      token: value,
    };
  if (parts[1] === "p" && parts.length === 4)
    return { type: "pay", marketId: parts[2], userId: parts[3] };
  return null;
}
