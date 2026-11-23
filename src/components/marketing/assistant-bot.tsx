"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, Volume2, VolumeX, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type BotLink = { href: string; label: string };
type Message = { role: "bot" | "user"; text: string; links?: BotLink[] };

const COPY = {
  it: {
    open: "Apri assistente",
    close: "Chiudi assistente",
    title: "Assistente Offcut",
    placeholder: "Scrivi una domanda…",
    send: "Invia",
    readAloud: "Leggi ad alta voce",
    stopAudio: "Interrompi lettura",
    greeting: "Ciao! Posso spiegarti commissioni, prenotazioni, abbinamenti o aiutarti a stimare il tuo impatto. Cosa ti serve?",
    chips: ["Come funzionano le commissioni?", "Prenotare un ritiro", "Calcolare il mio impatto", "Richiedere un preventivo"],
    fees: "Iscrizione gratuita: la commissione è del 6% solo sugli affari conclusi. Trasporto e lavorazione sono voci separate del preventivo, così ricevi un unico prezzo consegnato.",
    booking: "Dopo l'abbinamento puoi prenotare ritiro o consegna dalla Inbox dell'app: vedi subito il dettaglio costi (materiale, commissione 6%, trasporto, lavorazione) e confermi data e fascia oraria.",
    footprint: "Apri il calcolatore: scegli materiale e tonnellate mensili, stimiamo risparmio annuo e CO₂e evitata.",
    quote: "Compila il form: bastano materiale, quantità, zona ed email. Rispondiamo entro 48 ore lavorative.",
    match: "L'abbinamento confronta materiale, volume, raggio e condizione e spiega ogni punteggio. Puoi esplorare la demo con un account sandbox.",
    fallback: "Posso aiutarti su: commissioni e prezzi, prenotazione ritiri/consegne, abbinamenti, calcolo dell'impatto e richieste di preventivo. Prova una delle domande qui sotto.",
    quoteLink: "Richiedi un preventivo",
    impactLink: "Calcola il tuo impatto",
    demoLink: "Prova la demo",
  },
  en: {
    open: "Open assistant",
    close: "Close assistant",
    title: "Offcut assistant",
    placeholder: "Ask a question…",
    send: "Send",
    readAloud: "Read aloud",
    stopAudio: "Stop reading",
    greeting: "Hi! I can explain commissions, bookings, matching, or help you estimate your impact. What do you need?",
    chips: ["How do commissions work?", "Book a pick-up", "Estimate my impact", "Request a quote"],
    fees: "Free to join: the 6% commission applies only to completed deals. Transport and processing are separate quote line items, so you get one delivered price.",
    booking: "After matching, book a pick-up or drop-off from the app Inbox: you see the cost breakdown (material, 6% commission, transport, processing) and confirm date and time slot.",
    footprint: "Open the calculator: pick a material and monthly tons, we estimate annual savings and CO₂e avoided.",
    quote: "Fill in the form: material, quantity, area and email are enough. We reply within 48 working hours.",
    match: "Matching compares material, volume, radius and condition and explains every score. You can explore the demo with a sandbox account.",
    fallback: "I can help with: commissions and pricing, pick-up/drop-off bookings, matching, impact estimates and quote requests. Try one of the questions below.",
    quoteLink: "Request a quote",
    impactLink: "Estimate your impact",
    demoLink: "Try the demo",
  },
};

function replyFor(query: string, lang: "it" | "en"): Message {
  const c = COPY[lang];
  const x = query.toLowerCase();
  if (/ritiro|consegna|prenot|booking|appuntament|pick.?up|drop.?off/.test(x)) {
    return { role: "bot", text: c.booking, links: [{ href: "/login", label: c.demoLink }] };
  }
  if (/impatto|co2|carbon|risparm|footprint|calcol/.test(x)) {
    return { role: "bot", text: c.footprint, links: [{ href: "/impatto", label: c.impactLink }] };
  }
  if (/preventiv|quote|offerta/.test(x)) {
    return { role: "bot", text: c.quote, links: [{ href: "/preventivo", label: c.quoteLink }] };
  }
  if (/fee|prezz|commission|pagament|costo|trasport|process|payout/.test(x)) {
    return { role: "bot", text: c.fees, links: [{ href: "/preventivo", label: c.quoteLink }] };
  }
  if (/match|abbin|come funzion|how/.test(x)) {
    return { role: "bot", text: c.match, links: [{ href: "/login", label: c.demoLink }] };
  }
  if (/ciao|salve|buongiorno|hello|hi|hey/.test(x)) {
    return { role: "bot", text: c.greeting };
  }
  return { role: "bot", text: c.fallback };
}

export function AssistantBot() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("circularlink.bot") === "open") setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem("circularlink.bot", open ? "open" : "closed");
    } catch {
      /* ignore */
    }
    if (open && messages.length === 0) {
      setMessages([{ role: "bot", text: COPY[lang].greeting }]);
    }
    if (!open && canSpeak) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, open]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setMessages((prev) => [...prev, { role: "user", text: trimmed }, replyFor(trimmed, lang)]);
      setInput("");
    },
    [lang],
  );

  const toggleSpeech = useCallback(() => {
    if (!canSpeak) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const lastBot = [...messages].reverse().find((m) => m.role === "bot");
    if (!lastBot) return;
    const utterance = new SpeechSynthesisUtterance(lastBot.text);
    utterance.lang = lang === "it" ? "it-IT" : "en-US";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [canSpeak, speaking, messages, lang]);

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-label={c.title}
          className="fixed bottom-20 right-4 z-40 flex max-h-[70vh] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
        >
          <div className="flex items-center justify-between gap-2 bg-forest px-4 py-3 text-paper">
            <p className="text-[15px] font-medium">{c.title}</p>
            <div className="flex items-center gap-1">
              {canSpeak ? (
                <button
                  type="button"
                  onClick={toggleSpeech}
                  aria-label={speaking ? c.stopAudio : c.readAloud}
                  aria-pressed={speaking}
                  className="inline-flex size-8 items-center justify-center rounded-full text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper"
                >
                  {speaking ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                aria-label={c.close}
                className="inline-flex size-8 items-center justify-center rounded-full text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-[14px] leading-relaxed ${
                    m.role === "user" ? "bg-forest text-paper" : "bg-sand text-ink"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.links?.length ? (
                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      {m.links.map((l) => (
                        <Link key={l.href} href={l.href} className="font-medium text-forest underline underline-offset-4 hover:text-ink">
                          {l.label}
                        </Link>
                      ))}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {messages.length <= 1 ? (
            <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-2">
              {c.chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => send(chip)}
                  className="rounded-full border border-line bg-paper px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-sage hover:text-ink"
                >
                  {chip}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-line p-3"
          >
            <label htmlFor="bot-input" className="sr-only">
              {c.placeholder}
            </label>
            <input
              id="bot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={c.placeholder}
              autoComplete="off"
              className="h-10 flex-1 rounded-xl border border-line bg-white px-3 text-[16px] text-ink placeholder:text-muted/60 focus-visible:border-moss sm:text-[14px]"
            />
            <button
              type="submit"
              aria-label={c.send}
              disabled={!input.trim()}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest text-paper transition-colors hover:bg-moss disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? c.close : c.open}
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-40 inline-flex size-12 items-center justify-center rounded-full bg-forest text-paper shadow-lift transition-colors hover:bg-moss"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </>
  );
}
