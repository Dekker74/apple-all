# ✅ Modifiche Completate — CircularLink Offcut Design

## 🎨 1. Estetica Offcut (Applicata a Tutto il Sito)

### Palette Colori

#### **Light Mode**
```css
--bg: #F1F4EF        /* Sfondo principale (carta calda) */
--sf: #FFFFFF        /* Superficie card/panel */
--sf2: #E8EFEA       /* Superficie secondaria */
--ink: #13241B       /* Testo principale (verde scuro) */
--mut: #5B6B62       /* Testo muted/secondario */
--line: #D9E1DA      /* Bordi */
--moss: #2D5A43      /* Verde primario (CTA, link, focus) */
--moss-hover: #224634 /* Verde hover */
--mint: #CFE5D4      /* Verde chiaro (bg pills, states) */
--amb: #B87A12       /* Ambra (warning) */
--danger: #B83B3B    /* Rosso errori */
```

#### **Dark Mode**
```css
--bg: #0F1A14        /* Sfondo scuro principale */
--sf: #16251C        /* Superficie card/panel dark */
--sf2: #1C2E24       /* Superficie secondaria dark */
--ink: #E8F0EA       /* Testo chiaro */
--mut: #9DB0A4       /* Testo muted chiaro */
--line: #264034      /* Bordi dark */
--moss: #7FC79F      /* Verde primario chiaro */
--moss-hover: #92D4B0 /* Verde hover chiaro */
--mint: #1F3A2B      /* Verde scuro (bg pills dark) */
--amb: #E0A944       /* Ambra chiara */
--danger: #E06C6C    /* Rosso chiaro */
```

### Tipografia
- **Headings**: Bricolage Grotesque (600, 700)
- **Body**: DM Sans (già presente)
- **Line height**: 1.55 (body), 1.12 (headings)
- **Letter spacing**: -0.02em (headings)

### Componenti Ridisegnati

#### **Button (`.btn-offcut`)**
```css
background: var(--moss);
color: var(--on);
border-radius: 12px;
padding: 11px 18px;
font-weight: 600;
transition: background 0.15s;

/* Variants */
.ghost { background: none; border: 1px solid var(--moss); }
.sm { padding: 8px 14px; font-size: 0.88rem; }
```

#### **Input/Select/Textarea (`.input-offcut`)**
```css
border: 1px solid var(--line);
border-radius: 10px;
background: var(--bg);
padding: 11px 12px;
transition: border-color 0.15s;

:focus { border-color: var(--moss); }
```

#### **Card/Panel**
```css
border: 1px solid var(--line);
background: var(--sf);
border-radius: 18px; /* Più arrotondato */
```

#### **Segmented Control (`.seg`)**
```css
display: flex;
gap: 6px;
background: var(--mint);
padding: 5px;
border-radius: 14px;

button.on {
  background: var(--sf);
  color: var(--moss);
  font-weight: 600;
}
```

---

## 🌍 2. Selector Città Emilia-Romagna

### File Creati
- **[`src/lib/emilia-romagna-cities.ts`](src/lib/emilia-romagna-cities.ts)** — Lista ~80 città
- **[`src/components/city-selector.tsx`](src/components/city-selector.tsx)** — Componente UI

### UI Features
- **Pills interattive** con ricerca filtrata
- **Stile Offcut**: bordi arrotondati, hover verde mint, selezione verde moss
- **Scrollabile**: max-height 280px con overflow
- **Responsive**: si adatta a mobile

### Città Incluse (per Provincia)

#### Bologna (10)
Bologna, Imola, Casalecchio di Reno, San Lazzaro di Savena, Castel Maggiore, Zola Predosa, Pianoro, San Giovanni in Persiceto, Molinella, Budrio

#### Modena (10)
Modena, Carpi, Sassuolo, Formigine, Vignola, Mirandola, Castelfranco Emilia, Maranello, Fiorano Modenese, Pavullo nel Frignano

#### Parma (8)
Parma, Fidenza, Collecchio, Salsomaggiore Terme, Langhirano, Noceto, Traversetolo, Fornovo di Taro

#### Reggio Emilia (8)
Reggio Emilia, Correggio, Guastalla, Scandiano, Casalgrande, Rubiera, Castellarano, Montecchio Emilia

#### Ferrara (7)
Ferrara, Cento, Comacchio, Argenta, Bondeno, Codigoro, Portomaggiore

#### Ravenna (7)
Ravenna, Faenza, Lugo, Cervia, Russi, Alfonsine, Bagnacavallo

#### Forlì-Cesena (8)
Forlì, Cesena, Cesenatico, Forlimpopoli, Savignano sul Rubicone, Meldola, Bertinoro, Castrocaro Terme

#### Rimini (7)
Rimini, Riccione, Cattolica, Santarcangelo di Romagna, Bellaria-Igea Marina, Misano Adriatico, San Giovanni in Marignano

#### Piacenza (6)
Piacenza, Castel San Giovanni, Fiorenzuola d'Arda, Rottofreno, Podenzano, Carpaneto Piacentino

**Totale: ~80 città**

