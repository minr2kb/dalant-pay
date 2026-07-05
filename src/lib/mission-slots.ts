export function resolveNextSlot(
  logs: { slot: number; verifiedAt: string | null }[],
  limitCount: number | null,
): number {
  const verifiedSlots = new Set(
    logs.filter((l) => l.verifiedAt !== null).map((l) => l.slot),
  );
  if (limitCount === null) {
    const maxUsed = verifiedSlots.size > 0 ? Math.max(...verifiedSlots) : 0;
    return maxUsed + 1;
  }
  return (
    Array.from({ length: limitCount }, (_, i) => i + 1).find(
      (s) => !verifiedSlots.has(s),
    ) ?? 1
  );
}
