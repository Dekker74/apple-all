"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CATEGORY_COPY, CONDITION_COPY, FREQUENCY_COPY, PROCESSING_COPY } from "@/components/forms/form-copy";
import { formatLocalDate } from "@/components/forms/local-format";
import { StatusPill } from "@/components/forms/status-pill";
import { useLocalCopy } from "@/components/forms/use-local-copy";
import { useCurrentOrg, useOrgRequests } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types";

const COPY = {
  it: {
    eyebrow: "Domanda · i miei requisiti",
    title: "Le mie richieste",
    description: (orgName: string) =>
      `${orgName} · specifica una volta, riutilizza quando serve. Le richieste restano aperte mentre il motore cerca nuova offerta secondo le condizioni accettate.`,
    newRequest: "Nuova richiesta",
    stats: {
      open: "Richieste aperte",
      volume: "Volume richiesto",
      matches: "Abbinamenti",
      strong: "Candidati solidi",
      cardVolume: "Volume",
      cardBudget: "Budget massimo",
      cardBudgetKg: "Budget / kg",
    },
    tabs: {
      all: "Tutte",
      open: "Aperte",
      matched: "Abbinate",
      fulfilled: "Evase",
      closed: "Chiuse",
    },
    best: (score: number) => `Migliore affinità ${score}`,
    delivery: (date: string) => `Consegna ${date}`,
    radius: (km: number) => `${km} km di raggio`,
    activeMatches: (count: number) =>
      `${count} ${count === 1 ? "abbinamento attivo" : "abbinamenti attivi"}`,
    strongCount: (count: number) => `${count} solidi`,
    analyzing: "motore ancora in analisi",
    viewMatches: "Vedi abbinamenti",
    empty: {
      title: "Nessuna richiesta",
      description:
        "Definisci il materiale necessario, le condizioni accettate e il budget consegnato. Il motore valuterà ogni annuncio.",
      filteredTitle: "Nessuna richiesta in questo stato",
      filteredDescription: "Prova un altro filtro di stato o pubblica una nuova richiesta.",
      action: "Pubblica una richiesta",
      reset: "Mostra tutte",
    },
    tipTitle: "Cerchi una qualità che non trovi?",
    tipDescription:
      "Aggiungi alternative accettabili alla composizione: aumenta in modo significativo gli abbinamenti qualificati.",
    openMatches: "Apri feed abbinamenti",
  },
  en: {
    eyebrow: "Demand · my requirements",
    title: "My requests",
    description: (orgName: string) =>
      `${orgName} · define once, reuse whenever needed. Requests stay open while the engine looks for new supply matching your accepted conditions.`,
    newRequest: "New request",
    stats: {
      open: "Open requests",
      volume: "Requested volume",
      matches: "Matches",
      strong: "Strong candidates",
      cardVolume: "Volume",
      cardBudget: "Maximum budget",
      cardBudgetKg: "Budget / kg",
    },
    tabs: {
      all: "All",
      open: "Open",
      matched: "Matched",
      fulfilled: "Fulfilled",
      closed: "Closed",
    },
    best: (score: number) => `Best affinity ${score}`,
    delivery: (date: string) => `Delivery ${date}`,
    radius: (km: number) => `${km} km radius`,
    activeMatches: (count: number) =>
      `${count} active ${count === 1 ? "match" : "matches"}`,
    strongCount: (count: number) => `${count} strong`,
    analyzing: "engine still analysing",
    viewMatches: "View matches",
    empty: {
      title: "No requests yet",
      description:
        "Define the material you need, acceptable conditions and the delivered budget. The engine will assess every listing.",
      filteredTitle: "No request in this status",
      filteredDescription: "Try another status filter or post a new request.",
      action: "Post a request",
      reset: "Show all",
    },
    tipTitle: "Looking for a grade you cannot find?",
    tipDescription:
      "Add acceptable alternatives to the composition: it significantly increases qualified matches.",
    openMatches: "Open match feed",
  },
} as const;

const TABS: { value: "all" | RequestStatus; key: keyof (typeof COPY.it)["tabs"] }[] = [
  { value: "all", key: "all" },
  { value: "open", key: "open" },
  { value: "matched", key: "matched" },
  { value: "fulfilled", key: "fulfilled" },
  { value: "closed", key: "closed" },
];

