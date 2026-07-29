import assert from "node:assert";
import { test } from "node:test";
import { resolveNextSlot } from "./mission-slots.ts";

test("로그 없으면 1번 슬롯부터", () => {
  assert.strictEqual(resolveNextSlot([], null), 1);
  assert.strictEqual(resolveNextSlot([], 3), 1);
});

test("무제한(limitCount null)이면 최대 슬롯 다음 번호", () => {
  const logs = [
    { slot: 1, verifiedAt: "2026-01-01" },
    { slot: 2, verifiedAt: "2026-01-02" },
  ];
  assert.strictEqual(resolveNextSlot(logs, null), 3);
});

test("횟수 제한이면 비어있는 가장 앞 슬롯을 재사용", () => {
  const logs = [
    { slot: 1, verifiedAt: "2026-01-01" },
    { slot: 3, verifiedAt: "2026-01-02" },
  ];
  assert.strictEqual(resolveNextSlot(logs, 3), 2);
});

test("미인증(voided 등) 슬롯은 집계에서 제외되어 빈 슬롯 취급", () => {
  const logs = [{ slot: 1, verifiedAt: null }];
  assert.strictEqual(resolveNextSlot(logs, 3), 1);
});

test("제한 횟수를 모두 채우면 1번으로 폴백", () => {
  const logs = [
    { slot: 1, verifiedAt: "2026-01-01" },
    { slot: 2, verifiedAt: "2026-01-02" },
  ];
  assert.strictEqual(resolveNextSlot(logs, 2), 1);
});
