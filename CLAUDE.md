@AGENTS.md

# 달란트페이 — 개발 컨텍스트

## 서비스 개요

오프라인 모임(수련회, MT, 행사 등)에서 미션 수행 → 달란트 적립 → 마켓 구매/전송까지 웹으로 처리하는 서비스. 실물 달란트·종이 미션표 없이 스마트폰 하나로 운영. 마켓 단위로 격리되어 행사마다 독립적으로 재사용 가능.

- **달란트** = 마켓 내 포인트. 이름 커스텀 가능 (`markets.point_label`: 달란트, 코인, 별 등)
- **권한**: `admin` (미션 관리, QR 스캔, 수동 지급, POS 결제) / `user` (미션 인증, 달란트 확인, 구매, 전송)
- 관리자도 참여자로 미션 수행 가능. 단, 자기 자신 QR 스캔 불가 (`verified_by != user_id`)
- 관리자 승격: 홈에서 `markets.admin_code` 입력 → `market_participants.role = 'admin'` 즉시 승격

## 라우팅 구조

```
/login                              → 카카오 로그인
/onboarding                         → 최초 1회 본명/생일/성별 입력
/markets                            → 마켓 목록
/markets/[id]                       → QR 랜딩 (마켓 진입)
/markets/[id]/(user)/...            → 일반 유저 화면 (route group, URL에 포함 안됨)
/markets/[id]/home                  → 유저 홈 (잔액 카드, 결제 QR, 전송, 최근 내역)
/markets/[id]/missions              → 미션 목록 (status=active|past)
/markets/[id]/missions/[missionId]  → 미션 상세
/markets/[id]/history               → 달란트 내역 (구매내역 포함, 탭 확장)
/markets/[id]/mypage                → 마이페이지
/markets/[id]/ranking               → 달란트 랭킹
/markets/[id]/admin/...             → 관리자 화면 (/admin/ URL 세그먼트 포함)
/markets/[id]/admin/home
/markets/[id]/admin/scan
/markets/[id]/admin/points
/markets/[id]/admin/missions
/markets/[id]/admin/pos
/markets/[id]/admin/users
/markets/[id]/admin/users/[userId]
```

## Next.js 16 주의사항

- `params`는 `Promise`다 — 반드시 `await props.params`
- `PageProps<'/path'>` / `LayoutProps<'/path'>` 타입은 전역 사용 가능 (import 불필요)
- **경로 문자열에 route group 이름 포함 금지**: `PageProps<'/markets/[id]/(user)/home'>` → ❌ / `PageProps<'/markets/[id]/home'>` → ✅
- Server Component → Client Component props: 직렬화 불가 값(React 컴포넌트, 함수) 전달 불가

## UI 패턴

- **아이콘 전달**: `FloatingTabBar`에 Lucide 컴포넌트 직접 전달 불가 → 문자열 키(`'Home'`, `'ListTodo'` 등)로 전달, 내부 `ICON_MAP`에서 해석
- **모달**: `'use client'` 컴포넌트로 분리 후 Server Component에서 import
- 탭바: 고정 pill 형태 `fixed bottom-4 left-4 right-4 rounded-full`
- 기본 색상: emerald `oklch(0.696 0.17 162.48)` (`--color-primary` 재정의)

## 미션 타입 (`MissionType`)

| 값 | 한국어 | 인증 방식 |
|----|--------|-----------|
| `'user_qr'` | 유저 간 인증 | 미션 수행자가 QR 생성 → 다른 참여자가 스캔 |
| `'upload'` | 업로드형 | 사진 업로드 → 관리자가 승인 후 QR 스캔 |
| `'admin_qr'` | 관리자 인증 | 미션 수행자가 QR 생성 → 관리자가 직접 스캔 |
| `'manual'` | 상시 | 인증 없음 — 관리자가 수동 지급 (게임 포인트 등) |

- `limitCount: number | null` — `null` = 무제한
- `isGroup: boolean` — 단체 미션이면 관리자 QR 스캔 시 같이 줄 인원 선택 창 표시
- `activeFrom` / `activeUntil` — `null`이면 제한 없음

## 미션 상태 (`MissionStatus`)

`getMissionStatus(mission)` — `src/types/index.ts` 에 정의
- `'active'`: `activeFrom ≤ now ≤ activeUntil`
- `'upcoming'`: `activeFrom > now` (UI에 탭 노출 안 함)
- `'past'`: `activeUntil < now`

## 모달 규칙

**모든 모달은 뒤로가기로 닫혀야 한다.**

