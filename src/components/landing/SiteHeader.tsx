import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const NAV_LINKS = [
  { href: "#how-it-works", label: "소개" },
  { href: "#testimonials", label: "실사용사례" },
  { href: "#guide", label: "이용안내" },
  { href: "#pricing", label: "요금제" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-4 top-4 z-40 mx-auto flex w-auto max-w-3xl items-center justify-between gap-4 rounded-full border border-gray-100 bg-white/50 py-2 pr-2 pl-5 shadow-xl shadow-black/3 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-gray-950/60">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <Image src="/logo.svg" alt="" width={24} height={25} />
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex dark:text-gray-400">
        {NAV_LINKS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="transition-colors hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>
      <Button
        render={<Link href="/login" />}
        nativeButton={false}
        variant="outline"
        className="h-9 shrink-0 rounded-full border-white/60 bg-white/50 px-4 dark:border-white/10 dark:bg-white/10"
      >
        로그인
      </Button>
    </header>
  );
}
