"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CITIES, COMMISSION_RATE, DEMO_PASSWORD, VAT_RATE } from "@/lib/constants";
import { buildMatchId, evaluateMatch } from "@/lib/matching";
import { computePriceBreakdown, round } from "@/lib/pricing";
import { createSeedData, type SeedData } from "@/lib/seed";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AccountRole,
  CollectionPlan,
  DemoAccount,
  ListingStatus,
  Location,
  Match,
  MatchStatus,
  MaterialCategory,
  MaterialCondition,
  MaterialListing,
  MaterialRequest,
  MemberRole,
  Order,
  OrderEvent,
  Organization,
  OrgType,
  ProcessingType,
  Profile,
  Quote,
} from "@/types";

function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeReference(prefix: string): string {
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function findOrgForUser(state: DataState, userId: string | null): string | null {
  if (!userId) return null;
  const membership = state.memberships.find((m) => m.userId === userId && m.status === "active");
  return membership?.orgId ?? null;
}

const DEMO_USER_IDS = new Set(["usr_elena", "usr_marco"]);

function isDemoUserId(userId: string | null | undefined): boolean {
  return !!userId && DEMO_USER_IDS.has(userId);
}

export function rebuildMatches(data: {
  listings: MaterialListing[];
  requests: MaterialRequest[];
  locations: Location[];
  matches: Match[];
}): Match[] {
  const locationsById = new Map(data.locations.map((l) => [l.id, l]));
  const existing = new Map(data.matches.map((m) => [`${m.requestId}::${m.listingId}`, m]));
  const next: Match[] = [];

  for (const request of data.requests) {
    if (request.status !== "open" && request.status !== "matched") continue;
    for (const listing of data.listings) {
      if (listing.orgId === request.orgId) continue;
      if (listing.status !== "active" && listing.status !== "matched") continue;
      const evaluation = evaluateMatch(
        listing,
        request,
        locationsById.get(listing.locationId),
        locationsById.get(request.locationId),
      );
      if (!evaluation || evaluation.score < 55) continue;
      const key = `${request.id}::${listing.id}`;
      const prior = existing.get(key);
      next.push({
        id: prior?.id ?? buildMatchId(request.id, listing.id),
        listingId: listing.id,
        requestId: request.id,
        ...evaluation,
        status: prior?.status ?? "suggested",
        createdAt: prior?.createdAt ?? nowIso(),
      });
    }
  }
  return next;
}

export interface NewListingInput {
  title: string;
  description: string;
  category: MaterialCategory;
  composition: { material: string; percent: number }[];
  quantityKg: number;
  condition: MaterialCondition;
  conditionFlags?: MaterialCondition[];
  purityPct: number;
  pricePerKg: number;
  availableFrom: string;
  availableUntil: string;
  photos: string[];
  handling: string[];
  packaging: string;
  minOrderKg: number;
  locationId: string;
  status?: ListingStatus;
}

export interface NewRequestInput {
  title: string;
  description: string;
  category: MaterialCategory;
  acceptableComposition: string[];
  acceptedConditions?: MaterialCondition[];
  qualityThresholds: { minPurityPct: number; maxMoisturePct: number; maxContaminationPct: number };
  quantityKg: number;
  frequency: MaterialRequest["frequency"];
  maxBudget: number;
  requiredProcessing: ProcessingType[];
  neededBy: string;
  radiusKm: number;
  locationId: string;
}

export interface OnboardingInput {
  accountRole: AccountRole;
  orgType: OrgType;
  companyName: string;
  vatNumber: string;
  country: string;
  website?: string;
  addressLine: string;
  city: string;
  postalCode: string;
  invites: { email: string; role: MemberRole }[];
}

// --- Inbox & Booking (Offcut-style pick-up / drop-off) ---

export type AppointmentType = "pickup" | "dropoff";
export type AppointmentMaterial = "plastic" | "cardboard" | "wood";
export type AppointmentCondition = "clean" | "mixed" | "contaminated";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface AppointmentFinance {
  rate: number;
  gross: number;
  commission: number;
  transport: number;
  service: number;
  processing: number;
  net: number;
}

export interface Appointment {
  id: string;
  partnerName: string;
  type: AppointmentType;
  material: AppointmentMaterial;
  condition: AppointmentCondition;
  tons: number;
  hub: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  finance: AppointmentFinance;
  createdAt: string;
}

export interface InboxMessage {
  id: string;
  from: "me" | "partner";
  body: string;
  at: string;
}

export interface InboxThread {
  id: string;
  partnerName: string;
  orgId: string | null;
  subject: string;
  messages: InboxMessage[];
  unread: number;
  listingId?: string;
  requestId?: string;
  matchId?: string;
}

export const APPOINTMENT_RATES: Record<AppointmentMaterial, number> = {
  plastic: 210,
  cardboard: 60,
  wood: 55,
};

export const APPOINTMENT_PROCESSING_RATES: Record<AppointmentCondition, number> = {
  clean: 0,
  mixed: 15,
  contaminated: 30,
};

export const APPOINTMENT_TRANSPORT_FEE = 120;
export const APPOINTMENT_SERVICE_FEE = 45;
export const APPOINTMENT_HUBS = [
  "Bologna",
  "Imola",
  "Casalecchio di Reno",
  "San Lazzaro di Savena",
] as const;
export const APPOINTMENT_SLOTS = ["08:00–11:00", "11:00–14:00", "14:00–18:00"] as const;

export function computeAppointmentFinance(input: {
  material: AppointmentMaterial;
  condition: AppointmentCondition;
  tons: number;
  rate?: number;
}): AppointmentFinance {
  const rate = input.rate ?? APPOINTMENT_RATES[input.material];
  const gross = round(rate * input.tons, 2);
  const commission = round(gross * COMMISSION_RATE, 2);
  const transport = APPOINTMENT_TRANSPORT_FEE;
  const service = APPOINTMENT_SERVICE_FEE;
  const processing = round(input.tons * APPOINTMENT_PROCESSING_RATES[input.condition], 2);
  const net = round(Math.max(0, gross - commission - transport - service - processing), 2);
  return { rate, gross, commission, transport, service, processing, net };
}

function dateInputFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

function createSeedAppointments(): Appointment[] {
  const scheduled: Appointment = {
    id: "appt_seed_1",
    partnerName: "GreenLoop Fibres S.r.l.",
    type: "pickup",
    material: "plastic",
    condition: "mixed",
    tons: 12,
    hub: "Bologna",
    date: dateInputFromNow(3),
    time: APPOINTMENT_SLOTS[0],
    status: "scheduled",
    finance: computeAppointmentFinance({ material: "plastic", condition: "mixed", tons: 12 }),
    createdAt: nowIso(),
  };
  const completed: Appointment = {
    id: "appt_seed_2",
    partnerName: "Cartiera Veneta S.p.A.",
    type: "dropoff",
    material: "cardboard",
    condition: "clean",
    tons: 8,
    hub: "Bologna",
    date: dateInputFromNow(-6),
    time: APPOINTMENT_SLOTS[2],
    status: "completed",
    finance: computeAppointmentFinance({ material: "cardboard", condition: "clean", tons: 8 }),
    createdAt: nowIso(),
  };
  return [scheduled, completed];
}

function createSeedInboxThreads(): InboxThread[] {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  return [
    {
      id: "thr_seed_1",
      partnerName: "GreenLoop Fibres S.r.l.",
      orgId: "org_greenloop",
      subject: "Ritiro plastiche miste · hub Bologna",
      unread: 1,
      messages: [
        {
          id: "msg_seed_1",
          from: "partner",
          body: "Ciao! Abbiamo confermato la disponibilità per il ritiro delle plastiche miste. Il nostro hub di Bologna può ricevere fino a 15 t a settimana.",
          at: hoursAgo(26),
        },
        {
          id: "msg_seed_2",
          from: "me",
          body: "Perfetto, procediamo con 12 t. Vi mando le specifiche del materiale e le foto dei bancali in giornata.",
          at: hoursAgo(22),
        },
        {
          id: "msg_seed_3",
          from: "partner",
          body: "Ricevuto, grazie. Confermate la fascia di ritiro dall'Inbox così blocciamo il mezzo per Bologna.",
          at: hoursAgo(2),
        },
      ],
    },
    {
      id: "thr_seed_2",
      partnerName: "Cartiera Veneta S.p.A.",
      orgId: "org_cartiera",
      subject: "Consegna cartone pulito · hub Bologna",
      unread: 0,
      messages: [
        {
          id: "msg_seed_4",
          from: "partner",
          body: "Buongiorno, il cartone consegnato la scorsa settimana ha superato il controllo qualità: umidità e purezza in linea con il contratto.",
          at: hoursAgo(120),
        },
        {
          id: "msg_seed_5",
          from: "me",
          body: "Ottima notizia. Per il prossimo lotto possiamo confermare 8 t di cartone pulito, stessa fascia oraria.",
          at: hoursAgo(96),
        },
        {
          id: "msg_seed_6",
          from: "partner",
          body: "Confermato. Il pagamento del netto viene disposto a 30 giorni come da accordo. Alla prossima consegna!",
          at: hoursAgo(90),
        },
      ],
    },
  ];
}

export interface DataState extends SeedData {
  session: { userId: string | null };
  currentOrgId: string | null;
  lastMatchRunAt: string | null;
  authChecked: boolean;
  appointments: Appointment[];
  inboxThreads: InboxThread[];
}

interface Actions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  resendConfirmation: (email: string) => Promise<void>;
  signInWithProvider: (provider: "google" | "azure") => Promise<void>;
  hydrateSession: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => void;
  switchOrg: (orgId: string) => void;
  updateOrganization: (patch: Partial<Organization>) => void;
  addLocation: (input: {
    name: string;
    addressLine: string;
    city: string;
    postalCode: string;
    country: string;
    isPrimary?: boolean;
  }) => void;
  inviteMember: (input: { email: string; role: MemberRole; fullName?: string }) => void;
  createListing: (input: NewListingInput) => string;
  updateListing: (listingId: string, input: NewListingInput) => void;
  updateListingStatus: (listingId: string, status: ListingStatus) => void;
  createRequest: (input: NewRequestInput) => string;
  generateMatches: () => number;
  setMatchStatus: (matchId: string, status: MatchStatus) => void;
  createOrderFromMatch: (matchId: string) => string;
  requestQuoteForListing: (listingId: string, quantityKg: number, neededBy?: string) => string;
  issueQuote: (orderId: string) => void;
  acceptQuote: (orderId: string) => void;
  scheduleCollection: (
    orderId: string,
    input: {
      windowStart: string;
      windowEnd: string;
      transportPartnerId: string;
      processingPartnerId: string;
      qcPartnerId: string;
      instructions?: string;
    },
  ) => void;
  completeOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  bookAppointment: (input: {
    partnerName: string;
    type: AppointmentType;
    material: AppointmentMaterial;
    condition: AppointmentCondition;
    tons: number;
    hub: string;
    date: string;
    time: string;
  }) => string;
  cancelAppointment: (appointmentId: string) => void;
  openInboxThreadForMatch: (matchId: string) => string | null;
  sendInboxMessage: (threadId: string, body: string) => void;
  resetDemo: () => void;
}

