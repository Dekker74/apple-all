"use client";

import { useI18n } from "@/lib/i18n";
import { PROCESSING_MAP } from "@/lib/constants";
import { formatCurrency, formatKg, formatPerKg } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { PriceBreakdown } from "@/types";

function Line({
  label,
  sub,
  value,
  muted,
}: {
  label: string;
  sub?: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className={cn("text-[12.5px]", muted ? "text-muted" : "text-ink")}>{label}</p>
        {sub ? <p className="mt-0.5 text-[12px] text-muted">{sub}</p> : null}
      </div>
      <span
        className={cn(
          "shrink-0 font-mono text-[12px] tabular-nums",
          muted ? "text-muted" : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PriceBreakdownPanel({
  breakdown,
  processingLabels,
  distanceKm,
  className,
  compact = false,
}: {
  breakdown: PriceBreakdown;
  processingLabels?: string[];
  distanceKm?: number;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className={cn("rounded-xl border border-line bg-paper/60", compact ? "p-4" : "p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">{t("Prezzo consegnato stimato")}</p>
          <p className="mt-1 font-display text-[30px] leading-none tracking-tight">
            {formatCurrency(breakdown.total, { cents: true })}
          </p>
          <p className="mt-1.5 text-[12px] text-muted">
            {formatPerKg(breakdown.deliveredPerKg)} {t("consegnato")} · {formatKg(breakdown.quantityKg)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">{t("IVA inclusa")}</p>
          <p className="mt-1 font-mono text-[12px] text-muted">
            {Math.round(breakdown.taxRate * 100)}% · {formatCurrency(breakdown.taxAmount)}
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-line/70 border-t border-line/70">
        <Line
          label={t("Materiale")}
          sub={`${formatKg(breakdown.quantityKg)} × ${formatPerKg(breakdown.materialPerKg)}`}
          value={formatCurrency(breakdown.materialCost, { cents: true })}
        />
        <Line
          label={t(`Commissione Offcut (${Math.round(breakdown.commissionRate * 100)}%)`)}
          sub={t("Abbinamento, contratti, coordinamento")}
          value={formatCurrency(breakdown.commissionAmount, { cents: true })}
          muted
        />
        <Line
          label={t("Lavorazione")}
          sub={
            processingLabels && processingLabels.length > 0
              ? processingLabels.join(" · ")
              : t("Nessuna lavorazione richiesta")
          }
          value={formatCurrency(breakdown.processingCost, { cents: true })}
          muted
        />
        <Line
          label={t("Trasporto")}
          sub={distanceKm ? t(`${distanceKm} km · ${t("linea consolidata")}`) : t("Linea consolidata")}
          value={formatCurrency(breakdown.transportCost, { cents: true })}
          muted
        />
        <Line label={t("Subtotale")} value={formatCurrency(breakdown.subtotal, { cents: true })} />
        <Line
          label={t(`IVA ${Math.round(breakdown.taxRate * 100)}%`)}
          value={formatCurrency(breakdown.taxAmount, { cents: true })}
          muted
        />
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-line pt-3">
        <span className="text-[12.5px] font-medium">{t("Totale consegnato")}</span>
        <span className="font-mono text-[15px] font-medium tabular-nums">
          {formatCurrency(breakdown.total, { cents: true })}
        </span>
      </div>
    </div>
  );
}

export function ProcessingChips({
  processing,
  className,
}: {
  processing: (keyof typeof PROCESSING_MAP)[];
  className?: string;
}) {
  const { t } = useI18n();
  if (processing.length === 0) {
    return (
      <span className={cn("text-[12px] text-muted", className)}>{t("Nessuna lavorazione richiesta")}</span>
    );
  }
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {processing.map((p) => (
        <span
          key={p}
          className="rounded-full border border-line bg-white px-2 py-0.5 text-[12px] text-moss"
        >
          {t(PROCESSING_MAP[p]?.label ?? p)}
        </span>
      ))}
    </div>
  );
}
