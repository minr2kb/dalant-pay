# routar 실사용 분석 (dalant-pay)

> **결론 먼저:** routar는 이 코드베이스에서 "반쪽짜리 계약"으로 쓰이고 있다. 클라이언트는 routar 계약 위에서 돌지만, 서버 15개 라우트는 그 계약을 전혀 모르고 손으로 다시 짠다. 이 비대칭이 장단점·버그·확장 설계의 모든 축을 결정한다.

---

## 1. 실제 배선 구조

routar가 닿는 범위를 그리면 이렇다:

```
router.ts (defineRouter + endpoint + zod)   ← 단일 계약 정의
   │
   ├─→ client.ts (createApi + dispatchExecutor)
   │        ├─ serverExecutor (cookie 포워딩, fetch self-call)   ← 사실상 미사용/함정
   │        └─ clientExecutor (브라우저 fetch)
   │
   └─→ queries.ts (createQueries flatten:true)  ← TanStack 액세서 생성
            │
            └─→ 컴포넌트: useSuspenseQuery(marketsQuery.get(...))

[서버 API 15개 route.ts]  ← routar를 import조차 안 함.
   route()/authRoute()/marketAdminRoute() + req.json() + 수동 if 검증
```

핵심 관찰: **`router.ts`의 zod body 스키마는 서버에서 죽은 코드다.** `transfer` 엔드포인트는 계약에 `amount: z.number().int().min(1)`을 선언하지만, `transfer/route.ts`는 그걸 안 쓰고 `if (!Number.isInteger(body.amount) || body.amount < 1)`로 다시 검증한다 (route-helpers, transfer/route.ts:9). 진실의 원천이 둘이다.

데이터 경로도 사실상 **3개로 분기**한다:
- (a) 클라이언트 → routar executor → fetch → API
- (b) 서버 컴포넌트 → supabase 직접 호출 → `qc.setQueryData(query.queryKey, {data})` 수동 시딩 (home/page.tsx:41)
- (c) 뮤테이션 → `transferApi.transfer()` core 클라이언트 직접 호출, react-query 액세서 우회 (TransferModal.tsx:47)

routar가 통일하는 건 데이터 흐름이 아니라 **타입**뿐이다.

---

## 2. 실사용 장점 (진짜 고충을 푸는 지점)

| 장점 | 근거 | 프론트 고충 해결도 |
|------|------|----------|
| **단일 계약 → 클라 타입 자동** | `marketsQuery.get({marketId})` 한 번에 path 검증 + 응답 타입 + queryKey가 다 나옴 | ★★★ — 수동 `fetch<T>()` + 키 문자열 관리의 표준 통증을 실제로 없앰 |
| **queryKey 자동·일관** | `participantsQuery.$key`, `.queryKey()`가 envelope 기준으로 생성 → SSR/CSR 키 일치 보장 | ★★★ — "키 오타로 invalidate 안 됨" 류 버그가 구조적으로 차단됨 |
| **`flatten:true` 호출 인체공학** | `get({marketId})` vs `get({path:{marketId}})` — envelope 안 쓰고 평평하게 | ★★ — 실제로 호출부가 깔끔함 |
| **prefetch/suspense 패턴 정착** | page.tsx에서 `.queryKey`로 시딩 → HydrationBoundary → `useSuspenseQuery` | ★★ — 이 패턴을 강제하니 팀 코드가 균일해짐 |
| **`invalidates` 선언형 캐시 무효화** | `routarQueryClient`가 `meta.invalidates` 자동 처리 | ★★ — 단, 이 코드베이스는 절반만 씀 (아래 단점) |

**결론(장점):** "클라이언트 단독 타입드 API 클라이언트 + TanStack 결선"으로는 좋은 라이브러리다. tRPC보다 가볍고(서버 런타임 의존 없음), 순수 OpenAPI codegen보다 손맛이 좋다. 키 관리·타입 동기화라는 프론트의 진짜 통증을 푼다.

---

## 3. 실사용 단점 (복잡도만 올리는 지점)

**(1) 가장 큰 문제 — 계약이 클라이언트에서 끝난다.**
서버가 같은 router를 안 쓰니, routar가 약속하는 "스키마 우선"의 절반이 실현 안 된다. body 검증 로직이 router.ts와 route.ts에 **이중으로** 존재하고 드리프트가 가능하다. 지금은 routar가 주는 안전망이 "클라가 보내는 모양"까지고, "서버가 받는 모양"은 보장 못 한다. 이 프로젝트에서 routar가 "복잡도 대비 효용"이 애매해지는 핵심 이유.

**(2) 이중 envelope 지옥. — ✅ RESOLVED.** 이 문서 작성 이후 `client.ts`의 `createFetchExecutor`에 `unwrap: (raw) => (raw as { data: unknown })?.data ?? raw`가 걸렸다. 지금은 컴포넌트에서 `.data.data`를 손으로 벗기는 코드가 없다. 아래 원래 분석은 히스토리로 남겨둔다:

