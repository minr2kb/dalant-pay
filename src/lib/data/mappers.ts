import { keyBy } from "es-toolkit";
import type {
  Group,
  Market,
  MarketItem,
  MarketParticipant,
  Mission,
  MissionSlotData,
  Order,
  PendingMissionLog,
  PointLog,
  Role,
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
  // group:groups(name) - supabase-js's array-vs-object cardinality inference for
  // FK embeds isn't consistent without generated Database types (same caveat as
  // the `user` join above), so accept either shape instead of guessing one.
  const groupField = row.group as
    | { name: string }
    | { name: string }[]
    | null
    | undefined;
  const groupRow = Array.isArray(groupField) ? groupField[0] : groupField;
  return {
    id: row.id as string,
    marketId: row.market_id as string,
    user,
    role: row.role as Role,
    balance: row.balance as number,
    displayName: (row.display_name as string | null) ?? user.realName,
    groupId: (row.group_id as string | null) ?? null,
    groupName: groupRow?.name ?? null,
  };
}

export function mapGroup(row: Record<string, unknown>): Group {
  return {
    id: row.id as string,
    marketId: row.market_id as string,
    name: row.name as string,
  };
}

export function mapMission(
  row: Record<string, unknown>,
  // 호출부가 이미 이 미션에 해당하는 로그만 추려서 넘긴다 (listMissions 참고).
  logsForMission: Record<string, unknown>[] = [],
): Mission {
  const limitCount = row.limit_count as number | null;

  let slots: MissionSlotData[] | undefined;
  if (limitCount !== null) {
    const logsBySlot = keyBy(logsForMission, (l) => l.slot as number);
    slots = Array.from({ length: limitCount }, (_, i) => {
      const log = logsBySlot[i + 1];
      return {
        slot: i + 1,
        verifiedByName: log ? (log.verified_by_name as string | null) : null,
        verifiedAt: log ? (log.verified_at as string | null) : null,
        photoUrl: log ? (log.photo_url as string | null) : null,
        requested: !!log,
      };
    });
  } else if (logsForMission.length > 0) {
    slots = logsForMission.map((log) => ({
      slot: log.slot as number,
      verifiedByName: (log.verified_by_name as string | null) ?? null,
      verifiedAt: (log.verified_at as string | null) ?? null,
      photoUrl: (log.photo_url as string | null) ?? null,
      requested: true,
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
    isActive: row.is_active as boolean,
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