export default function RequestsPage() {
  const s = useLocalCopy(COPY);
  const { lang } = useI18n();
  const categoryCopy = useLocalCopy(CATEGORY_COPY);
  const conditionCopy = useLocalCopy(CONDITION_COPY);
  const org = useCurrentOrg();
  const requests = useOrgRequests();
  const matches = useAppStore((state) => state.matches);
  const locations = useAppStore((state) => state.locations);
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("all");

  const filtered = useMemo(
    () => (tab === "all" ? requests : requests.filter((request) => request.status === tab)),
    [requests, tab],
  );

  const open = requests.filter((request) => request.status === "open" || request.status === "matched");
  const volume = open.reduce((sum, request) => sum + request.quantityKg, 0);
  const matchCount = matches.filter(
    (match) => requests.some((request) => request.id === match.requestId) && match.status !== "dismissed",
  ).length;
  const strongCount = matches.filter(
    (match) =>
      requests.some((request) => request.id === match.requestId) &&
      match.status !== "dismissed" &&
      match.confidence === "strong",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={s.eyebrow}
        title={s.title}
        description={s.description(org?.name ?? (lang === "it" ? "La tua organizzazione" : "Your organisation"))}
        actions={
          <Button size="lg" asChild>
            <Link href="/app/requests/new">
              <Plus className="size-4" /> {s.newRequest}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {[
          { label: s.stats.open, value: String(open.length) },
          { label: s.stats.volume, value: formatKg(volume) },
          { label: s.stats.matches, value: String(matchCount) },
          { label: s.stats.strong, value: String(strongCount) },
        ].map((stat) => (
          <div key={stat.label} className="min-w-0 bg-white px-4 py-3.5">
            <p className="font-mono text-[11.5px] uppercase tracking-[0.13em] text-muted">
              {stat.label}
            </p>
            <p className="mt-1.5 font-display text-[24px] leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex w-full gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => {
          const count =
            item.value === "all"
              ? requests.length
              : requests.filter((request) => request.status === item.value).length;
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

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((request) => {
            const requestMatches = matches.filter(
              (match) => match.requestId === request.id && match.status !== "dismissed",
            );
            const best = [...requestMatches].sort((a, b) => b.score - a.score)[0];
            const location = locations.find((item) => item.id === request.locationId);
            const budgetPerKg = request.quantityKg > 0 ? request.maxBudget / request.quantityKg : 0;
            return (
              <article
                key={request.id}
                className="rounded-2xl border border-line bg-white p-5 transition-colors hover:border-sage/70 motion-reduce:transition-none"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <CategoryIcon category={request.category} size="lg" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill kind="request" status={request.status} />
                        <span className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                          {request.reference}
                        </span>
                        {best ? (
                          <Badge variant={best.confidence === "strong" ? "strong" : "review"}>
                            <Sparkles className="size-3" /> {s.best(best.score)}
                          </Badge>
                        ) : null}
                      </div>
                      <h2 className="mt-2 text-[17px] leading-tight">{request.title}</h2>
                      <p className="mt-1 max-w-[620px] line-clamp-2 text-[11.5px] leading-relaxed text-muted">
                        {request.description}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" /> {location?.city ?? "—"}{" "}
                          {s.radius(request.radiusKm)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {s.delivery(formatLocalDate(request.neededBy, lang))}
                        </span>
                        <span>
                          {FREQUENCY_COPY[request.frequency]?.[lang] ?? request.frequency}
                        </span>
                        <span>{categoryCopy[request.category]?.label ?? request.category}</span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {request.acceptableComposition.map((item) => (
                          <span
                            key={item}
                            className="rounded border border-line bg-paper/60 px-1.5 py-0.5 text-[11.5px] text-muted"
                          >
                            {item}
                          </span>
                        ))}
                        {(request.acceptedConditions ?? []).map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-line bg-mist/40 px-1.5 py-0.5 text-[11.5px] text-moss"
                          >
                            {conditionCopy[item]?.label ?? item}
                          </span>
                        ))}
                        {request.requiredProcessing.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[11.5px] text-moss"
                          >
                            {PROCESSING_COPY[item]?.[lang] ?? item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid shrink-0 grid-cols-3 gap-4 rounded-xl bg-paper/60 px-4 py-3 lg:grid-cols-1 lg:gap-2.5">
                    <div className="min-w-0">
                      <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                        {s.stats.cardVolume}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[12px]">
                        {formatKg(request.quantityKg)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                        {s.stats.cardBudget}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[12px]">
                        {formatCurrency(request.maxBudget)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                        {s.stats.cardBudgetKg}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[12px]">
                        {formatPerKg(budgetPerKg)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
                  <p className="text-[12px] text-muted">
                    {s.activeMatches(requestMatches.length)}
                    {requestMatches.length > 0
                      ? ` · ${s.strongCount(requestMatches.filter((match) => match.confidence === "strong").length)}`
                      : ` · ${s.analyzing}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="lg" asChild>
                      <Link href="/app/matches">
                        <Target className="size-4" /> {s.viewMatches}
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <Link href="/app/requests/new">
                        <Plus className="size-4" /> {s.newRequest}
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
          title={requests.length === 0 ? s.empty.title : s.empty.filteredTitle}
          description={requests.length === 0 ? s.empty.description : s.empty.filteredDescription}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="lg" asChild>
                <Link href="/app/requests/new">
                  <Plus className="size-4" /> {s.empty.action}
                </Link>
              </Button>
              {requests.length > 0 ? (
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
          <Link href="/app/matches">
            {s.openMatches} <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
