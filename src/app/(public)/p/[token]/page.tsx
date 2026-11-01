import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { leadNotes, proposals, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { loadProposal, proposalBlocked } from "@/lib/proposal-access";
import { notifyUser } from "@/lib/notifications";
import { formatPrice } from "@/lib/pricing";
import ProposalClient from "./ProposalClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your ad proposal", robots: { index: false, follow: false } };

// The advertiser's proposal page: their ad on the store's screen, the offer, and Accept & pay
export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const p = await loadProposal(token);
  if (!p) notFound();

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

  const signedIn = session ? { name: (session.user as any).name as string, email: (session.user as any).email as string } : null;
  // An account with the proposal's email already exists: they sign in rather than sign up
  const [existing] = signedIn ? [] : await db.select({ id: users.id }).from(users).where(eq(users.email, p.email)).limit(1);

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
      defaults={{ name: p.contactName ?? "", phone: p.phone ?? "" }}
      signedIn={signedIn}
      accountExists={!!existing}
    />
  );
}
