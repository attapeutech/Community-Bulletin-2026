// Shared chrome styles from the design's nav: the 34px square icon buttons and
// the neon primary CTA.

export const ICON_BUTTON =
  "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] border border-ce-line3 bg-ce-panel text-ce-text4 transition-colors hover:border-ce-accent hover:text-ce-text";

export const NEON_CTA =
  "whitespace-nowrap rounded-[9px] border border-white/35 px-[18px] py-2.5 text-sm font-bold text-ce-onAccent transition-transform hover:-translate-y-px";

export const NEON_CTA_STYLE = {
  background: "linear-gradient(180deg,#6ff7e5,#22d3bd)",
  boxShadow:
    "0 0 0 1px rgba(62,230,209,.35), 0 0 18px rgba(62,230,209,.55), 0 0 44px rgba(62,230,209,.35), inset 0 1px 0 rgba(255,255,255,.55)",
};
