"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CalendarPlus,
  Inbox as InboxIcon,
  MessageSquare,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { BookingModal, FeeBreakdown } from "@/components/app/booking-modal";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { relativeTime } from "@/lib/format";
import { useCurrentOrg, useMatchViews, useOrgOrders, usePrimaryLocation } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import {
  APPOINTMENT_HUBS,
  useAppStore,
  type Appointment,
  type AppointmentMaterial,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import type { MaterialCategory } from "@/types";

const CONTENT = {
  it: {
    eyebrow: "Inbox · connessioni e logistica",
    title: "Posta e appuntamenti.",
    description: (orgName: string, unread: number, scheduled: number) =>
      `${orgName} · ${unread} messaggi non letti · ${scheduled} appuntamenti in programma. Ritiri e consegne gestiti da Offcut, con una ripartizione economica trasparente.`,
    book: "Prenota appuntamento",
    tabConnections: "Connessioni",
    tabMessages: "Messaggi",
    tabAppointments: "Appuntamenti",
    connectionsSub: "Aziende collegate tramite abbinamenti AI e ordini. Prenota un ritiro o una consegna in un clic.",
    bookShort: "Prenota",
    score: "punteggio",
    tonsAvailable: "t scambiate",
    emptyConnectionsTitle: "Nessuna connessione",
    emptyConnectionsDesc: "Quando un abbinamento AI o un ordine collega la tua azienda a un partner, lo trovi qui pronto per la prenotazione.",
    emptyConnectionsAction: "Rivedi abbinamenti",
    emptyMessagesTitle: "Nessun messaggio",
    emptyMessagesDesc: "Le conversazioni con i partner connessi compaiono qui. Invia il primo messaggio dalla scheda di un partner.",
    conversationWith: "Conversazione con",
    back: "Torna alle conversazioni",
    you: "Tu",
    messagePlaceholder: "Scrivi un messaggio al partner…",
    messageLabel: "Messaggio",
    send: "Invia messaggio",
    sent: "Messaggio inviato",
    emptyAppointmentsTitle: "Nessun appuntamento",
    emptyAppointmentsDesc: "Prenota un ritiro o una consegna dalla scheda di un partner connesso, oppure direttamente con Offcut.",
    pickup: "Ritiro",
    dropoff: "Consegna",
    statusScheduled: "Programmato",
    statusCompleted: "Completato",
    statusCancelled: "Annullato",
    materials: { plastic: "Plastica", cardboard: "Cartone", wood: "Legno" },
    conditions: { clean: "Pulito", mixed: "Misto", contaminated: "Contaminato" },
    categories: { paper_cardboard: "Carta e cartone", wood: "Legno", plastic: "Plastica" },
    cancel: "Annulla",
    cancelConfirm: "Annullare questo appuntamento? L'operazione non può essere annullata.",
    cancelYes: "Sì, annulla",
    cancelNo: "Mantieni",
    cancelledToast: "Appuntamento annullato",
  },
  en: {
    eyebrow: "Inbox · connections and logistics",
    title: "Mail and appointments.",
    description: (orgName: string, unread: number, scheduled: number) =>
      `${orgName} · ${unread} unread messages · ${scheduled} scheduled appointments. Pick-ups and drop-offs handled by Offcut, with a transparent fee breakdown.`,
    book: "Book appointment",
    tabConnections: "Connections",
    tabMessages: "Messages",
    tabAppointments: "Appointments",
    connectionsSub: "Partners connected through AI matches and orders. Book a pick-up or drop-off in one click.",
    bookShort: "Book",
    score: "score",
    tonsAvailable: "t exchanged",
    emptyConnectionsTitle: "No connections yet",
    emptyConnectionsDesc: "When an AI match or an order links your company to a partner, it shows up here ready to book.",
    emptyConnectionsAction: "Review matches",
    emptyMessagesTitle: "No messages",
    emptyMessagesDesc: "Conversations with connected partners appear here. Send the first message from a partner card.",
    conversationWith: "Conversation with",
    back: "Back to conversations",
    you: "You",
    messagePlaceholder: "Write a message to the partner…",
    messageLabel: "Message",
    send: "Send message",
    sent: "Message sent",
    emptyAppointmentsTitle: "No appointments",
    emptyAppointmentsDesc: "Book a pick-up or drop-off from a connected partner card, or directly with Offcut.",
    pickup: "Pick-up",
    dropoff: "Drop-off",
    statusScheduled: "Scheduled",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    materials: { plastic: "Plastic", cardboard: "Cardboard", wood: "Wood" },
    conditions: { clean: "Clean", mixed: "Mixed", contaminated: "Contaminated" },
    categories: { paper_cardboard: "Paper & cardboard", wood: "Wood", plastic: "Plastic" },
    cancel: "Cancel",
    cancelConfirm: "Cancel this appointment? This cannot be undone.",
    cancelYes: "Yes, cancel",
    cancelNo: "Keep it",
    cancelledToast: "Appointment cancelled",
  },
} as const;

const CATEGORY_TO_APPOINTMENT: Record<MaterialCategory, AppointmentMaterial> = {
  paper_cardboard: "cardboard",
  wood: "wood",
  plastic: "plastic",
};

interface Connection {
  orgId: string;
  name: string;
  category: MaterialCategory | null;
  city: string | null;
  score: number | null;
  orderRef: string | null;
  tons: number | null;
}

type InboxTab = "connections" | "messages" | "appointments";

interface BookingState {
  open: boolean;
  partnerName?: string;
  defaultMaterial?: AppointmentMaterial;
  defaultTons?: number;
  defaultHub?: string;
}

function formatAppointmentDate(date: string, lang: "it" | "en"): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function InboxPage() {
  const { lang } = useI18n();
  const t = CONTENT[lang];
  const { t: tx } = useI18n();

  const org = useCurrentOrg();
  const matchViews = useMatchViews();
  const orders = useOrgOrders();
  const primaryLocation = usePrimaryLocation();
  const listings = useAppStore((s) => s.listings);
  const requests = useAppStore((s) => s.requests);
  const organizations = useAppStore((s) => s.organizations);
  const locations = useAppStore((s) => s.locations);
  const appointments = useAppStore((s) => s.appointments);
  const threads = useAppStore((s) => s.inboxThreads);
  const cancelAppointment = useAppStore((s) => s.cancelAppointment);
  const sendInboxMessage = useAppStore((s) => s.sendInboxMessage);

  const searchParams = useSearchParams();
  const threadParam = searchParams.get("thread");
  const [tab, setTab] = useState<InboxTab>(
    threadParam || searchParams.get("tab") === "messages" ? "messages" : "connections",
  );
  const [booking, setBooking] = useState<BookingState>({ open: false });
  const [activeThreadId, setActiveThreadId] = useState<string | null>(threadParam);
  const [draft, setDraft] = useState("");
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Deep link from a match/buyer suggestion into the persisted conversation.
  useEffect(() => {
    if (!threadParam) return;
    if (threads.some((thread) => thread.id === threadParam)) {
      setActiveThreadId(threadParam);
      setTab("messages");
    }
  }, [threadParam, threads]);

  const listingMap = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings]);
  const requestMap = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);
  const orgMap = useMemo(() => new Map(organizations.map((o) => [o.id, o])), [organizations]);
  const locMap = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);

  const connections = useMemo<Connection[]>(() => {
    if (!org) return [];
    const map = new Map<string, Connection>();
    for (const { match } of matchViews) {
      const listing = listingMap.get(match.listingId);
      const request = requestMap.get(match.requestId);
      const counterpartOrgId =
        request?.orgId === org.id ? listing?.orgId : request?.orgId;
      if (!counterpartOrgId || counterpartOrgId === org.id) continue;
      const counterpart = orgMap.get(counterpartOrgId);
      if (!counterpart) continue;
      const category = listing?.category ?? request?.category ?? null;
      const locationId =
        request?.orgId === org.id ? listing?.locationId : request?.locationId;
      map.set(counterpartOrgId, {
        orgId: counterpartOrgId,
        name: counterpart.name,
        category,
        city: locationId ? locMap.get(locationId)?.city ?? null : null,
        score: match.score,
        orderRef: null,
        tons: Math.round(match.quantityKg / 100) / 10,
      });
    }
    for (const order of orders) {
      if (order.status === "cancelled") continue;
      const counterpartOrgId =
        order.buyerOrgId === org.id ? order.supplierOrgId : order.buyerOrgId;
      if (!counterpartOrgId || counterpartOrgId === org.id) continue;
      const counterpart = orgMap.get(counterpartOrgId);
      if (!counterpart) continue;
      const listing = listingMap.get(order.listingId);
      const prior = map.get(counterpartOrgId);
      map.set(counterpartOrgId, {
        orgId: counterpartOrgId,
        name: counterpart.name,
        category: prior?.category ?? listing?.category ?? null,
        city: prior?.city ?? (listing ? locMap.get(listing.locationId)?.city ?? null : null),
        score: prior?.score ?? null,
        orderRef: order.reference,
        tons: prior?.tons ?? Math.round(order.quantityKg / 100) / 10,
      });
    }
    return [...map.values()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [org, matchViews, orders, listingMap, requestMap, orgMap, locMap]);

  const unreadCount = threads.reduce((sum, thread) => sum + thread.unread, 0);
  const scheduled = useMemo(
    () => appointments.filter((a) => a.status === "scheduled"),
    [appointments],
  );
  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort((a, b) => {
        const rank = (x: Appointment) => (x.status === "scheduled" ? 0 : 1);
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        return b.date.localeCompare(a.date);
      }),
    [appointments],
  );

  const activeThread =
    threads.find((thread) => thread.id === activeThreadId) ?? threads[0] ?? null;

  useEffect(() => {
    setDraft("");
  }, [activeThread?.id]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeThread?.id, activeThread?.messages.length]);

  const defaultHub =
    primaryLocation && (APPOINTMENT_HUBS as readonly string[]).includes(primaryLocation.city)
      ? primaryLocation.city
      : undefined;

  function openBooking(connection?: Connection) {
    setBooking({
      open: true,
      partnerName: connection?.name,
      defaultMaterial: connection?.category
        ? CATEGORY_TO_APPOINTMENT[connection.category]
        : undefined,
      defaultTons: connection?.tons && connection.tons > 0 ? connection.tons : undefined,
      defaultHub,
    });
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThread || !draft.trim()) return;
    sendInboxMessage(activeThread.id, draft);
    setDraft("");
  }

  function handleCancelConfirm(appointmentId: string) {
    cancelAppointment(appointmentId);
    setConfirmCancelId(null);
    toast.success(t.cancelledToast);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description(org?.name ?? "Offcut", unreadCount, scheduled.length)}
        actions={
          <Button className="h-11" onClick={() => openBooking()}>
            <CalendarPlus className="size-4" /> {t.book}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as InboxTab)}>
        <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl p-1 sm:w-auto sm:rounded-full">
          <TabsTrigger value="connections" className="min-h-[44px] px-4">
            <Users /> {t.tabConnections}
            <span className="font-mono text-[12px] tabular-nums opacity-70">
              {connections.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="min-h-[44px] px-4">
            <MessageSquare /> {t.tabMessages}
            {unreadCount > 0 ? (
              <span className="font-mono text-[12px] tabular-nums opacity-70">{unreadCount}</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="appointments" className="min-h-[44px] px-4">
            <CalendarClock /> {t.tabAppointments}
            <span className="font-mono text-[12px] tabular-nums opacity-70">
              {scheduled.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-3">
          <p className="text-[12.5px] text-muted">{t.connectionsSub}</p>
          {connections.length > 0 ? (
            <div className="grid gap-3">
              {connections.map((connection) => (
                <article
                  key={connection.orgId}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-[13.5px] font-medium text-ink">
                      {connection.name}
                    </h3>
                    <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
                      {connection.category ? t.categories[connection.category] : "—"}
                      {connection.city ? ` · ${connection.city}` : ""}
                      {connection.score !== null ? ` · ${t.score} ${connection.score}` : ""}
                      {connection.orderRef ? ` · ${connection.orderRef}` : ""}
                    </p>
                    {connection.tons !== null ? (
                      <p className="mt-1 text-[12px] text-muted">
                        <span className="font-mono tabular-nums">{connection.tons}</span>{" "}
                        {t.tonsAvailable}
                      </p>
                    ) : null}
                  </div>
                  <Button className="h-11 shrink-0" onClick={() => openBooking(connection)}>
                    <CalendarPlus className="size-4" /> {t.bookShort}
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={t.emptyConnectionsTitle}
              description={t.emptyConnectionsDesc}
              action={
                <Button className="h-11" asChild>
                  <Link href="/app/matches">
                    <Sparkles className="size-4" /> {t.emptyConnectionsAction}
                  </Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="messages">
          {threads.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
              <div
                className={cn(
                  "space-y-2",
                  activeThreadId !== null ? "hidden md:block" : "block",
                )}
                role="list"
                aria-label={t.tabMessages}
              >
                {threads.map((thread) => {
                  const last = thread.messages[thread.messages.length - 1];
                  const selected = activeThread?.id === thread.id;
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      role="listitem"
                      onClick={() => setActiveThreadId(thread.id)}
                      className={cn(
                        "block w-full min-h-[44px] rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/40",
                        selected
                          ? "border-forest bg-mist"
                          : "border-line bg-white hover:bg-sand/60",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-[12.5px] font-medium text-ink">
                          {thread.partnerName}
                        </span>
                        {thread.unread > 0 ? (
                          <Badge variant="default" className="shrink-0 font-mono tabular-nums">
                            {thread.unread}
                          </Badge>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-muted">
                        {thread.subject}
                      </span>
                      {last ? (
                        <span className="mt-1 flex items-baseline justify-between gap-2">
                          <span className="min-w-0 truncate text-[11.5px] text-muted/80">
                            {tx(last.body)}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-muted/70">
                            {tx(relativeTime(last.at))}
                          </span>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div
                className={cn(
                  "rounded-2xl border border-line bg-white shadow-soft",
                  activeThreadId !== null ? "block" : "hidden md:block",
                )}
              >
                {activeThread ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                      <Button
                        variant="ghost"
                        className="h-11 w-11 shrink-0 md:hidden"
                        onClick={() => setActiveThreadId(null)}
                        aria-label={t.back}
                      >
                        <ArrowLeft className="size-4" />
                      </Button>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {activeThread.partnerName}
                        </p>
                        <p className="truncate font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
                          {activeThread.subject}
                        </p>
                      </div>
                    </div>
                    <div
                      ref={messagesRef}
                      role="log"
                      aria-live="polite"
                      aria-label={`${t.conversationWith} ${activeThread.partnerName}`}
                      className="max-h-[380px] space-y-3 overflow-y-auto px-4 py-4"
                    >
                      {activeThread.messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            message.from === "me" ? "justify-end" : "justify-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl border border-line px-3.5 py-2.5",
                              message.from === "me" ? "bg-sand" : "bg-mist",
                            )}
                          >
                            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                              {message.from === "me" ? t.you : activeThread.partnerName} ·{" "}
                              {tx(relativeTime(message.at))}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-ink">
                              {tx(message.body)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form
                      onSubmit={handleSend}
                      className="flex items-center gap-2 border-t border-line px-4 py-3"
                    >
                      <Label htmlFor="inbox-message" className="sr-only">
                        {t.messageLabel}
                      </Label>
                      <Input
                        id="inbox-message"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={t.messagePlaceholder}
                        className="h-11 min-w-0 flex-1"
                        autoComplete="off"
                      />
                      <Button
                        type="submit"
                        className="h-11 w-11 shrink-0"
                        disabled={!draft.trim()}
                        aria-label={t.send}
                      >
                        <Send className="size-4" />
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="p-6">
                    <EmptyState
                      icon={MessageSquare}
                      title={t.emptyMessagesTitle}
                      description={t.emptyMessagesDesc}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title={t.emptyMessagesTitle}
              description={t.emptyMessagesDesc}
            />
          )}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-3">
          {sortedAppointments.length > 0 ? (
            <div className="grid gap-3">
              {sortedAppointments.map((appointment) => {
                const statusBadge =
                  appointment.status === "scheduled" ? (
                    <Badge variant="review">{t.statusScheduled}</Badge>
                  ) : appointment.status === "completed" ? (
                    <Badge variant="success">{t.statusCompleted}</Badge>
                  ) : (
                    <Badge variant="danger">{t.statusCancelled}</Badge>
                  );
                return (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-line bg-white p-4 shadow-soft"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-[13.5px] font-medium text-ink">
                          {appointment.type === "pickup" ? t.pickup : t.dropoff} ·{" "}
                          {appointment.partnerName}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {statusBadge}
                          <Badge variant="muted" className="font-mono tabular-nums">
                            {appointment.tons} t · {t.materials[appointment.material]}
                          </Badge>
                          <Badge variant="outline">
                            {t.conditions[appointment.condition]}
                          </Badge>
                        </div>
                        <p className="mt-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
                          {formatAppointmentDate(appointment.date, lang)} · {appointment.time} ·{" "}
                          {appointment.hub}
                        </p>
                      </div>
                      {appointment.status === "scheduled" ? (
                        <Button
                          variant="destructive"
                          className="h-11 shrink-0"
                          onClick={() => setConfirmCancelId(appointment.id)}
                        >
                          {t.cancel}
                        </Button>
                      ) : null}
                    </div>

                    <div aria-live="polite">
                      {confirmCancelId === appointment.id ? (
                        <div className="mt-3 rounded-2xl border border-danger/30 bg-danger/10 p-3.5">
                          <p className="text-[12.5px] text-ink">{t.cancelConfirm}</p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <Button
                              variant="destructive"
                              className="h-11"
                              onClick={() => handleCancelConfirm(appointment.id)}
                            >
                              {t.cancelYes}
                            </Button>
                            <Button
                              variant="outline"
                              className="h-11"
                              onClick={() => setConfirmCancelId(null)}
                            >
                              {t.cancelNo}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <FeeBreakdown
                      finance={appointment.finance}
                      condition={appointment.condition}
                      className="mt-3"
                    />
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={InboxIcon}
              title={t.emptyAppointmentsTitle}
              description={t.emptyAppointmentsDesc}
              action={
                <Button className="h-11" onClick={() => openBooking()}>
                  <CalendarPlus className="size-4" /> {t.book}
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>

      <BookingModal
        open={booking.open}
        onOpenChange={(open) => setBooking((b) => ({ ...b, open }))}
        partnerName={booking.partnerName}
        defaultMaterial={booking.defaultMaterial}
        defaultTons={booking.defaultTons}
        defaultHub={booking.defaultHub}
      />
    </div>
  );
}
