"use client";

import { useI18n } from "@/lib/i18n";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  MapPin,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { CategoryIcon } from "@/components/material/category-icon";
import { RequestStatusBadge } from "@/components/material/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CATEGORY_MAP, PROCESSING_MAP } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useCurrentOrg, useOrgRequests } from "@/lib/hooks";
import { formatCurrency, formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types";

const TABS: { value: "all" | RequestStatus; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "open", label: "Apri" },
  { value: "matched", label: "Abbinato" },
  { value: "fulfilled", label: "Evaso" },
  { value: "closed", label: "Chiuso" },
];

export default function RequestsPage() {
  const { t } = useI18n();
  const org = useCurrentOrg();
  const requests = useOrgRequests();
  const matches = useAppStore((s) => s.matches);
  const locations = useAppStore((s) => s.locations);
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("all");

  const filtered = useMemo(
    () => (tab === "all" ? requests : requests.filter((r) => r.status === tab)),
    [requests, tab],
  );

  const open = requests.filter((r) => r.status === "open" || r.status === "matched");
  const volume = open.reduce((sum, r) => sum + r.quantityKg, 0);
  const matchCount = matches.filter(
    (m) => requests.some((r) => r.id === m.requestId) && m.status !== "dismissed",
  ).length;
  const strongCount = matches.filter(
    (m) =>
      requests.some((r) => r.id === m.requestId) &&
      m.status !== "dismissed" &&
      m.confidence === "strong",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Domanda · i miei requisiti")}
        title={t("Le mie richieste")}
        description={t(`${org?.name ?? t("La tua organizzazione")} · specifica una volta, riutilizza ogni mese. Le richieste restano aperte mentre il motore cerca nuova offerta secondo le condizioni accettate.`)}
        actions={
          <Button size="sm" asChild>
            <Link href="/app/requests/new">
              <Plus className="size-3.5" /> {t("Nuova richiesta")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
        {[
          { label: t("Richieste aperte"), value: String(open.length) },
          { label: t("Volume richiesto"), value: formatKg(volume) },
          { label: t("Abbinamenti AI"), value: String(matchCount) },
          { label: t("Candidati solidi"), value: String(strongCount) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white px-4 py-3.5">
            <p className="font-mono text-[12px] uppercase tracking-[0.13em] text-muted">{stat.label}</p>
            <p className="mt-1.5 font-display text-[24px] leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {TABS.map((tabItem) => {
          const count = tabItem.value === "all" ? requests.length : requests.filter((r) => r.status === tabItem.value).length;
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

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((request) => {
            const requestMatches = matches.filter(
              (m) => m.requestId === request.id && m.status !== "dismissed",
            );
            const best = requestMatches.sort((a, b) => b.score - a.score)[0];
            const location = locations.find((l) => l.id === request.locationId);
            const budgetPerKg = request.maxBudget / request.quantityKg;
            return (
              <article
                key={request.id}
                className="group rounded-2xl border border-line bg-white p-5 transition-all hover:border-sage/70 hover:shadow-soft"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <CategoryIcon category={request.category} size="lg" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <RequestStatusBadge status={request.status} />
                        <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                          {request.reference}
                        </span>
                        {best ? (
                          <Badge variant={best.confidence === "strong" ? "strong" : "review"}>
                            <Sparkles className="size-3" /> {t(`Migliore affinità ${best.score}`)}
                          </Badge>
                        ) : null}
                      </div>
                      <h2 className="mt-2 text-[17px] leading-tight">{t(request.title)}</h2>
                      <p className="mt-1 max-w-[560px] line-clamp-2 text-[11.5px] leading-relaxed text-muted">
                        {t(request.description)}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" /> {location?.city} {t(`· ${request.radiusKm} km di raggio`)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />{" "}
                          {t(`Consegna ${formatDate(request.neededBy, { withYear: false })}`)}
                        </span>
                        <span className="capitalize">{request.frequency === "weekly" ? t("Settimanale") : request.frequency === "monthly" ? t("Mensile") : request.frequency === "quarterly" ? t("Trimestrale") : t("Una tantum")}</span>
                        <span>{t(CATEGORY_MAP[request.category].label)}</span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {request.acceptableComposition.map((c) => (
                          <span
                            key={c}
                            className="rounded border border-line bg-paper/60 px-1.5 py-0.5 text-[11.5px] text-muted"
                          >
                            {t(c)}
                          </span>
                        ))}
                        {request.requiredProcessing.map((p) => (
                          <span
                            key={p}
                            className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[11.5px] text-moss"
                          >
                            {t(PROCESSING_MAP[p].label)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid shrink-0 grid-cols-3 gap-4 rounded-xl bg-paper/60 px-4 py-3 lg:grid-cols-1 lg:gap-2.5 lg:px-4 lg:py-3">
                    <div>
                      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{t("Volume")}</p>
                      <p className="mt-0.5 font-mono text-[12px]">{formatKg(request.quantityKg)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{t("Budget massimo")}</p>
                      <p className="mt-0.5 font-mono text-[12px]">{formatCurrency(request.maxBudget)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{t("Budget / kg")}</p>
                      <p className="mt-0.5 font-mono text-[12px]">{formatPerKg(budgetPerKg)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
                  <p className="text-[12px] text-muted">
                    {requestMatches.length} {requestMatches.length === 1 ? t("abbinamento attivo") : t("abbinamenti attivi")}
                    {requestMatches.length > 0
                      ? t(` · ${requestMatches.filter((m) => m.confidence === "strong").length} solidi`)
                      : t(" · motore ancora in analisi")}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/app/matches">
                        <Target className="size-3.5" /> {t("Vedi abbinamenti")}
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/app/requests/new">
                        <Plus className="size-3.5" /> {t("Nuova richiesta")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={requests.length === 0 ? t("Nessuna richiesta") : t("Nessuna richiesta in questo stato")}
          description={
            requests.length === 0
              ? t("Definisci il materiale necessario, le condizioni accettate e il budget consegnato. Il motore valuterà ogni annuncio.")
              : t("Prova un altro filtro di stato o pubblica una nuova richiesta.")
          }
          action={
            <Button size="sm" asChild>
              <Link href="/app/requests/new">
                <Plus className="size-3.5" /> {t("Pubblica una richiesta")}
              </Link>
            </Button>
          }
        />
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium">{t("Cerchi una qualità che non trovi?")}</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {t("Aggiungi alternative accettabili alla composizione: aumenta in modo significativo gli abbinamenti qualificati.")}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/matches">
            {t("Apri feed abbinamenti")} <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
