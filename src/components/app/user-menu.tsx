"use client";

import { useI18n } from "@/lib/i18n";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentOrg, useCurrentUser } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const user = useCurrentUser();
  const org = useCurrentOrg();
  const signOut = useAppStore((s) => s.signOut);
  const router = useRouter();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`${user.fullName} — account menu`}
          title={`${user.fullName} — account menu`}
          className={cn(
            "offcut-user-menu-trigger flex w-full items-center gap-2.5 rounded-xl text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/20",
            compact ? "px-1.5 py-1.5 hover:bg-white/70" : "p-1 hover:bg-sand",
          )}
        >
          <Avatar name={user.fullName} size="sm" />
          <span className={cn("offcut-user-menu-label min-w-0 flex-1", compact ? "" : "hidden sm:block")}>
            <span className="block truncate text-[12px] font-medium leading-tight">{user.fullName}</span>
            <span className="block truncate text-[11.5px] text-muted">{user.email}</span>
          </span>
          <ChevronDown className="offcut-user-menu-chevron size-3.5 shrink-0 text-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px]">
        <div className="px-2.5 py-2">
          <p className="text-[12.5px] font-medium">{user.fullName}</p>
          <p className="text-[12px] text-muted">{user.email}</p>
          {org ? (
            <p className="mt-1.5 flex items-center gap-1 font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
              <Building2 className="size-3" /> {org.name}
            </p>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("Account")}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <UserRound /> {t("Profilo e azienda")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <Settings /> {t("Impostazioni spazio di lavoro")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2.5 py-1.5">
          <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
            <ShieldCheck className="size-3 text-moss" />
            {isSupabaseConfigured ? t("Autenticazione Supabase") : t("Spazio di lavoro demo locale")}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-danger focus:bg-danger/10 focus:text-danger [&_svg]:text-danger"
          onSelect={async () => {
            await signOut();
            router.replace("/login");
          }}
        >
          <LogOut /> {t("Esci")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
