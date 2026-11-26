"use client";

import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { localized } from "@/components/app/offcut-ux-copy";
import { perKg } from "@/components/app/offcut-ux-text";
import { MaterialThumb } from "@/components/material/material-thumb";
import { CATEGORY_MAP, CONDITION_MAP } from "@/lib/constants";
import { formatKg, formatPerKg } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { MaterialListing } from "@/types";

const COPY = {
  it: { delivered: "consegnato", view: "Visualizza" },
  en: { delivered: "delivered", view: "View" },
};

export function ListingCard({
  listing,
  supplierName,
  city,
  distanceKm,
  deliveredPerKg,
  matchScore,
  className,
}: {
  listing: MaterialListing;
  supplierName: string;
  city: string;
  distanceKm?: number;
  deliveredPerKg?: number;
  matchScore?: number;
  className?: string;
}) {
  const { t, lang } = useI18n();
  const c = localized(COPY, lang);
  return (
    <Link
      href={`/app/marketplace/${listing.id}`}
      className={cn(
        "group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-sage/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss",
        className,
      )}
    >
      <div className="relative">
        <MaterialThumb
          category={listing.category}
          reference={listing.reference}
          photos={listing.photos}
          className="h-36 w-full"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white px-2 py-0.5 text-[11.5px] font-medium text-ink">
            {t(CATEGORY_MAP[listing.category].short)}
          </span>
          {matchScore !== undefined ? (
            <span className="rounded-full bg-forest px-2 py-0.5 font-mono text-[11.5px] text-paper">
              AI {matchScore}
            </span>
          ) : null}
        </div>
        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-white px-2 py-0.5 text-[11.5px] font-medium text-ink">
          {t(CONDITION_MAP[listing.condition].label)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted">
          <span className="truncate">{supplierName}</span>
          {listing.status === "active" ? <BadgeCheck className="size-3 shrink-0 text-moss" aria-label={t("Verificato")} /> : null}
        </div>
        <h3 className="mt-1 line-clamp-2 text-[14px] font-medium leading-[1.5] text-ink">
          {t(listing.title)}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1">
          {listing.composition.slice(0, 2).map((part) => (
            <span
              key={part.material}
              className="rounded border border-line/80 bg-paper/60 px-1.5 py-0.5 text-[11.5px] text-muted"
            >
              {t(part.material)} {part.percent}%
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{t("Materiale")}</p>
            <p className="mt-0.5 font-mono text-[13px] tabular-nums">
              {formatPerKg(listing.pricePerKg)}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{t("Disponibile")}</p>
            <p className="mt-0.5 font-mono text-[13px] tabular-nums">{formatKg(listing.quantityKg)}</p>
          </div>
        </div>

        <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-line/70 pt-3 text-[12px] text-muted">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <MapPin className="size-3 shrink-0" /> {city}
            {distanceKm !== undefined ? ` · ${distanceKm} km` : ""}
          </span>
          {deliveredPerKg !== undefined ? (
            <span className="shrink-0 font-mono text-[12px] text-ink">
              {perKg(deliveredPerKg, lang)} {c.delivered}
            </span>
          ) : (
            <span className="shrink-0 text-forest">
              {c.view} <span aria-hidden>→</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
