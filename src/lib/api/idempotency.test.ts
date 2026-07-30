import assert from "node:assert";
import { test } from "node:test";
import type { Supabase } from "@/lib/api/route-helpers";
import { withIdempotencyKey } from "./idempotency.ts";

// route-helpers의 service_role 클라이언트를 실제로 띄우지 않고, withIdempotencyKey가
// 쓰는 from().insert()/.select().eq().maybeSingle()/.update().eq() 체인만 흉내낸
// 인메모리 더블 — insert는 이미 있는 key면 postgres unique_violation(23505)을 낸다.
function makeFakeSupabase(
  seed: Record<string, { status: number | null; response: unknown }> = {},
) {
  const store = new Map(Object.entries(seed));
  return {
    from(table: string) {
      assert.strictEqual(table, "idempotency_keys");
      return {
        insert(row: { key: string }) {
          if (store.has(row.key)) {
            return Promise.resolve({
              error: { code: "23505", message: "duplicate key" },
            });
          }
          store.set(row.key, { status: null, response: null });
          return Promise.resolve({ error: null });
        },
        select() {
          return {
            eq(_col: string, key: string) {
              return {
                maybeSingle: () =>
                  Promise.resolve({ data: store.get(key) ?? null }),
              };
            },
          };
        },
        update(patch: { status: number; response: unknown }) {
          return {
            eq(_col: string, key: string) {
              const row = store.get(key);
              if (row) {
                row.status = patch.status;
                row.response = patch.response;
              }
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  } as unknown as Supabase;
}

const baseOpts = { marketId: "m1", userId: "u1", endpoint: "transfer" };

test("key 없으면 DB 없이 handler를 바로 실행한다", async () => {
  const supabase = makeFakeSupabase();
  let calls = 0;
  const result = await withIdempotencyKey(
    supabase,
    { ...baseOpts, key: undefined },
    async () => {
      calls++;
      return { status: 200, json: { ok: true } };
    },
  );
  assert.strictEqual(calls, 1);
  assert.deepStrictEqual(result, { status: 200, json: { ok: true } });
});

test("새 key면 handler를 실행하고 결과를 저장한다", async () => {
  const supabase = makeFakeSupabase();
  let calls = 0;
  const result = await withIdempotencyKey(
    supabase,
    { ...baseOpts, key: "key-a" },
    async () => {
      calls++;
      return { status: 200, json: { newBalance: 10 } };
    },
  );
  assert.strictEqual(calls, 1);
  assert.deepStrictEqual(result, { status: 200, json: { newBalance: 10 } });
});

test("이미 완료된 key로 재시도하면 handler를 다시 안 태우고 캐시된 응답을 돌려준다", async () => {
  const supabase = makeFakeSupabase({
    "key-b": { status: 200, response: { newBalance: 10 } },
  });
  let calls = 0;
  const result = await withIdempotencyKey(
    supabase,
    { ...baseOpts, key: "key-b" },
    async () => {
      calls++;
      throw new Error("다시 실행되면 안 된다");
    },
  );
  assert.strictEqual(calls, 0);
  assert.deepStrictEqual(result, { status: 200, json: { newBalance: 10 } });
});

test("처리 중(status 미확정)인 key로 재시도하면 409를 돌려주고 handler는 안 태운다", async () => {
  const supabase = makeFakeSupabase({
    "key-c": { status: null, response: null },
  });
  let calls = 0;
  const result = await withIdempotencyKey(
    supabase,
    { ...baseOpts, key: "key-c" },
    async () => {
      calls++;
      return { status: 200, json: {} };
    },
  );
  assert.strictEqual(calls, 0);
  assert.strictEqual(result.status, 409);
});
