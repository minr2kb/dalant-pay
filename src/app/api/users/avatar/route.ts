import { authRoute, err, ok } from "@/lib/api/route-helpers";
import { supabase as serviceClient } from "@/lib/supabase/service";

// mission-photos 업로드 라우트와 동일한 이유로 service-role 업로드를 씀 — 자세한 내용은
// 그쪽 route.ts 주석 참고.
export const POST = authRoute(async (req, { userId }) => {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return err("파일이 없어요", 400);

  const path = `${userId}.jpg`;
  const buffer = await file.arrayBuffer();
  const { error } = await serviceClient.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
  if (error) return err("업로드에 실패했어요", 500);

  const publicUrl = serviceClient.storage.from("avatars").getPublicUrl(path)
    .data.publicUrl;
  return ok({ avatarUrl: `${publicUrl}?t=${Date.now()}` });
});
