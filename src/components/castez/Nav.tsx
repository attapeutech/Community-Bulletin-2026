import Link from "next/link";
import { Logo } from "./Brand";
import { MobileMenu } from "./MobileMenu";
import { NavAuth } from "./NavAuth";
import { FranchiseDemoLink, LiveAdsPill, NAV_LINKS, PostAdPill } from "./NavItems";
import { NavSearch } from "./NavSearch";
import { CeThemeToggle } from "./ThemeToggle";

export function Nav({ showThemeToggle = true }: { showThemeToggle?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-ce-line8 bg-ce-ground/[0.72] backdrop-blur-[18px]">
      {/* Row 1 */}
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-3 px-4 sm:px-6">
        <Logo />

        <div className="hidden md:flex md:flex-1">
          <NavSearch />
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <LiveAdsPill />
          <PostAdPill />
        </div>

        <nav className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="whitespace-nowrap text-sm font-medium text-ce-muted transition-colors hover:text-ce-text"
            >
              {l.label}
            </Link>
          ))}
          <FranchiseDemoLink className="text-sm" />
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          {showThemeToggle && <CeThemeToggle />}
          <NavAuth />
        </div>

        <div className="ml-auto shrink-0 lg:hidden">
          <MobileMenu />
        </div>
      </div>

      {/* Row 2 — search moves to its own row below md, as in the old navbar */}
      <div className="flex h-11 items-center gap-2 border-t border-ce-line2 px-4 md:hidden">
        <NavSearch compact />
      </div>
    </header>
  );
}