> `oneOf(MarketSchema)` = `{data: Market}`를 응답 스키마로 쓰는데, executor에 `unwrap`을 안 걸었다. 그래서 `marketData.data.data`가 되는 걸 매 컴포넌트가 손으로 벗긴다. `createExecutor({unwrap})` 또는 endpoint `adapter`로 한 줄이면 사라질 마찰을 전역에 방치 중이었다.

**(3) `serverExecutor`는 함정이다.**
서버 컴포넌트가 자기 Next API를 `http://localhost:3000/api`로 fetch하는 건 안티패턴(불필요한 네트워크 홉 + 직렬화 + cookie 수동 재조립). 그래서 실제로 home/page는 이걸 우회하고 supabase를 직접 부른다. 즉 `client.ts`의 cookie 포워딩 serverExecutor는 **존재하지만 회피되는** 코드 — 다음 사람이 "왜 있지?" 하고 밟을 지뢰.

**(4) 뮤테이션 레이어를 절반만 채택. — ✅ RESOLVED.** 지금 `queries.ts`에 `transferQuery`가 있고, `TransferModal.tsx`는 `useMutation(transferQuery.transfer({invalidates: [participantsQuery.$key]}))`로 다른 뮤테이션과 동일한 패턴을 쓴다. 다만 `TransferModal.tsx`에 이제 안 쓰는 `transferApi` import가 죽은 채로 남아있었다(정리 필요 — 별도 코드 정리 대상). 아래 원래 분석은 히스토리로 남겨둔다:

> `queries.ts`에 `transferQuery`가 아예 없다. transfer는 core `transferApi`를 직접 부르고 `useMutation`을 손으로 쓰며 `invalidateQueries({queryKey: participantsQuery.$key})`를 수동 호출한다. routar의 `invalidates` 선언형 sugar를 안 쓰니, "뮤테이션 표준화"라는 가치가 휘발됨.

**(5) 응답 zod를 클라에서 매번 재파싱.**
`validate` 기본값 true라 모든 응답이 클라에서 zod 통과. 안전하지만, 이미 서버가 만든 신뢰 데이터에 대한 비용. 운영에선 `{request:true, response:'warn'}` 같은 드리프트-관측 모드가 더 맞다 (지금은 미설정).

**(6) 사소한 DRY.** `staleTime: 60_000`이 get-query-client.ts와 providers.tsx 양쪽에 복붙.

---

## 4. 에이전틱 코딩에서의 특성

routar는 **에이전트한테 양날**이다.

**유리한 점:**
- **계약이 한 파일에 모임** → 에이전트가 `router.ts` 하나만 읽으면 전체 API 표면을 안다. 탐색 비용↓.
- **타입이 손을 잡아줌** → 에이전트가 `get({marketId})` 호출을 틀리면 컴파일 에러. 환각 키·환각 필드가 차단됨.
- **패턴이 균일** → page→client→suspense가 정형화돼서, 새 화면 추가 시 에이전트가 복붙·치환으로 안전하게 확장.

**불리한 점:**
- **이중 envelope + 3-경로 분기**는 에이전트가 자주 틀리는 지점이다. `.data.data`를 한 단계 빼먹거나, 서버에서 routar client를 써야 할지 supabase 직접 호출할지 판단을 흔든다. 실제로 이 코드베이스의 "home은 setQueryData, 다른 건 prefetch" 같은 비일관은 에이전트가 어느 쪽을 모방할지 헷갈리게 만든다.
- **죽은 코드(serverExecutor, 미사용 transferQuery 부재)**는 에이전트에게 잘못된 신호를 준다 — "serverExecutor가 있으니 서버에서 이걸 써야지" 하고 안티패턴을 강화할 위험.
- **계약↔구현 드리프트를 컴파일러가 못 잡음** (서버가 계약 밖이라). 에이전트가 route.ts의 검증을 바꿔도 router.ts가 안 따라오고, 아무도 안 깨진다 → 조용한 버그.

**종합:** 계약을 **양쪽이** 강제했다면 routar는 에이전틱 코딩에 이상적인 구조(좁은 진실의 원천 + 컴파일 가드)다. 지금처럼 클라만 강제하면, 에이전트가 밟을 수 있는 비일관 표면이 오히려 늘어난다.

---

## 5. 발견한 버그·날카로운 모서리

직접 트레이스한 것들 (대부분 routar 자체 버그가 아니라 **설정/사용 결함**):

