import Link from "next/link";
import { Logo } from "./Brand";
import { MobileMenu } from "./MobileMenu";
import { NavAuth } from "./NavAuth";
import { NavBell } from "./NavBell";
import { NAV_LINKS } from "./NavItems";
import { NavSearch } from "./NavSearch";
import { CeThemeToggle } from "./ThemeToggle";

/**
 * Follows castez-package/design-components/CastEZ Landing.dc.html.
 * The wiring -- session, real geo/search, notifications, theme -- is ours.
 *
 *   <= 1180px  centre nav links hide, hamburger appears
 *   <= 1000px  location + search narrows
 *   <=  860px  search hides, location collapses to the pin
 *   <=  768px  search moves to its own row
 *   <=  420px  bell hides
 */
export function Nav({ showThemeToggle = true }: { showThemeToggle?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-ce-line8 bg-ce-ground/[0.72] backdrop-blur-[18px]">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-4 px-4 sm:gap-7 sm:px-6">
        <Logo />

        <div className="hidden md:flex md:min-w-0 md:flex-1">
          <NavSearch />
        </div>

        <nav className="ml-auto flex items-center gap-[26px] max-[1180px]:hidden">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="whitespace-nowrap text-sm font-medium text-ce-muted transition-colors hover:text-ce-text"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <div className="max-[420px]:hidden">
            <NavBell />
          </div>
          {showThemeToggle && <CeThemeToggle />}

          <div className="max-[1180px]:hidden">
            <NavAuth />
          </div>

          <div className="min-[1181px]:hidden">
            <MobileMenu showThemeToggle={showThemeToggle} />
          </div>
        </div>
      </div>

      {/* Below md the segmented control moves to its own row */}
      <div className="flex h-12 items-center border-t border-ce-line2 px-4 md:hidden">
        <NavSearch compact />
      </div>
    </header>
  );
}
