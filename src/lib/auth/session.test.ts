import assert from "node:assert";
import { test } from "node:test";
import {
  decideSessionAction,
  didUserChange,
  rememberUserId,
} from "./session.ts";

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

function stubBrowserStorage() {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).window = globalThis;
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

test("기록된 유저가 없으면(첫 로그인) 바뀐 걸로 보지 않는다", () => {
  stubBrowserStorage();
  assert.strictEqual(didUserChange("user-a"), false);
});

test("rememberUserId로 남긴 유저와 같으면 안 바뀐 것", () => {
  stubBrowserStorage();
  rememberUserId("user-a");
  assert.strictEqual(didUserChange("user-a"), false);
});

test("rememberUserId로 남긴 유저와 다르면 바뀐 것", () => {
  stubBrowserStorage();
  rememberUserId("user-a");
  assert.strictEqual(didUserChange("user-b"), true);
});
