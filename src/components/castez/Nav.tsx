import Link from "next/link";
import { MobileMenu } from "./MobileMenu";
import { Logo, StatusPill } from "./Brand";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ce-line8 bg-ce-ground/[0.72] backdrop-blur-[18px]">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-3 px-4 sm:gap-7 sm:px-6">
        <Logo />

        <div className="hidden lg:block">
          <StatusPill />
        </div>

        <nav className="ml-auto hidden items-center gap-[26px] md:flex">
          <Link href="#audiences" className="text-sm font-medium text-ce-muted hover:text-ce-text">
            Platform
          </Link>
          <Link href="#flow" className="text-sm font-medium text-ce-muted hover:text-ce-text">
            How it works
          </Link>
          <Link href="#audiences" className="text-sm font-medium text-ce-muted hover:text-ce-text">
            Pricing
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5 md:ml-0">
          <Link
            href="#audiences"
            className="hidden rounded-[9px] border border-ce-line4 bg-ce-raised px-3.5 py-[9px] text-sm font-semibold text-ce-text3 md:inline-block"
          >
            Host a Screen
          </Link>
          <Link
            href="#audiences"
            className="whitespace-nowrap rounded-[9px] bg-[linear-gradient(180deg,#5cf0dd,#2ad3bf)] px-3 py-2 text-[13px] font-bold text-ce-onAccent sm:px-4 sm:py-2.5 sm:text-sm"
            style={{ boxShadow: "0 0 24px rgba(62,230,209,.32)" }}
          >
            Launch Campaign
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
