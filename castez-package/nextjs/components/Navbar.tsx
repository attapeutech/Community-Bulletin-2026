"use client";

import Link from "next/link";
import { useState } from "react";
import ChooseLocationDialog from "./ChooseLocationDialog";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("All locations");

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#191c22] bg-[#07080b]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-7 px-6">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2.5 text-zinc-100 hover:text-zinc-100">
            <span className="h-[26px] w-[26px] rounded-[7px] bg-gradient-to-br from-emerald-300 to-indigo-500 shadow-[0_0_18px_rgba(62,230,209,0.45)]" />
            <span className="font-display text-lg font-bold tracking-tight">
              casteasy<span className="text-zinc-500">.io</span>
            </span>
          </Link>

          {/* Location + search, one segmented control */}
          <div className="flex min-w-0 max-w-[430px] flex-1 items-stretch overflow-hidden rounded-full border border-hairline bg-[#0c0e12] focus-within:border-emerald-300 focus-within:ring-[3px] focus-within:ring-emerald-300/15 max-[1000px]:max-w-[300px] max-[860px]:max-w-none max-[860px]:flex-none">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap border-r border-hairline px-3.5 text-[13px] font-semibold text-zinc-300 transition hover:bg-white/[0.04] hover:text-zinc-50 max-[860px]:px-2.5"
            >
              <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] text-emerald-300" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="max-[860px]:hidden">{label}</span>
              <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div className="relative min-w-0 flex-1 max-[860px]:hidden">
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" />
              </svg>
              <input
                type="search"
                aria-label="Search screens in this location"
                placeholder="Search screens in this location"
                className="h-full w-full bg-transparent py-2.5 pl-[34px] pr-3.5 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <nav className="flex items-center gap-[26px] max-[1180px]:hidden">
            <a href="#audiences" className="text-sm font-medium text-zinc-400 hover:text-zinc-100">Platform</a>
            <a href="#flow" className="text-sm font-medium text-zinc-400 hover:text-zinc-100">How it works</a>
            <a href="#audiences" className="text-sm font-medium text-zinc-400 hover:text-zinc-100">Pricing</a>
          </nav>

          <div className="ml-auto flex flex-shrink-0 items-center gap-2.5">
            <Link href="/login" className="px-1 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-100 max-[720px]:hidden">Log in</Link>
            <a href="#audiences" className="whitespace-nowrap rounded-[9px] border border-zinc-800 bg-[#0e1116] px-3.5 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-700 max-[720px]:hidden">Host a Screen</a>
            <a href="#audiences" className="whitespace-nowrap rounded-[9px] bg-gradient-to-b from-[#5cf0dd] to-[#2ad3bf] px-4 py-2.5 text-sm font-bold text-brand-ink shadow-[0_0_24px_rgba(62,230,209,0.32)]">Launch Campaign</a>
          </div>
        </div>
      </header>

      <ChooseLocationDialog
        open={open}
        onClose={() => setOpen(false)}
        onApply={({ country, state, city }) => {
          setLabel(
            city !== "All cities" ? city : state !== "All states" ? state : country === "United States" ? "All locations" : country
          );
          setOpen(false);
        }}
      />
    </>
  );
}
