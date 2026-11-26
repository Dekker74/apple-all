"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Message {
  role: "user" | "bot";
  content: string;
}

const COPY = {
  it: {
    title: "Offcut AI",
    status: "Offcut AI",
    open: "Apri chat con Offcut AI",
    close: "Chiudi chat",
    you: "Tu",
    greeting: "Ciao! Sono Offcut AI. Posso spiegarti come funzionano abbinamenti, costi, ritiro e consegna e impatto. Per un prezzo preciso serve il preventivo.",
    intro: "Ciao! Sono Offcut AI: ti aiuto a capire come funziona il marketplace per i materiali in eccedenza. Operiamo a Bologna e dintorni. Scegli una domanda qui sotto o scrivimi pure.",
    typing: "Sto scrivendo…",
    placeholder: "Scrivi la tua domanda…",
    send: "Invia il messaggio",
    askBot: "Chiedi a Offcut AI",
    voiceInput: "Detta la domanda",
    readAloud: "Leggi l'ultima risposta",
    noVoice: "Il riconoscimento vocale non è disponibile in questo browser.",
    noSpeech: "La sintesi vocale non è disponibile in questo browser.",
    errorUnavailable: "L'assistente non è disponibile in questo momento. Per domande commerciali usa il modulo preventivo.",
    errorInvalid: "Il messaggio non è valido. Prova a riscriverlo in modo più breve.",
    errorGeneric: "Non è stato possibile ottenere una risposta. Riprova tra poco o usa il modulo preventivo.",
    historyLabel: "Conversazione con Offcut AI",
    chips: [
      "Come funziona il matching?",
      "Quali sono i costi?",
      "Come prenoto un ritiro?",
      "Quali materiali supportate?",
      "Come si calcola l'impatto?",
    ],
  },
  en: {
    title: "Offcut AI",
    status: "Offcut AI",
    open: "Open chat with Offcut AI",
    close: "Close chat",
    you: "You",
    greeting: "Hi! I'm Offcut AI. I can explain matching, costs, pick-up and delivery, and impact. For an exact price you need a quote.",
    intro: "Hi! I'm Offcut AI: I can help you understand the marketplace for surplus material. We operate in Bologna and nearby towns. Pick a question below or write to me.",
    typing: "Typing…",
    placeholder: "Write your question…",
    send: "Send message",
    askBot: "Ask Offcut AI",
    voiceInput: "Dictate your question",
    readAloud: "Read the last reply",
    noVoice: "Voice input is not available in this browser.",
    noSpeech: "Speech output is not available in this browser.",
    errorUnavailable: "The assistant is unavailable right now. For commercial questions, use the quote form.",
    errorInvalid: "That message isn't valid. Try rewriting it more briefly.",
    errorGeneric: "We couldn't get a reply. Try again shortly or use the quote form.",
    historyLabel: "Conversation with Offcut AI",
    chips: [
      "How does matching work?",
      "What are the costs?",
      "How do I book a pick-up?",
      "Which materials do you support?",
      "How is impact estimated?",
    ],
  },
} as const;

function isIntroText(content: string): boolean {
  return Object.values(COPY).some((copy) => copy.intro === content);
}

function isSeedMessage(message: Message): boolean {
  if (message.role !== "bot") return false;
  return Object.values(COPY).some((copy) => copy.greeting === message.content || copy.intro === message.content);
}

const HISTORY_KEY = "offcut-chat-history";
const INTRO_KEY = "offcut-chat-intro-shown";
const LEGACY_HISTORY_KEY = "circularlink-chat-history";
const LEGACY_INTRO_KEY = "circularlink-chat-intro-shown";

