import Image from "next/image";
import Link from "next/link";
import { gmarketSans } from "@/fonts/gmarket-sans";
import { NAV_LINKS } from "./SiteHeader";

const CONTACT_EMAIL = "kbmin1129@gmail.com";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-muted/30">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(18rem,50vw,36rem)] bg-linear-to-t from-primary/35 via-primary/10 to-transparent" />

      <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
              둘러보기
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-gray-600 hover:text-foreground dark:text-gray-400"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
              시작하기
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-foreground dark:text-gray-400"
                >
                  로그인
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
              문의
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-gray-600 hover:text-foreground dark:text-gray-400"
                >
                  이메일로 문의
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex max-w-5xl items-center gap-2 px-6 sm:gap-4">
        <Image
          src="/logo.svg"
          alt=""
          width={64}
          height={66}
          className="h-[clamp(2.5rem,8vw,8rem)] w-auto"
        />
        <span
          className={`${gmarketSans.className} select-none whitespace-nowrap text-[clamp(3rem,10vw,8rem)] leading-none font-bold tracking-tighter`}
        >
          Dalant Pay
        </span>
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pt-10 pb-8">
        <div className="flex flex-col items-center justify-between gap-2 border-t border-black/5 pt-6 text-xs text-gray-400 sm:flex-row dark:border-white/10">
          <p>© {new Date().getFullYear()} Kyungbae Min</p>
          <p>오프라인 미션 인증 리워드</p>
        </div>
      </div>
    </footer>
  );
}
