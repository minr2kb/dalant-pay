# 달란트페이

> 오프라인 모임을 위한 미션 인증 기반 달란트 결제 서비스


<img width="1200" height="630" alt="DP_thumb" src="https://github.com/user-attachments/assets/33770513-9201-4aea-a8f6-b48cf3aeac8b" />


---

## 서비스 소개

달란트페이는 수련회·MT·행사 등 오프라인 모임에서 미션을 수행하고 달란트(포인트)를 적립한 뒤, 마켓에서 사용하는 전 과정을 웹으로 처리하는 서비스입니다.

실물 달란트나 종이 미션표 없이, 스마트폰 하나로 미션 인증부터 마켓 결제까지 처리합니다. 마켓 단위로 격리되어 행사마다 독립적으로 재사용 가능합니다.

---

## 핵심 개념

### 마켓
행사 단위의 컨텍스트. 모든 미션·참여자·달란트 내역·구매 기록은 마켓에 속하며, 행사가 끝나도 데이터가 남아 다음 행사는 새 마켓으로 독립 운영합니다.

### 달란트
마켓 내 포인트. 미션 인증 시 적립되고, 마켓 구매 또는 참여자 간 전송으로 차감됩니다. 마켓마다 단위 이름을 커스텀할 수 있습니다 (달란트, 코인, 별 등).

### 권한
| 권한 | 설명 |
|------|------|
| `owner` | `admin` 권한 전체 + 마켓 생성, 마켓 설정 변경/종료 |
| `admin` | 미션 관리, QR 스캔 처리, 달란트 수동 지급/차감, 마켓 POS 사용 |
| `user` | 미션 인증 제출, 달란트 내역 확인, 마켓 구매, 참여자 간 전송 |

관리자도 참여자로서 동일하게 미션을 수행할 수 있습니다. 단, 자기 자신의 QR을 스캔하는 것은 서버에서 차단합니다.

마켓 생성은 화이트리스트(`users.can_create_market`)된 유저만 가능하며, 생성한 유저는 해당 마켓의 `owner`가 됩니다.

---

## 주요 기능

### 일반 참여자
- **미션 인증** — QR 코드 또는 사진 업로드로 미션을 인증하고 달란트를 즉시 적립
- **달란트 전송** — 같은 마켓 참여자에게 달란트를 직접 전송 (QR 스캔 또는 이름 검색)
- **달란트 내역** — 적립·차감·구매·전송 내역을 타임라인으로 확인
- **마켓 결제** — 홈 화면에서 결제 QR을 생성하면 관리자가 스캔해서 즉시 차감

### 관리자
- **QR 스캔** — 참여자가 제시한 QR을 스캔해 미션 인증 또는 마켓 결제를 즉시 처리. QR 없이 미션·참여자를 직접 선택하는 수동인증도 지원
- **활동 내역** — 업로드형 미션의 승인 대기 목록과 최근 활동을 한 화면에서 확인
- **달란트 관리** — 참여자별 수동 지급·차감 및 전체 잔액 현황 확인
- **미션 관리** — 미션 추가, 활성화/비활성화, 인증 타입·보상(고정 또는 범위)·횟수 설정, 드래그로 순서 변경
- **물품 관리** — 마켓 물품 추가/수정/삭제, 드래그로 순서 변경
- **마켓 POS** — 물품을 선택하고 참여자 QR을 스캔해 결제 처리
- **유저 관리** — 참여자별 달란트 잔액, 미션 완료 현황 확인

### 소유자 (`owner`)
- **마켓 생성** — 화이트리스트된 유저만 새 마켓 생성 가능
- **마켓 설정** — 마켓 정보 수정, 종료 처리
- **초대** — QR 코드 또는 링크 복사로 마켓 참여 초대

---

## 미션 인증 타입

| 타입 | 설명 |
|------|------|
| `user_qr` | 미션 수행자가 QR 생성 → 다른 참여자가 스캔 |
| `upload` | 사진 업로드 후 QR 생성 → 관리자가 스캔 |
| `admin_qr` | 미션 수행자가 QR 생성 → 관리자가 스캔 |
| `manual` | 인증 없음 — 관리자가 수동 지급 |

