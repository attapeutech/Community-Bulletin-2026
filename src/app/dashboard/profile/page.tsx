import { requireAuth } from "@/lib/auth/session";
import { ProfileClient } from "./ProfileClient";
import type { User } from "@/lib/db/schema";

export default async function ProfilePage() {
  const session = await requireAuth();
  const user = session.user as unknown as User;

  return (
    <ProfileClient
      name={user.name}
      email={user.email}
      twoFactorEnabled={user.twoFactorEnabled ?? false}
    />
  );
}
