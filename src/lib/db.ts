import type {
  Market,
  MarketItem,
  MarketParticipant,
  Mission,
  MissionSlotData,
  Order,
  PendingMissionLog,
  PointLog,
  User,
} from "@/types";

export function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    realName: row.real_name as string,
    birthDate: row.birth_date as string,
    gender: row.gender as "male" | "female",
    avatarUrl: (row.avatar_url as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapMarket(row: Record<string, unknown>): Market {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    pointLabel: row.point_label as string,
    startsAt: row.starts_at as string,
    endsAt: row.ends_at as string,
    createdAt: row.created_at as string,
  };
}

export function mapParticipant(
  row: Record<string, unknown>,
): MarketParticipant {
  const user = mapUser(row.user as Record<string, unknown>);
  return {
    id: row.id as string,
    marketId: row.market_id as string,
    user,
    role: row.role as "admin" | "user",
    balance: row.balance as number,
    displayName: (row.display_name as string | null) ?? user.realName,
  };
}

export function mapMission(
  row: Record<string, unknown>,
  logs: Record<string, unknown>[] = [],
): Mission {
  const limitCount = row.limit_count as number | null;
  const logsForThis = logs.filter((l) => l.mission_id === row.id);

  let slots: MissionSlotData[] | undefined;
  if (limitCount !== null) {
    slots = Array.from({ length: limitCount }, (_, i) => {
      const log = logsForThis.find((l) => (l.slot as number) === i + 1);
      return {
        slot: i + 1,
        verifiedByName: log ? (log.verified_by_name as string | null) : null,
        verifiedAt: log ? (log.verified_at as string | null) : null,
        photoUrl: log ? (log.photo_url as string | null) : null,
      };
    });
  } else if (logsForThis.length > 0) {
    slots = logsForThis.map((log) => ({
      slot: log.slot as number,
      verifiedByName: (log.verified_by_name as string | null) ?? null,
      verifiedAt: (log.verified_at as string | null) ?? null,
      photoUrl: (log.photo_url as string | null) ?? null,
    }));
  }

  return {
    id: row.id as string,
    marketId: row.market_id as string,
    title: row.title as string,
    ...(row.description ? { description: row.description as string } : {}),
    type: row.type as Mission["type"],
    isGroup: row.is_group as boolean,
    reward: row.reward as number,
    rewardMin: (row.reward_min as number | null) ?? null,
    rewardMax: (row.reward_max as number | null) ?? null,
    limitCount,
    activeFrom: (row.active_from as string | null) ?? null,
    activeUntil: (row.active_until as string | null) ?? null,
    isActive: row.is_active as boolean,
    sortOrder: row.sort_order as number,
    ...(slots ? { slots } : {}),
  };
}

export function mapPointLog(row: Record<string, unknown>): PointLog {
  const missionLog = row.mission_logs as
    | {
        photo_url: string | null;
        slot: number | null;
        verified_by: string | null;
      }
    | null
    | undefined;
  return {
    id: row.id as string,
    marketId: row.market_id as string,
    userId: row.user_id as string,
    amount: row.amount as number,
    reasonType: row.reason_type as PointLog["reasonType"],
    ...(row.mission_title ? { missionTitle: row.mission_title as string } : {}),
    ...(row.verified_by_name
      ? { verifiedByName: row.verified_by_name as string }
      : {}),
    ...(row.item_name ? { itemName: row.item_name as string } : {}),
    ...(row.order_id ? { orderId: row.order_id as string } : {}),
    ...(row.memo ? { memo: row.memo as string } : {}),
    ...(((row.photo_url as string | null) ?? missionLog?.photo_url)
      ? {
          photoUrl:
            (row.photo_url as string | null) ??
            (missionLog?.photo_url as string),
        }
      : {}),
    ...(missionLog?.slot != null ? { slot: missionLog.slot } : {}),
    ...(((row.verified_by as string | null) ?? missionLog?.verified_by)
      ? {
          verifiedByUserId:
            (row.verified_by as string | null) ??
            (missionLog?.verified_by as string),
        }
      : {}),
    createdAt: row.created_at as string,
    ...(row.voided_at ? { voidedAt: row.voided_at as string } : {}),
  };
}

export function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    marketId: row.market_id as string,
    userId: row.user_id as string,
    verifiedByName: (row.verified_by_name as string) ?? "",
    items: row.items as Order["items"],
    total: row.total as number,
    purchasedAt: row.purchased_at as string,
  };
}

export function mapItem(row: Record<string, unknown>): MarketItem {
  return {
    id: row.id as string,
    name: row.name as string,
    price: row.price as number,
    sortOrder: row.sort_order as number,
  };
}

export function mapPendingMissionLog(
  row: Record<string, unknown>,
): PendingMissionLog {
  const mission = row.missions as
    | {
        title: string;
        reward: number;
        reward_min: number | null;
        reward_max: number | null;
        is_group: boolean;
      }
    | null
    | undefined;
  return {
    id: row.id as string,
    missionId: row.mission_id as string,
    missionTitle: mission?.title ?? "미션",
    reward: mission?.reward ?? 0,
    rewardMin: mission?.reward_min ?? null,
    rewardMax: mission?.reward_max ?? null,
    userId: row.user_id as string,
    slot: row.slot as number,
    photoUrl: (row.photo_url as string | null) ?? null,
    isGroup: mission?.is_group ?? false,
  };
}
