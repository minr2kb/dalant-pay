import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { data: market } = await supabase
    .from("markets")
    .select("title")
    .eq("id", id)
    .maybeSingle();

  const name = market?.title ?? "달란트페이";

  return NextResponse.json({
    name,
    short_name: name,
    description: "오프라인 모임을 위한 미션 인증 기반 달란트 결제 서비스",
    start_url: `/markets/${id}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10b981",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  });
}
