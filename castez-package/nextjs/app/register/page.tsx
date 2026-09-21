import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create your account — casteasy.io" };

export default function Page() {
  return <RegisterForm />;
}
