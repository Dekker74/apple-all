"use client";

import { useI18n } from "@/lib/i18n";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Eye,
  MoreHorizontal,
  Package,
  Pause,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { CategoryIcon } from "@/components/material/category-icon";
import { MaterialThumb } from "@/components/material/material-thumb";
import { ListingStatusBadge } from "@/components/material/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useCurrentOrg, useOrgListings } from "@/lib/hooks";
import { formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ListingStatus } from "@/types";

const TABS: { value: "all" | ListingStatus; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "active", label: "Attivi" },
  { value: "sold", label: "Venduti" },
  { value: "draft", label: "Bozze" },
];

export default function ListingsPage() {
  const { t } = useI18n();
  const org = useCurrentOrg();
  const listings = useOrgListings();
  const matches = useAppStore((s) => s.matches);
  const updateListingStatus = useAppStore((s) => s.updateListingStatus);
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("all");

  const filtered = useMemo(
    () => (tab === "all" ? listings : listings.filter((l) => l.status === tab)),
    [listings, tab],
  );

  const totalVolume = listings.reduce((sum, l) => sum + l.quantityKg, 0);
  const avgPrice =
    listings.length > 0 ? listings.reduce((sum, l) => sum + l.pricePerKg, 0) / listings.length : 0;
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0);
  const matchCount = matches.filter(
    (m) => listings.some((l) => l.id === m.listingId) && m.status !== "dismissed",
  ).length;

  function toggleStatus(id: string, status: ListingStatus) {
    updateListingStatus(id, status);
    toast.success(status === "active" ? t("Annuncio riattivato") : t("Annuncio in pausa"));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("I tuoi materiali in vendita")}
        title={t("Materiali che vendi")}
        description={t(`Hai ${listings.filter((l) => l.status === "active").length} annunci attivi. Quando qualcuno è interessato, lo vedi qui sotto.`)}
        actions={
          <Button size="sm" asChild>
            <Link href="/app/listings/new">
              <Plus className="size-3.5" /> {t("Vendi nuovo materiale")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {[
          { label: t("Materiali in vendita"), value: String(listings.filter((l) => l.status === "active").length) },
          { label: t("Persone interessate"), value: String(matchCount) },
          { label: t("Volume totale"), value: formatKg(totalVolume) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white px-4 py-3.5">
            <p className="font-mono text-[12px] uppercase tracking-[0.13em] text-muted">{stat.label}</p>
            <p className="mt-1.5 font-display text-[24px] leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {TABS.map((tabItem) => {
            const count = tabItem.value === "all" ? listings.length : listings.filter((l) => l.status === tabItem.value).length;
            return (
              <button
                key={tabItem.value}
                onClick={() => setTab(tabItem.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  tab === tabItem.value
                    ? "border-forest bg-forest text-paper"
                    : "border-line bg-white/60 text-muted hover:border-sage hover:text-ink",
                )}
              >
                {t(tabItem.label)}
                <span className={cn("font-mono text-[12px]", tab === tabItem.value ? "text-lime" : "text-muted")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
          {totalViews} visualizzazioni marketplace
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Materiale")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("Categoria")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("Disponibile")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("Prezzo")}</TableHead>
                <TableHead>{t("Stato")}</TableHead>
                <TableHead>{t("Abbinamenti")}</TableHead>
                <TableHead className="hidden xl:table-cell">{t("Disponibile fino al")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((listing) => {
                const listingMatches = matches.filter(
                  (m) => m.listingId === listing.id && m.status !== "dismissed",
                );
                return (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <MaterialThumb
                          category={listing.category}
                          reference={listing.reference}
                          photos={listing.photos}
                          compact
                          className="hidden h-11 w-14 shrink-0 rounded-lg sm:block"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/app/marketplace/${listing.id}`}
                            className="block max-w-[280px] truncate text-[12.5px] font-medium hover:underline"
                          >
                            {t(listing.title)}
                          </Link>
                          <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
                            {listing.reference} · {listing.views} {t("visualizzazioni")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-[12px] text-muted">
                        <CategoryIcon category={listing.category} size="sm" />
                        {CATEGORY_MAP[listing.category].short}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-[12px]">
                      {formatKg(listing.quantityKg)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-[12px]">
                      {formatPerKg(listing.pricePerKg)}
                    </TableCell>
                    <TableCell>
                      <ListingStatusBadge status={listing.status} />
                    </TableCell>
                    <TableCell>
                      {listingMatches.length > 0 ? (
                        <Link href={`/app/matches?listing=${listing.id}`}>
                          <Badge variant="lime" className="cursor-pointer hover:opacity-80">
                            <Sparkles className="size-3" /> {listingMatches.length} compratori
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-[12px] text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-[12px] text-muted">
                      {t(formatDate(listing.availableUntil))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={t("Azioni annuncio")}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/marketplace/${listing.id}`}>
                              <Eye /> {t("Vedi dettagli")}
                            </Link>
                          </DropdownMenuItem>
                          {listingMatches.length > 0 && (
                            <DropdownMenuItem asChild>
                              <Link href={`/app/matches?listing=${listing.id}`}>
                                <Sparkles /> {listingMatches.length} persone interessate
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {listing.status === "active" || listing.status === "matched" ? (
                            <DropdownMenuItem onSelect={() => toggleStatus(listing.id, "archived")}>
                              <Pause /> {t("Nascondi annuncio")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => toggleStatus(listing.id, "active")}>
                              <Play /> {t("Mostra di nuovo")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={listings.length === 0 ? t("Non hai ancora materiali in vendita") : t("Nessun materiale in questo stato")}
          description={
            listings.length === 0
              ? t("Pubblica il tuo primo materiale e inizia a ricevere richieste.")
              : t("Prova un altro filtro o pubblica nuovo materiale.")
          }
          action={
            <Button size="sm" asChild>
              <Link href="/app/listings/new">
                <Plus className="size-3.5" /> {t("Vendi materiale")}
              </Link>
            </Button>
          }
        />
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium">{t("💡 Consiglio")}</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {t("Descrivi bene il materiale e le persone giuste lo troveranno più facilmente.")}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/marketplace">
            {t("Esplora marketplace")} <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
