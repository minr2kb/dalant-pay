import { ScanPageClient } from "./ScanPageClient";

export default async function ScanPage(
  props: PageProps<"/markets/[id]/admin/scan">,
) {
  const { id: marketId } = await props.params;
  return <ScanPageClient marketId={marketId} />;
}
