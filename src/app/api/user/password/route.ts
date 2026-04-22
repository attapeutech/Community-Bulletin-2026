import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const result = await auth.api.changePassword({
    headers: await headers(),
    body: { currentPassword, newPassword, revokeOtherSessions: false },
  });

  if ((result as any)?.error) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
