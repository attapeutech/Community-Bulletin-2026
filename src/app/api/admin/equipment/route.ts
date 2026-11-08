import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { equipment } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { equipmentSchema } from "@/lib/equipment";
import { equipmentColumns, MissingKeyError } from "@/lib/equipment-server";

// POST /api/admin/equipment — admin: add an item
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const data = equipmentSchema.parse(await req.json());
    const [row] = await db.insert(equipment).values(equipmentColumns(data)).returning({ id: equipment.id });
    return NextResponse.json({ success: true, data: row });
  } catch (error: any) {
    if (error instanceof MissingKeyError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 503 });
    }
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Please check the form" }, { status: 422 });
    }
    if (error.code === "23503" || error.cause?.code === "23503") {
      return NextResponse.json({ success: false, error: "That store or screen no longer exists" }, { status: 409 });
    }
    console.error("[POST /api/admin/equipment]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
