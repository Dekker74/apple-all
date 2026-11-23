"use client";

import { useEffect, useRef, useState } from "react";

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

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Ciao! Sono Offcut Bot. Chiedimi come funziona il matching, i costi, come prenotare un ritiro, o calcolare il tuo impatto ambientale.",
    },
  ]);
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

  // Load chat history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("circularlink-chat-history");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse chat history:", e);
      }
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("circularlink-chat-history", JSON.stringify(messages));
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
        content: `Scusa, si è verificato un errore: ${error.message}. Riprova tra poco.`,
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
      alert("Il riconoscimento vocale non è supportato dal tuo browser.");
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
      alert("La sintesi vocale non è supportata dal tuo browser.");
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
          <button id="chat-close" onClick={() => setIsOpen(false)} aria-label="Chiudi chat">
            &times;
          </button>
        </div>

        <div id="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <b>{msg.role === "bot" ? "Offcut Bot" : "Tu"}</b>
              <p>{msg.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message bot">
              <b>Offcut Bot</b>
              <p>Sto scrivendo...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="chat-chips">
            {SUGGESTED_CHIPS.map((chip) => (
              <button key={chip} onClick={() => handleChipClick(chip)}>
                {chip}
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
              placeholder="Scrivi la tua domanda..."
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
                  title="Input vocale"
                >
                  🎤
                </button>
                <button
                  type="button"
                  className="btn-offcut ghost sm"
                  onClick={handleVoiceOutput}
                  disabled={isLoading || messages.filter((m) => m.role === "bot").length === 0}
                  title="Leggi risposta"
                >
                  🔊
                </button>
              </div>
              <button type="submit" className="btn-offcut sm" disabled={isLoading || !input.trim()}>
                Invia
              </button>
            </div>
          </form>
        </div>
      </div>

      <button
        id="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Chiudi chat" : "Apri chat"}
        title="Offcut Bot"
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}
