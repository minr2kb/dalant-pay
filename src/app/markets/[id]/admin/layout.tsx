import { FloatingTabBar } from "@/components/FloatingTabBar";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout(props: LayoutProps<"/markets/[id]">) {
  const { id } = await props.params;

  const userId = await getCurrentUserId();
  let isOwner = false;
  if (userId) {
    const supabase = await createClient();
    const { data: participant } = await supabase
      .from("market_participants")
      .select("role")
      .eq("market_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    isOwner = participant?.role === "owner";
  }

  const tabs = [
    {
      label: "홈",
      segment: "admin/home",
      href: `/markets/${id}/admin/home`,
      icon: "Home",
    },
    {
      label: "미션",
      segment: "admin/missions",
      href: `/markets/${id}/admin/missions`,
      icon: "ListTodo",
    },
    {
      label: "물품",
      segment: "admin/items",
      href: `/markets/${id}/admin/items`,
      icon: "ShoppingBag",
    },
    {
      label: "유저",
      segment: "admin/users",
      href: `/markets/${id}/admin/users`,
      icon: "Users",
    },
    ...(isOwner
      ? [
          {
            label: "설정",
            segment: "admin/settings",
            href: `/markets/${id}/admin/settings`,
            icon: "Settings",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950">
      <main className="min-h-svh pb-28">{props.children}</main>
      <FloatingTabBar tabs={tabs} />
    </div>
  );
}
