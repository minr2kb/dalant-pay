import { ImageResponse } from "next/og";
import { supabase } from "@/lib/supabase";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await supabase
    .from("markets")
    .select("title")
    .eq("id", id)
    .single();
  const title = data?.title ?? "달란트페이";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        backgroundColor: "#10b981",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          height: 96,
          width: 96,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 28,
          backgroundColor: "rgba(255,255,255,0.16)",
        }}
      >
        <span style={{ fontSize: 48, fontWeight: 700, color: "white" }}>D</span>
      </div>
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          padding: "0 96px",
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 28, color: "rgba(255,255,255,0.75)" }}>
        달란트페이
      </div>
    </div>,
    { ...size },
  );
}
