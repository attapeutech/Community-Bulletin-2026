import type { CbEarning } from "@/lib/cb-earning";

const m = (c: number) => `${c < 0 ? "−" : ""}$${(Math.abs(c) / 100).toFixed(2)}`;

/**
 * Community Bulletin's side of one paid ad (admins only):
 *   $50.00 Our 50% of the $100 ad · + $9.40 tax · = $59.40 · − $1.72 Stripe (our part) · = $57.68 · − $9.40 tax to WA · = $48.28 CB keeps
 */
export function CbBreakdown({ ad, cb }: {
  ad: {
    adPriceCents: number; taxCents: number; taxRateBps: number | null; taxAreaName: string | null; shareRateBps: number;
    ownStore: boolean; storeFeeCents: number; storeShareCents: number;
    offline?: { cents: number; method: string | null } | null;
  };
  cb: CbEarning;
}) {
  const ourLabel = ad.ownStore ? "Our store: the whole"
    : ad.shareRateBps && !ad.offline ? `Our ${100 - ad.shareRateBps / 100}% of the`
    : "Our part of the";
  const row = { display: "flex", justifyContent: "space-between", gap: 14, fontSize: 12, color: "#4A6B82" } as const;
  const total = { ...row, borderTop: "1px solid #D8E4EE", marginTop: 3, paddingTop: 3, color: "#1A3A5C", fontWeight: 600 } as const;
  const note = { fontSize: 11, color: "#7C93A8", paddingLeft: 10 } as const;
  const rate = ad.taxRateBps ? ` (${(ad.taxRateBps / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%${ad.taxAreaName ? `, ${ad.taxAreaName}` : ""})` : "";
  return (
    <div style={{ fontVariantNumeric: "tabular-nums", minWidth: 230 }}>
      <div style={row}><span>{ourLabel} {m(ad.adPriceCents)} ad</span><span style={{ color: "#1A3A5C" }}>{m(cb.ourShareCents)}</span></div>
      {ad.offline && <div style={note}>{m(ad.adPriceCents)} − {m(ad.offline.cents)} paid to the store{ad.offline.method ? ` (${ad.offline.method})` : ""}</div>}
      {ad.taxCents > 0
        ? <div style={row}><span>+ Sales tax collected{rate}</span><span>{m(ad.taxCents)}</span></div>
        : !ad.taxRateBps && <div style={note}>No sales tax (paid before tax was set up)</div>}
      {ad.taxCents > 0 && <div style={total}><span>Subtotal</span><span>{m(cb.subtotalCents)}</span></div>}
      <div style={row}><span>− Stripe fee (our part){cb.estimated && " · est."}</span><span>−{m(cb.ourFeeCents)}</span></div>
      <div style={note}>
        {ad.storeFeeCents > 0
          ? <>{m(cb.stripeTotalCents)} Stripe charged − {m(ad.storeFeeCents)} store&apos;s part</>
          : <>{m(cb.stripeTotalCents)} Stripe charged{cb.estimated ? " (2.9% + 30¢)" : ""}</>}
      </div>
      {ad.taxCents > 0 && <div style={total}><span>After Stripe</span><span>{m(cb.afterStripeCents)}</span></div>}
      {ad.taxCents > 0 && <div style={row}><span>− Sales tax owed to WA</span><span>−{m(ad.taxCents)}</span></div>}
      <div style={{ ...total, fontSize: 13, fontWeight: 700 }}><span>CB keeps</span><span style={{ color: "#15803D" }}>{m(cb.keepsCents)}</span></div>
    </div>
  );
}
