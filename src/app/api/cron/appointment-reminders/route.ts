import { NextRequest, NextResponse } from "next/server";
import { notifyAppointmentsSoon } from "@/lib/notifications";

// POST /api/cron/appointment-reminders — bell reminders for Sales appointments starting within the hour
// Called by a Coolify scheduled task every 15 minutes:
//   curl -X POST https://communitybulletin.com/api/cron/appointment-reminders \
//        -H "Authorization: Bearer $CRON_SECRET"
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/appointment-reminders] CRON_SECRET env var not set");
    return NextResponse.json({ success: false, error: "Server misconfigured" }, { status: 500 });
  }
  if ((req.headers.get("authorization") ?? "") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sent = await notifyAppointmentsSoon(new Date());
    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("[cron/appointment-reminders]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
