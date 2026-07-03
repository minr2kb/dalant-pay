import { defineRouter, endpoint } from "@routar/core";
import { z } from "zod";
import {
  MarketItemSchema,
  MarketParticipantSchema,
  MarketSchema,
  MissionSchema,
  OrderItemSchema,
  OrderSchema,
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
    response: z.array(MarketSchema),
  }),
  get: endpoint({
    method: "GET",
    path: "/:marketId",
    request: { path: marketId },
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
        limitCount: z.number().int().min(1).nullable().optional(),
        activeFrom: z.string().nullable().optional(),
        activeUntil: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
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
  verify: endpoint({
    method: "POST",
    path: "/:marketId/missions/:missionId/verify",
    request: {
      path: marketAndMission,
      body: z.object({
        token: z.string().optional(),
        userId: z.string().optional(),
        slot: z.number().optional(),
        photoUrls: z.array(z.string()).optional(),
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
});

export const pointLogsRouter = defineRouter("/markets", {
  list: endpoint({
    method: "GET",
    path: "/:marketId/point-logs",
    request: {
      path: marketId,
      query: z.object({ userId: z.string().optional() }).optional(),
    },
    response: z.array(PointLogSchema),
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
  delete: endpoint({
    method: "DELETE",
    path: "/:marketId/items/:itemId",
    request: { path: marketAndItem },
    response: z.object({ id: z.string() }),
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
