import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await requireAuth();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id as string),
    columns: { name: true, email: true, twoFactorEnabled: true },
  });

  return (
    <ProfileClient
      name={user?.name ?? session.user.name ?? ""}
      email={user?.email ?? session.user.email ?? ""}
      twoFactorEnabled={user?.twoFactorEnabled ?? false}
    />
  );
}