export function ChatWidget() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "bot", content: COPY[lang].greeting }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    messagesEndRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Load history and, on the first homepage visit only, seed an intro message.
  useEffect(() => {
    let initial: Message[] = [{ role: "bot", content: c.greeting }];
    try {
      const stored = localStorage.getItem(HISTORY_KEY) ?? localStorage.getItem(LEGACY_HISTORY_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (m): m is Message =>
              Boolean(m) &&
              typeof m === "object" &&
              typeof (m as Message).content === "string" &&
              ["user", "bot"].includes((m as Message).role),
          );
          if (valid.length > 0) {
            initial = valid.every((m) => isSeedMessage(m))
              ? valid.map((m) => ({
                  role: "bot" as const,
                  content: isIntroText(m.content) ? c.intro : c.greeting,
                }))
              : valid.slice(-20);
          }
        }
      }
    } catch {
      /* corrupted history: start fresh */
    }

    try {
      const introShown = localStorage.getItem(INTRO_KEY) ?? localStorage.getItem(LEGACY_INTRO_KEY);
      if (!introShown && window.location.pathname === "/") {
        if (initial.length === 1) initial = [{ role: "bot", content: c.intro }];
        localStorage.setItem(INTRO_KEY, "1");
      }
    } catch {
      /* storage may be disabled */
    }
    setMessages(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the visitor has not started a real conversation yet, the seeded
  // greeting/intro follows the selected interface language.
  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length || !prev.every((m) => isSeedMessage(m))) return prev;
      const nextContent = prev.some((m) => isIntroText(m.content)) ? c.intro : c.greeting;
      return prev.length === 1 && prev[0].content === nextContent
        ? prev
        : [{ role: "bot", content: nextContent }];
    });
  }, [c.greeting, c.intro]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      /* storage may be disabled */
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  function errorText(code: unknown): string {
    if (code === "chat_unavailable" || code === "invalid_message") {
      return code === "invalid_message" ? c.errorInvalid : c.errorUnavailable;
    }
    return c.errorGeneric;
  }

  async function sendMessage(text: string) {
    const value = text.trim();
    if (!value || isLoading) return;

    const userMessage: Message = { role: "user", content: value };
    const history = messages.slice(-10).map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev.slice(-19), userMessage]);
    setInput("");
    setNotice(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value, history, locale: lang }),
      });
      const data = (await response.json().catch(() => null)) as { response?: string; error?: string } | null;
      if (!response.ok || !data || typeof data.response !== "string" || !data.response.trim()) {
        setMessages((prev) => [...prev.slice(-19), { role: "bot", content: errorText(data?.error) }]);
        return;
      }
      const reply = data.response.trim().slice(0, 2000);
      setMessages((prev) => [...prev.slice(-19), { role: "bot", content: reply }]);
    } catch {
      setMessages((prev) => [...prev.slice(-19), { role: "bot", content: c.errorGeneric }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleVoiceInput() {
    type RecognitionLike = {
      lang: string;
      interimResults: boolean;
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      start: () => void;
    };
    type RecognitionCtor = new () => RecognitionLike;
    const scope = window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    const Recognition = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
    if (!Recognition) {
      setNotice(c.noVoice);
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = lang === "it" ? "it-IT" : "en-US";
      recognition.interimResults = false;
      recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) setInput(transcript);
      };
      recognition.onerror = () => setNotice(c.noVoice);
      recognition.start();
    } catch {
      setNotice(c.noVoice);
    }
  }

  function handleVoiceOutput() {
    if (!("speechSynthesis" in window)) {
      setNotice(c.noSpeech);
      return;
    }
    const lastBot = [...messages].reverse().find((m) => m.role === "bot");
    if (!lastBot) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastBot.content);
    utterance.lang = lang === "it" ? "it-IT" : "en-US";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div id="chat-widget">
      <div id="chat-panel" className={isOpen ? "open" : ""} role="dialog" aria-label={c.title}>
        <div id="chat-header">
          <h3>
            {c.title}
            <span className="ai-status"><i aria-hidden />{c.status}</span>
          </h3>
          <button id="chat-close" type="button" onClick={() => { setIsOpen(false); window.speechSynthesis?.cancel(); }} aria-label={c.close}>
            &times;
          </button>
        </div>

        <div id="chat-messages" role="log" aria-live="polite" aria-label={c.historyLabel}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <b>{msg.role === "bot" ? c.title : c.you}</b>
              <p>{msg.content}</p>
            </div>
          ))}
          {isLoading ? (
            <div className="chat-message bot">
              <b>{c.title}</b>
              <p>{c.typing}</p>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 ? (
          <div className="chat-chips">
            {c.chips.map((chip) => (
              <button key={chip} type="button" onClick={() => sendMessage(chip)} disabled={isLoading}>
                {chip}
              </button>
            ))}
          </div>
        ) : null}

        <div id="chat-input-area">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
          >
            <label htmlFor="chat-input" className="sr-only">{c.placeholder}</label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={c.placeholder}
              maxLength={2000}
              disabled={isLoading}
            />
            <p className="sr-only" role="status" aria-live="polite">{notice}</p>
            {notice ? <p className="mt-2 text-[12px] leading-relaxed text-muted" aria-hidden="true">{notice}</p> : null}
            <div className="chat-actions">
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn-offcut ghost sm" onClick={handleVoiceInput} disabled={isLoading} title={c.voiceInput} aria-label={c.voiceInput}>
                  <span aria-hidden="true">🎤</span>
                </button>
                <button
                  type="button"
                  className="btn-offcut ghost sm"
                  onClick={handleVoiceOutput}
                  disabled={isLoading || !messages.some((m) => m.role === "bot")}
                  title={c.readAloud}
                  aria-label={c.readAloud}
                >
                  <span aria-hidden="true">🔊</span>
                </button>
              </div>
              <button type="submit" className="btn-offcut sm" disabled={isLoading || !input.trim()} aria-label={c.send}>
                {c.send}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="chat-launcher">
        <span className="chat-launcher-label" aria-hidden="true">{c.askBot}</span>
        <button
          id="chat-toggle"
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? c.close : c.open}
          aria-expanded={isOpen}
          aria-controls="chat-panel"
          title={c.title}
        >
          {isOpen ? <X className="size-6" aria-hidden="true" /> : <MessageSquare className="size-6" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
