import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { latestApplicationFor } from "@/lib/partner-applications";
import ApplyForm from "./ApplyForm";

export const dynamic = "force-dynamic";

export default async function PartnerApplyPage() {
  const session = await requireAuth();
  const userId = (session.user as any).id as string;
  const [me] = await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  const latest = await latestApplicationFor(userId);
  const isPartner = me?.role === "store_owner" || me?.role === "admin";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-12">
      <div className="text-xs font-bold text-[#E8563A] tracking-widest uppercase mb-3">For store owners</div>
      <h1 className="font-serif text-[clamp(26px,4vw,36px)] font-bold text-[#1A3A5C] dark:text-white mb-3">Become a store partner</h1>
      <p className="text-[15px] text-[#4A6B82] dark:text-[#9DC4E0] mb-8 leading-relaxed">
        Host a Community Bulletin screen in your store and earn a share of every ad shown there. No fees — use a TV you already have,
        or we&apos;ll provide one. <Link href="/demo" className="text-[#4A90C4] font-semibold">See how it works ↗</Link>
      </p>

      {isPartner ? (
        <Status tone="green" title="You're already a store partner">
          Manage your stores and earnings from your <Link href="/dashboard/store-owner" className="underline">dashboard</Link>.
        </Status>
      ) : latest?.status === "pending" ? (
        <Status tone="amber" title="Your application is under review">
          We received your application for <strong>{latest.businessName}</strong> on {latest.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}.
          We&apos;ll be in touch soon — you&apos;ll also get an email and a notification when it&apos;s reviewed.
        </Status>
      ) : (
        <>
          {latest?.status === "declined" && (
            <div className="mb-6">
              <Status tone="slate" title="Your previous application wasn't approved">
                {latest.declineReason ?? "You're welcome to apply again with updated details."}
              </Status>
            </div>
          )}
          <ApplyForm defaultContactName={me?.name ?? ""} />
        </>
      )}
    </div>
  );
}

function Status({ tone, title, children }: { tone: "green" | "amber" | "slate"; title: string; children: React.ReactNode }) {
  const styles = {
    green: "bg-green-50 border-green-200 text-green-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    slate: "bg-[#F7F9FC] border-[#D8E4EE] text-[#1A3A5C]",
  }[tone];
  return (
    <div className={`rounded-xl border px-5 py-4 ${styles}`}>
      <div className="font-semibold text-[15px] mb-1">{title}</div>
      <div className="text-[14px] leading-relaxed">{children}</div>
    </div>
  );
}
