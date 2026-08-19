import type {
  MarketItem,
  MarketParticipant,
  Mission,
  PointLog,
  Role,
} from "@/types";

export const SAMPLE_MARKET_ID = "sample";
export const SAMPLE_USER_ID = "sample-user";
export const SAMPLE_USER_NAME = "나(체험중)";

export const SAMPLE_MARKET = {
  id: SAMPLE_MARKET_ID,
  title: "체험용 여름 수련회",
  description: "달란트페이가 처음이신가요? 자유롭게 둘러보세요.",
  pointLabel: "달란트",
  startsAt: "2026-08-01T00:00:00.000Z",
  endsAt: "2026-08-05T00:00:00.000Z",
  createdAt: "2026-07-01T00:00:00.000Z",
};

// 랭킹 3위(나)와 값을 맞춰서 홈 "보유 달란트"와 랭킹이 같은 숫자를 보여준다.
export const SAMPLE_BALANCE = 40;

export const SAMPLE_MISSIONS: Mission[] = [
  {
    id: "sample-mission-1",
    marketId: SAMPLE_MARKET_ID,
    title: "옆 사람과 인사하기",
    description: "처음 만난 사람과 통성명하고 QR을 서로 인증해요",
    type: "user_qr",
    isGroup: false,
    reward: 1,
    rewardMin: null,
    rewardMax: null,
    limitCount: 1,
    activeFrom: null,
    activeUntil: null,
    isActive: true,
    sortOrder: 0,
    slots: [
      {
        slot: 1,
        verifiedByName: "김민수",
        verifiedAt: "2026-08-01T02:00:00.000Z",
        photoUrl: null,
        requested: true,
      },
    ],
  },
  {
    id: "sample-mission-2",
    marketId: SAMPLE_MARKET_ID,
    title: "단체 사진 인증샷",
    description: "조원 전체와 함께 사진을 찍어 업로드해요",
    type: "upload",
    isGroup: true,
    reward: 4,
    rewardMin: null,
    rewardMax: null,
    limitCount: null,
    activeFrom: null,
    activeUntil: null,
    isActive: true,
    sortOrder: 1,
    slots: [
      {
        slot: 1,
        verifiedByName: null,
        verifiedAt: "2026-08-01T06:30:00.000Z",
        photoUrl: null,
        requested: true,
      },
    ],
  },
  {
    id: "sample-mission-3",
    marketId: SAMPLE_MARKET_ID,
    title: "레크레이션 우승",
    description: "관리자가 현장에서 직접 지급해요",
    type: "manual",
    isGroup: false,
    reward: 5,
    rewardMin: null,
    rewardMax: null,
    limitCount: null,
    activeFrom: null,
    activeUntil: null,
    isActive: true,
    sortOrder: 2,
    slots: [],
  },
  {
    id: "sample-mission-4",
    marketId: SAMPLE_MARKET_ID,
    title: "물풍선 릴레이 완주",
    description: "완주하면 관리자가 QR을 직접 스캔해줘요",
    type: "admin_qr",
    isGroup: false,
    reward: 3,
    rewardMin: null,
    rewardMax: null,
    limitCount: 3,
    activeFrom: null,
    activeUntil: null,
    isActive: true,
    sortOrder: 3,
    slots: [
      {
        slot: 1,
        verifiedByName: "김민수",
        verifiedAt: "2026-08-02T03:00:00.000Z",
        photoUrl: null,
        requested: true,
      },
      {
        slot: 2,
        verifiedByName: null,
        verifiedAt: null,
        photoUrl: null,
        requested: false,
      },
      {
        slot: 3,
        verifiedByName: null,
        verifiedAt: null,
        photoUrl: null,
        requested: false,
      },
    ],
  },
  {
    id: "sample-mission-5",
    marketId: SAMPLE_MARKET_ID,
    title: "성경퀴즈 5문제 맞히기",
    description: "친구와 짝을 지어 서로 QR을 인증해요",
    type: "user_qr",
    isGroup: false,
    reward: 2,
    rewardMin: null,
    rewardMax: null,
    limitCount: 5,
    activeFrom: null,
    activeUntil: null,
    isActive: true,
    sortOrder: 4,
    slots: [
      {
        slot: 1,
        verifiedByName: "이서연",
        verifiedAt: "2026-08-02T05:00:00.000Z",
        photoUrl: null,
        requested: true,
      },
      {
        slot: 2,
        verifiedByName: "박지훈",
        verifiedAt: "2026-08-02T07:00:00.000Z",
        photoUrl: null,
        requested: true,
      },
      {
        slot: 3,
        verifiedByName: null,
        verifiedAt: null,
        photoUrl: null,
        requested: false,
      },
      {
        slot: 4,
        verifiedByName: null,
        verifiedAt: null,
        photoUrl: null,
        requested: false,
      },
      {
        slot: 5,
        verifiedByName: null,
        verifiedAt: null,
        photoUrl: null,
        requested: false,
      },
    ],
  },
];

