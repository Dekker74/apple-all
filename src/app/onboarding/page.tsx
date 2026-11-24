"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleCheck,
  Loader2,
  Mail,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { OffcutShell } from "@/components/offcut/shell";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { CITIES, COUNTRIES } from "@/lib/constants";
import { useCurrentUser, useHydrated } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@/types";

const STEPS = [
  { title: "Tipo di account", sub: "Chi si sta registrando" },
  { title: "Azienda e sedi", sub: "Legale e operativo" },
];

interface Invite {
  email: string;
  role: MemberRole;
}

export default function OnboardingPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const authChecked = useAppStore((s) => s.authChecked);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const signOut = useAppStore((s) => s.signOut);
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [accountRole, setAccountRole] = useState<"business" | "individual">("business");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("IT");
  const [vatNumber, setVatNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("Bologna");
  const [postalCode, setPostalCode] = useState("40121");
  const [invites, setInvites] = useState<Invite[]>([{ email: "", role: "admin" }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hydrated || !authChecked) return;
    if (!user) router.replace("/login");
    else if (user.onboarded) router.replace("/app/dashboard");
  }, [hydrated, authChecked, user, router]);

  const countryCities = useMemo(
    () => CITIES.filter((c) => c.country === country),
    [country],
  );

  useEffect(() => {
    if (countryCities.length > 0 && !countryCities.some((c) => c.city === city)) {
      setCity(countryCities[0].city);
      setPostalCode(countryCities[0].postalCode);
    }
  }, [countryCities, city]);

  if (!hydrated || !authChecked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="size-5 animate-spin text-muted" />
      </div>
    );
  }

  function next() {
    setError(null);
    if (step === 0) {
      if (accountRole === "individual") {
        setError("Gli account individuali sono previsti nella Fase 2. Scegli Azienda per continuare.");
        return;
      }
      setStep(1);
    }
  }

  function submit() {
    setError(null);
    if (companyName.trim().length < 2) {
      setError("Inserisci la ragione sociale.");
      return;
    }
    if (vatNumber.trim().length < 6) {
      setError("Inserisci una partita IVA valida (incluso il prefisso paese).");
      return;
    }
    if (addressLine.trim().length < 3) {
      setError("Inserisci l'indirizzo della sede principale.");
      return;
    }
    setSaving(true);
    try {
      completeOnboarding({
        accountRole,
        orgType: "both",
        companyName,
        vatNumber,
        country,
        website,
        addressLine,
        city,
        postalCode,
        invites: invites.filter((i) => i.email.trim().length > 0),
      });
      toast.success("Spazio di lavoro creato", { description: "Il tuo mercato è ora attivo." });
      router.replace("/app/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile creare lo spazio di lavoro.");
      setSaving(false);
    }
  }

  const vatPrefix = COUNTRIES.find((c) => c.code === country)?.vatPrefix ?? "IT";

  return (
    <OffcutShell>
      <main className="offcut-grid2">
        <aside>
          <p className="eyebrow">Configurazione</p>
          <h1 className="mt-2 text-[30px] leading-tight">Configura il tuo spazio di lavoro</h1>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            Due passaggi. Potrai invitare il tuo team in seguito.
          </p>
          <ol className="mt-8 space-y-1">
            {STEPS.map((s, index) => {
              const done = index < step;
              const active = index === step;
              return (
                <li key={s.title}>
                  <button
                    onClick={() => index < step && setStep(index)}
                    disabled={index > step}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                      active ? "bg-white shadow-sm" : "hover:bg-white/50",
                      index > step && "opacity-45",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[12px]",
                        done
                          ? "border-forest bg-forest text-lime"
                          : active
                            ? "border-forest text-forest"
                            : "border-line text-muted",
                      )}
                    >
                      {done ? <Check className="size-3" strokeWidth={3} /> : index + 1}
                    </span>
                    <span>
                      <span className={cn("block text-[12px]", active ? "font-medium text-ink" : "text-muted")}>
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-muted/80">{s.sub}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-8 rounded-xl border border-line bg-white/50 p-3.5">
            <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
              <Sparkles className="size-3 text-moss" /> Cosa succede ora
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Forniamo lo spazio di lavoro con offerta e domanda di mercato attive. I primi abbinamenti AI
              compaiono subito dopo la configurazione.
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">
                Passo {step + 1} di {STEPS.length}
              </span>
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={cn("h-1 w-8 rounded-full", i <= step ? "bg-forest" : "bg-line")}
                  />
                ))}
              </div>
            </div>

            {step === 0 ? (
              <div className="mt-6">
                <h2 className="text-[30px] leading-tight">Come vuoi registrarti?</h2>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  Gli account aziendali possono operare, invitare amministratori e gestire più sedi.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setAccountRole("business")}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      accountRole === "business"
                        ? "border-forest bg-mist/40 ring-1 ring-forest"
                        : "border-line hover:border-sage",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-forest text-lime">
                        <Building2 className="size-4" />
                      </span>
                      {accountRole === "business" ? (
                        <CircleCheck className="size-4 text-forest" />
                      ) : null}
                    </div>
                    <p className="mt-4 text-[14px] font-medium">Azienda</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      Organizzazione con partita IVA, sedi, amministratori e attività di acquisto o vendita.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      setAccountRole("individual");
                      setError("Gli account individuali fanno parte della Fase 2 e non sono ancora disponibili.");
                    }}
                    className={cn(
                      "relative rounded-xl border p-4 text-left transition-all",
                      accountRole === "individual"
                        ? "border-line bg-sand/50"
                        : "border-line hover:border-sage",
                    )}
                  >
                    <span className="absolute right-3 top-3 rounded-full border border-line bg-paper px-2 py-0.5 font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                      Phase 2
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-lg bg-sand text-muted">
                      <UserRound className="size-4" />
                    </span>
                    <p className="mt-4 text-[14px] font-medium text-muted">Individuale</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      Artigiani e acquirenti indipendenti. Non abilitato in questa versione MVP.
                    </p>
                  </button>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="mt-6">
                <h2 className="text-[30px] leading-tight">Azienda e sede principale</h2>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  Usiamo la sede principale per calcolare distanze e prezzi consegnati.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="field-label">Ragione sociale</label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Northwind Packaging S.p.A."
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="field-label">Partita IVA</label>
                    <div className="mt-1.5 flex">
                      <span className="flex h-10 items-center rounded-l-xl border border-r-0 border-line bg-sand/60 px-2.5 font-mono text-[12px] text-muted">
                        {vatPrefix}
                      </span>
                      <Input
                        value={vatNumber.replace(/^[A-Za-z]{2}/, "")}
                        onChange={(e) => setVatNumber(`${vatPrefix}${e.target.value.replace(/\s/g, "")}`)}
                        placeholder="04829170159"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Paese</label>
                    <Select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1.5"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">
                      Sito web <span className="font-normal text-muted">(facoltativo)</span>
                    </label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="company.com"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
                    Sede principale
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="field-label">Indirizzo</label>
                      <Input
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="Via Emilia Est 1240"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="field-label">Città</label>
                      <Select
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          const found = CITIES.find((c) => c.city === e.target.value);
                          if (found) setPostalCode(found.postalCode);
                        }}
                        className="mt-1.5"
                      >
                        {countryCities.map((c) => (
                          <option key={c.city} value={c.city}>
                            {c.city}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="field-label">CAP</label>
                      <Input
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
                        Inviti amministratore
                      </p>
                      <p className="mt-1 text-[12px] text-muted">
                        Facoltativo. Gli amministratori possono gestire annunci, richieste e preventivi.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setInvites((prev) => [...prev, { email: "", role: "member" }])}
                      disabled={invites.length >= 4}
                    >
                      <Plus className="size-3.5" /> Aggiungi
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {invites.map((invite, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                          <Input
                            value={invite.email}
                            onChange={(e) =>
                              setInvites((prev) =>
                                prev.map((item, i) =>
                                  i === index ? { ...item, email: e.target.value } : item,
                                ),
                              )
                            }
                            placeholder="colleague@company.com"
                            type="email"
                            className="pl-9"
                          />
                        </div>
                        <Select
                          value={invite.role}
                          onChange={(e) =>
                            setInvites((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, role: e.target.value as MemberRole } : item,
                              ),
                            )
                          }
                          className="w-[120px]"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Membro</option>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setInvites((prev) => prev.filter((_, i) => i !== index))}
                          aria-label="Rimuovi invito"
                          disabled={invites.length === 1 && index === 0}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2.5 text-[11.5px] leading-relaxed text-danger"
              >
                <X className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </div>
            ) : null}

            <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="-ml-2"
              >
                <ArrowLeft className="size-3.5" /> Indietro
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next}>
                  Continua <ArrowRight className="size-3.5" />
                </Button>
              ) : (
                <Button type="button" onClick={submit} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Entra in Offcut <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted">
            Hai bisogno di aiuto? <Link href="/" className="underline">Parla con il team Offcut</Link> · I tuoi
            dati restano nel tuo spazio di lavoro.
          </p>
        </section>
      </main>
    </OffcutShell>
  );
}
