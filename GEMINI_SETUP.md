# Gemini AI Chatbot Setup

## Ottenere la chiave API Gemini

1. Vai su [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Accedi con il tuo account Google
3. Clicca su "Get API key" o "Create API key"
4. Copia la chiave generata

## Configurare l'ambiente locale

Aggiungi la chiave al file `.env.local`:

```bash
GEMINI_API_KEY=your_api_key_here
```

## Configurare Vercel (Produzione)

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto `circularlink`
3. Settings → Environment Variables
4. Aggiungi:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: la tua chiave API
   - **Environments**: Production, Preview, Development (tutti)
5. Redeploy il progetto

## Verifica

- **Locale**: Il widget chat dovrebbe apparire in basso a destra
- **Produzione**: Dopo il deploy, verifica su `circularlink.app`

## Modello usato

- **Gemini Flash (modelli correnti)** — il server prova `gemini-3.5-flash`, `gemini-3.6-flash` e `gemini-flash-latest` in automatico
- Quota gratuita: 15 richieste/minuto, 1 milione token/minuto

## Knowledge Base

Il bot conosce:
- Come funziona il matching materiali
- Prezzi e commissioni (6%, trasporto, lavorazione)
- Ritiro e consegna con Offcut
- Materiali supportati (carta, legno, plastica)
- Impatto ambientale (CO₂e evitata)
- Area operativa: Emilia-Romagna

## Troubleshooting

**"Gemini API key not configured"**
→ Hai dimenticato di aggiungere `GEMINI_API_KEY` alle variabili d'ambiente

**"Failed to generate response"**
→ Verifica che la chiave sia corretta e attiva

**Il widget non appare**
→ Controlla la console browser per errori JavaScript
