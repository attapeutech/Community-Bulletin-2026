import { BrandMark } from "@/components/layout/BrandMark";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function AuthLayout({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-screen font-sans">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[42%] lg:min-w-[340px] bg-primary dark:bg-[#0F2540] px-9 py-8 flex-col justify-between items-center">
        {/* Logo hero */}
        <Link href="/" className="flex flex-col items-center gap-5 flex-1 justify-center no-underline">
          <BrandMark size={112} className="ring-1 ring-white/15 rounded-[25px]" />
          <div className="text-center">
            <div className="font-serif font-bold text-[38px] text-white leading-[1.05]">Community</div>
            <div className="font-serif font-bold text-[38px] text-destructive leading-[1.05]">
              Bulletin<span className="text-accent text-[22px] font-sans font-normal">.com</span>
            </div>
            <div className="w-[50px] h-[3px] bg-destructive rounded-sm mx-auto mt-3" />
            <div className="text-[11px] text-accent/60 dark:text-[#9DC4E0]/80 mt-2 tracking-[0.1em] uppercase">
              Digital in-store advertising
            </div>
          </div>
        </Link>

        {/* Hero copy */}
        <div className="text-center pb-5">
          <h2 className="font-serif font-bold text-[17px] text-white leading-snug mb-2">
            Your neighborhood.<br />Your screen. Your community.
          </h2>
          <p className="text-xs text-accent/60 dark:text-[#9DC4E0]/80 leading-relaxed m-0">
            Connecting local businesses with their community —<br />
            on digital screens inside the stores people visit every day.
          </p>
        </div>

        {/* Launch-stage highlights (same as the home page); swap for live numbers once they're worth showing */}
        <div className="flex justify-around w-full pt-[18px] border-t border-white/10">
          {[{ num: "Local", lbl: "Stores near you" }, { num: "1-week", lbl: "Campaigns" }, { num: "Human", lbl: "Reviewed ads" }].map(({ num, lbl }) => (
            <div key={lbl} className="text-center">
              <div className="font-serif font-bold text-[18px] text-destructive">{num}</div>
              <div className="text-[10px] text-accent/60 dark:text-[#9DC4E0]/80 mt-0.5">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 bg-secondary flex items-center justify-center px-4 sm:px-8 py-10">
        {/* wide: roomier card for longer forms (e.g. register with store details) */}
        <div className={`w-full ${wide ? "max-w-[560px]" : "max-w-[400px]"} flex flex-col items-center gap-6 transition-[max-width] duration-200`}>
          {/* Mobile-only logo */}
          <Link href="/" className="lg:hidden flex items-center gap-3 no-underline">
            <BrandMark size={52} />
            <div className="flex flex-col leading-none">
              <span className="font-serif font-bold text-[17px] text-[#1A3A5C]">Community</span>
              <span className="font-serif font-bold text-[17px] leading-none">
                <span style={{ color: "#E8563A" }}>Bulletin</span>
                <span className="text-[#4A90C4] text-[11px] font-sans font-normal">.com</span>
              </span>
            </div>
          </Link>

          <Card className="w-full border-border/50 shadow-none rounded-2xl">
            <CardContent className="px-5 sm:px-8 py-7 sm:py-9">
              {children}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
