"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
      className="w-full justify-start px-3.5 py-2.5 text-[#9DC4E0] text-[13px] hover:bg-white/10 hover:text-[#9DC4E0] rounded-lg h-auto font-normal"
    >
      Sign out
    </Button>
  );
}
