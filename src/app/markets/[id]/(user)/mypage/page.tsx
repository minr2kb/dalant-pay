import { MyPageClient } from "./MyPageClient";

export default async function MyPage(props: PageProps<"/markets/[id]/mypage">) {
  const { id: marketId } = await props.params;
  return <MyPageClient marketId={marketId} />;
}
