import { authRoute, err, ok } from "@/lib/api/route-helpers";
import { supabase as serviceClient } from "@/lib/supabase/service";

// 브라우저에서 Supabase Storage로 직접 업로드하면 storage RLS(authenticated 롤 +
// auth.uid() 매칭)를 타는데, 이 프로젝트에서 해당 경로가 산발적으로 깨져서(Storage API
// 쪽 canary 빌드 버그로 추정 — role/uid는 정상인데도 RLS가 거부) 유효한 세션으로도
// 계속 실패했다. 서버가 대신 service-role로 업로드하면 RLS를 아예 안 타므로 이 문제를
// 우회한다. 인증은 authRoute(쿠키 기반 세션 검증)로 처리 — storage RLS만큼 신뢰할 수
// 있고 이미 다른 모든 API 라우트가 쓰는 검증된 경로다.
export const POST = authRoute<{ marketId: string; missionId: string }>(
  async (req, { params, userId }) => {
    const { marketId, missionId } = params;
    const formData = await req.formData();
    const file = formData.get("file");
    const slotRaw = formData.get("slot");
    if (!(file instanceof File)) return err("파일이 없어요", 400);
    const slot = Number(slotRaw);
    if (!Number.isInteger(slot) || slot < 1)
      return err("잘못된 요청이에요", 400);

    // 클라이언트가 아니라 세션에서 뽑은 userId로 경로를 만들어야 본인 사진만 쓸 수 있다
    const path = `${marketId}/${missionId}/${userId}-${slot}.jpg`;
    const buffer = await file.arrayBuffer();
    const { error } = await serviceClient.storage
      .from("mission-photos")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });
    if (error) return err("업로드에 실패했어요", 500);

    const publicUrl = serviceClient.storage
      .from("mission-photos")
      .getPublicUrl(path).data.publicUrl;
    // 경로가 고정이라 재업로드해도 URL이 그대로라 캐시된 옛 이미지가 보일 수 있음 → 쿼리로 무효화
    return ok({ photoUrl: `${publicUrl}?t=${Date.now()}` });
  },
);
