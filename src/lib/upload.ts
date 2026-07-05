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
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  });

  const supabase = createClient();
  const ext = file.type.includes("png") ? "png" : "jpg";
  // slot 단위 고정 경로 — 인증 전 재업로드는 같은 파일을 덮어써 고아 파일을 남기지 않는다
  const path = `${marketId}/${missionId}/${userId}-${slot}.${ext}`;

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
