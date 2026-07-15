import assert from "node:assert";
import { test } from "node:test";
import { createSafeStorage } from "./persist-storage.ts";

test("정상 백엔드에서는 값을 그대로 읽고 쓴다", async () => {
  const store = new Map<string, string>();
  const storage = createSafeStorage({
    get: async (key) => store.get(key),
    set: async (key, value) => {
      store.set(key, value);
    },
    del: async (key) => {
      store.delete(key);
    },
  });

  await storage.setItem("a", "1");
  assert.strictEqual(await storage.getItem("a"), "1");
  await storage.removeItem("a");
  assert.strictEqual(await storage.getItem("a"), null);
});

test("백엔드가 없는 값을 반환하면 null", async () => {
  const storage = createSafeStorage({
    get: async () => undefined,
    set: async () => {},
    del: async () => {},
  });
  assert.strictEqual(await storage.getItem("missing"), null);
});

test("백엔드가 던져도 절대 throw하지 않는다 (IndexedDB 차단 환경 폴백)", async () => {
  const storage = createSafeStorage({
    get: async () => {
      throw new Error("blocked");
    },
    set: async () => {
      throw new Error("blocked");
    },
    del: async () => {
      throw new Error("blocked");
    },
  });

  assert.strictEqual(await storage.getItem("a"), null);
  await assert.doesNotReject(() => storage.setItem("a", "1"));
  await assert.doesNotReject(() => storage.removeItem("a"));
});
