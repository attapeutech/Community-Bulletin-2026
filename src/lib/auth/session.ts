import { auth } from "./index";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { verifications } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { User } from "@/lib/db/schema";

export type UserRole = "user" | "store_owner" | "approver" | "admin";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = session.user as unknown as User;

  if (user.twoFactorEnabled) {
    const sessionToken = (session as any).session?.token as string | undefined;
    if (!sessionToken) redirect("/two-factor");

    const verified = await db.query.verifications.findFirst({
      where: and(
        eq(verifications.identifier, `2fa_ok:${sessionToken}`),
        gt(verifications.expiresAt, new Date())
      ),
    });
    if (!verified) redirect("/two-factor");
  }

  return session;
}

export async function requireRole(...roles: UserRole[]) {
  const session = await requireAuth();
  const userRole = (session.user as unknown as User).role;
  if (!roles.includes(userRole as UserRole)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireApproverOrAdmin() {
  return requireRole("approver", "admin");
}

export async function requireStoreOwner() {
  return requireRole("store_owner", "admin");
}

export function isAdmin(role: string) {
  return role === "admin";
}

export function isApprover(role: string) {
  return role === "approver" || role === "admin";
}

export function isStoreOwner(role: string) {
  return role === "store_owner" || role === "admin";
}
