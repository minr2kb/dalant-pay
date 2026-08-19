import { notFound } from "next/navigation";
import { SAMPLE_MISSIONS } from "../../data";
import { SampleMissionDetailClient } from "./SampleMissionDetailClient";

export default async function SampleMissionDetailPage(
  props: PageProps<"/sample/missions/[missionId]">,
) {
  const { missionId } = await props.params;
  const mission = SAMPLE_MISSIONS.find((m) => m.id === missionId);
  if (!mission) notFound();

  return <SampleMissionDetailClient mission={mission} />;
}
