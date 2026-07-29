import assert from "node:assert";
import { test } from "node:test";
import {
  formatReward,
  getMissionStatus,
  hasRewardRange,
  type Mission,
} from "./index.ts";

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "m1",
    marketId: "mk1",
    title: "test",
    type: "manual",
    isGroup: false,
    reward: 10,
    rewardMin: null,
    rewardMax: null,
    limitCount: null,
    activeFrom: null,
    activeUntil: null,
    isActive: true,
    sortOrder: 0,
    ...overrides,
  };
}

test("비활성 미션은 기간과 무관하게 past", () => {
  assert.strictEqual(
    getMissionStatus(makeMission({ isActive: false })),
    "past",
  );
});

test("기간 제한 없으면 active", () => {
  assert.strictEqual(getMissionStatus(makeMission()), "active");
});

test("activeUntil이 지났으면 past", () => {
  const mission = makeMission({ activeUntil: "2000-01-01T00:00:00Z" });
  assert.strictEqual(getMissionStatus(mission), "past");
});

test("activeFrom이 아직 안 왔으면 upcoming", () => {
  const mission = makeMission({ activeFrom: "2999-01-01T00:00:00Z" });
  assert.strictEqual(getMissionStatus(mission), "upcoming");
});

test("activeFrom~activeUntil 사이면 active", () => {
  const mission = makeMission({
    activeFrom: "2000-01-01T00:00:00Z",
    activeUntil: "2999-01-01T00:00:00Z",
  });
  assert.strictEqual(getMissionStatus(mission), "active");
});

test("rewardMin/Max 둘 다 있어야 range로 취급 — 하나만 있으면 고정 reward", () => {
  assert.strictEqual(hasRewardRange(makeMission({ rewardMin: 5 })), false);
  assert.strictEqual(
    hasRewardRange(makeMission({ rewardMin: 5, rewardMax: 20 })),
    true,
  );
});

test("formatReward: range면 min~max, 아니면 고정값", () => {
  assert.strictEqual(formatReward(makeMission({ reward: 10 })), "10");
  assert.strictEqual(
    formatReward(makeMission({ rewardMin: 5, rewardMax: 20 })),
    "5~20",
  );
});
