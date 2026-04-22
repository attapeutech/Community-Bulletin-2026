import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase().trim()) });
  if (!user) {
    return NextResponse.json({ error: "No account found with that email address." }, { status: 404 });
  }

  await auth.api.forgetPassword({ body: { email, redirectTo } });

  return NextResponse.json({ ok: true });
}
