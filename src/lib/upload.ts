import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "mission-photos";

export async function uploadMissionPhoto(
  file: File,
  marketId: string,
  missionId: string,
  userId: string,
  slot: number,
): Promise<string> {
  // fileType을 고정해 원본이 png/heic 등이어도 항상 jpg로 나온다 — 확장자가 바뀌면
  // 아래 경로도 바뀌어서 upsert가 옛 파일을 못 덮어쓰고 고아로 남기기 때문
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/jpeg",
  });

  const supabase = createClient();
  // getSession()은 만료된(또는 곧 만료될) 세션이면 자동으로 refresh까지 해준다 —
  // 백그라운드에 오래 있던 모바일 브라우저에서 만료된 토큰으로 업로드하면 storage RLS의
  // authenticated 조건에 걸려 400이 나기 때문에, 업로드 직전에 세션을 확실히 살려둔다
  await supabase.auth.getSession();
  // slot 단위 고정 경로 — 인증 전 재업로드는 같은 파일을 덮어써 고아 파일을 남기지 않는다
  const path = `${marketId}/${missionId}/${userId}-${slot}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      contentType: compressed.type || "image/jpeg",
      upsert: true,
    });
  if (error) throw error;

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path)
    .data.publicUrl;
  // 경로가 고정이라 재업로드해도 URL이 그대로라 캐시된 옛 이미지가 보일 수 있음 → 쿼리로 무효화
  return `${publicUrl}?t=${Date.now()}`;
}
