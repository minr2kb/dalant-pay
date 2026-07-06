import { AuthGate } from "@/components/AuthGate";
import { FloatingTabBar } from "@/components/FloatingTabBar";

export default async function UserLayout(props: LayoutProps<"/markets/[id]">) {
  const { id } = await props.params;

  const tabs = [
    { label: "홈", segment: "home", href: `/markets/${id}/home`, icon: "Home" },
    {
      label: "미션",
      segment: "missions",
      href: `/markets/${id}/missions`,
      icon: "ListTodo",
    },
    {
      label: "랭킹",
      segment: "ranking",
      href: `/markets/${id}/ranking`,
      icon: "Trophy",
    },
    {
      label: "마이",
      segment: "mypage",
      href: `/markets/${id}/mypage`,
      icon: "User",
    },
  ];

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950">
      <AuthGate marketId={id}>
        <main className="min-h-svh pb-28 pt-4">{props.children}</main>
      </AuthGate>
      <FloatingTabBar tabs={tabs} />
    </div>
  );
}
