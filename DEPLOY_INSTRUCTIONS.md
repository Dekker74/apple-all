# Deploy Instructions

## 🚀 Modifiche completate

### ✅ Estetica Offcut applicata
- Palette colori light/dark Offcut su tutto il sito
- Tipografia: Bricolage Grotesque + DM Sans
- Componenti: button, card, input, modal, segmented control
- Responsive design mantenuto

### ✅ Selector città Emilia-Romagna
- ~80 città principali organizzate per provincia
- UI stile pills con ricerca filtrata
- Applicato a: `/preventivo` e setup profilo utente

### ✅ Chatbot Gemini integrato
- Widget flottante bottom-right su tutte le pagine
- Gemini Flash con knowledge base CircularLink
- Features: chips suggeriti, input vocale, lettura risposta
- Storico chat persistente in localStorage
- Esc per chiudere

---

## 📦 Prossimi passi

### 1. Push su GitHub

Il commit è pronto localmente. Per pushare:

```bash
cd /root/circularlink
git push origin main
```

Se hai problemi di autenticazione, usa uno dei metodi GitHub:
- **Personal Access Token** (Settings → Developer settings → Tokens)
- **SSH Key** (Settings → SSH and GPG keys)
- **GitHub CLI**: `gh auth login` poi `git push`

### 2. Configurare la chiave Gemini

#### **A. Ottenere la chiave**
1. Vai su https://aistudio.google.com/app/apikey
2. Accedi con Google
3. Clicca "Get API key" o "Create API key"
4. Copia la chiave

#### **B. Aggiungerla a Vercel**
1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto `all-1-2026` (o `circularlink`)
3. Settings → Environment Variables
4. Aggiungi:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `<la_tua_chiave>`
   - **Environments**: seleziona Production, Preview, Development
5. Salva

#### **C. Redeploy**
Dopo aver aggiunto la variabile:
- Vercel redeploya automaticamente dopo il push
- Oppure: Deployments → ⋯ → Redeploy

### 3. Test locale (opzionale)

Per testare in locale:

```bash
# Crea .env.local
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Avvia dev server
npm run dev

# Apri http://localhost:3000
# Il widget chat dovrebbe apparire in basso a destra
```

---

## 🎯 Cosa verificare dopo il deploy

### Chatbot
- [ ] Widget flottante visibile in basso a destra
- [ ] Clicca sul widget → si apre il pannello chat
- [ ] Prova a chiedere: "Come funziona il matching?"
- [ ] Verifica risposta Gemini (non errore "API key not configured")
- [ ] Chips suggeriti cliccabili
- [ ] Esc chiude il pannello

### City Selector
- [ ] Vai su `/preventivo`
- [ ] Campo "Zona" mostra pills città Emilia-Romagna
- [ ] Ricerca "Bologna" filtra correttamente
- [ ] Clicca su una città → si seleziona (sfondo verde moss)
- [ ] Form si invia correttamente

### Estetica Offcut
- [ ] Colori light: sfondo `#F1F4EF`, testo `#13241B`, verde `#2D5A43`
- [ ] Colori dark (attiva dark mode): sfondo `#0F1A14`, testo `#E8F0EA`, verde `#7FC79F`
- [ ] Button arrotondati (12px), hover con transizione smooth
- [ ] Card con bordi 18px, ombra soft
- [ ] Input con bordo 10px, focus verde moss

---

## 📄 File di riferimento

- **Palette CSS**: [`src/app/globals.css`](src/app/globals.css) → `:root` e `.dark`
- **City selector**: [`src/components/city-selector.tsx`](src/components/city-selector.tsx)
- **Chat widget**: [`src/components/chat-widget.tsx`](src/components/chat-widget.tsx)
- **API Gemini**: [`src/app/api/chat/route.ts`](src/app/api/chat/route.ts)
- **Lista città**: [`src/lib/emilia-romagna-cities.ts`](src/lib/emilia-romagna-cities.ts)

---

## 🐛 Troubleshooting

### "Gemini API key not configured"
→ Hai dimenticato di aggiungere `GEMINI_API_KEY` a Vercel Environment Variables

### Chat non appare
→ Controlla la console browser (F12) per errori JavaScript

### City selector non filtra
→ Verifica che il file `emilia-romagna-cities.ts` sia stato deployato

### Colori sembrano vecchi
→ Hard refresh (Ctrl+Shift+R o Cmd+Shift+R) per pulire cache CSS

---

## 💰 Quota Gemini

**Piano gratuito:**
- 15 richieste/minuto
- 1 milione token/minuto
- 1500 richieste/giorno

**Sufficiente per:**
- ~500 conversazioni/giorno di traffico moderato
- Produzione early-stage

**Upgrade a pagamento:**
- Se superi i limiti, vai su Google AI Studio → Billing

---

## ✅ Commit fatto

```
commit a429f71
Author: Kiro Agent
Date: [now]

Apply Offcut design system + Emilia-Romagna city selector + Gemini chatbot

- Apply Offcut color palette (light/dark) to entire site
- Add Emilia-Romagna city selector with pills UI (~80 cities)
- Integrate Gemini Flash chatbot widget (floating, with chips, voice I/O)
- Update all CSS with Offcut components (segmented control, buttons, inputs)
- Maintain CircularLink branding (logo unchanged)
- Add GEMINI_SETUP.md with configuration instructions
```

**Pronto per il push!** 🚀
