import { HistoryClient } from "./HistoryClient";

export default async function HistoryPage(
  props: PageProps<"/markets/[id]/history">,
) {
  const { id: marketId } = await props.params;
  return <HistoryClient marketId={marketId} />;
}
