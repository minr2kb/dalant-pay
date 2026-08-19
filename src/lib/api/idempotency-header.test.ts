import assert from "node:assert";
import { test } from "node:test";
import { createApi, defineRouter, endpoint } from "@routar/core";
import { z } from "zod";
import { executor } from "./executor.ts";

// router.ts는 "./schemas"를 확장자 없이 import해서 node --experimental-strip-types의
// 네이티브 ESM 로더로는 못 읽는다(Next.js 번들러 모드 전용 관례) - 그래서 실제
// router.ts를 그대로 끌어오는 대신, 검증에 필요한 만큼만 로컬로 정의한다. executor는
// 프로덕션과 동일한 싱글턴을 그대로 쓰므로 fetch executor 자체는 진짜로 검증된다.
const testRouter = defineRouter("/markets", {
  verify: endpoint({
    method: "POST",
    path: "/:marketId/missions/:missionId/verify",
    request: {
      path: z.object({ marketId: z.string(), missionId: z.string() }),
      body: z.object({ userId: z.string().optional() }),
    },
    response: z.object({ missionId: z.string() }),
  }),
  transfer: endpoint({
    method: "POST",
    path: "/:marketId/transfer",
    request: {
      path: z.object({ marketId: z.string() }),
      body: z.object({ toUserId: z.string(), amount: z.number() }),
    },
    response: z.object({ newBalance: z.number() }),
  }),
});
const testApi = createApi(executor, testRouter);

// @routar/core 1.11 업데이트로 생긴 진짜 per-call 헤더 지원을 검증한다 - 이 테스트가
// 실패하면 idempotencyKey를 헤더로 옮긴 게 실제로는 요청에 안 실리고 있다는 뜻이다.
// executor.ts의 fetch executor는 free variable `fetch`를 호출 시점에 조회하므로,
// 모듈이 이미 로드돼 있어도 여기서 globalThis.fetch를 바꿔치기하면 그대로 먹힌다.
function stubFetch(onRequest: (init: RequestInit | undefined) => void) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (_url, init) => {
    onRequest(init);
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ data: { missionId: "m1", newBalance: 10 } }),
    } as Response;
  }) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

test("verify가 Idempotency-Key 헤더를 실제 fetch 요청에 실어 보낸다", async () => {
  let captured: Record<string, string> | undefined;
  const restore = stubFetch((init) => {
    captured = init?.headers as Record<string, string>;
  });
  try {
    await testApi.verify(
      { path: { marketId: "mk1", missionId: "m1" }, body: { userId: "u1" } },
      { headers: { "Idempotency-Key": "test-key-primary" } },
    );
  } finally {
    restore();
  }
  assert.strictEqual(captured?.["Idempotency-Key"], "test-key-primary");
});

test("연속 호출마다 다른 헤더를 보낼 수 있다 (그룹 미션 대상자별 키)", async () => {
  const seen: (string | undefined)[] = [];
  const restore = stubFetch((init) => {
    seen.push((init?.headers as Record<string, string>)?.["Idempotency-Key"]);
  });
  try {
    await Promise.all([
      testApi.verify(
        { path: { marketId: "mk1", missionId: "m1" }, body: { userId: "u1" } },
        { headers: { "Idempotency-Key": "key:primary" } },
      ),
      testApi.verify(
        { path: { marketId: "mk1", missionId: "m1" }, body: { userId: "u2" } },
        { headers: { "Idempotency-Key": "key:u2" } },
      ),
    ]);
  } finally {
    restore();
  }
  assert.deepStrictEqual(new Set(seen), new Set(["key:primary", "key:u2"]));
});

test("transfer도 Idempotency-Key 헤더를 실어 보낸다", async () => {
  let captured: Record<string, string> | undefined;
  const restore = stubFetch((init) => {
    captured = init?.headers as Record<string, string>;
  });
  try {
    await testApi.transfer(
      { path: { marketId: "mk1" }, body: { toUserId: "u2", amount: 5 } },
      { headers: { "Idempotency-Key": "transfer-key" } },
    );
  } finally {
    restore();
  }
  assert.strictEqual(captured?.["Idempotency-Key"], "transfer-key");
});

test("헤더 없이 호출하면 Idempotency-Key가 안 실린다 (옵트인 확인)", async () => {
  let captured: Record<string, string> | undefined;
  const restore = stubFetch((init) => {
    captured = init?.headers as Record<string, string>;
  });
  try {
    await testApi.transfer({
      path: { marketId: "mk1" },
      body: { toUserId: "u2", amount: 5 },
    });
  } finally {
    restore();
  }
  assert.strictEqual(captured?.["Idempotency-Key"], undefined);
});
