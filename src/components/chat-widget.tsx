"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface Message {
  role: "user" | "bot";
  content: string;
}

const SUGGESTED_CHIPS = [
  "Come funziona il matching?",
  "Quali sono i costi?",
  "Come prenoto un ritiro?",
  "Quali materiali supportate?",
  "Calcola il mio impatto CO₂",
];

const GREETING: Message = {
  role: "bot",
  content:
    "Ciao! Sono Offcut Bot. Chiedimi come funziona il matching, i costi, come prenotare un ritiro, o calcolare il tuo impatto ambientale.",
};

const FIRST_VISIT_INTRO: Message = {
  role: "bot",
  content:
    "Ciao! Sono Offcut Bot, l'assistente di Offcut. Ti aiuto a capire come funziona il marketplace per i materiali in eccedenza: abbinamenti, prezzi e commissioni, ritiro e consegna, impatto ambientale. Scegli una domanda qui sotto o scrivimi pure.",
};

const HISTORY_KEY = "circularlink-chat-history";
const INTRO_KEY = "circularlink-chat-intro-shown";

export function ChatWidget() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load history and, on the very first visit only, open with a short intro.
  useEffect(() => {
    let hasHistory = false;
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          hasHistory = true;
        }
      }
    } catch (e) {
      console.error("Failed to parse chat history:", e);
    }

    try {
      // The intro should welcome someone landing on the public homepage; it
      // must not cover forms when a user opens a deep link such as /login.
      if (!localStorage.getItem(INTRO_KEY) && window.location.pathname === "/") {
        if (!hasHistory) setMessages([FIRST_VISIT_INTRO]);
        setIsOpen(true);
        localStorage.setItem(INTRO_KEY, "1");
      }
    } catch (e) {
      console.error("Failed to save chat intro state:", e);
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const data = await response.json();
      const botMessage: Message = { role: "bot", content: data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "bot",
        content: t(`Scusa, si è verificato un errore: ${error.message}. Riprova tra poco.`),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleChipClick = (text: string) => {
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert(t("Il riconoscimento vocale non è supportato dal tuo browser."));
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "it-IT";
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.start();
  };

  const handleVoiceOutput = () => {
    if (!("speechSynthesis" in window)) {
      alert(t("La sintesi vocale non è supportata dal tuo browser."));
      return;
    }

    const lastBotMessage = [...messages].reverse().find((msg) => msg.role === "bot");
    if (!lastBotMessage) return;

    const utterance = new SpeechSynthesisUtterance(lastBotMessage.content);
    utterance.lang = "it-IT";
    speechSynthesis.speak(utterance);
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div id="chat-widget">
      <div id="chat-panel" className={isOpen ? "open" : ""}>
        <div id="chat-header">
          <h3>
            Offcut Bot
            <span className="ai-status">
              <i></i>Online
            </span>
          </h3>
          <button id="chat-close" onClick={() => setIsOpen(false)} aria-label={t("Chiudi chat")}>
            &times;
          </button>
        </div>

        <div id="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <b>{msg.role === "bot" ? "Offcut Bot" : t("Tu")}</b>
              <p>{t(msg.content)}</p>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message bot">
              <b>Offcut Bot</b>
              <p>{t("Sto scrivendo...")}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="chat-chips">
            {SUGGESTED_CHIPS.map((chip) => (
              <button key={chip} onClick={() => handleChipClick(chip)}>
                {t(chip)}
              </button>
            ))}
          </div>
        )}

        <div id="chat-input-area">
          <form onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("Scrivi la tua domanda...")}
              maxLength={2000}
              disabled={isLoading}
            />
            <div className="chat-actions">
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn-offcut ghost sm"
                  onClick={handleVoiceInput}
                  disabled={isLoading}
                  title={t("Input vocale")}
                >
                  🎤
                </button>
                <button
                  type="button"
                  className="btn-offcut ghost sm"
                  onClick={handleVoiceOutput}
                  disabled={isLoading || messages.filter((m) => m.role === "bot").length === 0}
                  title={t("Leggi risposta")}
                >
                  🔊
                </button>
              </div>
              <button type="submit" className="btn-offcut sm" disabled={isLoading || !input.trim()}>
                {t("Invia")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="chat-launcher">
        <span className="chat-launcher-label" aria-hidden="true">
          {t("Chiedi al bot")}
        </span>
        <button
          id="chat-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? t("Chiudi chat") : t("Apri chat con Offcut Bot")}
          title="Offcut Bot"
        >
          {isOpen ? "✕" : "💬"}
        </button>
      </div>
    </div>
  );
}
