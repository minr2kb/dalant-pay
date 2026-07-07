import { UserHomeClient } from "./UserHomeClient";

export default async function UserHomePage(
  props: PageProps<"/markets/[id]/home">,
) {
  const { id: marketId } = await props.params;
  return <UserHomeClient marketId={marketId} />;
}
