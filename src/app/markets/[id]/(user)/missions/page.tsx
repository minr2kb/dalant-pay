import { MissionListClient } from "./MissionListClient";

export default async function MissionsPage(
  props: PageProps<"/markets/[id]/missions">,
) {
  const { id: marketId } = await props.params;
  return <MissionListClient marketId={marketId} />;
}
