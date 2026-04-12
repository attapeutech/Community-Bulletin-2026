"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "10px 14px",
        borderRadius: 8,
        color: "#9DC4E0",
        fontSize: 13,
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
