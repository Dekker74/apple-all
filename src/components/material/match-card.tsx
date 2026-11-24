"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  MapPin,
  MessageSquare,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/material/category-icon";
import { ProcessingChips } from "@/components/material/price-breakdown";
import { CONFIDENCE_META } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { formatCurrency, formatKg, formatPerKg } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { Match, MaterialListing, MaterialRequest } from "@/types";

function ScoreRing({ score, confidence }: { score: number; confidence: Match["confidence"] }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const color = confidence === "strong" ? "var(--apple-blue)" : confidence === "review" ? "var(--amb)" : "var(--mut)";
  return (
    <div className="relative size-12 shrink-0">
      <svg viewBox="0 0 44 44" className="size-12 -rotate-90">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="var(--apple-hairline)" strokeWidth="3" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (score / 100) * circumference}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[12px] font-medium tabular-nums">
        {score}
      </span>
    </div>
  );
}

export function MatchCard({
  match,
  listing,
  request,
  supplierName,
  supplierCity,
  compact = false,
  className,
}: {
  match: Match;
  listing: MaterialListing;
  request: MaterialRequest;
  supplierName: string;
  supplierCity: string;
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const createOrder = useAppStore((s) => s.createOrderFromMatch);
  const setMatchStatus = useAppStore((s) => s.setMatchStatus);
  const openInboxThreadForMatch = useAppStore((s) => s.openInboxThreadForMatch);
  const currentOrgId = useAppStore((s) => s.currentOrgId);
  const counterpartName = useAppStore((s) => {
    const counterpartId =
      currentOrgId === listing.orgId ? request.orgId : currentOrgId === request.orgId ? listing.orgId : null;
    return s.organizations.find((o) => o.id === counterpartId)?.name ?? "Partner Offcut";
  });
  const existingOrder = useAppStore((s) =>
    s.orders.find((o) => o.matchId === match.id && o.status !== "cancelled"),
  );
  const confidence = CONFIDENCE_META[match.confidence];
  const isSeller = Boolean(currentOrgId && listing.orgId === currentOrgId && request.orgId !== currentOrgId);
  const isBuyer = Boolean(currentOrgId && request.orgId === currentOrgId && listing.orgId !== currentOrgId);

  function handleOrder() {
    try {
      const id = createOrder(match.id);
      toast.success("Ordine creato", { description: "Ora è possibile preparare il preventivo." });
      router.push(`/app/orders/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossibile creare l'ordine.");
    }
  }

  function handleContact() {
    try {
      const threadId = openInboxThreadForMatch(match.id);
      if (!threadId) throw new Error("Impossibile aprire la conversazione.");
      toast.success("Conversazione pronta", { description: `${counterpartName} · ${listing.reference}` });
      router.push(`/app/inbox?tab=messages&thread=${encodeURIComponent(threadId)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossibile contattare il partner.");
    }
  }

  const reasons = match.reasons.slice(0, compact ? 2 : 3);
  const risk = match.risks[0];

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:border-sage/70 hover:shadow-soft",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line/80 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <CategoryIcon category={listing.category} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={match.confidence === "strong" ? "strong" : "review"} className="gap-1">
                <span className={cn("size-1.5 rounded-full", confidence.dot)} />
                {confidence.label}
              </Badge>
              <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
                {match.quantityKg === request.quantityKg ? "Volume completo" : "Volume parziale"}
              </span>
            </div>
            <Link
              href={`/app/marketplace/${listing.id}`}
              className="mt-1.5 block truncate text-[14px] font-medium leading-[1.5] text-ink hover:underline"
            >
              {listing.title}
            </Link>
            <p className="mt-0.5 truncate text-[12px] text-muted">
              {supplierName} · {supplierCity} · {listing.reference}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <ScoreRing score={match.score} confidence={match.confidence} />
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">Affinità AI</span>
        </div>
      </div>

      <div className={cn("grid gap-5 px-5 py-4", compact ? "" : "sm:grid-cols-[1.15fr_1fr]")}>
        <div>
          <p className="eyebrow mb-2 flex items-center gap-1.5">
            <Sparkles className="size-3 text-moss" /> Perché è compatibile
          </p>
          <ul className="space-y-1.5">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-[11.5px] leading-relaxed text-ink/85">
                <Check className="mt-[2px] size-3 shrink-0 text-moss" strokeWidth={2.5} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          {risk && !compact ? (
            <p className="mt-2.5 flex items-start gap-1.5 text-[12px] leading-relaxed text-amber">
              <CircleAlert className="mt-[1px] size-3 shrink-0" />
              {risk}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl bg-paper/70 p-3.5">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
                Stima consegnata
              </p>
              <p className="mt-0.5 font-display text-[24px] leading-none">
                {formatCurrency(match.breakdown.total, { cents: true })}
              </p>
            </div>
            <p className="pb-0.5 font-mono text-[12px] tabular-nums text-muted">
              {formatPerKg(match.breakdown.deliveredPerKg)}
            </p>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line/70 pt-2 text-[11.5px] text-muted">
            <span className="flex items-center gap-1">
              <PackageCheck className="size-3" /> {formatKg(match.quantityKg)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {match.distanceKm} km
            </span>
            <span>consegna {formatDate(request.neededBy, { withYear: false })}</span>
          </div>
          {!compact ? (
            <div className="mt-2.5">
              <p className="mb-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
                Lavorazione
              </p>
              <ProcessingChips processing={match.requiredProcessing} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/80 bg-paper/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted">
            <Link href={`/app/marketplace/${listing.id}`}>
              Vedi materiale <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted"
            onClick={() => {
              setMatchStatus(match.id, match.status === "shortlisted" ? "suggested" : "shortlisted");
              toast.success(
                match.status === "shortlisted" ? "Rimosso dai preferiti" : "Aggiunto ai preferiti",
              );
            }}
          >
            {match.status === "shortlisted" ? "In preferiti" : "Preferiti"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isSeller || isBuyer ? (
            <Button size="sm" variant="outline" onClick={handleContact}>
              <MessageSquare className="size-3.5" />
              {isSeller ? "Contatta acquirente" : "Contatta fornitore"}
            </Button>
          ) : null}
          {existingOrder ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/app/orders/${existingOrder.id}`}>
                Vedi ordine <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="accent" onClick={handleOrder}>
              Crea ordine
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