1. **계약-구현 드리프트 무방비** (구조적). router.ts의 body 스키마와 route.ts의 수동 검증이 분리 → 언제든 어긋남. 가장 심각.
2. **`serverExecutor` self-HTTP 안티패턴** (client.ts:18-25). 서버에서 호출되면 자기 API로 네트워크 왕복. 현재 회피되지만 제거 안 됨.
3. ~~이중 envelope 미해소~~ — ✅ RESOLVED (`client.ts`에 `unwrap` 설정됨, `.data.data` 코드 없음).
4. ~~뮤테이션 비일관~~ — ✅ RESOLVED (`transferQuery` 존재, `TransferModal.tsx`가 다른 뮤테이션과 동일 패턴 사용).
5. **응답 검증 비용** 운영 모드 미세팅 (`validate` 기본 strict).
6. **DRY**: staleTime 중복.

routar **라이브러리 자체**에서 눈에 띈 잠재 모서리:
- `joinPaths`가 `://`를 뭉갠다고 d.ts에 명시 — `createFetchExecutor`에 절대 URL을 baseURL로 주는 이 코드(`${BASE_URL}/api`)는 내부에서 절대 URL을 어떻게 다루는지에 따라 취약. 지금은 동작하지만 baseURL 합성 규칙이 문서화 덜 됨.
- `flatten`이 body가 plain object가 아니면(배열) envelope로 폴백하는데, 이 폴백이 **타입에서만** 일어나고 호출자는 그걸 모름 → 어떤 엔드포인트는 flat, 어떤 건 envelope라 호출 스타일이 엔드포인트마다 갈림. (이 프로젝트는 운 좋게 안 밟음)

---

## 6. 추가되면 좋을 것 (routar 쪽)

- **`unwrap` 프리셋 + envelope 헬퍼 공식화**: `listOf`/`oneOf` 같은 `{data}` 래퍼를 routar가 1급으로 알고 자동 언랩. (지금은 사용자가 매번 손으로)
- **개발 모드 계약-구현 어서션**: 서버 핸들러를 routar가 모를 때라도, 응답이 스키마와 다르면 dev에서 throw하는 옵션 (현재 `'warn'`보다 강한 dev-only strict).
- **mutation invalidates를 router 레벨에서 선언** — 이미 `defaults`로 가능하지만, 이 프로젝트가 안 쓰는 걸 보면 디스커버리가 약함. 문서/예제 강화.
- **그리고 가장 큰 것 → 서버 모듈.** 아래.

---

## 7. Next.js 백엔드 확장 모듈 설계 (`@routar/next`)

핵심 제약부터: **Next App Router는 파일 기반 라우팅**이라 routar가 라우팅을 "소유"할 수 없다. 따라서 모듈은 *서버를 띄우는* 게 아니라, **파일별 핸들러를 계약에 바인딩하는 어댑터**여야 한다. 이게 설계의 전제다.

### 7.1 목표

같은 `router.ts`를 서버가 소비해서:
1. path/query/body **자동 검증·타입드 인자**로 핸들러에 주입 (수동 `req.json()` + `if` 제거)
2. 응답을 **계약 스키마로 dev 검증** + envelope **자동 래핑** (이중 `.data` 소멸)
3. 미들웨어/컨텍스트(supabase, userId, role) **타입드 주입** — 기존 `authRoute`/`marketAdminRoute`를 흡수
4. 도메인 에러 → HTTP 상태 **선언형 매핑** (`err('insufficient...', 400)` 산재 제거)
5. **RSC 인프로세스 호출** — 서버에서 fetch self-call 대신 핸들러를 직접 invoke (serverExecutor 함정 제거)

### 7.2 핸들러 바인딩 인터페이스

```ts
// app/api/markets/[marketId]/transfer/route.ts
import { createRoute } from '@routar/next'
import { transferRouter } from '@/lib/api/router'
import { withAuth, withMarket } from '@/lib/api/ctx'

export const { POST } = createRoute(transferRouter, {
  // 키 = 계약의 엔드포인트 이름. 시그니처가 계약에서 추론됨.
  transfer: async ({ params, body, ctx }) => {
    // params: { marketId: string }      ← path 스키마에서 타입+검증 완료
    // body:   { toUserId, amount }       ← body 스키마에서 검증 완료 (min(1) 포함!)
    // ctx:    { supabase, userId }       ← 미들웨어가 주입
    if (body.toUserId === ctx.userId)
      throw new ApiError('SELF_TRANSFER', '자신에게는 전송할 수 없습니다', 400)

    const { data, error } = await ctx.supabase.rpc('transfer_points', { ... })
    if (error) throw mapRpcError(error)   // 도메인→HTTP 매핑

    // bare data 반환 → 모듈이 oneOf 계약 보고 {data} 자동 래핑 + dev 검증
    return { fromUserId: ctx.userId, toUserId: body.toUserId, amount: body.amount, newBalance: data.new_balance }
  },
}, {
  middleware: [withAuth, withMarket('admin')],   // 기존 authRoute/marketAdminRoute 대체
})
```

