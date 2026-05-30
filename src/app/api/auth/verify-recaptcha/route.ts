import { NextRequest, NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ success: false }, { status: 400 });
  const ok = await verifyRecaptcha(token);
  return NextResponse.json({ success: ok });
}
