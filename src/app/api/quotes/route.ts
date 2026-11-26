import { NextResponse } from "next/server";
import { referenceFromId, validateQuotePayload } from "@/lib/quotes/schema";
import { persistQuoteRequest } from "@/lib/quotes/supabase";
import { sendQuoteEmails, teamAddress } from "@/lib/quotes/email";
import { buildQuoteMailto } from "@/lib/quotes/mailto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 10_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const validated = validateQuotePayload(body);
  if (!validated.ok) {
    if (validated.error === "spam") {
      // Honeypot: answer like a success so bots do not learn, but store nothing.
      return NextResponse.json({ ok: true, id: null, reference: null, emailSent: false, persisted: false });
    }
    return NextResponse.json(
      { ok: false, error: validated.error, fields: validated.fields },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  const reference = referenceFromId(id);
  const createdAt = new Date().toISOString();
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const referrer = request.headers.get("referer") ?? undefined;

  const email = await sendQuoteEmails({
    id,
    reference,
    createdAt,
    payload: validated.value,
    userAgent,
    referrer,
  });

  const team = teamAddress();
  const mailto = email.sent && email.confirmationSent || !team
    ? undefined
    : buildQuoteMailto({
        to: team,
        reference,
        payload: validated.value,
        lang: validated.value.locale === "en" ? "en" : "it",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://apple-all-andrea-grecos-projects.vercel.app",
      });

  const persisted = await persistQuoteRequest({
    id,
    payload: validated.value,
    userAgent,
    referrer,
    emailSent: email.sent,
    emailError: email.sent ? undefined : `${email.reason}${"detail" in email && email.detail ? `: ${email.detail}` : ""}`,
  });

  if (!persisted.ok && !email.sent && !mailto) {
    return NextResponse.json(
      { ok: false, error: "delivery_failed", reference },
      { status: 503 },
    );
  }

  let warning: string | undefined;
  if (!email.sent) {
    warning = email.reason === "not_configured" ? "email_not_configured" : "email_delivery_failed";
  }
  if (!persisted.ok) {
    warning = warning ? `${warning}+storage_unavailable` : "storage_unavailable";
  }

  return NextResponse.json({
    ok: true,
    id,
    reference,
    emailSent: email.sent,
    confirmationSent: email.sent ? email.confirmationSent : false,
    ...(mailto ? { mailto } : {}),
    ...(email.sent && email.confirmationDetail ? { confirmationDetail: email.confirmationDetail } : {}),
    persisted: persisted.ok,
    ...(warning ? { warning } : {}),
  });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
}
