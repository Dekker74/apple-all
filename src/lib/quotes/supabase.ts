import { createClient } from "@supabase/supabase-js";
import type { QuotePayload } from "./schema";

export type StoredQuote = {
  id: string;
  reference: string;
};

type PersistInput = {
  id: string;
  payload: Required<Pick<QuotePayload, "intent" | "material" | "quantityKg" | "zone" | "email">> & QuotePayload;
  userAgent?: string;
  referrer?: string;
  emailSent: boolean;
  emailError?: string;
};

export type PersistResult =
  | { ok: true; stored: StoredQuote }
  | { ok: false; reason: "not_configured" | "db_error"; detail?: string };

export function isQuoteStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Inserts a lead with the public anon key. The table only grants INSERT to anon,
 * so this client cannot read or modify existing rows.
 */
export async function persistQuoteRequest(input: PersistInput): Promise<PersistResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, reason: "not_configured" };

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("quote_requests").insert({
    id: input.id,
    intent: input.payload.intent,
    material: input.payload.material,
    quantity_kg: input.payload.quantityKg,
    zone: input.payload.zone,
    email: input.payload.email,
    company: input.payload.company ?? null,
    notes: input.payload.notes ?? null,
    locale: input.payload.locale ?? "it",
    source: "website",
    status: "new",
    email_sent: input.emailSent,
    email_error: input.emailError ? input.emailError.slice(0, 500) : null,
    user_agent: input.userAgent ? input.userAgent.slice(0, 500) : null,
    referrer: input.referrer ? input.referrer.slice(0, 500) : null,
    client_request_id: input.payload.clientRequestId ?? null,
  });

  if (error) {
    return { ok: false, reason: "db_error", detail: `${error.code ?? "error"}: ${error.message}`.slice(0, 300) };
  }
  return { ok: true, stored: { id: input.id, reference: "" } };
}
