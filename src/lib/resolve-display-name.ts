// realName이 이미 쓰이고 있으면 B, C, D... 접미사를 붙여 겹치지 않는 이름을 찾는다.
// 전체 알파벳이 다 겹치는 극단적 경우엔 실명 그대로 돌려주되 hasConflict만 true로 남긴다.
export function resolveDisplayName(
  realName: string,
  existingNames: Set<string>,
): { displayName: string; hasConflict: boolean } {
  if (!existingNames.has(realName)) {
    return { displayName: realName, hasConflict: false };
  }
  for (const suffix of "BCDEFGHIJKLMNOPQRSTUVWXYZ") {
    const candidate = `${realName}${suffix}`;
    if (!existingNames.has(candidate)) {
      return { displayName: candidate, hasConflict: true };
    }
  }
  return { displayName: realName, hasConflict: true };
}