function sampleParticipant(
  id: string,
  realName: string,
  balance: number,
  opts?: { group?: { id: string; name: string }; role?: Role },
): MarketParticipant {
  return {
    id: `sample-participant-${id}`,
    marketId: SAMPLE_MARKET_ID,
    user: {
      id: id === "me" ? SAMPLE_USER_ID : `sample-user-${id}`,
      name: realName,
      realName,
      birthDate: "2000-01-01",
      gender: "female",
      avatarUrl: null,
      createdAt: SAMPLE_MARKET.createdAt,
    },
    role: opts?.role ?? "user",
    balance,
    displayName: realName,
    groupId: opts?.group?.id ?? null,
    groupName: opts?.group?.name ?? null,
  };
}

// 관리자 스캔 화면의 "수동인증" 플로우(미션→참여자 선택)와 유저 관리 목록에서 쓴다.
// 이서연/박지훈은 같은 조로 묶어 단체 미션의 "팀 전체 선택" 버튼도 체험할 수 있게 하고,
// 김민수는 관리자 배지, 나(체험중)는 소유자 배지를 보여주도록 역할을 나눠뒀다.
export const SAMPLE_PARTICIPANTS: MarketParticipant[] = [
  sampleParticipant("1", "이서연", 50, {
    group: { id: "sample-group-1", name: "1조" },
  }),
  sampleParticipant("2", "박지훈", 45, {
    group: { id: "sample-group-1", name: "1조" },
  }),
  sampleParticipant("3", "정하람", 32),
  sampleParticipant("4", "김민수", 28, { role: "admin" }),
];

export const SAMPLE_ME: MarketParticipant = sampleParticipant(
  "me",
  SAMPLE_USER_NAME,
  SAMPLE_BALANCE,
  { role: "owner" },
);

export const SAMPLE_ITEMS: MarketItem[] = [
  {
    id: "sample-item-1",
    name: "아이스크림",
    price: 3,
    sortOrder: 0,
    isActive: true,
  },
  { id: "sample-item-2", name: "콜라", price: 2, sortOrder: 1, isActive: true },
  { id: "sample-item-3", name: "과자", price: 4, sortOrder: 2, isActive: true },
  {
    id: "sample-item-4",
    name: "기념 스티커",
    price: 1,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "sample-item-5",
    name: "굿즈 텀블러",
    price: 10,
    sortOrder: 4,
    isActive: false,
  },
];

export const SAMPLE_RANKING: { displayName: string; balance: number }[] = [
  { displayName: "이서연", balance: 50 },
  { displayName: "박지훈", balance: 45 },
  { displayName: SAMPLE_USER_NAME, balance: SAMPLE_BALANCE },
  { displayName: "임채원", balance: 36 },
  { displayName: "정하람", balance: 32 },
  { displayName: "김도윤", balance: 29 },
  { displayName: "오하은", balance: 26 },
  { displayName: "윤소율", balance: 24 },
];

