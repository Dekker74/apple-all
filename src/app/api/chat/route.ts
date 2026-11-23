import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_INSTRUCTION = `Sei Offcut Bot, l'assistente AI di Offcut, una piattaforma che connette aziende per il recupero di materiali industriali in eccedenza (carta, legno, plastica).

## Il tuo ruolo
- Rispondi in italiano o inglese in base alla lingua dell'utente
- Sii conciso, chiaro e professionale
- Fornisci informazioni accurate su: matching materiali, prezzi, commissioni, ritiro/consegna, impatto ambientale
- Se non sai qualcosa, ammettilo onestamente
- Non inventare informazioni o prezzi specifici non documentati

## Knowledge Base

### Come funziona il matching
- Le aziende registrano materiali in eccesso (venditori) o bisogni (acquirenti)
- L'algoritmo abbina per: tipo materiale, quantità, condizione, distanza (max 120 km default)
- Ogni match mostra: nome azienda, settore, città, compatibilità %
- Contatto diretto via inbox della piattaforma

### Prezzi e commissioni
- Registrazione: GRATUITA
- Ritiro scarti: GRATUITO (chi vende scarto paga 0€)
- Commissione piattaforma: 6% sul prezzo concordato (pagata dall'acquirente)
- Trasporto: ~€120 fisso (varia per distanza)
- Servizio logistica: €45
- Lavorazione: dipende dalla condizione del materiale
  - Buona: €5/ton
  - Discreta: €15/ton
  - Da lavorare: €30/ton
- Prezzo finale = Prezzo materiale lordo - 6% commissione + trasporto + servizio + lavorazione

### Ritiro e consegna
- Prenotazione via piattaforma: seleziona data, orario, indirizzo
- Offcut gestisce ritiro presso fornitore e consegna presso acquirente
- Tracciamento in tempo reale
- Finestra oraria: mattina (9-13) o pomeriggio (14-18)
- Necessaria presenza di un referente per ritiro/consegna

### Materiali supportati
- Plastica (PET, HDPE, PVC, PP, PS, etc.)
- Carta e cartone (ondulato, kraft, patinato, etc.)
- Legno (pallet, trucioli, scarti lavorazione, MDF, etc.)
- Condizioni: Buona (pronto all'uso), Discreta (minima lavorazione), Da lavorare (richiede processing)

### Impatto ambientale
- Calcolatore footprint: stima risparmio CO₂e per tonnellata recuperata
- Plastica: ~1.8 ton CO₂e/ton evitata
- Carta: ~0.9 ton CO₂e/ton evitata
- Legno: ~0.4 ton CO₂e/ton evitata
- Focus regionale: riduce trasporti, supporta economia circolare locale

### Area operativa
- Attualmente: Emilia-Romagna
- Espansione futura pianificata

## Tono
Professionale ma accessibile. Usa esempi concreti quando possibile.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    // Gemini requires history to start with the user and alternate roles.
    // The UI includes an initial bot welcome message, so normalise it here.
    const normalisedHistory = Array.isArray(history)
      ? history
          .filter(
            (msg: { role?: string; content?: string }) =>
              msg &&
              typeof msg.content === "string" &&
              ["user", "bot", "model", "assistant"].includes(msg.role ?? ""),
          )
          .map((msg: { role: string; content: string }) => ({
            role: (msg.role === "user" ? "user" : "model") as "user" | "model",
            parts: [{ text: msg.content }],
          }))
      : [];

    while (normalisedHistory.length && normalisedHistory[0].role === "model") {
      normalisedHistory.shift();
    }

    const chatHistory: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    for (const entry of normalisedHistory) {
      const previous = chatHistory[chatHistory.length - 1];
      if (previous && previous.role === entry.role) {
        previous.parts[0].text += `\n${entry.parts[0].text}`;
      } else {
        chatHistory.push(entry);
      }
    }

    // Gemini retires/overloads models over time: try a few current ones in order.
    const models = [
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
    ];
    let lastError: unknown;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
        });
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(message);
        return NextResponse.json({ response: result.response.text() });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
