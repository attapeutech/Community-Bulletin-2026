import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset your password — casteasy.io" };

export default function Page() {
  return <ForgotPasswordForm />;
}
