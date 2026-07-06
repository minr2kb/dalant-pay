import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // 이 마켓 안에서 홈 화면에 추가하면 마켓 URL로 바로 열리도록 전용 manifest로 교체
  return { manifest: `/markets/${id}/manifest.webmanifest` };
}

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
