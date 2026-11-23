"use client";

import Link from "next/link";
import { BadgeCheck, Building2, Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentOrg, useUserOrgs } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { cn, initials } from "@/lib/utils";

export function OrgSwitcher({ className }: { className?: string }) {
  const orgs = useUserOrgs();
  const currentOrg = useCurrentOrg();
  const switchOrg = useAppStore((s) => s.switchOrg);

  if (!currentOrg) {
    return (
      <Link
        href="/onboarding"
        className={cn(
          "flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-[12px] text-muted hover:border-sage hover:text-ink",
          className,
        )}
      >
        <Plus className="size-4" /> Crea organizzazione
      </Link>
    );
  }

  const typeLabel =
    currentOrg.type === "both" ? "Acquirente e fornitore" : currentOrg.type === "buyer" ? "Acquirente" : "Fornitore";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl border border-line bg-white px-2.5 py-2 text-left transition-colors hover:border-sage/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/20",
            className,
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-forest font-mono text-[11.5px] font-medium text-lime">
            {initials(currentOrg.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1">
              <span className="truncate text-[12px] font-medium leading-tight text-ink">
                {currentOrg.name}
              </span>
              {currentOrg.verified ? <BadgeCheck className="size-3.5 shrink-0 text-moss" /> : null}
            </span>
            <span className="mt-0.5 block font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
              {typeLabel}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[236px]">
        <DropdownMenuLabel>Organizzazioni</DropdownMenuLabel>
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onSelect={() => switchOrg(org.id)}
            className="items-start py-2"
          >
            <Building2 className="mt-0.5" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium">{org.name}</span>
              <span className="block text-[11.5px] capitalize text-muted">
                {org.type === "both" ? "Acquirente e fornitore" : org.type === "buyer" ? "Acquirente" : "Fornitore"} · {org.country}
              </span>
            </span>
            {org.id === currentOrg.id ? <Check className="mt-1 size-3.5 text-moss" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <Settings /> Impostazioni organizzazione
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