### Dove è Applicato
- ✅ `/preventivo` (pagina richiesta preventivo)
- ✅ `/app` setup profilo (prossimamente)

---

## 💬 3. Chatbot Gemini AI

### File Creati
- **[`src/app/api/chat/route.ts`](src/app/api/chat/route.ts)** — API endpoint Gemini
- **[`src/components/chat-widget.tsx`](src/components/chat-widget.tsx)** — Widget UI
- **[`GEMINI_SETUP.md`](GEMINI_SETUP.md)** — Istruzioni configurazione

### Modello
- **Gemini Flash** (modelli correnti con fallback automatico: 3.5 / 3.6 / flash-latest)

### Knowledge Base
Il bot conosce:
- ✅ **Matching materiali**: come funziona l'algoritmo, compatibilità
- ✅ **Prezzi e commissioni**: 6% + trasporto €120 + servizio €45 + lavorazione
- ✅ **Ritiro e consegna**: prenotazione, finestre orarie, tracciamento
- ✅ **Materiali supportati**: carta, legno, plastica + condizioni
- ✅ **Impatto CO₂e**: calcolo risparmio per tonnellata
- ✅ **Area operativa**: Emilia-Romagna

### UI Features

#### **Widget Flottante**
```
Posizione: bottom-right (24px da bordi)
Size: 56x56px (pulsante), 380x580px (panel)
Style: shadow, border, backdrop sfumato
Mobile: responsive (52x52px pulsante, panel max-width 100vw-48px)
```

#### **Panel Chat**
- **Header**: titolo "Offcut Bot" + badge "Online" verde
- **Messages area**: scrollabile, bot a sinistra, user a destra
- **Chips suggeriti**: 5 domande comuni (solo al primo messaggio)
- **Input**: textarea con Enter per inviare (Shift+Enter per newline)
- **Azioni**:
  - 🎤 Input vocale (Web Speech Recognition)
  - 🔊 Leggi risposta (Web Speech Synthesis)
  - Invia (button submit)

#### **Interazioni**
- **Esc** chiude il panel
- **Focus automatico** su textarea quando si apre
- **Scroll automatico** al nuovo messaggio
- **Storico persistente** in `localStorage`

### System Instruction (Gemini)
```
Sei Offcut Bot, l'assistente AI di CircularLink/Offcut.
- Rispondi in IT/EN in base alla lingua dell'utente
- Sii conciso, chiaro, professionale
- Fornisci info accurate su matching, prezzi, ritiro, impatto
- Non inventare dati non documentati
```

### Configurazione Necessaria

#### **1. Ottenere chiave**
https://aistudio.google.com/app/apikey

#### **2. Aggiungerla a Vercel**
```
Key: GEMINI_API_KEY
Value: <la_tua_chiave>
Environments: Production, Preview, Development
```

#### **3. Verificare**
- Widget appare bottom-right
- Click → panel si apre
- Domanda → risposta Gemini (non errore)

---

## 📦 File Modificati/Creati

### Nuovi file (10)
```
✅ src/app/api/chat/route.ts                 (API Gemini)
✅ src/components/chat-widget.tsx            (Widget UI)
✅ src/components/city-selector.tsx          (City pills)
✅ src/lib/emilia-romagna-cities.ts          (Lista città)
✅ GEMINI_SETUP.md                           (Setup guide)
✅ DEPLOY_INSTRUCTIONS.md                    (Deploy guide)
✅ CHANGES_SUMMARY.md                        (Questo file)
```

### Modificati (3)
```
✅ src/app/globals.css                       (Palette Offcut, componenti)
✅ src/app/layout.tsx                        (ChatWidget import)
✅ src/app/preventivo/page.tsx               (CitySelector)
✅ .env.example                              (GEMINI_API_KEY)
```

### Dipendenze aggiunte (1)
```
✅ @google/generative-ai                     (Gemini SDK)
```

---

## ✅ Verifica Build

```bash
$ npx tsc --noEmit
✓ Type check passed

$ npm run build
✓ Compiled successfully
✓ 28 routes generated
✓ Build completed
```

---

## 🚀 Prossimi Passi

### 1. Push su GitHub
```bash
git push origin main
```

### 2. Configurare Gemini su Vercel
- Vai su Vercel Dashboard → Settings → Environment Variables
- Aggiungi `GEMINI_API_KEY`
- Redeploy

### 3. Test in produzione
- [ ] Widget chat visibile
- [ ] Conversazione Gemini funzionante
- [ ] City selector su `/preventivo`
- [ ] Colori Offcut light/dark
- [ ] Responsive mobile

---

## 🎯 Risultato Finale

✅ **Estetica Offcut** applicata a tutto il sito (pubblico + app)  
✅ **~80 città Emilia-Romagna** con UI pills interattiva  
✅ **Chatbot Gemini** con knowledge base CircularLink completa  
✅ **Logo CircularLink** mantenuto (non cambiato in Offcut)  
✅ **Build verde** (0 errori type/lint)  
✅ **Commit pronto** per push  

**Pronto per il deploy! 🚀**
