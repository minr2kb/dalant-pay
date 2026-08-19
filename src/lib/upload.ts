import * as Sentry from "@sentry/nextjs";
import imageCompression from "browser-image-compression";

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

// HEIC/HEIF 변환 + 압축 - 두 업로드 경로(미션 사진/아바타) 공통.
async function compress(file: File): Promise<File | Blob> {
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
      console.error("[compress] HEIC conversion failed", e);
    }
  }

  // fileType을 고정해 원본이 png/heic 등이어도 항상 jpg로 나온다 - 확장자가 바뀌면
  // 서버 쪽 경로도 바뀌어서 upsert가 옛 파일을 못 덮어쓰고 고아로 남기기 때문
  try {
    return await imageCompression(source as File, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: "image/jpeg",
    });
  } catch (e) {
    // ponytail: 워커 생성 차단, 캔버스 메모리 한도 등으로 압축이 실패할 수 있다 -
    // 용량이 크더라도 (HEIC면 변환된) 원본 그대로 올려서 인증 자체는 막지 않는다
    Sentry.captureException(e);
    console.error("[compress] compression failed, using source as-is", e);
    return source;
  }
}

// 브라우저에서 Supabase Storage에 직접 업로드하면 storage RLS(authenticated 롤 +
// auth.uid() 매칭)를 타는데, Storage API 쪽 문제로 유효한 세션에서도 산발적으로 거부돼서
// (row-level security policy 에러) 서버 라우트를 거치도록 바꿨다 - 서버는 service-role로
// 업로드해 RLS를 아예 타지 않는다. 인증은 라우트의 authRoute(쿠키 세션)가 담당.
async function uploadViaRoute(
  url: string,
  blob: File | Blob,
  fields: Record<string, string>,
): Promise<Response> {
  const formData = new FormData();
  formData.append("file", blob, "photo.jpg");
  for (const [key, value] of Object.entries(fields))
    formData.append(key, value);
  return fetch(url, { method: "POST", body: formData });
}

async function handleUploadResponse(
  res: Response,
): Promise<Record<string, unknown>> {
  if (res.status === 401)
    throw new SessionExpiredError("로그인이 만료됐어요. 다시 로그인해주세요");
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? "업로드에 실패했어요");
  return body.data;
}

export async function uploadMissionPhoto(
  file: File,
  marketId: string,
  missionId: string,
  slot: number,
): Promise<string> {
  const blob = await compress(file);
  const res = await uploadViaRoute(
    `/api/markets/${marketId}/missions/${missionId}/photo/upload`,
    blob,
    { slot: String(slot) },
  );
  const data = await handleUploadResponse(res);
  return data.photoUrl as string;
}

export async function uploadAvatar(file: File): Promise<string> {
  const blob = await compress(file);
  const res = await uploadViaRoute("/api/users/avatar", blob, {});
  const data = await handleUploadResponse(res);
  return data.avatarUrl as string;
}
