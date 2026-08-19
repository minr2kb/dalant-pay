import { marketRoleRoute } from "@/lib/api/route-helpers";
import { getMarket } from "@/lib/data/markets";
import { listParticipants } from "@/lib/data/participants";
import { listPointLogs } from "@/lib/data/point-logs";
import { POINT_LOG_CATEGORY } from "@/types";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// 정산용 전체 포인트 내역 CSV - admin/owner 전용, 필터 없이 마켓 전체를 한 번에 뽑는다.
// listPointLogs는 page/pageSize를 안 주면 전체를 반환한다(admin/home 합계 계산과 동일 경로).
export const GET = marketRoleRoute<{ marketId: string }>(
  ["admin", "owner"],
  async (_req, { supabase, params }) => {
    const { marketId } = params;
    const [market, participants, logs] = await Promise.all([
      getMarket(supabase, marketId),
      listParticipants(supabase, marketId),
      listPointLogs(supabase, marketId),
    ]);

    const nameById = new Map(
      participants.map((p) => [p.user.id, p.user.realName]),
    );

    const header = [
      "일시",
      "유형",
      "대상자",
      `${market.pointLabel} 변동`,
      "내용",
      "처리자",
      "사진 URL",
    ];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleString("ko-KR"),
      POINT_LOG_CATEGORY[log.reasonType].label,
      nameById.get(log.userId) ?? "알 수 없음",
      String(log.amount),
      log.missionTitle ?? log.itemName ?? log.memo ?? "",
      log.verifiedByName ?? "",
      log.photoUrl ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const filename = encodeURIComponent(`${market.title}_정산내역.csv`);
    // BOM 없이 열면 엑셀이 UTF-8 CSV의 한글을 깨트린다.
    return new Response(`﻿${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="export.csv"; filename*=UTF-8''${filename}`,
      },
    });
  },
);
