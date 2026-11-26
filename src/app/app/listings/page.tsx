"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Copy,
  Eye,
  MoreHorizontal,
  Package,
  Pause,
  Pencil,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { CategoryIcon } from "@/components/material/category-icon";
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
import { LISTING_DRAFT_KEY } from "@/components/forms/draft-keys";
import { CATEGORY_COPY } from "@/components/forms/form-copy";
import { formatLocalDate } from "@/components/forms/local-format";
import { MaterialPreview } from "@/components/forms/material-preview";
import { StatusPill } from "@/components/forms/status-pill";
import { useLocalCopy } from "@/components/forms/use-local-copy";
import { useCurrentOrg, useOrgListings } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ListingStatus, MaterialListing } from "@/types";

const COPY = {
  it: {
    eyebrow: "I tuoi materiali in vendita",
    title: "Materiali che vendi",
    description: (count: number) =>
      `Hai ${count} ${count === 1 ? "annuncio attivo" : "annunci attivi"}. Quando qualcuno è interessato, lo vedi qui sotto.`,
    newListing: "Vendi nuovo materiale",
    stats: {
      active: "Materiali in vendita",
      interested: "Persone interessate",
      volume: "Volume totale",
    },
    tabs: { all: "Tutti", active: "Attivi", sold: "Venduti", draft: "Bozze" },
    views: (count: number) => `${count} visualizzazioni marketplace`,
    columns: {
      material: "Materiale",
      category: "Categoria",
      available: "Disponibile",
      price: "Prezzo",
      status: "Stato",
      matches: "Abbinamenti",
      until: "Disponibile fino al",
    },
    buyers: (count: number) => `${count} ${count === 1 ? "compratore" : "compratori"}`,
    interested: (count: number) =>
      `${count} ${count === 1 ? "persona interessata" : "persone interessate"}`,
    actions: "Azioni annuncio",
    details: "Vedi dettagli",
    edit: "Modifica materiali",
    duplicate: "Duplica come bozza",
    hide: "Nascondi annuncio",
    show: "Mostra di nuovo",
    empty: {
      title: "Non hai ancora materiali in vendita",
      description:
        "Pubblica il tuo primo annuncio: scegli la categoria, aggiungi quantità e prezzo, poi controlla l'anteprima.",
      filteredTitle: "Nessun materiale in questo stato",
      filteredDescription: "Prova un altro filtro o pubblica nuovo materiale.",
      action: "Vendi materiale",
      reset: "Mostra tutti",
    },
    tipTitle: "Consiglio",
    tipDescription:
      "Descrivi bene il materiale e le persone giuste lo troveranno più facilmente.",
    explore: "Esplora marketplace",
    toastShown: "Annuncio riattivato",
    toastHidden: "Annuncio in pausa",
    toastDuplicated: "Bozza pronta",
    duplicateDescription: "Controlla i dati nel form prima di pubblicare la copia.",
    toastDuplicateFailed: "Impossibile preparare la bozza. Riprova.",
    toastEditFailed: "Impossibile preparare la modifica. Riprova.",
  },
  en: {
    eyebrow: "Your materials for sale",
    title: "Materials you sell",
    description: (count: number) =>
      `You have ${count} active ${count === 1 ? "listing" : "listings"}. When someone is interested, you will see it here.`,
    newListing: "Sell new material",
    stats: {
      active: "Materials for sale",
      interested: "Interested companies",
      volume: "Total volume",
    },
    tabs: { all: "All", active: "Active", sold: "Sold", draft: "Drafts" },
    views: (count: number) => `${count} marketplace views`,
    columns: {
      material: "Material",
      category: "Category",
      available: "Available",
      price: "Price",
      status: "Status",
      matches: "Matches",
      until: "Available until",
    },
    buyers: (count: number) => `${count} ${count === 1 ? "buyer" : "buyers"}`,
    interested: (count: number) =>
      `${count} ${count === 1 ? "interested company" : "interested companies"}`,
    actions: "Listing actions",
    details: "View details",
    edit: "Edit materials",
    duplicate: "Duplicate as draft",
    hide: "Hide listing",
    show: "Show again",
    empty: {
      title: "You have not listed any material yet",
      description:
        "Publish your first listing: pick a category, add quantity and price, then check the preview.",
      filteredTitle: "No material in this status",
      filteredDescription: "Try another filter or publish new material.",
      action: "Sell material",
      reset: "Show all",
    },
    tipTitle: "Tip",
    tipDescription: "Describe the material clearly so the right buyers can find it.",
    explore: "Explore marketplace",
    toastShown: "Listing reactivated",
    toastHidden: "Listing paused",
    toastDuplicated: "Draft ready",
    duplicateDescription: "Review the details in the form before publishing the copy.",
    toastDuplicateFailed: "Could not prepare the draft. Please try again.",
    toastEditFailed: "Could not prepare the edit. Please try again.",
  },
} as const;

