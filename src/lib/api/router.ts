import { defineRouter, endpoint } from "@routar/core";
import { z } from "zod";
import {
  EarnedTotalSchema,
  MarketItemSchema,
  MarketListItemSchema,
  MarketParticipantSchema,
  MarketSchema,
  MissionSchema,
  OrderItemSchema,
  OrderSchema,
  PendingMissionLogSchema,
  PointLogSchema,
  TransferResponseSchema,
} from "./schemas";

const marketId = z.object({ marketId: z.string() });
const marketAndUser = z.object({ marketId: z.string(), userId: z.string() });
const marketAndMission = z.object({
  marketId: z.string(),
  missionId: z.string(),
});
const marketAndItem = z.object({ marketId: z.string(), itemId: z.string() });

export const marketsRouter = defineRouter("/markets", {
  list: endpoint({
    method: "GET",
    path: "/",
    response: z.array(MarketListItemSchema),
  }),
  get: endpoint({
    method: "GET",
    path: "/:marketId",
    request: { path: marketId },
    response: MarketSchema,
  }),
  create: endpoint({
    method: "POST",
    path: "/",
    request: {
      body: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        pointLabel: z.string().min(1),
        adminCode: z.string().min(4),
        startsAt: z.string(),
        endsAt: z.string(),
      }),
    },
    response: z.object({ marketId: z.string() }),
  }),
  update: endpoint({
    method: "PATCH",
    path: "/:marketId",
    request: {
      path: marketId,
      body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        pointLabel: z.string().min(1).optional(),
        adminCode: z.string().min(4).optional(),
        startsAt: z.string().optional(),
        endsAt: z.string().optional(),
      }),
    },
    response: MarketSchema,
  }),
});

export const participantsRouter = defineRouter("/markets", {
  list: endpoint({
    method: "GET",
    path: "/:marketId/participants",
    request: { path: marketId },
    response: z.array(MarketParticipantSchema),
  }),
  get: endpoint({
    method: "GET",
    path: "/:marketId/participants/:userId",
    request: { path: marketAndUser },
    response: z.object({
      participant: MarketParticipantSchema,
      pointLogs: z.array(PointLogSchema),
      orders: z.array(OrderSchema),
    }),
  }),
  adjustPoints: endpoint({
    method: "PATCH",
    path: "/:marketId/participants/:userId/points",
    request: {
      path: marketAndUser,
      body: z.object({
        amount: z.number().int(),
        memo: z.string().optional(),
      }),
    },
    response: z.object({
      userId: z.string(),
      amount: z.number(),
      newBalance: z.number(),
      memo: z.string().nullable(),
    }),
  }),
  join: endpoint({
    method: "POST",
    path: "/:marketId/participants",
    request: { path: marketId },
    response: z.object({
      isNew: z.boolean(),
      hasConflict: z.boolean(),
      displayName: z.string(),
    }),
  }),
  promoteOwner: endpoint({
    method: "POST",
    path: "/:marketId/participants/:userId/promote-owner",
    request: { path: marketAndUser },
    response: MarketParticipantSchema,
  }),
  revokeRole: endpoint({
    method: "POST",
    path: "/:marketId/participants/:userId/revoke-role",
    request: { path: marketAndUser },
    response: MarketParticipantSchema,
  }),
});

export const missionsRouter = defineRouter("/markets", {
  list: endpoint({
    method: "GET",
    path: "/:marketId/missions",
    request: {
      path: marketId,
      query: z
        .object({
          status: z.enum(["active", "upcoming", "past"]).optional(),
          userId: z.string().optional(),
        })
        .optional(),
    },
    response: z.array(MissionSchema),
  }),
  get: endpoint({
    method: "GET",
    path: "/:marketId/missions/:missionId",
    request: {
      path: marketAndMission,
      query: z.object({ userId: z.string().optional() }).optional(),
    },
    response: MissionSchema,
  }),
  create: endpoint({
    method: "POST",
    path: "/:marketId/missions",
    request: {
      path: marketId,
      body: z.object({
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(["user_qr", "upload", "admin_qr", "manual"]),
        isGroup: z.boolean(),
        reward: z.number().int().min(0),
        rewardMin: z.number().int().min(0).nullable().optional(),
        rewardMax: z.number().int().min(0).nullable().optional(),
        limitCount: z.number().int().min(1).nullable(),
        activeFrom: z.string().nullable(),
        activeUntil: z.string().nullable(),
      }),
    },
    response: MissionSchema,
  }),
  update: endpoint({
    method: "PATCH",
    path: "/:marketId/missions/:missionId",
    request: {
      path: marketAndMission,
      body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(["user_qr", "upload", "admin_qr", "manual"]).optional(),
        isGroup: z.boolean().optional(),
        reward: z.number().int().min(0).optional(),
        rewardMin: z.number().int().min(0).nullable().optional(),
        rewardMax: z.number().int().min(0).nullable().optional(),
        limitCount: z.number().int().min(1).nullable().optional(),
        activeFrom: z.string().nullable().optional(),
        activeUntil: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }),
    },
    response: MissionSchema,
  }),
  delete: endpoint({
    method: "DELETE",
    path: "/:marketId/missions/:missionId",
    request: { path: marketAndMission },
    response: z.object({ id: z.string() }),
  }),
  reorder: endpoint({
    method: "PATCH",
    path: "/:marketId/missions/reorder",
    request: {
      path: marketId,
      body: z.object({ missionIds: z.array(z.string()) }),
    },
    response: z.array(MissionSchema),
  }),
  verify: endpoint({
    method: "POST",
    path: "/:marketId/missions/:missionId/verify",
    request: {
      path: marketAndMission,
      body: z.object({
        token: z.string().optional(),
        userId: z.string().optional(),
        slot: z.number().optional(),
        reward: z.number().int().min(0).optional(),
      }),
    },
    response: z.object({
      missionId: z.string(),
      userId: z.string(),
      verifiedBy: z.string(),
      slot: z.number(),
      reward: z.number(),
      verifiedAt: z.string(),
    }),
  }),
  uploadPhoto: endpoint({
    method: "POST",
    path: "/:marketId/missions/:missionId/photo",
    request: {
      path: marketAndMission,
      // photoUrl 없이 호출 가능 — 사진 업로드가 계속 실패할 때 유저가 사진 없이
      // 인증 대기 상태로만 넘어갈 수 있는 탈출구
      body: z.object({ photoUrl: z.string().optional() }),
    },
    response: z.object({ slot: z.number(), photoUrl: z.string().nullable() }),
  }),
  deletePhoto: endpoint({
    method: "DELETE",
    path: "/:marketId/missions/:missionId/photo",
    request: {
      path: marketAndMission,
      body: z.object({ userId: z.string().optional() }),
    },
    response: z.object({ deleted: z.boolean() }),
  }),
  pendingLogs: endpoint({
    method: "GET",
    path: "/:marketId/missions/pending",
    request: { path: marketId },
    response: z.array(PendingMissionLogSchema),
  }),
});

