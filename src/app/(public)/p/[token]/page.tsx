import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, leadNotes, proposals } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { loadProposal, proposalBlocked } from "@/lib/proposal-access";
import { notifyUser } from "@/lib/notifications";
import { formatPrice } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";
import { recordPaidCheckout } from "@/lib/stripe-checkout";
import ProposalClient from "./ProposalClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your ad proposal", robots: { index: false, follow: false } };

// The advertiser's proposal page: their ad on the store's screen, the offer, and Pay (no sign-in needed)
export default async function ProposalPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ session_id?: string }> }) {
  const { token } = await params;
  const { session_id: checkoutId } = await searchParams;
  let p = await loadProposal(token);
  if (!p) notFound();

  // Back from Stripe: record the payment now in case the webhook is late (the session must be for this proposal's ad)
  if (checkoutId && p.adId && p.userId && !p.paidAt) {
    try {
      const checkout = await stripe.checkout.sessions.retrieve(checkoutId);
      const done = await recordPaidCheckout(checkout, p.adId, p.userId);
      if (done.ok) p = (await loadProposal(token)) ?? p;
    } catch (err) {
      console.error("[proposal page] confirming checkout failed", err);
    }
  }

  const session = await getSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  // First open: record it, note it on the lead and tell whoever sent it (not when the sales team checks it)
  const [firstView] = isAdmin ? [] : await db.update(proposals).set({ viewedAt: new Date() })
    .where(and(eq(proposals.id, p.id), isNull(proposals.viewedAt)))
    .returning({ id: proposals.id });
  if (firstView) {
    await db.insert(leadNotes).values({ leadId: p.leadId, authorId: null, body: "Proposal: opened by the advertiser" });
    if (p.createdBy) {
      await notifyUser(p.createdBy, {
        type: "proposal_update",
        subject: `${p.businessName} opened your proposal`,
        body: `Their ad at ${p.storeName}`,
        link: `/dashboard/sales/${p.leadId}`,
      });
    }
  }

  // The sales team opening the link (e.g. to take payment at the counter) pays as the advertiser, not as themselves
  const signedIn = session && !isAdmin ? { name: (session.user as any).name as string, email: (session.user as any).email as string } : null;
  // Paid, not signed in: an account made at payment has no way to sign in yet, so we offer "set a password"
  const [login] = p.paidAt && !signedIn && p.userId
    ? await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, p.userId)).limit(1)
    : [];

  return (
    <ProposalClient
      token={token}
      businessName={p.businessName}
      store={{ name: p.storeName, place: `${p.storeAddress}, ${p.city}, ${p.state}`, shoppers: p.shoppers }}
      price={formatPrice(p.price)}
      previewSrc={p.demoAdId ? `/display/${p.storeSlug}?demo=${p.demoToken}&ad=${p.demoAdId}&only=1` : null}
      blocked={proposalBlocked(p)}
      paid={!!p.paidAt}
      email={p.email}
      signedIn={signedIn}
      canSignIn={!!login}
    />
  );
}