const TABS: { value: "all" | ListingStatus; key: keyof (typeof COPY.it)["tabs"] }[] = [
  { value: "all", key: "all" },
  { value: "active", key: "active" },
  { value: "sold", key: "sold" },
  { value: "draft", key: "draft" },
];

export default function ListingsPage() {
  const s = useLocalCopy(COPY);
  const { lang } = useI18n();
  const categoryCopy = useLocalCopy(CATEGORY_COPY);
  const router = useRouter();
  const org = useCurrentOrg();
  const listings = useOrgListings();
  const matches = useAppStore((state) => state.matches);
  const updateListingStatus = useAppStore((state) => state.updateListingStatus);
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("all");

  const filtered = useMemo(
    () => (tab === "all" ? listings : listings.filter((listing) => listing.status === tab)),
    [listings, tab],
  );

  const totalVolume = listings.reduce((sum, listing) => sum + listing.quantityKg, 0);
  const totalViews = listings.reduce((sum, listing) => sum + listing.views, 0);
  const matchCount = matches.filter(
    (match) => listings.some((listing) => listing.id === match.listingId) && match.status !== "dismissed",
  ).length;

  function toggleStatus(id: string, status: ListingStatus) {
    updateListingStatus(id, status);
    toast.success(status === "active" ? s.toastShown : s.toastHidden);
  }

  function buildListingDraft(listing: MaterialListing, editingId?: string) {
    return {
      title: editingId ? listing.title : `${listing.title} (${lang === "it" ? "copia" : "copy"})`,
      category: listing.category,
      description: listing.description,
      conditionFlags: listing.conditionFlags ?? [listing.condition],
      composition: listing.composition,
      quantityKg: String(listing.quantityKg),
      minOrderKg: String(listing.minOrderKg),
      pricePerKg: String(listing.pricePerKg),
      availableFrom: listing.availableFrom,
      availableUntil: listing.availableUntil,
      locationId: listing.locationId,
      packaging: listing.packaging,
      handling: listing.handling,
      photos: listing.photos ?? [],
      editingId,
    };
  }

  function openDraft(draft: ReturnType<typeof buildListingDraft>, error: string) {
    try {
      window.localStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify(draft));
      router.push("/app/listings/new");
    } catch {
      toast.error(error);
    }
  }

  function editListing(listing: MaterialListing) {
    openDraft(buildListingDraft(listing, listing.id), s.toastEditFailed);
  }

  function duplicateListing(listing: MaterialListing) {
    const draft = buildListingDraft(listing);
    try {
      window.localStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify(draft));
      toast.success(s.toastDuplicated, { description: s.duplicateDescription });
      router.push("/app/listings/new");
    } catch {
      toast.error(s.toastDuplicateFailed);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={s.eyebrow}
        title={s.title}
        description={s.description(listings.filter((listing) => listing.status === "active").length)}
        actions={
          <Button size="lg" asChild>
            <Link href="/app/listings/new">
              <Plus className="size-4" /> {s.newListing}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {[
          { label: s.stats.active, value: String(listings.filter((l) => l.status === "active").length) },
          { label: s.stats.interested, value: String(matchCount) },
          { label: s.stats.volume, value: formatKg(totalVolume) },
        ].map((stat) => (
          <div key={stat.label} className="min-w-0 bg-white px-4 py-3.5">
            <p className="font-mono text-[11.5px] uppercase tracking-[0.13em] text-muted">
              {stat.label}
            </p>
            <p className="mt-1.5 font-display text-[24px] leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto">
          {TABS.map((item) => {
            const count =
              item.value === "all"
                ? listings.length
                : listings.filter((listing) => listing.status === item.value).length;
            const active = tab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors motion-reduce:transition-none",
                  active
                    ? "border-forest bg-forest text-paper"
                    : "border-line bg-white/60 text-muted hover:border-sage hover:text-ink",
                )}
              >
                {s.tabs[item.key]}
                <span className={cn("font-mono", active ? "text-lime" : "text-muted")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
          {s.views(totalViews)}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{s.columns.material}</TableHead>
                <TableHead className="hidden md:table-cell">{s.columns.category}</TableHead>
                <TableHead className="hidden sm:table-cell">{s.columns.available}</TableHead>
                <TableHead className="hidden lg:table-cell">{s.columns.price}</TableHead>
                <TableHead>{s.columns.status}</TableHead>
                <TableHead>{s.columns.matches}</TableHead>
                <TableHead className="hidden xl:table-cell">{s.columns.until}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((listing) => {
                const listingMatches = matches.filter(
                  (match) => match.listingId === listing.id && match.status !== "dismissed",
                );
                return (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <MaterialPreview
                          category={listing.category}
                          photos={listing.photos}
                          compact
                          className="hidden h-11 w-14 shrink-0 rounded-lg sm:block"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/app/marketplace/${listing.id}`}
                            className="block max-w-[280px] truncate text-[12.5px] font-medium hover:underline"
                          >
                            {listing.title}
                          </Link>
                          <p className="mt-0.5 font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted">
                            {listing.reference} · {listing.views}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-[12px] text-muted">
                        <CategoryIcon category={listing.category} size="sm" />
                        {categoryCopy[listing.category]?.short ?? s.columns.category}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-[12px]">
                      {formatKg(listing.quantityKg)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-[12px]">
                      {formatPerKg(listing.pricePerKg)}
                    </TableCell>
                    <TableCell>
                      <StatusPill kind="listing" status={listing.status} />
                    </TableCell>
                    <TableCell>
                      {listingMatches.length > 0 ? (
                        <Link href={`/app/matches?listing=${listing.id}`}>
                          <Badge variant="lime" className="cursor-pointer hover:opacity-80">
                            <Sparkles className="size-3" /> {s.buyers(listingMatches.length)}
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-[12px] text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-[12px] text-muted">
                      {formatLocalDate(listing.availableUntil, lang)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={s.actions}
                            className="size-11 sm:size-9"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/marketplace/${listing.id}`}>
                              <Eye /> {s.details}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => editListing(listing)}>
                            <Pencil /> {s.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => duplicateListing(listing)}>
                            <Copy /> {s.duplicate}
                          </DropdownMenuItem>
                          {listingMatches.length > 0 ? (
                            <DropdownMenuItem asChild>
                              <Link href={`/app/matches?listing=${listing.id}`}>
                                <Sparkles /> {s.interested(listingMatches.length)}
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          {listing.status === "active" || listing.status === "matched" ? (
                            <DropdownMenuItem onSelect={() => toggleStatus(listing.id, "archived")}>
                              <Pause /> {s.hide}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => toggleStatus(listing.id, "active")}>
                              <Play /> {s.show}
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
          title={listings.length === 0 ? s.empty.title : s.empty.filteredTitle}
          description={
            listings.length === 0 ? s.empty.description : s.empty.filteredDescription
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="lg" asChild>
                <Link href="/app/listings/new">
                  <Plus className="size-4" /> {s.empty.action}
                </Link>
              </Button>
              {listings.length > 0 ? (
                <Button variant="outline" size="lg" onClick={() => setTab("all")}>
                  {s.empty.reset}
                </Button>
              ) : null}
            </div>
          }
        />
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium">{s.tipTitle}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{s.tipDescription}</p>
        </div>
        <Button variant="outline" size="lg" asChild>
          <Link href="/app/marketplace">
            {s.explore} <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