const marketAndLog = z.object({ marketId: z.string(), logId: z.string() });

export const pointLogsRouter = defineRouter("/markets", {
  list: endpoint({
    method: "GET",
    path: "/:marketId/point-logs",
    request: {
      path: marketId,
      query: z
        .object({
          userId: z.string().optional(),
          page: z.coerce.number().int().min(0).optional(),
          pageSize: z.coerce.number().int().min(1).optional(),
        })
        .optional(),
    },
    response: z.array(PointLogSchema),
  }),
  recentMissions: endpoint({
    method: "GET",
    path: "/:marketId/point-logs/recent-missions",
    request: {
      path: marketId,
    },
    response: z.array(PointLogSchema),
  }),
  earnedTotals: endpoint({
    method: "GET",
    path: "/:marketId/point-logs/earned-totals",
    request: { path: marketId },
    response: z.array(EarnedTotalSchema),
  }),
  revoke: endpoint({
    method: "POST",
    path: "/:marketId/point-logs/:logId/revoke",
    request: { path: marketAndLog },
    response: z.object({ id: z.string(), newBalance: z.number() }),
  }),
});

export const ordersRouter = defineRouter("/markets", {
  list: endpoint({
    method: "GET",
    path: "/:marketId/orders",
    request: {
      path: marketId,
      query: z.object({ userId: z.string().optional() }).optional(),
    },
    response: z.array(OrderSchema),
  }),
  create: endpoint({
    method: "POST",
    path: "/:marketId/orders",
    request: {
      path: marketId,
      body: z.object({
        userId: z.string(),
        items: z.array(OrderItemSchema),
      }),
    },
    response: z.object({
      id: z.string(),
      marketId: z.string(),
      userId: z.string(),
      verifiedBy: z.string(),
      items: z.array(OrderItemSchema),
      total: z.number(),
      newBalance: z.number(),
      purchasedAt: z.string(),
    }),
  }),
});

export const itemsRouter = defineRouter("/markets", {
  list: endpoint({
    method: "GET",
    path: "/:marketId/items",
    request: { path: marketId },
    response: z.array(MarketItemSchema),
  }),
  create: endpoint({
    method: "POST",
    path: "/:marketId/items",
    request: {
      path: marketId,
      body: z.object({ name: z.string(), price: z.number().int().min(0) }),
    },
    response: MarketItemSchema,
  }),
  update: endpoint({
    method: "PATCH",
    path: "/:marketId/items/:itemId",
    request: {
      path: marketAndItem,
      body: z.object({
        name: z.string().optional(),
        price: z.number().int().min(0).optional(),
        sortOrder: z.number().int().optional(),
      }),
    },
    response: MarketItemSchema,
  }),
  delete: endpoint({
    method: "DELETE",
    path: "/:marketId/items/:itemId",
    request: { path: marketAndItem },
    response: z.object({ id: z.string() }),
  }),
  reorder: endpoint({
    method: "PATCH",
    path: "/:marketId/items/reorder",
    request: {
      path: marketId,
      body: z.object({ itemIds: z.array(z.string()) }),
    },
    response: z.array(MarketItemSchema),
  }),
});

export const adminRouter = defineRouter("/markets", {
  auth: endpoint({
    method: "POST",
    path: "/:marketId/admin/auth",
    request: {
      path: marketId,
      body: z.object({ code: z.string() }),
    },
    response: z.object({ granted: z.boolean() }),
  }),
});

export const transferRouter = defineRouter("/markets", {
  transfer: endpoint({
    method: "POST",
    path: "/:marketId/transfer",
    request: {
      path: marketId,
      body: z.object({
        toUserId: z.string(),
        amount: z.number().int().min(1),
      }),
    },
    response: TransferResponseSchema,
  }),
});

// 마켓에 속하지 않는 리소스 — 푸시 구독은 유저·디바이스 단위라 /markets 밖에 둔다.
export const pushRouter = defineRouter("/push", {
  subscribe: endpoint({
    method: "POST",
    path: "/subscribe",
    request: {
      body: z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      }),
    },
    response: z.object({ ok: z.boolean() }),
  }),
  unsubscribe: endpoint({
    method: "POST",
    path: "/unsubscribe",
    request: {
      body: z.object({ endpoint: z.string() }),
    },
    response: z.object({ ok: z.boolean() }),
  }),
});