단체 미션(`is_group`)의 경우, 스캔 후 참여자를 추가 선택해 일괄 적립합니다.

---

## QR 인증 구조

### 미션 QR
```json
{
  "type": "mission",
  "missionId": "...",
  "userId": "...",
  "marketId": "...",
  "expiresAt": "ISO8601"
}
```
HMAC-SHA256 서명, 유효시간 5분. 이미 처리된 QR 재사용은 서버에서 차단합니다.

### 결제 QR (Pay QR)
```
dalant:p:<marketId>:<userId>
```
마켓 POS 결제 및 달란트 전송 수신자 식별에 재활용합니다.

---

## 달란트 전송

참여자끼리 달란트를 직접 전송할 수 있습니다.

- 수신자 선택: 상대방의 결제 QR 스캔 또는 이름 검색
- 원자적 처리: Supabase RPC(`transfer_points`)로 잔액 이전 + 로그 2건 삽입을 단일 트랜잭션으로 처리
- 내역: `reason_type = 'transfer'`, `memo = "송신자 → 수신자"` 형태로 기록

---

## DB 스키마

```sql
users               (id uuid PK, name, real_name, birth_date, gender, can_create_market)
markets             (id text PK, title, point_label, admin_code, starts_at, ends_at)
market_participants (id text PK, market_id text FK, user_id uuid FK, role, balance int)
market_items        (id text PK, market_id text FK, name, price int)
missions            (id text PK, market_id text FK, title, type, is_group, reward, reward_min, reward_max, limit_count, active_from, active_until, is_active)
mission_logs        (id text PK, mission_id text FK, user_id uuid FK, verified_by uuid FK, slot int, photo_url)
point_logs          (id text PK, market_id text FK, user_id uuid FK, amount int, reason_type, memo)
orders              (id text PK, market_id text FK, user_id uuid FK, verified_by uuid FK, items jsonb, total int)
```

**ID 타입**: `users.id` / `*.user_id`만 `uuid`. 나머지 모든 PK/FK는 `text` (nanoid).

**권한(`role`)**: `'owner' | 'admin' | 'user'`

`reason_type`: `'mission' | 'purchase' | 'manual' | 'transfer'`

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| 데이터 패칭 | TanStack Query v5 + @routar/react-query |
| 인증 | Kakao OAuth (Supabase Auth) |
| DB / Storage | Supabase (PostgreSQL + RLS) |
| 배포 | Vercel |

### 데이터 패칭 아키텍처

서버 컴포넌트에서 SSR prefetch → `HydrationBoundary` → 클라이언트 컴포넌트에서 `useSuspenseQuery`로 캐시 읽기. Mutation은 `invalidates` 선언으로 자동 캐시 무효화.

---

## 라우팅 구조

```
/login                              카카오 로그인
/onboarding                         최초 1회 본명·생일·성별 입력
/markets                            마켓 목록 (참여 중인 마켓만)
/markets/new                        마켓 생성 (owner 화이트리스트 전용)
/markets/[id]                       QR 랜딩 · 초대 링크 진입점 (마켓 참여)
/markets/[id]/home                  유저 홈 (잔액, 결제 QR, 전송, 최근 내역)
/markets/[id]/missions              미션 목록
/markets/[id]/missions/[missionId]  미션 상세 및 인증
/markets/[id]/history               달란트 내역
/markets/[id]/mypage                마이페이지
/markets/[id]/ranking               달란트 랭킹
/markets/[id]/admin/home            관리자 홈
/markets/[id]/admin/scan            QR 스캔 (수동인증 포함)
/markets/[id]/admin/activity        활동 내역 (승인 대기 등)
/markets/[id]/admin/points          달란트 수동 관리
/markets/[id]/admin/missions        미션 관리
/markets/[id]/admin/items           물품 관리
/markets/[id]/admin/pos             마켓 POS
/markets/[id]/admin/users           유저 관리
/markets/[id]/admin/users/[userId]  유저 상세
/markets/[id]/admin/settings        마켓 설정 (owner 전용)
```

---

## 로컬 개발

```bash
pnpm install
pnpm dev
```

`.env.local`에 Supabase 프로젝트 URL과 anon key를 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
