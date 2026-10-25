import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileClient } from "./ProfileClient";
import { latestApplicationFor } from "@/lib/partner-applications";

export default async function ProfilePage() {
  const session = await requireAuth();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id as string),
    columns: { name: true, email: true, twoFactorEnabled: true, image: true, role: true },
  });

  // Advertiser accounts can apply to become a store partner from here
  const application = user?.role === "user" ? await latestApplicationFor(session.user.id as string) : null;

  return (
    <>
      <ProfileClient
        name={user?.name ?? session.user.name ?? ""}
        email={user?.email ?? session.user.email ?? ""}
        image={user?.image ?? null}
        twoFactorEnabled={user?.twoFactorEnabled ?? false}
      />

      {user?.role === "user" && (
        <div className="max-w-[600px] rounded-xl border border-[#E2EAF2] bg-white px-6 py-5">
          <div className="font-serif text-base font-bold text-[#1A3A5C] mb-1">Own a store?</div>
          {application?.status === "pending" ? (
            <p className="text-[13px] text-amber-800 m-0">
              Your store partner application for <strong>{application.businessName}</strong> is under review. We&apos;ll email you once it&apos;s reviewed.
            </p>
          ) : (
            <>
              <p className="text-[13px] text-[#4A6B82] mt-0 mb-3">
                Host a Community Bulletin screen in your store and earn a share of every ad shown there. No fees — use your own TV or we&apos;ll provide one.
                {application?.status === "declined" && " Your previous application wasn't approved, but you're welcome to apply again."}
              </p>
              <Link
                href="/partners/apply"
                className="inline-flex items-center h-9 px-4 rounded-lg bg-[#1A3A5C] text-white text-[13px] font-semibold no-underline hover:bg-[#15304d]"
              >
                Become a store partner →
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
