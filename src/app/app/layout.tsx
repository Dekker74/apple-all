"use client";

import { useI18n } from "@/lib/i18n";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { AppShell } from "@/components/app/app-shell";
import { useCurrentUser, useHydrated } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";

function BootScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper">
      <LogoMark className="size-10 animate-pulse" />
      <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-muted">{label}</p>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const authChecked = useAppStore((s) => s.authChecked);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !authChecked) return;
    if (!user) router.replace("/login");
    else if (!user.onboarded) router.replace("/onboarding");
  }, [hydrated, authChecked, user, router]);

  if (!hydrated || !authChecked) return <BootScreen label={t("Caricamento spazio di lavoro")} />;
  if (!user) return <BootScreen label={t("Reindirizzamento all'accesso")} />;
  if (!user.onboarded) return <BootScreen label={t("Completamento onboarding")} />;

  return <AppShell>{children}</AppShell>;
}
