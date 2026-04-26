import { Icon } from "@/components/layout/Icon";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen font-sans">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-[42%] min-w-[340px] bg-primary px-9 py-8 flex-col justify-between items-center">
        {/* Logo hero */}
        <Link href="/" className="flex flex-col items-center gap-5 flex-1 justify-center no-underline">
          <div className="bg-[#E8EFF6] rounded-[22px] p-4 flex w-28 h-28 items-center justify-center">
            <Icon size={80} />
          </div>
          <div className="text-center">
            <div className="font-serif font-bold text-[38px] text-white leading-[1.05]">Community</div>
            <div className="font-serif font-bold text-[38px] text-destructive leading-[1.05]">
              Bulletin<span className="text-accent text-[22px] font-sans font-normal">.com</span>
            </div>
            <div className="w-[50px] h-[3px] bg-destructive rounded-sm mx-auto mt-3" />
            <div className="text-[11px] text-accent/60 mt-2 tracking-[0.1em] uppercase">
              Digital in-store advertising
            </div>
          </div>
        </Link>

        {/* Hero copy */}
        <div className="text-center pb-5">
          <h2 className="font-serif font-bold text-[17px] text-white leading-snug mb-2">
            Your neighborhood.<br />Your screen. Your community.
          </h2>
          <p className="text-xs text-accent/60 leading-relaxed m-0">
            Connecting local businesses with their community —<br />
            on digital screens inside the stores people visit every day.
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-around w-full pt-[18px] border-t border-white/10">
          {[{ num: "500+", lbl: "Locations" }, { num: "2,400+", lbl: "Active ads" }, { num: "48", lbl: "States" }].map(({ num, lbl }) => (
            <div key={lbl} className="text-center">
              <div className="font-serif font-bold text-[18px] text-destructive">{num}</div>
              <div className="text-[10px] text-accent/60 mt-0.5">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 bg-secondary flex flex-col items-center justify-center px-6 sm:px-8 py-10">
        {/* Mobile logo — only shown below lg where the left panel is hidden */}
        <Link href="/" className="lg:hidden flex items-center gap-3 mb-8 no-underline">
          <div className="bg-[#E8EFF6] rounded-[14px] p-2.5 flex">
            <Icon size={40} />
          </div>
          <div>
            <div className="font-serif font-bold text-[22px] text-[#1A3A5C] leading-[1.05]">Community</div>
            <div className="font-serif font-bold text-[22px] leading-[1.05]">
              <span className="text-[#E8563A]">Bulletin</span>
              <span className="text-[#4A90C4] text-[14px] font-sans font-normal">.com</span>
            </div>
          </div>
        </Link>

        <Card className="w-full max-w-[400px] border-border/50 shadow-none rounded-2xl">
          <CardContent className="px-8 py-9">
            {children}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