**기본 패턴 — `openModal`** (`src/lib/overlay.tsx`). overlay-kit 위에 popstate 동기화 + 중첩 모달 스택 처리를 얹은 헬퍼. 실제로 대부분의 모달(TransferModal, QRModal, PointLogDetailModal, ImageViewer 등 10곳 이상)이 이 패턴을 쓴다.

```tsx
openModal((close) => <SomeModal onClose={close} />)
```

- `close`는 내부적으로 `window.history.back()`을 호출하도록 이미 연결되어 있음 — 직접 unmount하거나 state를 꺼서 닫지 않는다.
- 모달 위에 모달(중첩)이 열려도 뒤로가기 1번에 최상단 모달만 닫힌다 (`overlayStack`으로 관리).

**보조 패턴 — `useModalHistory(open, close)`** (`src/hooks/use-modal-history.ts`). overlay-kit 없이 로컬 `useState`로 여닫는 단순 폼에 한해 사용 (현재 `admin/missions/page.tsx` 1곳).

```tsx
const [open, setOpen] = useState(false)
const close = useCallback(() => setOpen(false), [])
useModalHistory(open, close)      // 열릴 때 pushState, popstate로 close 연결
```

- X 버튼 / 배경 클릭 닫기: `setOpen(false)` ❌ → `window.history.back()` ✅
- 모달 내부에서 직접 `setOpen(false)`를 호출하면 history 스택이 남아 다음 뒤로가기가 어긋남
- 새 모달은 특별한 이유가 없으면 `openModal`을 우선 사용할 것

## 버튼·입력 높이 규칙

**모든 인터랙티브 요소는 shadcn/ui 기반으로 작성한다.**

| 요소 | 최소 높이 | 비고 |
|------|-----------|------|
| 주요 액션 `Button` (CTA, 확인, 제출) | `h-12` (48px) | `py-*` 단독 사용 금지 |
| 보조 `Button` (취소, 보조 액션) | `h-10` (40px) | |
| `Input` (텍스트, 숫자, 검색) | `h-12` (48px) | `py-*`로 높이 지정 금지 |
| 탭 pill (토글형 선택) | `h-9` (36px) | 네이티브 `<button>` 허용 |
| 카드형 선택지 (성별, 옵션 카드 등) | 자유 (`py-6` 등) | 카드 전체가 터치 영역 |
| 아이콘 전용 버튼 (삭제, 추가 아이콘) | `h-8`~`h-10` | 네이티브 `<button>` 허용 |

**금지 패턴**
- `<input>` 네이티브 태그 직접 사용 → `<Input>` (shadcn)으로 교체
- `Button`에 `py-*`만으로 높이 지정 → 반드시 `h-*` 병행
- `size="sm"` → 높이가 36px 이하로 떨어지므로 사용 금지 (탭 pill 제외)

## FloatingTabBar · Nav 클리어런스

- TabBar: `fixed bottom-4 left-4 right-4 z-50 rounded-full` — 뷰포트 하단 약 86px 차지
- 레이아웃 `<main>`: **`min-h-svh pb-28`** — `<main>` 자체가 최소 뷰포트 높이를 보장하고 112px 여백으로 nav 가림 방지
- 페이지 root div: **`min-h-svh` 사용 금지** — 레이아웃 `<main>`이 이미 처리하므로 페이지에서 중복 설정하면 `pb-28`이 div 밖으로 밀려 하단 콘텐츠가 가려짐
- 예외: `admin/scan` 같은 full-screen 고정 오버레이 페이지는 별도 처리

```
✅ 레이아웃:  <main className="min-h-svh pb-28">
✅ 페이지:    <div className="bg-white">
❌ 페이지:    <div className="min-h-svh bg-white">  ← nav가 콘텐츠 가림
```

## DB ID 타입 규칙 — 혼동 금지

**`user_id` / `users.id`만 UUID. 그 외 모든 ID는 `text` (nanoid).**

| 컬럼 | 타입 | 이유 |
|------|------|------|
| `users.id` | `uuid` | Supabase Auth가 생성 |
| `*.user_id` (모든 테이블의 user_id FK) | `uuid` | `users.id` 참조 |
| `markets.id` | `text` | nanoid |
| `*.market_id` (모든 테이블의 market_id FK) | `text` | nanoid |
| `missions.id`, `mission_logs.id` | `text` | nanoid |
| `mission_logs.mission_id` | `text` | nanoid |
| `orders.id`, `point_logs.id` | `text` | nanoid |
| `market_items.id` | `text` | nanoid |

