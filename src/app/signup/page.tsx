import type { Metadata } from "next";
import { OffcutAuthShell } from "@/components/offcut/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Crea un account" };

export default function SignupPage() {
  return (
    <OffcutAuthShell mode="signup">
      <SignupForm />
    </OffcutAuthShell>
  );
}
