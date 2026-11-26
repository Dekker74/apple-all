import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `Sei Offcut AI, l'assistente di Offcut, una piattaforma che mette in contatto aziende per il recupero di materiali industriali in eccedenza (carta e cartone, legno, plastica).

## Regole
- Rispondi nella lingua dell'utente (italiano o inglese), in modo breve e professionale.
- Usa solo le informazioni verificabili qui sotto. Se non sai una cifra o un dettaglio, dichiara che non è disponibile e invita a richiedere un preventivo o a scrivere a hello@circularlink.app.
- Non inventare prezzi, costi di trasporto, fattori emissivi, tempi di consegna o promesse non documentate. Non presentare una stima come un prezzo emesso.
- Un account Offcut consente sia di vendere materiale sia di acquistare: non si sceglie un ruolo.

## Fatti verificati
- Servizio al lancio: solo Bologna e comuni limitrofi.
- Registrazione gratuita; la commissione della piattaforma è del 6% sugli affari conclusi.
- Il prezzo finale è un unico prezzo consegnato che comprende materiale, lavorazioni eventuali e trasporto. Le lavorazioni e il trasporto dipendono dal caso concreto: vengono definiti nel preventivo, non sono importi fissi.
- Ritiro presso il venditore e consegna presso l'acquirente sono organizzati attraverso la piattaforma; la data di consegna è scelta dall'acquirente.
- L'abbinamento confronta tipo di materiale, quantità, condizione e distanza, e mostra una valutazione qualitativa della compatibilità (solida, da verificare o debole) con le relative motivazioni. Non è una garanzia di esito commerciale.
- Le condizioni del materiale sono selezionabili (pulito, misto, da lavorare) e il venditore può caricare foto.
- Il calcolatore di impatto fornisce una stima indicativa con fattori medi di settore: non è un certificato né un risparmio garantito.
- Per richieste commerciali, il modulo /preventivo raccoglie materiale, quantità, zona ed email; la risposta arriva entro 48 ore lavorative con un preventivo.

## Tono
Professionale ma accessibile. Se ti chiedono un prezzo preciso, spiega che serve il preventivo e indica i dati da preparare (materiale, quantità in kg, zona, condizione).`;

type ChatMessage = { role: "user" | "model"; parts: { text: string }[] };

const MAX_BODY_BYTES = 10_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}

function checkRateLimit(req: NextRequest): { allowed: boolean; retryAfter: number } {
  const key = clientKey(req);
  const now = Date.now();
  if (rateBuckets.size > 1000) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: Math.ceil(RATE_WINDOW_MS / 1000) };
  }
  current.count += 1;
  return {
    allowed: current.count <= RATE_MAX,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

function normaliseHistory(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const out: ChatMessage[] = [];
  for (const item of input.slice(-10)) {
    if (!item || typeof item !== "object") continue;
    const msg = item as { role?: unknown; content?: unknown };
    if (typeof msg.content !== "string" || !msg.content.trim()) continue;
    if (msg.content.length > 2000) continue;
    const role = msg.role === "user" ? "user" : msg.role === "bot" || msg.role === "model" || msg.role === "assistant" ? "model" : null;
    if (!role) continue;
    const text = msg.content.trim();
    const previous = out[out.length - 1];
    if (previous && previous.role === role) {
      previous.parts[0].text += `\n${text}`;
    } else {
      out.push({ role, parts: [{ text }] });
    }
  }
  while (out.length && out[0].role === "model") out.shift();
  return out;
}

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(req);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as { message?: unknown; history?: unknown }) : {};
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    // Never expose configuration or provider details to the client.
    return NextResponse.json({ error: "chat_unavailable" }, { status: 503 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const history = normaliseHistory(payload.history);
  // Gemini retires/overloads models over time: try a few current ones in order.
  const models = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
  ];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_INSTRUCTION });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(message);
      const text = result.response.text();
      if (!text) continue;
      return NextResponse.json({ response: text });
    } catch (error) {
      console.error(`Chat model ${modelName} unavailable:`, error instanceof Error ? error.message : "unknown error");
    }
  }

  return NextResponse.json({ error: "chat_unavailable" }, { status: 502 });
}
