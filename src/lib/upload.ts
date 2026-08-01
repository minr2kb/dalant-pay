import * as Sentry from "@sentry/nextjs";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

export class SessionExpiredError extends Error {}

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  // iOS Safari는 갤러리에서 고른 HEIC의 file.type을 빈 문자열로 주는 경우가 있어
  // 확장자도 같이 본다
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    /\.hei[cf]$/i.test(file.name)
  );
}

// 두 버킷(미션 사진/아바타) 공통 업로드 경로 — 압축 옵션과 upsert 전략이 동일하다.
async function compressAndUpload(
  file: File,
  bucket: string,
  path: string,
): Promise<string> {
  // HEIC/HEIF는 캔버스로 디코딩 못 하는 브라우저(사파리 계열 제외 대부분)가 많아
  // 압축 라이브러리에 넘기기 전에 먼저 JPEG로 변환한다. 실패하면 원본 그대로
  // 다음 단계(압축)로 넘어가고, 거기서도 못 버티면 아래 압축 fallback이 받는다.
  let source: File | Blob = file;
  if (isHeic(file)) {
    try {
      const heic2any = (await import("heic2any")).default;
      const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      });
      const blob = Array.isArray(converted) ? converted[0] : converted;
      source = new File([blob], file.name.replace(/\.hei[cf]$/i, ".jpg"), {
        type: "image/jpeg",
        lastModified: file.lastModified,
      });
    } catch (e) {
      Sentry.captureException(e);
      console.error("[compressAndUpload] HEIC conversion failed", e);
    }
  }

  // fileType을 고정해 원본이 png/heic 등이어도 항상 jpg로 나온다 — 확장자가 바뀌면
  // 위 path도 바뀌어서 upsert가 옛 파일을 못 덮어쓰고 고아로 남기기 때문
  let uploadFile: File | Blob = source;
  try {
    uploadFile = await imageCompression(source as File, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: "image/jpeg",
    });
  } catch (e) {
    // ponytail: 워커 생성 차단, 캔버스 메모리 한도 등으로 압축이 실패할 수 있다 —
    // 용량이 크더라도 (HEIC면 변환된) 원본 그대로 올려서 인증 자체는 막지 않는다
    Sentry.captureException(e);
    console.error(
      "[compressAndUpload] compression failed, using source as-is",
      e,
    );
  }

  const supabase = createClient();
  // getSession()은 만료된(또는 곧 만료될) 세션이면 자동으로 refresh까지 해준다 —
  // 백그라운드에 오래 있던 모바일 브라우저에서 만료된 토큰으로 업로드하면 storage RLS의
  // authenticated 조건에 걸려 400이 나기 때문에, 업로드 직전에 세션을 확실히 살려둔다.
  // refresh token 자체가 없어졌으면(다른 기기 로그아웃, 토큰 회전 등) session이 null로
  // 돌아오는데, 이때 그대로 업로드하면 anon 권한이라 storage RLS가 막아서 알아보기 힘든
  // "row-level security policy" 에러만 남는다 — 여기서 먼저 걸러 로그인 만료를 알려준다
  const { data } = await supabase.auth.getSession();
  if (!data.session)
    throw new SessionExpiredError("로그인이 만료됐어요. 다시 로그인해주세요");

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, uploadFile, {
      contentType: uploadFile.type || "image/jpeg",
      upsert: true,
    });
  if (error) throw error;

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(path)
    .data.publicUrl;
  // 경로가 고정이라 재업로드해도 URL이 그대로라 캐시된 옛 이미지가 보일 수 있음 → 쿼리로 무효화
  return `${publicUrl}?t=${Date.now()}`;
}

export function uploadMissionPhoto(
  file: File,
  marketId: string,
  missionId: string,
  userId: string,
  slot: number,
): Promise<string> {
  // slot 단위 고정 경로 — 인증 전 재업로드는 같은 파일을 덮어써 고아 파일을 남기지 않는다
  const path = `${marketId}/${missionId}/${userId}-${slot}.jpg`;
  return compressAndUpload(file, "mission-photos", path);
}

export function uploadAvatar(file: File, userId: string): Promise<string> {
  return compressAndUpload(file, "avatars", `${userId}.jpg`);
}