export type AppStore = DataState & Actions;

/**
 * Local account "database": passwords are salted and hashed in the browser so
 * sign-up and sign-in work without waiting for an email confirmation.
 */
function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const seed = createSeedData();

/** Demo mail/appointments are sample content. Real accounts start with an empty
 *  inbox so they never see conversations they did not create. */
function demoWorkspacePatch(state: DataState, enabled: boolean): Partial<DataState> {
  if (!enabled) {
    return {
      appointments: state.appointments.filter((a) => !a.id.startsWith("appt_seed_")),
      inboxThreads: state.inboxThreads.filter((t) => !t.id.startsWith("thr_seed_")),
      notifications: state.notifications.filter((n) => !n.id.startsWith("ntf_seed_")),
    };
  }

  const merge = <T extends { id: string }>(seeded: T[], current: T[]): T[] => {
    const existing = new Set(current.map((item) => item.id));
    return [...seeded.filter((item) => !existing.has(item.id)), ...current];
  };

  return {
    appointments: merge(createSeedAppointments(), state.appointments),
    inboxThreads: merge(createSeedInboxThreads(), state.inboxThreads),
    notifications: merge(seed.notifications, state.notifications),
  };
}

const initialState: DataState = {
  ...seed,
  session: { userId: null },
  currentOrgId: null,
  lastMatchRunAt: null,
  authChecked: false,
  appointments: createSeedAppointments(),
  inboxThreads: createSeedInboxThreads(),
};

