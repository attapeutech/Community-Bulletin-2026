import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users, userRoleEnum } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { desc, eq } from "drizzle-orm";
import { issueTempPassword, TEMP_PASSWORD_DAYS } from "@/lib/temp-password";
import { sendAccountCreatedEmail } from "@/lib/email/templates";

// GET /api/admin/users — full user list
export async function GET() {
  try {
    await requireAdmin();

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified,
        twoFactorEnabled: users.twoFactorEnabled,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const ROLE_LABELS: Record<string, string> = {
  user: "Advertiser",
  store_owner: "Store Owner",
  approver: "Approver",
  admin: "Admin",
};

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(userRoleEnum.enumValues),
  sendWelcomeEmail: z.boolean().default(true),
});

// POST /api/admin/users — admin creates an account with a temporary password (shown once)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 422 }
      );
    }
    const { name, email, role, sendWelcomeEmail } = parsed.data;

    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (taken) {
      return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    }

    // Admin vouches for the address, so it's confirmed; issueTempPassword sets the
    // password and forces a change on first login
    const [created] = await db
      .insert(users)
      .values({ name, email, role, emailVerified: true })
      .returning({
        id: users.id, name: users.name, email: users.email, role: users.role,
        emailVerified: users.emailVerified, twoFactorEnabled: users.twoFactorEnabled,
        createdAt: users.createdAt, banned: users.banned, banReason: users.banReason,
        lastLoginAt: users.lastLoginAt, lastLogoutAt: users.lastLogoutAt,
      });

    const tempPassword = await issueTempPassword(created.id);

    if (sendWelcomeEmail) {
      sendAccountCreatedEmail({ to: email, name, roleLabel: ROLE_LABELS[role] ?? role }).catch(console.error);
    }

    console.log(`[Admin] User ${created.id} (${role}) created by admin ${adminId}`);
    return NextResponse.json({ success: true, data: { user: created, tempPassword, expiresInDays: TEMP_PASSWORD_DAYS } }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/admin/users]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
