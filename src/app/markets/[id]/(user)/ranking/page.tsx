import { RankingClient } from "./RankingClient";

export default async function RankingPage(
  props: PageProps<"/markets/[id]/ranking">,
) {
  const { id: marketId } = await props.params;
  return <RankingClient marketId={marketId} />;
}
