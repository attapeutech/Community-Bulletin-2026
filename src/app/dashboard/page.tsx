import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) redirect("/login");

  const role = (session.user as any).role as string;

  switch (role) {
    case "admin":
      redirect("/dashboard/admin");
    case "approver":
      redirect("/dashboard/approver");
    case "store_owner":
      redirect("/dashboard/store-owner");
    default:
      redirect("/dashboard/user");
  }
}