**RPC / SQL 함수 작성 시 체크리스트:**
- `p_market_id` → `text` ✅ (uuid ❌)
- `p_mission_id` → `text` ✅ (uuid ❌)
- `p_user_id` / `p_from_user_id` / `p_to_user_id` → `uuid` ✅

## DB 스키마 요약

```sql
users          (id uuid PK, name, real_name, birth_date, gender, created_at, plan_id text FK->plans, default 'free')
plans          (id text PK 'free'|'standard'|'pro', name, market_limit int|null, participant_limit int|null, group_feature bool, sort_order int)
markets        (id text PK, title, description, point_label, admin_code, starts_at, ends_at, created_at)
market_participants (id text PK, market_id text, user_id uuid, role 'admin'|'user', balance int, UNIQUE(market_id,user_id))
market_items   (id text PK, market_id text, name, price int)
missions       (id text PK, market_id text, title, description, type, is_group bool, reward int, limit_count int|null, active_from ts|null, active_until ts|null, is_active bool)
mission_logs   (id text PK, mission_id text, user_id uuid, verified_by uuid, slot int, photo_url, verified_at, UNIQUE(mission_id,user_id,slot), CHECK(user_id!=verified_by))
point_logs     (id text PK, market_id text, user_id uuid, amount int, reason_type, mission_log_id text|null, order_id text|null, memo text|null, created_at)
orders         (id text PK, market_id text, user_id uuid, verified_by uuid, items jsonb, total int, purchased_at)
```

`reason_type`: `'mission' | 'purchase' | 'manual' | 'transfer'`

## 플랜 게이팅

`src/lib/data/plans.ts` — `getUserPlan`(유저 본인 plan_id 기준), `getMarketOwnerPlan`(마켓 owner의 plan_id 기준, 참가자 정원·그룹 기능처럼 마켓 단위 게이트에 사용).
- 마켓 생성 개수 제한: `canCreateMarket`(`src/lib/data/markets.ts`)
- 마켓당 참가자 정원: `joinMarket`(`src/lib/data/participants.ts`)
- 참여자 그룹 관리(스탠다드 이상): `POST /api/markets/:marketId/groups`

## QR 데이터 포맷

- **미션 QR**: `{ type: 'mission', missionId, userId, marketId, expiresAt }` — HMAC-SHA256 서명, 유효시간 5분. 이미 처리된 QR 재사용은 서버에서 차단.
- **결제 QR (Pay QR)**: `dalant:p:<marketId>:<userId>` — 마켓 POS 결제 및 달란트 전송 수신자 식별에 재활용. 별도 수신자 전용 버튼 없음.
- QR 파싱: `src/lib/qr.ts`의 `parseQR(val)` 사용

## 달란트 전송 (`transfer`)

- `PointReasonType`에 `'transfer'` 포함: `'mission' | 'purchase' | 'manual' | 'transfer'`
- `memo` 포맷: `"<송신자 realName> -> <수신자 realName>"`
- API: `POST /api/markets/:marketId/transfer` → `{ data: { fromUserId, toUserId, amount, newBalance } }`
- Supabase RPC: `transfer_points(p_market_id text, p_from_user_id uuid, p_to_user_id uuid, p_amount int, p_memo text)` — 원자적 잔액 이전 + point_logs 2건 삽입

## 데이터 패칭 패턴

**라이브러리**: `@tanstack/react-query` + `@routar/react-query` (`flatten: true`)

```
Server Component (page.tsx)
  → getQueryClient() + prefetchQuery(xyzQuery.endpoint({ marketId, ... }))
  → <HydrationBoundary state={dehydrate(qc)}>
      → <Suspense fallback={<p>불러오는 중…</p>}>
          → <XyzClient marketId={marketId} />  ('use client')
              → useSuspenseQuery / useSuspenseQueries
```

- Query 팩토리: `src/lib/query/queries.ts` — `marketsQuery`, `participantsQuery`, `missionsQuery`, `pointLogsQuery`, `ordersQuery`, `itemsQuery`, `adminQuery`
- Mutation 캐시 무효화: `useMutation(xyzQuery.verb({ invalidates: [xyzQuery.list.queryKey({ marketId })] }))`
- `admin/scan`은 full-screen overlay 특성상 prefetch shell 없이 클라이언트 전용

## 스타일링

- Tailwind CSS v4 — `tailwind.config.js` 없음, `@import "tailwindcss"` in CSS
- shadcn/ui 컴포넌트는 `src/components/ui/` 에 복사되어 있음
- pnpm 워크스페이스: `ignore-workspace-root-check = true` 설정됨
