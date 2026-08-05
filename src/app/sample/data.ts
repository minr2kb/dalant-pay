import type { Mission } from "@/types";

export const SAMPLE_MARKET_ID = "sample";

export const SAMPLE_MARKET = {
  id: SAMPLE_MARKET_ID,
  title: "체험용 여름 수련회",
  description: "달란트페이가 처음이신가요? 자유롭게 둘러보세요.",
  pointLabel: "달란트",
  startsAt: "2026-08-01T00:00:00.000Z",
  endsAt: "2026-08-05T00:00:00.000Z",
  createdAt: "2026-07-01T00:00:00.000Z",
};

export const SAMPLE_BALANCE = 1250;

export const SAMPLE_MISSIONS: Mission[] = [
  {
    id: "sample-mission-1",
    marketId: SAMPLE_MARKET_ID,
    title: "옆 사람과 인사하기",
    description: "처음 만난 사람과 통성명하고 QR을 서로 인증해요",
    type: "user_qr",
    isGroup: false,
    reward: 100,
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
    reward: 300,
    rewardMin: null,
    rewardMax: null,
    limitCount: null,
    activeFrom: null,
    activeUntil: null,
    isActive: true,
    sortOrder: 1,
    slots: [],
  },
  {
    id: "sample-mission-3",
    marketId: SAMPLE_MARKET_ID,
    title: "레크레이션 우승",
    description: "관리자가 현장에서 직접 지급해요",
    type: "manual",
    isGroup: false,
    reward: 500,
    rewardMin: null,
    rewardMax: null,
    limitCount: null,
    activeFrom: null,
    activeUntil: null,
    isActive: true,
    sortOrder: 2,
    slots: [],
  },
];

export const SAMPLE_RANKING: { displayName: string; balance: number }[] = [
  { displayName: "이서연", balance: 2400 },
  { displayName: "박지훈", balance: 1900 },
  { displayName: "나(체험중)", balance: SAMPLE_BALANCE },
  { displayName: "최유진", balance: 900 },
  { displayName: "정하람", balance: 650 },
];