function actorName(state: DataState): string {
  const profile = state.profiles.find((p) => p.id === state.session.userId);
  return profile?.fullName ?? "Offcut";
}

function event(label: string, actor: string, kind: OrderEvent["kind"], note?: string): OrderEvent {
  return { id: uid("evt"), at: nowIso(), label, note, actor, kind };
}

function applySupabaseUser(state: DataState, user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): Partial<DataState> {
  const email = user.email?.toLowerCase() ?? `user-${user.id.slice(0, 6)}@circularlink.local`;
  let profiles = state.profiles;
  let profile = profiles.find((p) => p.id === user.id) ?? profiles.find((p) => p.email.toLowerCase() === email);
  if (!profile) {
    const fullName =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      email.split("@")[0].replace(/[._-]/g, " ");
    profile = {
      id: user.id,
      fullName,
      email,
      accountRole: "business",
      onboarded: false,
      createdAt: nowIso(),
    };
    profiles = [...profiles, profile];
  }
  return {
    ...demoWorkspacePatch(state, isDemoUserId(profile.id)),
    profiles,
    session: { userId: profile.id },
    currentOrgId: findOrgForUser(state, profile.id),
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      signIn: async (email, password) => {
        const normalized = email.trim().toLowerCase();
        const state = get();
        const profile = state.profiles.find((p) => p.email.toLowerCase() === normalized);
        if (!profile) {
          throw new Error("Nessun account trovato con questa email. Registrati o usa un account demo.");
        }
        const account = state.accounts.find((a) => a.userId === profile.id);
        if (!account) {
          throw new Error("Account incompleto. Registrati di nuovo.");
        }

        if (account.isDemo) {
          if (password !== DEMO_PASSWORD) {
            throw new Error("Password non corretta per l'account demo.");
          }
        } else {
          if (!account.passwordHash || !account.passwordSalt) {
            throw new Error("Questo account non ha una password salvata. Registrati di nuovo.");
          }
          const candidate = await hashPassword(password, account.passwordSalt);
          if (candidate !== account.passwordHash) {
            throw new Error("Password non corretta.");
          }
        }

        set((s) => ({
          ...demoWorkspacePatch(s, account.isDemo),
          session: { userId: profile.id },
          currentOrgId: findOrgForUser(s, profile.id),
          authChecked: true,
        }));
      },

      signUp: async (name, email, password) => {
        const normalized = email.trim().toLowerCase();
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const state = get();
        if (state.profiles.some((p) => p.email.toLowerCase() === normalized)) {
          throw new Error("An account with this email already exists. Sign in instead.");
        }

        // Ask Supabase to create the real auth user. Its confirmation email is
        // the only transactional mail currently able to reach any recipient.
        // The local workspace still works even if the remote call is rejected.
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          void supabase.auth
            .signUp({
              email: normalized,
              password,
              options: { data: { company: name.trim() } },
            })
            .catch(() => undefined);
        }

        const salt = randomSalt();
        const passwordHash = await hashPassword(password, salt);
        const profile: Profile = {
          id: uid("usr"),
          fullName: name.trim(),
          email: normalized,
          accountRole: "business",
          onboarded: false,
          createdAt: nowIso(),
        };
        const account: DemoAccount = {
          userId: profile.id,
          email: normalized,
          isDemo: false,
          companyName: name.trim(),
          passwordHash,
          passwordSalt: salt,
        };
        set((s) => ({
          ...demoWorkspacePatch(s, false),
          profiles: [...s.profiles, profile],
          accounts: [...s.accounts, account],
          session: { userId: profile.id },
          currentOrgId: null,
          authChecked: true,
        }));
        return { needsConfirmation: false };
      },

      resendConfirmation: async (email) => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: email.trim().toLowerCase(),
        });
        if (error) throw new Error(error.message);
      },

      signInWithProvider: async (provider) => {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: provider === "azure" ? "azure" : "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          });
          if (error) throw new Error(error.message);
          return;
        }
        const state = get();
        const profile = state.profiles.find((p) => p.id === "usr_elena");
        if (!profile) throw new Error("Demo SSO is unavailable.");
        set((s) => ({
          ...demoWorkspacePatch(s, true),
          session: { userId: profile.id },
          currentOrgId: findOrgForUser(s, profile.id),
          authChecked: true,
        }));
      },

      hydrateSession: async () => {
        // Accounts live in the local persisted store; no remote session needed.
        set({ authChecked: true });
      },

      signOut: async () => {
        const supabase = getSupabaseBrowserClient();
        if (supabase) await supabase.auth.signOut();
        set({ session: { userId: null }, currentOrgId: null, authChecked: true });
      },

      completeOnboarding: (input) => {
        const state = get();
        const userId = state.session.userId;
        if (!userId) throw new Error("Sign in to complete onboarding.");
        if (input.accountRole === "individual") {
          throw new Error("Individual accounts are part of Phase 2 and are not available yet.");
        }
        const city = CITIES.find((c) => c.city === input.city) ?? CITIES[0];
        const orgId = uid("org");
        const locId = uid("loc");
        const org: Organization = {
          id: orgId,
          name: input.companyName.trim(),
          vatNumber: input.vatNumber.trim().toUpperCase(),
          country: input.country,
          website: input.website?.trim(),
          type: input.orgType,
          verified: false,
          createdAt: nowIso(),
        };
        const location: Location = {
          id: locId,
          orgId,
          name: `${city.city} site`,
          addressLine: input.addressLine.trim(),
          city: city.city,
          postalCode: input.postalCode.trim() || city.postalCode,
          country: input.country,
          lat: city.lat,
          lng: city.lng,
          isPrimary: true,
        };
        const profile = state.profiles.find((p) => p.id === userId);
        set((s) => ({
          organizations: [...s.organizations, org],
          locations: [...s.locations, location],
          memberships: [
            ...s.memberships,
            {
              id: uid("mem"),
              orgId,
              userId,
              role: "owner",
              fullName: profile?.fullName ?? "Owner",
              email: profile?.email ?? "",
              title: "Owner",
              status: "active",
              joinedAt: nowIso(),
            },
            ...input.invites
              .filter((i) => i.email.trim().includes("@"))
              .map<import("@/types").Membership>((i) => ({
                id: uid("mem"),
                orgId,
                userId: uid("invite"),
                role: i.role,
                fullName: i.email.split("@")[0],
                email: i.email.trim().toLowerCase(),
                status: "invited",
                joinedAt: nowIso(),
              })),
          ],
          profiles: s.profiles.map((p) =>
            p.id === userId ? { ...p, accountRole: input.accountRole, onboarded: true } : p,
          ),
          currentOrgId: orgId,
        }));
      },

      switchOrg: (orgId) => {
        const state = get();
        const allowed = state.memberships.some(
          (m) => m.orgId === orgId && m.userId === state.session.userId && m.status === "active",
        );
        if (!allowed) return;
        set({ currentOrgId: orgId });
      },

      updateOrganization: (patch) => {
        const { currentOrgId } = get();
        if (!currentOrgId) return;
        set((s) => ({
          organizations: s.organizations.map((o) => (o.id === currentOrgId ? { ...o, ...patch } : o)),
        }));
      },

      addLocation: (input) => {
        const { currentOrgId } = get();
        if (!currentOrgId) return;
        const city = CITIES.find((c) => c.city === input.city) ?? CITIES[0];
        set((s) => ({
          locations: [
            ...s.locations,
            {
              id: uid("loc"),
              orgId: currentOrgId,
              name: input.name,
              addressLine: input.addressLine,
              city: city.city,
              postalCode: input.postalCode || city.postalCode,
              country: input.country,
              lat: city.lat,
              lng: city.lng,
              isPrimary: false,
            },
          ],
        }));
      },

      inviteMember: (input) => {
        const { currentOrgId } = get();
        if (!currentOrgId) return;
        const org = get().organizations.find((o) => o.id === currentOrgId);
        set((s) => ({
          memberships: [
            ...s.memberships,
            {
              id: uid("mem"),
              orgId: currentOrgId,
              userId: uid("invite"),
              role: input.role,
              fullName: input.fullName?.trim() || input.email.split("@")[0],
              email: input.email.trim().toLowerCase(),
              status: "invited",
              joinedAt: nowIso(),
            },
          ],
          notifications: [
            {
              id: uid("ntf"),
              title: "Invitation sent",
              body: `${input.email} was invited to ${org?.name ?? "your organization"}.`,
              href: "/app/settings",
              createdAt: nowIso(),
              read: false,
              tone: "info" as const,
            },
            ...s.notifications,
          ],
        }));
      },

      createListing: (input) => {
        const state = get();
        if (!state.currentOrgId) throw new Error("Select an organization first.");
        const id = uid("lst");
        const listing: MaterialListing = {
          ...input,
          id,
          reference: makeReference("LST"),
          orgId: state.currentOrgId,
          currency: "EUR",
          status: input.status ?? "active",
          createdAt: nowIso(),
          views: 0,
        };
        set((s) => {
          const listings = [listing, ...s.listings];
          const matches = rebuildMatches({ ...s, listings });
          return { listings, matches, lastMatchRunAt: nowIso() };
        });
        return id;
      },

      updateListing: (listingId, input) => {
        const state = get();
        if (!state.currentOrgId) throw new Error("Select an organization first.");
        const existing = state.listings.find((listing) => listing.id === listingId);
        if (!existing || existing.orgId !== state.currentOrgId) throw new Error("Listing not found.");
        set((s) => {
          const listings = s.listings.map((listing) =>
            listing.id === listingId
              ? {
                  ...existing,
                  ...input,
                  id: existing.id,
                  reference: existing.reference,
                  orgId: existing.orgId,
                  currency: existing.currency,
                  createdAt: existing.createdAt,
                  views: existing.views,
                  status: input.status ?? existing.status,
                }
              : listing,
          );
          const matches = rebuildMatches({ ...s, listings });
          return { listings, matches, lastMatchRunAt: nowIso() };
        });
      },

      updateListingStatus: (listingId, status) => {
        set((s) => ({ listings: s.listings.map((l) => (l.id === listingId ? { ...l, status } : l)) }));
      },

      createRequest: (input) => {
        const state = get();
        if (!state.currentOrgId) throw new Error("Select an organization first.");
        const id = uid("req");
        const request: MaterialRequest = {
          ...input,
          id,
          reference: makeReference("REQ"),
          orgId: state.currentOrgId,
          status: "open",
          createdAt: nowIso(),
        };
        set((s) => {
          const requests = [request, ...s.requests];
          const matches = rebuildMatches({ ...s, requests });
          return { requests, matches, lastMatchRunAt: nowIso() };
        });
        return id;
      },

      generateMatches: () => {
        const state = get();
        const matches = rebuildMatches(state);
        set({ matches, lastMatchRunAt: nowIso() });
        return matches.length;
      },

      setMatchStatus: (matchId, status) => {
        set((s) => ({
          matches: s.matches.map((m) => (m.id === matchId ? { ...m, status } : m)),
        }));
      },

      createOrderFromMatch: (matchId) => {
        const state = get();
        const match = state.matches.find((m) => m.id === matchId);
        if (!match) throw new Error("Match not found.");
        const existing = state.orders.find((o) => o.matchId === matchId && o.status !== "cancelled");
        if (existing) return existing.id;
        const listing = state.listings.find((l) => l.id === match.listingId);
        const request = state.requests.find((r) => r.id === match.requestId);
        if (!listing || !request) throw new Error("Linked supply or demand was removed.");
        const id = uid("ord");
        const actor = actorName(state);
        const order: Order = {
          id,
          reference: makeReference("CL"),
          buyerOrgId: request.orgId,
          supplierOrgId: listing.orgId,
          listingId: listing.id,
          requestId: request.id,
          matchId: match.id,
          quoteId: null,
          quantityKg: match.quantityKg,
          status: "matched",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          collection: null,
          timeline: [
            event("Order created", actor, "user", `Matched ${listing.reference} to ${request.reference}`),
            event("Match confirmed", "Offcut", "system", `Similarity score ${match.score}/100`),
          ],
          createdByUserId: state.session.userId ?? "system",
        };
        set((s) => ({
          orders: [order, ...s.orders],
          matches: s.matches.map((m) => (m.id === matchId ? { ...m, status: "quoted" } : m)),
        }));
        return id;
      },

      requestQuoteForListing: (listingId, quantityKg, neededBy) => {
        const state = get();
        const listing = state.listings.find((l) => l.id === listingId);
        if (!listing) throw new Error("Listing not found.");
        const orgId = state.currentOrgId;
        if (!orgId) throw new Error("Select an organization first.");
        const location =
          state.locations.find((l) => l.orgId === orgId && l.isPrimary) ??
          state.locations.find((l) => l.orgId === orgId);
        if (!location) throw new Error("Add a site before requesting material.");
        const requestId = uid("req");
        const request: MaterialRequest = {
          id: requestId,
          reference: makeReference("REQ"),
          orgId,
          locationId: location.id,
          title: `Ad-hoc purchase — ${listing.title}`,
          description: `Generated from marketplace listing ${listing.reference}.`,
          category: listing.category,
          acceptableComposition: listing.composition.map((c) => c.material),
          qualityThresholds: {
            minPurityPct: Math.max(80, listing.purityPct - 3),
            maxMoisturePct: listing.category === "wood" ? 15 : 8,
            maxContaminationPct: listing.condition === "clean" ? 1 : 4,
          },
          quantityKg,
          frequency: "one_off",
          maxBudget: round(
            computePriceBreakdown({
              listing,
              quantityKg,
              distanceKm: 100,
              processing: listing.condition === "clean" ? [] : ["sorting"],
            }).total * 1.2,
            0,
          ),
          requiredProcessing: listing.condition === "clean" ? [] : ["sorting"],
          neededBy: neededBy ?? new Date(Date.now() + 21 * 86_400_000).toISOString().slice(0, 10),
          radiusKm: 350,
          status: "open",
          createdAt: nowIso(),
        };
        const evaluation = evaluateMatch(
          listing,
          request,
          state.locations.find((l) => l.id === listing.locationId),
          location,
        );
        if (!evaluation) throw new Error("This material is outside your requested category.");
        const match: Match = {
          id: buildMatchId(requestId, listing.id),
          listingId: listing.id,
          requestId,
          ...evaluation,
          status: "quoted",
          createdAt: nowIso(),
        };
        const orderId = uid("ord");
        const order: Order = {
          id: orderId,
          reference: makeReference("CL"),
          buyerOrgId: orgId,
          supplierOrgId: listing.orgId,
          listingId: listing.id,
          requestId,
          matchId: match.id,
          quoteId: null,
          quantityKg: evaluation.quantityKg,
          status: "matched",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          collection: null,
          timeline: [
            event("Ad-hoc request created", actorName(state), "user", `From listing ${listing.reference}`),
            event("Order created", "Offcut", "system", `Similarity score ${evaluation.score}/100`),
          ],
          createdByUserId: state.session.userId ?? "system",
        };
        set((s) => {
          const requests = [request, ...s.requests];
          const matches = [...s.matches.filter((m) => m.id !== match.id), match];
          return { requests, matches, orders: [order, ...s.orders] };
        });
        return orderId;
      },

      issueQuote: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) throw new Error("Order not found.");
        if (order.quoteId) return;
        const listing = state.listings.find((l) => l.id === order.listingId);
        const request = state.requests.find((r) => r.id === order.requestId);
        const match = state.matches.find((m) => m.id === order.matchId);
        if (!listing || !request) throw new Error("Linked material is missing.");
        const breakdown = computePriceBreakdown({
          listing,
          quantityKg: order.quantityKg,
          distanceKm: match?.distanceKm ?? 100,
          processing: match?.requiredProcessing ?? [],
        });
        const quoteId = uid("quo");
        const quote: Quote = {
          id: quoteId,
          orderId,
          breakdown,
          validUntil: new Date(Date.now() + 14 * 86_400_000).toISOString(),
          status: "issued",
          issuedAt: nowIso(),
          notes: "Delivered price includes processing coordination, transport and QC sampling.",
        };
        set((s) => ({
          quotes: [quote, ...s.quotes],
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  quoteId,
                  status: "quote_issued",
                  updatedAt: nowIso(),
                  timeline: [
                    ...o.timeline,
                    event("Quote issued", "Offcut", "system", "Valid for 14 days · 6% platform commission"),
                  ],
                }
              : o,
          ),
          matches: s.matches.map((m) => (m.id === order.matchId ? { ...m, status: "quoted" } : m)),
        }));
      },

      acceptQuote: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order?.quoteId) throw new Error("Issue a quote before accepting it.");
        const actor = actorName(state);
        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === order.quoteId ? { ...q, status: "accepted" as const } : q,
          ),
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "quote_accepted",
                  updatedAt: nowIso(),
                  timeline: [...o.timeline, event("Quote accepted", actor, "finance")],
                }
              : o,
          ),
          listings: s.listings.map((l) =>
            l.id === order.listingId ? { ...l, status: "matched" as const } : l,
          ),
        }));
      },

      scheduleCollection: (orderId, input) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) throw new Error("Order not found.");
        const collection: CollectionPlan = {
          ...input,
          qcStatus: "scheduled",
        };
        const transport = state.partners.find((p) => p.id === input.transportPartnerId);
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "collection_scheduled",
                  collection,
                  updatedAt: nowIso(),
                  timeline: [
                    ...o.timeline,
                    event(
                      "Collection scheduled",
                      actorName(state),
                      "partner",
                      `${transport?.name ?? "Carrier"} · QC partner booked`,
                    ),
                  ],
                }
              : o,
          ),
          listings: s.listings.map((l) =>
            l.id === order.listingId ? { ...l, status: "reserved" as const } : l,
          ),
        }));
      },

      completeOrder: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) throw new Error("Order not found.");
        const request = state.requests.find((r) => r.id === order.requestId);
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "completed",
                  collection: o.collection ? { ...o.collection, qcStatus: "passed" } : null,
                  updatedAt: nowIso(),
                  timeline: [
                    ...o.timeline,
                    event("QC passed", "Quality partner", "partner", "Sampling report uploaded"),
                    event("Order completed", actorName(state), "finance", "Invoice settled"),
                  ],
                }
              : o,
          ),
          listings: s.listings.map((l) =>
            l.id === order.listingId ? { ...l, status: "sold" as const } : l,
          ),
          requests: s.requests.map((r) =>
            r.id === order.requestId && request?.frequency === "one_off"
              ? { ...r, status: "fulfilled" as const }
              : r,
          ),
        }));
      },

      cancelOrder: (orderId) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "cancelled",
                  updatedAt: nowIso(),
                  timeline: [...o.timeline, event("Order cancelled", actorName(s), "user")],
                }
              : o,
          ),
        }));
      },

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      markAllNotificationsRead: () => {
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
      },

      bookAppointment: (input) => {
        const id = uid("appt");
        const appointment: Appointment = {
          id,
          partnerName: input.partnerName.trim() || "Offcut Hub",
          type: input.type,
          material: input.material,
          condition: input.condition,
          tons: input.tons,
          hub: input.hub,
          date: input.date,
          time: input.time,
          status: "scheduled",
          finance: computeAppointmentFinance({
            material: input.material,
            condition: input.condition,
            tons: input.tons,
          }),
          createdAt: nowIso(),
        };
        set((s) => ({ appointments: [appointment, ...s.appointments] }));
        return id;
      },

      cancelAppointment: (appointmentId) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId && a.status === "scheduled"
              ? { ...a, status: "cancelled" as const }
              : a,
          ),
        }));
      },

      openInboxThreadForMatch: (matchId) => {
        const state = get();
        const match = state.matches.find((m) => m.id === matchId);
        if (!match) return null;
        const listing = state.listings.find((l) => l.id === match.listingId);
        const request = state.requests.find((r) => r.id === match.requestId);
        if (!listing || !request) return null;

        const current = state.currentOrgId;
        const counterpartOrgId =
          current === listing.orgId
            ? request.orgId
            : current === request.orgId
              ? listing.orgId
              : request.orgId;
        if (!counterpartOrgId || counterpartOrgId === current) return null;

        const id = `thr_${current ?? "me"}_${listing.id}_${counterpartOrgId}`;
        const existing = state.inboxThreads.find((t) => t.id === id);
        if (existing) return existing.id;

        const partnerName =
          state.organizations.find((o) => o.id === counterpartOrgId)?.name ?? "Partner Offcut";
        set((s) => ({
          inboxThreads: [
            {
              id,
              partnerName,
              orgId: counterpartOrgId,
              subject: `${listing.reference} · ${listing.title}`,
              listingId: listing.id,
              requestId: request.id,
              matchId: match.id,
              messages: [],
              unread: 0,
            },
            ...s.inboxThreads,
          ],
        }));
        get().sendInboxMessage(
          id,
          `Ciao ${partnerName}: ti scrivo per ${listing.reference} — ${listing.title} (${Math.round(match.quantityKg)} kg disponibili).`,
        );
        return id;
      },

      sendInboxMessage: (threadId, body) => {
        const text = body.trim();
        if (!text) return;
        set((s) => ({
          inboxThreads: s.inboxThreads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  unread: 0,
                  messages: [
                    ...t.messages,
                    { id: uid("msg"), from: "me" as const, body: text, at: nowIso() },
                  ],
                }
              : t,
          ),
        }));
      },

      resetDemo: () => {
        const fresh = createSeedData();
        set({
          ...fresh,
          session: { userId: null },
          currentOrgId: null,
          lastMatchRunAt: null,
          authChecked: true,
          appointments: createSeedAppointments(),
          inboxThreads: createSeedInboxThreads(),
        });
      },
    }),
    {
      name: "circularlink-state-v1",
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as DataState;
        if (version >= 2 || !state) return state;
        return {
          ...state,
          ...demoWorkspacePatch(state, isDemoUserId(state.session?.userId)),
        };
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Functions are dropped by JSON serialization; data is persisted as-is.
        const { ...data } = state;
        return data;
      },
    },
  ),
);

export { COMMISSION_RATE, VAT_RATE };
