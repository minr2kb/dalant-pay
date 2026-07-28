import assert from "node:assert";
import { test } from "node:test";
import { resolveDisplayName } from "./resolve-display-name.ts";

test("겹치는 이름 없으면 실명 그대로, 충돌 아님", () => {
  assert.deepStrictEqual(resolveDisplayName("철수", new Set(["영희"])), {
    displayName: "철수",
    hasConflict: false,
  });
});

test("실명이 겹치면 B 접미사부터 붙인다", () => {
  assert.deepStrictEqual(resolveDisplayName("철수", new Set(["철수"])), {
    displayName: "철수B",
    hasConflict: true,
  });
});

test("B도 겹치면 다음 빈 접미사를 찾는다", () => {
  assert.deepStrictEqual(
    resolveDisplayName("철수", new Set(["철수", "철수B"])),
    { displayName: "철수C", hasConflict: true },
  );
});

test("알파벳을 전부 소진하면 실명 그대로 두되 충돌 표시는 남긴다", () => {
  const all = new Set([
    "철수",
    ..."BCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((s) => `철수${s}`),
  ]);
  assert.deepStrictEqual(resolveDisplayName("철수", all), {
    displayName: "철수",
    hasConflict: true,
  });
});
