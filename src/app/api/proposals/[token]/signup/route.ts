import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { leadNotes, proposals, users } from "@/lib/db/schema";
import { loadProposal, proposalBlocked } from "@/lib/proposal-access";
import { setUserPassword } from "@/lib/temp-password";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().max(30).optional().transform(v => v || null),
  password: z.string().min(8, "Use at least 8 characters for your password").max(128),
});

// POST /api/proposals/[token]/signup — public: a new advertiser creates their account from a proposal.
// The email is the one the proposal was sent to, so it counts as confirmed; the page then signs them in.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const p = await loadProposal(token);
    if (!p) return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
    const blocked = proposalBlocked(p);
    if (blocked) return NextResponse.json({ success: false, error: blocked }, { status: 409 });

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });

    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, p.email)).limit(1);
    if (taken) return NextResponse.json({ success: false, exists: true, error: "You already have an account with this email. Sign in to accept." }, { status: 409 });

    const [user] = await db.insert(users).values({
      name: parsed.data.name,
      email: p.email,
      role: "user",
      emailVerified: true,
      defaultPhone: parsed.data.phone,
    }).returning({ id: users.id });
    await setUserPassword(user.id, parsed.data.password);

    await db.update(proposals).set({ userId: user.id }).where(eq(proposals.id, p.id));
    await db.insert(leadNotes).values({ leadId: p.leadId, authorId: null, body: `Proposal: ${parsed.data.name} created their account (${p.email})` });

    return NextResponse.json({ success: true, data: { email: p.email } });
  } catch (error) {
    console.error("[POST /api/proposals/[token]/signup]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
