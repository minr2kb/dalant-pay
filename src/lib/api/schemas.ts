import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  realName: z.string(),
  birthDate: z.string(),
  gender: z.enum(["male", "female"]),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
});

export const MarketSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  pointLabel: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  createdAt: z.string(),
});

export const MarketListItemSchema = z.object({
  market: MarketSchema,
  participantCount: z.number(),
  isJoined: z.boolean(),
});

export const MissionSlotSchema = z.object({
  slot: z.number(),
  verifiedByName: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  photoUrl: z.string().nullable(),
});

export const MissionSchema = z.object({
  id: z.string(),
  marketId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(["user_qr", "upload", "admin_qr", "manual"]),
  isGroup: z.boolean(),
  reward: z.number(),
  rewardMin: z.number().nullable(),
  rewardMax: z.number().nullable(),
  limitCount: z.number().nullable(),
  activeFrom: z.string().nullable(),
  activeUntil: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  slots: z.array(MissionSlotSchema).optional(),
});

export const MarketParticipantSchema = z.object({
  id: z.string(),
  marketId: z.string(),
  user: UserSchema,
  role: z.enum(["admin", "user"]),
  balance: z.number(),
  displayName: z.string(),
});

export const OrderItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  qty: z.number(),
});

export const OrderSchema = z.object({
  id: z.string(),
  marketId: z.string(),
  userId: z.string(),
  verifiedByName: z.string(),
  items: z.array(OrderItemSchema),
  total: z.number(),
  purchasedAt: z.string(),
});

export const PointLogSchema = z.object({
  id: z.string(),
  marketId: z.string(),
  userId: z.string(),
  amount: z.number(),
  reasonType: z.enum(["mission", "purchase", "manual", "transfer"]),
  missionTitle: z.string().optional(),
  verifiedByName: z.string().optional(),
  itemName: z.string().optional(),
  orderId: z.string().optional(),
  memo: z.string().optional(),
  photoUrl: z.string().optional(),
  slot: z.number().optional(),
  verifiedByUserId: z.string().optional(),
  createdAt: z.string(),
  voidedAt: z.string().optional(),
});

export const EarnedTotalSchema = z.object({
  userId: z.string(),
  earned: z.number(),
});

export const PendingMissionLogSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  missionTitle: z.string(),
  reward: z.number(),
  rewardMin: z.number().nullable(),
  rewardMax: z.number().nullable(),
  userId: z.string(),
  slot: z.number(),
  photoUrl: z.string().nullable(),
  isGroup: z.boolean(),
});

export const MarketItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  sortOrder: z.number(),
});

export const TransferResponseSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.number(),
  newBalance: z.number(),
});
