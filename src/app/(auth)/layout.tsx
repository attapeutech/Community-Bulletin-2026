import { fontVars } from "@/lib/fonts";

// Auth is a standalone surface: no site nav or footer, per the delivered
// design. Dark is pinned for the same reason the landing pins it -- the bloom
// and the card treatment assume a dark ground.
export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <div className={`dark ${fontVars} font-ce-body`}>{children}</div>;
}
