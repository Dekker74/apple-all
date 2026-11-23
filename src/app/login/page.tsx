import type { Metadata } from "next";
import { OffcutAuthShell } from "@/components/offcut/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Accedi" };

export default function LoginPage() {
  return (
    <OffcutAuthShell mode="signin">
      <LoginForm />
    </OffcutAuthShell>
  );
}