이 한 블록이 현재 `transfer/route.ts`의 수동 파싱·검증·envelope를 **전부** 흡수한다. router.ts가 유일한 진실의 원천이 되고, `amount: z.number().int().min(1)`이 서버에서 **실제로** 강제된다.

### 7.3 미들웨어 = 타입드 컨텍스트 빌더

```ts
// 컨텍스트를 누적 타입으로 쌓는 형태 (Hono/tRPC 스타일)
const withAuth: Middleware<{}, { userId: string; supabase: Supabase }> =
  async (req, ctx, next) => {
    const user = await getUser(req)
    if (!user) throw new ApiError('UNAUTHORIZED', 'Unauthorized', 401)
    return next({ ...ctx, userId: user.id, supabase })
  }

const withMarket = (role: 'admin' | 'user'): Middleware<
  { userId: string; supabase: Supabase; params: { marketId: string } },
  { marketRole: 'admin' | 'user' }
> => async (req, ctx, next) => {
  const p = await ctx.supabase.from('market_participants')...
  if (role === 'admin' && p?.role !== 'admin')
    throw new ApiError('FORBIDDEN', 'Forbidden', 403)
  return next({ ...ctx, marketRole: p.role })
}
```

핸들러의 `ctx` 타입은 미들웨어 체인이 누적한 타입으로 추론된다. 지금의 `route`/`authRoute`/`marketAdminRoute` 3개 헬퍼가 합성 가능한 미들웨어 하나로 일반화됨.

### 7.4 에러 매핑 레지스트리

```ts
class ApiError extends Error {
  constructor(public code: string, public userMessage: string, public status: number) { super(code) }
}
// RPC 에러 문자열 → ApiError 매핑을 한 곳에
const mapRpcError = makeRpcMapper({
  insufficient_balance: ['잔액이 부족합니다', 400],
  sender_not_found:     ['참가자를 찾을 수 없습니다', 404],
  recipient_not_found:  ['수신자가 이 마켓의 참가자가 아닙니다', 404],
})
```
모듈이 핸들러에서 throw된 `ApiError`를 잡아 `{error: msg}` + status로 변환. 현재 route.ts마다 흩어진 `if (error.message.includes(...))` 사다리를 대체.

### 7.5 킬러 기능 — RSC 인프로세스 호출

```ts
// 서버 컴포넌트에서: fetch self-call ❌ → 같은 계약으로 핸들러 직접 invoke ✅
import { callServer } from '@routar/next'

const market = await callServer(marketsRouter.get, { params: { marketId } })
// 내부적으로 바인딩된 핸들러를 in-process 실행. 네트워크 0홉.
// 같은 계약 → 같은 타입 → client.ts의 serverExecutor 함정 자체가 사라짐
```

이게 dispatchExecutor의 server/client 분기를 **올바르게** 만든다: 클라는 fetch, 서버는 인프로세스. home/page.tsx의 "supabase 직접 호출 + 수동 setQueryData" 우회가 필요 없어지고, prefetch도 계약 위에서 통일된다.

### 7.6 파일 매핑 문제의 해법

routar path(`/:marketId/missions/:missionId/verify`)와 Next 파일 경로(`[marketId]/.../[missionId]/verify/route.ts`)의 정합성은 **빌드타임 린트**로 검증:
```
@routar/next check   → 계약의 모든 엔드포인트가 대응 route.ts에 바인딩됐는지,
                       파일 위치가 path와 일치하는지 정적 검사. CI 게이트.
```
(routar가 라우팅을 못 가지니, "누락/오배치"를 컴파일 밖에서라도 잡아주는 게 현실적 최선.)

### 7.7 이 설계가 푸는 것

| 현재 문제 | 모듈 적용 후 |
|-----------|-------------|
| 계약-구현 드리프트 | 서버가 같은 router 소비 → 컴파일 강제 |
| body 이중 검증 | router.ts 단일 검증, 서버 자동 적용 |
| 이중 `.data.data` | 핸들러 bare 반환 + 자동 envelope |
| serverExecutor self-HTTP | `callServer` 인프로세스 |
| 에러 처리 산재 | 레지스트리 매핑 |
| authRoute 3종 | 합성 미들웨어 1종 |

---

## 한 줄 요약

routar는 지금 "타입드 클라이언트"로는 값을 하지만, 이 코드베이스에선 계약을 클라이언트에서만 강제해 효용의 절반을 흘리고 있다. `@routar/next` 같은 서버 바인딩 모듈로 계약을 **양쪽에서** 닫으면, 이중 검증·이중 envelope·self-HTTP·에러 산재가 한꺼번에 사라지고 에이전틱 코딩에도 이상적인 "좁은 진실의 원천 + 양방향 컴파일 가드" 구조가 된다.
