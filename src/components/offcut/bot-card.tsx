"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

type Message = { role: "bot" | "user"; content: string };

const COPY = {
  it: {
    eyebrow: "ASSISTENTE DI CONOSCENZA OFFCUT",
    title: "Offcut AI",
    desc: "Chiedi a Offcut AI come funzionano gli abbinamenti, prezzi e commissioni, ritiro e consegna.",
    welcome:
      "Ciao! Sono Offcut AI. Chiedimi come funziona l'abbinamento, come si calcolano prezzo, trasporto e lavorazione, o come prenotare un ritiro.",
    placeholder: "Fai una domanda a Offcut AI…",
    speak: "Parla",
    read: "Leggi la risposta",
    send: "Invia",
    sending: "Scrivo…",
    error: "Non sono riuscito a rispondere. Riprova.",
  },
  en: {
    eyebrow: "OFFCUT KNOWLEDGE ASSISTANT",
    title: "Offcut AI",
    desc: "Ask Offcut AI about material matching, pricing & fees, or pick-up/drop-off scheduling.",
    welcome:
      "Hello! I’m Offcut AI. Ask me how matching works, how total prices and transport/processing fees are calculated, or how to book a pick-up or drop-off.",
    placeholder: "Ask Offcut AI a question…",
    speak: "Speak",
    read: "Read answer",
    send: "Send",
    sending: "Typing…",
    error: "I couldn’t answer. Please try again.",
  },
} as const;

export function OffcutBotCard() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const logRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([{ role: "bot", content: c.welcome }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    setMessages((prev) => [{ role: "bot", content: c.welcome }]);
  }, [c.welcome]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: value }]);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value, history }),
      });
      if (!response.ok) throw new Error("chat request failed");
      const data = (await response.json()) as { response: string };
      setMessages((prev) => [...prev, { role: "bot", content: data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: c.error }]);
    } finally {
      setBusy(false);
    }
  }

  function readLast() {
    const last = [...messages].reverse().find((m) => m.role === "bot");
    if (!last || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(last.content);
    utterance.lang = lang === "it" ? "it-IT" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function speak() {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
    };
    const Recognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Recognition) {
      setInput((v) => (v ? v : lang === "it" ? "Come funziona il matching?" : "How does matching work?"));
      return;
    }
    const recognition = new Recognition();
    recognition.lang = lang === "it" ? "it-IT" : "en-US";
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  return (
    <div className="card assistant-card">
      <div className="assistant-heading">
        <div>
          <p className="eyebrow">{c.eyebrow}</p>
          <h2>{c.title}</h2>
          <p className="mut">{c.desc}</p>
        </div>
        <span className="ai-status"><i /> {c.title}</span>
      </div>
      <div id="chat-log" className="chat-log" ref={logRef} role="log" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
            <b>{message.role === "user" ? (lang === "it" ? "Tu" : "You") : c.title}</b>
            <p>{message.content}</p>
          </div>
        ))}
        {busy ? <div className="chat-message bot"><b>{c.title}</b><p>{c.sending}</p></div> : null}
      </div>
      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <textarea
          className="textarea-offcut"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={2}
          maxLength={2000}
          placeholder={c.placeholder}
          aria-label={lang === "it" ? "La tua domanda" : "Your question"}
          required
        />
        <div className="chat-actions">
          <div>
            <button type="button" className="btn sm ghost" onClick={speak}>
              {listening ? "…" : c.speak}
            </button>
            <button type="button" className="btn sm ghost" onClick={readLast}>
              {c.read}
            </button>
          </div>
          <button className="btn sm" type="submit" disabled={busy}>
            {busy ? c.sending : c.send}
          </button>
        </div>
      </form>
    </div>
  );
}
