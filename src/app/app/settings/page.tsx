"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  CircleAlert,
  Database,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CITIES, COUNTRIES, ORG_TYPES } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import { useCurrentOrg, useCurrentUser, useOrgListings, useOrgLocations } from "@/lib/hooks";
import { formatCurrency, formatKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { MemberRole, OrgType } from "@/types";

const TABS = [
  { value: "company", label: "Azienda", icon: Building2 },
  { value: "sites", label: "Sedi", icon: MapPin },
  { value: "team", label: "Team", icon: Users },
  { value: "data", label: "Data & demo", icon: Database },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function SettingsPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const org = useCurrentOrg();
  const locations = useOrgLocations();
  const listings = useOrgListings();
  const memberships = useAppStore((s) => s.memberships);
  const quotes = useAppStore((s) => s.quotes);
  const orders = useAppStore((s) => s.orders);
  const requests = useAppStore((s) => s.requests);
  const matches = useAppStore((s) => s.matches);

  const updateOrganization = useAppStore((s) => s.updateOrganization);
  const addLocation = useAppStore((s) => s.addLocation);
  const inviteMember = useAppStore((s) => s.inviteMember);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const signOut = useAppStore((s) => s.signOut);

  const [tab, setTab] = useState<TabValue>("company");

  const [name, setName] = useState(org?.name ?? "");
  const [vatNumber, setVatNumber] = useState(org?.vatNumber ?? "");
  const [website, setWebsite] = useState(org?.website ?? "");
  const [description, setDescription] = useState(org?.description ?? "");
  const [type, setType] = useState<OrgType>(org?.type ?? "buyer");
  const [savingCompany, setSavingCompany] = useState(false);

  const [newSite, setNewSite] = useState({
    name: "",
    addressLine: "",
    city: CITIES[0].city,
    postalCode: CITIES[0].postalCode,
    country: "IT",
  });
  const [addingSite, setAddingSite] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("admin");
  const [inviting, setInviting] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setVatNumber(org.vatNumber);
    setWebsite(org.website ?? "");
    setDescription(org.description ?? "");
    setType(org.type);
  }, [org?.id]);

  if (!org || !user) return null;

  const orgMembers = memberships.filter((m) => m.orgId === org.id);
  const orgOrders = orders.filter((o) => o.buyerOrgId === org.id || o.supplierOrgId === org.id);
  const orgRequests = requests.filter((r) => r.orgId === org.id);
  const orgMatches = matches.filter(
    (m) =>
      orgRequests.some((r) => r.id === m.requestId) ||
      listings.some((l) => l.id === m.listingId),
  );
  const gmv = orgOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => {
      const quote = quotes.find((q) => q.id === o.quoteId);
      return sum + (quote?.breakdown.total ?? 0);
    }, 0);
  const volume = orgOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.quantityKg, 0);

  function saveCompany() {
    if (name.trim().length < 2) {
      toast.error("Inserisci la ragione sociale.");
      return;
    }
    setSavingCompany(true);
    try {
      updateOrganization({
        name: name.trim(),
        vatNumber: vatNumber.trim().toUpperCase(),
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        type,
      });
      toast.success("Dati aziendali salvati");
    } finally {
      setSavingCompany(false);
    }
  }

  function handleAddSite() {
    if (newSite.name.trim().length < 2 || newSite.addressLine.trim().length < 3) {
      toast.error("Inserisci nome e indirizzo della sede.");
      return;
    }
    setAddingSite(true);
    try {
      addLocation({
        name: newSite.name.trim(),
        addressLine: newSite.addressLine.trim(),
        city: newSite.city,
        postalCode: newSite.postalCode,
        country: newSite.country,
      });
      toast.success("Sede aggiunta", { description: `${newSite.name} · ${newSite.city}` });
      setNewSite({
        name: "",
        addressLine: "",
        city: CITIES[0].city,
        postalCode: CITIES[0].postalCode,
        country: "IT",
      });
    } finally {
      setAddingSite(false);
    }
  }

  function handleInvite() {
    if (!inviteEmail.includes("@")) {
      toast.error("Inserisci un indirizzo email aziendale valido.");
      return;
    }
    setInviting(true);
    try {
      inviteMember({ email: inviteEmail, role: inviteRole });
      toast.success("Invito inviato", { description: inviteEmail });
      setInviteEmail("");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Impostazioni spazio di lavoro"
        title="Organizzazione e accesso."
        description="Dati legali, sedi operative, ruoli del team e dati demo. Le modifiche si applicano subito ad abbinamenti e prezzi consegnati."
        actions={
          <Badge variant={org.verified ? "success" : "muted"}>
            {org.verified ? <BadgeCheck className="size-3" /> : null}
            {org.verified ? "Partita IVA verificata" : "Verifica in attesa"}
          </Badge>
        }
      />

      <div className="flex flex-wrap gap-1">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              onClick={() => setTab(item.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] transition-colors",
                tab === item.value
                  ? "border-forest bg-forest text-paper"
                  : "border-line bg-white/60 text-muted hover:border-sage hover:text-ink",
              )}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "company" ? (
        <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Entità giuridica</p>
                <p className="mt-1 text-[12px] text-muted">
                  Mostrato su preventivi, contratti e certificati QC.
                </p>
              </div>
              <Badge variant="outline">ID {org.id.slice(-6).toUpperCase()}</Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label">Ragione sociale</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <label className="field-label">Partita IVA</label>
                <Input
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="mt-1.5 font-mono"
                />
              </div>
              <div>
                <label className="field-label">Ruolo di mercato</label>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as OrgType)}
                  className="mt-1.5"
                >
                  {ORG_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.hint}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="field-label">
                  Sito web <span className="font-normal text-muted">(facoltativo)</span>
                </label>
                <div className="relative mt-1.5">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="company.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Paese</label>
                <Input
                  value={COUNTRIES.find((c) => c.code === org.country)?.label ?? org.country}
                  readOnly
                  disabled
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">
                  Cosa fai <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Convertitori, brand owner e riciclatori lo usano per valutare la compatibilità prima del preventivo."
                  className="mt-1.5 flex w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink shadow-sm outline-none transition-colors placeholder:text-muted/70 focus-visible:border-sage focus-visible:ring-2 focus-visible:ring-moss/20"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <p className="text-[11.5px] text-muted">
                Le modifiche alla partita IVA richiedono una nuova verifica da parte del team Offcut.
              </p>
              <Button size="sm" onClick={saveCompany} disabled={savingCompany}>
                {savingCompany ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Salva modifiche
              </Button>
            </div>
          </section>

          <div className="space-y-3">
            <section className="rounded-2xl border border-line bg-white p-5">
              <p className="eyebrow">Dimensione spazio di lavoro</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { label: "Annunci", value: String(listings.length) },
                  { label: "Richieste", value: String(orgRequests.length) },
                  { label: "Abbinamenti AI", value: String(orgMatches.length) },
                  { label: "Ordini", value: String(orgOrders.length) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-paper/60 px-3 py-2.5">
                    <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                      {item.label}
                    </p>
                    <p className="mt-1 font-display text-[20px] leading-none">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-muted">GMV completato</span>
                  <span className="font-mono">{formatCurrency(gmv, { cents: true })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Materiale circolato</span>
                  <span className="font-mono">{formatKg(volume)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Membro dal</span>
                  <span className="font-mono">{formatDate(org.createdAt)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5">
              <p className="eyebrow flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-moss" /> Verification
              </p>
              <ul className="mt-3 space-y-2.5 text-[12px]">
                {[
                  { label: "Formato partita IVA", done: true },
                  { label: "Sede legale", done: locations.length > 0 },
                  { label: "Contatto principale", done: Boolean(user.email) },
                  { label: "Revisione KYC manuale", done: org.verified },
                ].map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted">
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded-full",
                          item.done ? "bg-mist text-moss" : "bg-sand text-muted",
                        )}
                      >
                        {item.done ? <Check className="size-2.5" strokeWidth={3} /> : <CircleAlert className="size-2.5" />}
                      </span>
                      {item.label}
                    </span>
                    <span className={cn("font-mono text-[12px] uppercase", item.done ? "text-moss" : "text-muted")}>
                      {item.done ? "Fatto" : "In attesa"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      ) : null}

      {tab === "sites" ? (
        <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <p className="eyebrow">Sedi operative</p>
            <p className="mt-1 text-[12px] text-muted">
              Distanze, linee di trasporto e prezzi consegnati sono calcolati da queste sedi.
            </p>
            <div className="mt-4 space-y-2.5">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-paper text-muted">
                      <MapPin className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[12px] font-medium">
                        {loc.name}
                        {loc.isPrimary ? <Badge variant="lime">Principale</Badge> : null}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {loc.addressLine}, {loc.postalCode} {loc.city} · {loc.country}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[12px] text-muted">
                    {formatNumber(loc.lat, 3)}, {formatNumber(loc.lng, 3)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <p className="eyebrow flex items-center gap-1.5">
              <Plus className="size-3 text-muted" /> Aggiungi una sede
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="field-label">Nome sede</label>
                <Input
                  value={newSite.name}
                  onChange={(e) => setNewSite((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Stabilimento Milano"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="field-label">Indirizzo</label>
                <Input
                  value={newSite.addressLine}
                  onChange={(e) => setNewSite((prev) => ({ ...prev, addressLine: e.target.value }))}
                  placeholder="Via Savona 42"
                  className="mt-1.5"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">Città</label>
                  <Select
                    value={newSite.city}
                    onChange={(e) => {
                      const city = CITIES.find((c) => c.city === e.target.value);
                      setNewSite((prev) => ({
                        ...prev,
                        city: e.target.value,
                        postalCode: city?.postalCode ?? prev.postalCode,
                        country: city?.country ?? prev.country,
                      }));
                    }}
                    className="mt-1.5"
                  >
                    {CITIES.map((c) => (
                      <option key={c.city} value={c.city}>
                        {c.city}, {c.country}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="field-label">CAP</label>
                  <Input
                    value={newSite.postalCode}
                    onChange={(e) => setNewSite((prev) => ({ ...prev, postalCode: e.target.value }))}
                    className="mt-1.5 font-mono"
                  />
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={handleAddSite} disabled={addingSite}>
                {addingSite ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                Aggiungi sede
              </Button>
              <p className="text-[11.5px] leading-relaxed text-muted">
                Le coordinate provengono dalla tabella integrata delle città di lancio. Le nuove sedi non vengono mai impostate come principali automaticamente.
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "team" ? (
        <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
          <section className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line/80 px-5 py-4">
              <div>
                <p className="eyebrow">Membri e ruoli</p>
                <p className="mt-1 text-[12px] text-muted">
                  Proprietari e amministratori possono gestire annunci, richieste, preventivi e impostazioni.
                </p>
              </div>
              <Badge variant="muted">{orgMembers.length}</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead className="hidden sm:table-cell">Stato</TableHead>
                  <TableHead className="hidden md:table-cell">Iscritto dal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={member.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium">{member.fullName}</p>
                          <p className="truncate text-[11.5px] text-muted">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === "owner" ? "strong" : "outline"}>
                        {member.role === "owner" ? "Proprietario" : member.role === "admin" ? "Amministratore" : "Membro"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[12px]",
                          member.status === "active" ? "text-moss" : "text-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            member.status === "active" ? "bg-moss" : "bg-line",
                          )}
                        />
                        {member.status === "active" ? "Attivo" : "Invitato"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-[12px] text-muted">
                      {formatDate(member.joinedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <p className="eyebrow flex items-center gap-1.5">
              <UserPlus className="size-3 text-muted" /> Invita un collega
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="field-label">Email aziendale</label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Ruolo</label>
                <Select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="mt-1.5"
                >
                  <option value="admin">Amministratore — gestisce tutto</option>
                  <option value="member">Membro — crea e visualizza</option>
                </Select>
              </div>
              <Button size="sm" className="w-full" onClick={handleInvite} disabled={inviting}>
                {inviting ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
                Send invitation
              </Button>
              <p className="text-[11.5px] leading-relaxed text-muted">
                In questa versione MVP gli inviti vengono registrati localmente. Con Supabase configurato, l'invito via email viene inviato dal tuo progetto.
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "data" ? (
        <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow flex items-center gap-1.5">
                    <Database className="size-3 text-muted" /> Livello dati
                  </p>
                  <p className="mt-1.5 text-[12px] font-medium">
                    {isSupabaseConfigured ? "Supabase connesso" : "Persistenza demo locale"}
                  </p>
                  <p className="mt-1 max-w-[520px] text-[12px] leading-relaxed text-muted">
                    {isSupabaseConfigured
                      ? "L'autenticazione passa da Supabase. In questa versione MVP i dati di dominio usano ancora l'archivio locale, inizializzato con dati di mercato italiani."
                      : "Lo stato è salvato in questo browser tramite localStorage. Le variabili Supabase spostano l'autenticazione su Supabase e attivano lo schema SQL in supabase/migrations."}
                  </p>
                </div>
                <Badge variant={isSupabaseConfigured ? "success" : "muted"}>
                  {isSupabaseConfigured ? "Configurato" : "Demo"}
                </Badge>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ["Organizzazioni", String(1)],
                  ["Sedi", String(locations.length)],
                  ["Annunci", String(listings.length)],
                  ["Richieste", String(orgRequests.length)],
                  ["Abbinamenti", String(matches.length)],
                  ["Preventivi", String(quotes.length)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[12px]"
                  >
                    <span className="text-muted">{label}</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-paper/60 p-3 text-[11.5px] text-muted">
                <KeyRound className="size-3.5 shrink-0" />
                <p>
                  Provider di autenticazione: <span className="text-ink">{isSupabaseConfigured ? "Supabase Auth" : "Autenticazione demo locale"}</span>
                  {" · "}Accesso effettuato come <span className="text-ink">{user.email}</span>
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-danger/25 bg-danger/[0.04] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
                  <AlertTriangle className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">Reimposta lo spazio di lavoro demo</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">
                    Ripristina organizzazioni, annunci, richieste, abbinamenti, preventivi e ordini iniziali. Tutto ciò che hai creato in questo browser viene eliminato e viene effettuato il logout.
                  </p>
                  <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="mt-3">
                        <RotateCcw className="size-3.5" /> Reset demo data
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reimpostare tutto?</DialogTitle>
                        <DialogDescription>
                          Questa operazione cancella lo spazio di lavoro locale e ricarica il mercato demo iniziale. Non può essere annullata.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setResetOpen(false)}>
                          Keep my data
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            resetDemo();
                            setResetOpen(false);
                            toast.success("Reset demo", { description: "Accedi di nuovo per esplorare il mercato dimostrativo." });
                            router.replace("/login");
                          }}
                        >
                          Reimposta e esci
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-3">
            <section className="rounded-2xl border border-line bg-white p-5">
              <p className="eyebrow">Account demo</p>
              <div className="mt-3 space-y-2">
                {[
                  { label: "Acquirente", email: "elena.ricci@northwind.demo", org: "Northwind Packaging" },
                  { label: "Fornitore", email: "marco.bianchi@greenloop.demo", org: "GreenLoop Fibres" },
                ].map((account) => (
                  <div key={account.email} className="rounded-lg border border-line px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11.5px] font-medium">{account.org}</p>
                      <Badge variant="outline">{account.label}</Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-[11.5px] text-muted">{account.email}</p>
                  </div>
                ))}
                <p className="text-[11.5px] text-muted">
                  Shared password: <span className="font-mono text-ink">circular2026</span>
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5">
              <p className="eyebrow flex items-center gap-1.5">
                <Mail className="size-3 text-muted" /> Notifiche
              </p>
              <ul className="mt-3 space-y-2 text-[12px] text-muted">
                {[
                  "Preventivo inviato e accettato",
                  "Modifiche fascia di ritiro",
                  "Nuovi abbinamenti solidi",
                  "Certificato QC emesso",
                ].map((item) => (
                  <li key={item} className="flex items-center justify-between gap-2">
                    <span>{item}</span>
                    <span className="rounded-full bg-mist px-2 py-0.5 font-mono text-[12px] uppercase text-moss">
                      Attivo
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
                Le preferenze sono illustrative in questa versione MVP; la consegna avviene tramite il centro notifiche integrato.
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-white/60 p-5">
              <p className="eyebrow">Sessione</p>
              <p className="mt-2 truncate text-[12px] text-muted">{user.email}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={async () => {
                  await signOut();
                  router.replace("/login");
                }}
              >
                Esci
              </Button>
              <Link
                href="/"
                className="mt-2 flex items-center justify-center gap-1 text-[11.5px] text-muted hover:text-ink"
              >
                Torna al sito pubblico <ArrowUpRight className="size-3" />
              </Link>
            </section>
          </div>
        </div>
      ) : null}

      <p className="flex items-center justify-center gap-1.5 pb-2 text-center font-mono text-[12px] uppercase tracking-[0.14em] text-muted/60">
        <Trash2 className="size-3" /> L'eliminazione dello spazio di lavoro richiede una richiesta al supporto in questa versione MVP
      </p>
    </div>
  );
}