export const SAMPLE_POINT_LOGS: PointLog[] = [
  {
    id: "sample-log-1",
    marketId: SAMPLE_MARKET_ID,
    userId: SAMPLE_USER_ID,
    amount: 1,
    reasonType: "mission",
    missionTitle: SAMPLE_MISSIONS[0].title,
    verifiedByName: "김민수",
    createdAt: "2026-08-02T08:00:00.000Z",
  },
  {
    id: "sample-log-2",
    marketId: SAMPLE_MARKET_ID,
    userId: SAMPLE_USER_ID,
    amount: 2,
    reasonType: "transfer",
    memo: "정하람 -> 나(체험중)",
    createdAt: "2026-08-02T06:00:00.000Z",
  },
  {
    id: "sample-log-3",
    marketId: SAMPLE_MARKET_ID,
    userId: SAMPLE_USER_ID,
    amount: -3,
    reasonType: "purchase",
    itemName: "아이스크림",
    createdAt: "2026-08-01T05:00:00.000Z",
  },
  {
    id: "sample-log-4",
    marketId: SAMPLE_MARKET_ID,
    userId: SAMPLE_USER_ID,
    amount: 5,
    reasonType: "manual",
    memo: "레크레이션 우승 보너스",
    createdAt: "2026-07-31T09:00:00.000Z",
  },
  {
    id: "sample-log-5",
    marketId: SAMPLE_MARKET_ID,
    userId: SAMPLE_USER_ID,
    amount: 4,
    reasonType: "mission",
    missionTitle: SAMPLE_MISSIONS[1].title,
    verifiedByName: "관리자",
    createdAt: "2026-08-01T02:00:00.000Z",
  },
];

// 관리자 홈 "최근 활동"은 여러 참여자가 뒤섞여 보여야 실제 화면처럼 느껴져서,
// 위 개인 내역과는 별도로 참여자 이름을 붙인 목록을 둔다.
export const SAMPLE_ADMIN_ACTIVITY: {
  log: PointLog;
  participantName: string;
}[] = [
  { log: SAMPLE_POINT_LOGS[0], participantName: SAMPLE_USER_NAME },
  {
    log: {
      id: "sample-admin-log-1",
      marketId: SAMPLE_MARKET_ID,
      userId: "sample-user-2",
      amount: 2,
      reasonType: "mission",
      missionTitle: SAMPLE_MISSIONS[4].title,
      verifiedByName: "박지훈",
      createdAt: "2026-08-02T07:00:00.000Z",
    },
    participantName: "이서연",
  },
  {
    log: {
      id: "sample-admin-log-2",
      marketId: SAMPLE_MARKET_ID,
      userId: "sample-user-3",
      amount: 3,
      reasonType: "mission",
      missionTitle: SAMPLE_MISSIONS[3].title,
      verifiedByName: "관리자",
      createdAt: "2026-08-02T03:00:00.000Z",
    },
    participantName: "김민수",
  },
  { log: SAMPLE_POINT_LOGS[2], participantName: "임채원" },
  { log: SAMPLE_POINT_LOGS[3], participantName: "정하람" },
];

export const SAMPLE_RECENT_MISSION_LOGS: {
  id: string;
  participantName: string;
  missionTitle: string;
  amount: number;
  createdAt: string;
}[] = [
  {
    id: "sample-recent-1",
    participantName: "박지훈",
    missionTitle: "성경퀴즈 5문제 맞히기",
    amount: 2,
    createdAt: "2026-08-02T07:00:00.000Z",
  },
  {
    id: "sample-recent-2",
    participantName: "이서연",
    missionTitle: "성경퀴즈 5문제 맞히기",
    amount: 2,
    createdAt: "2026-08-02T05:00:00.000Z",
  },
  {
    id: "sample-recent-3",
    participantName: "김민수",
    missionTitle: "물풍선 릴레이 완주",
    amount: 3,
    createdAt: "2026-08-02T03:00:00.000Z",
  },
  {
    id: "sample-recent-4",
    participantName: SAMPLE_USER_NAME,
    missionTitle: "옆 사람과 인사하기",
    amount: 1,
    createdAt: "2026-08-01T02:00:00.000Z",
  },
];
