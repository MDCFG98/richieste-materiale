# Richieste Materiale — Guida Setup su Google AI Studio

App per la gestione delle richieste di materiale degli operai.
Backend: Firebase (Firestore + Auth + Storage)
IDE: Google AI Studio (browser-based, sostituto di Firebase Studio)

---

## COSA È GOOGLE AI STUDIO (in breve)

Google AI Studio (aistudio.google.com) è il nuovo ambiente di sviluppo
browser-based che sostituisce Firebase Studio. Funziona esattamente come
Firebase Studio: ci entri dal browser, scrivi codice, e fai il deploy
direttamente su Firebase App Hosting. Firestore e Authentication sono
integrati nativamente.

---

## STEP 1 — Crea il progetto Firebase (backend)

Prima di toccare Google AI Studio, crea il backend Firebase:

1. Vai su https://console.firebase.google.com
2. Clicca "Aggiungi progetto" → nome: richieste-materiale (o simile)
3. Disabilita Google Analytics (non serve) → Crea progetto

### Abilita Authentication
→ Console Firebase → Authentication → Inizia
→ Scheda "Sign-in method" → Email/Password → Abilita

### Abilita Firestore
→ Console Firebase → Firestore Database → Crea database
→ Scegli "Modalità produzione"
→ Regione: europe-west1

### Abilita Storage (per i messaggi audio)
→ Console Firebase → Storage → Inizia
→ Accetta le regole predefinite (le sostituiremo dopo)

### Prendi le credenziali
→ Console Firebase → Impostazioni progetto (ingranaggio in alto a sinistra)
→ Scheda "Generale" → "Le tue app" → clicca "Aggiungi app" → Web (</>)
→ Nome: richieste-web → Registra app
→ COPIA l'intero oggetto firebaseConfig (ti serve al passo 4)

---

## STEP 2 — Entra in Google AI Studio

1. Vai su https://aistudio.google.com
2. Accedi con il tuo account Google (stesso account del progetto Firebase)
3. Clicca "Nuovo progetto" o "New project"
4. Scegli il tuo progetto Firebase creato al passo 1
   (Google AI Studio lo rileva automaticamente grazie all'account)

---

## STEP 3 — Carica i file del progetto

In Google AI Studio trovi un pannello file a sinistra (uguale a Firebase Studio).
Devi ricreare questa struttura caricando i file dallo ZIP:

```
richieste-app/
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── firestore.rules
├── storage.rules
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── login/page.tsx
    │   ├── pending/page.tsx
    │   ├── operaio/page.tsx
    │   ├── magazzino/page.tsx
    │   └── admin/page.tsx
    ├── contexts/
    │   └── AuthContext.tsx
    └── lib/
        └── firebase.ts     ← ⚠️ DA COMPILARE (vedi step 4)
```

COME CARICARE: In Google AI Studio clicca col tasto destro sulla cartella
"src" nel pannello file → "Upload files" oppure crea i file uno per uno
con "New file" e incolla il contenuto dallo ZIP.

---

## STEP 4 — Configura le credenziali Firebase

Apri il file `src/lib/firebase.ts` e sostituisci i valori INSERISCI_QUI
con quelli copiati al passo 1:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← il tuo valore
  authDomain: "nome-app.firebaseapp.com",
  projectId: "nome-app",
  storageBucket: "nome-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

Salva il file (Ctrl+S).

---

## STEP 5 — Installa le dipendenze

Nel terminale integrato di Google AI Studio (in basso, scheda "Terminal"):

```bash
npm install
```

Aspetta che finisca (1-2 minuti).

---

## STEP 6 — Carica le regole di sicurezza Firestore

1. Vai su console.firebase.google.com → Firestore → Regole
2. Cancella tutto il testo esistente
3. Incolla il contenuto del file `firestore.rules`
4. Clicca "Pubblica"

Poi fai lo stesso per Storage:
1. Console Firebase → Storage → Regole
2. Incolla il contenuto del file `storage.rules`
3. Clicca "Pubblica"

---

## STEP 7 — Crea il primo utente Admin (una volta sola)

Il primo admin non può essere approvato da nessuno (non esiste ancora).
Quindi vai fatto manualmente:

1. Avvia l'app in preview da Google AI Studio (tasto ▶ o "Run")
2. Registrati con la tua email (quella del magazzino)
3. Vai su console.firebase.google.com → Firestore → users
4. Trova il tuo documento (ha il tuo uid come ID)
5. Clicca sul campo "role" → modifica da "pending" a "admin" → Salva
6. Torna nell'app → aggiorna la pagina → entrerai come Admin

Da quel momento puoi approvare tutti gli altri utenti dal pannello Admin
dell'app senza toccare più Firestore manualmente.

---

## STEP 8 — Deploy su Firebase App Hosting

Nel terminale di Google AI Studio:

```bash
npm run build
firebase deploy --only apphosting
```

Oppure usa il pulsante "Deploy" di Google AI Studio se disponibile.

---

## COME FUNZIONA L'APP

### Per gli OPERAI
- Si registrano → il magazzino li approva come "Operaio"
- Schermata unica: scrivono testo libero O registrano un audio vocale
- Inviano la richiesta → appare nella loro lista con lo stato aggiornato

### Per il MAGAZZINO  
- Si registrano → admin li approva come "Magazzino"
- Vedono TUTTE le richieste di tutti gli operai in tempo reale
- Badge rosso in alto con il numero di richieste ancora in attesa
- Filtri per stato: Tutte / In attesa / Ordinato / Acquistato / In lavorazione
- Su ogni richiesta: 3 pulsanti → ACQUISTATO | ORDINATO | IN LAVORAZIONE

### Per l'ADMIN
- Come Magazzino + pannello Gestione Utenti
- Approva nuovi utenti e assegna ruolo (Operaio / Magazzino / Admin)
- Può anche sospendere utenti (rimettere a "pending")

---

## RUOLI

| Ruolo     | Cosa può fare                                         |
|-----------|-------------------------------------------------------|
| pending   | Registrato, in attesa di approvazione                 |
| operaio   | Invia richieste, vede solo le proprie                 |
| magazzino | Vede e gestisce tutte le richieste                    |
| admin     | Come magazzino + approva/gestisce utenti              |

---

## STRUTTURA DATI FIRESTORE

### Collezione `users/{uid}`
```
name: string
email: string
role: 'pending' | 'operaio' | 'magazzino' | 'admin'
createdAt: timestamp
```

### Collezione `richieste/{id}`
```
text: string           (testo scritto, può essere vuoto se c'è audio)
audioUrl: string|null  (URL Firebase Storage del messaggio vocale)
authorId: string       (uid dell'operaio che ha inviato)
authorName: string     (nome dell'operaio)
status: 'pending' | 'ordinato' | 'acquistato' | 'in_lavorazione'
createdAt: timestamp
updatedAt: timestamp   (aggiornato quando il magazzino cambia stato)
```
