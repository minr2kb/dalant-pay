import assert from "node:assert";
import { test } from "node:test";
import { decideSessionAction } from "./session.ts";

test("로컬 세션 없으면 pending이든 뭐든 redirect", () => {
  assert.strictEqual(decideSessionAction(false, "pending"), "redirect");
  assert.strictEqual(decideSessionAction(false, "valid"), "redirect");
  assert.strictEqual(decideSessionAction(false, "invalid"), "redirect");
});

test("로컬 세션 있고 원격 검증 아직 pending이면 낙관적으로 render", () => {
  assert.strictEqual(decideSessionAction(true, "pending"), "render");
});

test("로컬 세션 있고 원격 검증 valid면 render", () => {
  assert.strictEqual(decideSessionAction(true, "valid"), "render");
});

test("로컬 세션 있어도 원격 검증 invalid면 redirect", () => {
  assert.strictEqual(decideSessionAction(true, "invalid"), "redirect");
});
