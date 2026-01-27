# CLASSROOM: Documento Tecnico di Flusso

## Panoramica

La funzionalità **Classroom** permette a un Superuser (SU) di creare uno spazio collaborativo in cui guidare utenti Non-Superuser (NSU) attraverso attività di scrittura basate su turni e prompt condivisi.

---

## 🔴 STATO ATTUALE: NON FUNZIONANTE

Il sistema presenta un **problema critico**: l'API Vercel per la gestione delle stanze (`/api/admin/rooms`) **non esiste ancora** o non implementa gli endpoint necessari.

### Sintomi osservati:
- **"Token non valido"**: L'API ritorna 401/403 perché l'endpoint non gestisce `action: "claim"`
- **Redirect al login Lovable**: Il link `/join/:room?token=...` viene intercettato da un sistema di autenticazione (probabilmente il proxy Lovable) prima di raggiungere la tua app
- **Stanza funziona solo localmente**: La stanza creata in `SuperuserClassroom.tsx` usa stato React locale (`useState`), non persiste su server

---

## Flusso Previsto (Come DOVREBBE Funzionare)

### FASE 1: Creazione Stanza da parte del SU

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPERUSER (SU)                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. SU accede a /superuser-settings                                 │
│  2. Clicca su "Gestione Classroom"                                  │
│  3. Viene reindirizzato a /superuser-classroom                      │
│                                                                     │
│  4. Compila il form:                                                │
│     - Nome stanza: "Classe 3B - Laboratorio Storie"                 │
│     - Durata turno: 300 secondi (5 min)                             │
│     - Spunto comune: "Era una notte tempestosa..."                  │
│                                                                     │
│  5. Clicca "Crea Stanza"                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              API VERCEL (MANCANTE!)                                 │
│              POST /api/admin/rooms                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Request Body:                                                      │
│  {                                                                  │
│    "action": "create",                                              │
│    "room_name": "Classe 3B",                                        │
│    "turn_s": 300,                                                   │
│    "promptSeed": "Era una notte...",                                │
│    "adminJwt": "xxx"  // per autenticazione SU                      │
│  }                                                                  │
│                                                                     │
│  Response (attesa):                                                 │
│  {                                                                  │
│    "success": true,                                                 │
│    "room": "room_1706000000000",                                    │
│    "token": "XK7M9PLQ",                                             │
│    "expires_at": "2024-01-23T18:00:00Z"                             │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              FRONTEND GENERA LINK                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Link generato:                                                     │
│  https://fantasmia.lovable.app/join/room_1706000000000?token=XK7M9PLQ│
│                                                                     │
│  SU copia questo link e lo distribuisce (chat, email, LIM, ecc.)    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### FASE 2: Accesso NSU tramite Link

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UTENTE NSU                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NSU riceve il link dal SU                                       │
│  2. Apre il link in un browser (anche diverso da quello del SU)     │
│                                                                     │
│  URL: /join/room_1706000000000?token=XK7M9PLQ                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              JoinRoom.tsx                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Estrae parametri:                                                  │
│  - room = "room_1706000000000" (da URL path)                        │
│  - token = "XK7M9PLQ" (da query string)                             │
│                                                                     │
│  Mostra UI "Accesso alla stanza..."                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              roomSessionManager.claimRoom()                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Chiama API:                                                        │
│  POST https://fantasmia-ai.vercel.app/api/admin/rooms               │
│  {                                                                  │
│    "action": "claim",                                               │
│    "room": "room_1706000000000",                                    │
│    "token": "XK7M9PLQ"                                              │
│  }                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
        ┌───────────────────┐     ┌───────────────────┐
        │   API RISPONDE    │     │   API NON ESISTE  │
        │   200 OK          │     │   O ERRORE        │
        └───────────────────┘     └───────────────────┘
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐     ┌───────────────────┐
        │  Salva sessione   │     │  "Token non       │
        │  in localStorage  │     │   valido"         │
        │                   │     │                   │
        │  Redirect a /     │     │  Mostra errore    │
        └───────────────────┘     └───────────────────┘
```

### FASE 3: Sincronizzazione e Turni (se tutto funziona)

```
┌─────────────────────────────────────────────────────────────────────┐
│              POLLING SINCRONIZZAZIONE (ogni 3s)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Ogni 3 secondi, roomSessionManager.refreshRoomState() chiama:      │
│                                                                     │
│  POST /api/admin/rooms                                              │
│  { "action": "claim", "room": "...", "token": "..." }               │
│                                                                     │
│  L'API risponde con lo stato aggiornato:                            │
│  {                                                                  │
│    "roomState": {                                                   │
│      "turnActive": true,                                            │
│      "turnEndsAt": 1706001234567,                                   │
│      "promptSeed": "Era una notte tempestosa..."                    │
│    }                                                                │
│  }                                                                  │
│                                                                     │
│  Il banner si aggiorna mostrando:                                   │
│  - Countdown turno                                                  │
│  - Spunto comune                                                    │
│  - Stato (Turno attivo / Turno terminato)                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### FASE 4: NSU Scrive la Storia

```
┌─────────────────────────────────────────────────────────────────────┐
│              NSU DURANTE IL TURNO                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NSU vede il RoomBanner fisso in basso con:                      │
│     - Nome stanza                                                   │
│     - Countdown "4:32"                                              │
│     - Badge "Partecipante"                                          │
│     - Spunto: "Era una notte tempestosa..."                         │
│                                                                     │
│  2. NSU naviga all'editor (es. /create-story)                       │
│                                                                     │
│  3. Il sistema verifica isEditableForNSU():                         │
│     - Se turno attivo: NSU può scrivere                             │
│     - Se turno scaduto: NSU NON può modificare                      │
│                                                                     │
│  4. NSU scrive basandosi sullo spunto comune                        │
│                                                                     │
│  5. Quando il turno scade:                                          │
│     - Il testo viene "bloccato"                                     │
│     - NSU attende il prossimo turno o istruzioni dal SU             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 PROBLEMI IDENTIFICATI

### Problema 1: API Vercel Mancante

**File**: `src/utils/roomSessionManager.ts` linea 35

```typescript
const ROOMS_API_URL = 'https://fantasmia-ai.vercel.app/api/admin/rooms';
```

Questa API deve supportare:

| Action | Metodo | Scopo |
|--------|--------|-------|
| `create` | POST + adminJwt | SU crea nuova stanza |
| `claim` | POST | NSU/SU entra nella stanza con token |
| `turn` | POST + adminJwt | SU avvia/ferma/salta turno |
| `room_patch` | POST + adminJwt | SU aggiorna spunto comune |
| `close` | POST + adminJwt | SU chiude la stanza |

### Problema 2: Stanza Solo Locale

**File**: `src/pages/SuperuserClassroom.tsx` linea 63-74

```typescript
// TODO: Call API to create room
// await fetch('/api/rooms', { method: 'POST', body: ... })

setActiveRoom({
  token,
  room: roomId,
  // ...questo stato esiste SOLO nel browser del SU!
});
```

La stanza viene creata **solo nello stato React locale**. Non esiste persistenza server-side.

### Problema 3: Link Intercettato

Quando si apre il link in un altro browser:

1. Il browser fa GET a `/join/room_xxx?token=yyy`
2. Lovable preview proxy potrebbe richiedere autenticazione
3. L'utente vede la pagina di login Lovable invece di JoinRoom.tsx

**Soluzione**: Questo problema si risolve **pubblicando l'app** su dominio custom o Lovable published URL.

---

## ✅ COSA SERVE PER FAR FUNZIONARE IL SISTEMA

### 1. Implementare API Vercel `/api/admin/rooms`

```typescript
// api/admin/rooms.ts (da creare su Vercel)

const rooms = new Map(); // In produzione: Redis o database

export default async function handler(req, res) {
  const { action, room, token, adminJwt, ...params } = req.body;

  switch (action) {
    case 'create':
      // Verifica adminJwt, crea stanza, genera token
      break;
      
    case 'claim':
      // Verifica token, ritorna sessione e stato stanza
      break;
      
    case 'turn':
      // Solo SU: avvia/ferma turno
      break;
      
    case 'room_patch':
      // Solo SU: aggiorna promptSeed
      break;
  }
}
```

### 2. Collegare SuperuserClassroom all'API

Sostituire i `TODO` in `SuperuserClassroom.tsx` con chiamate API reali.

### 3. Pubblicare l'app

Per testare da browser diversi, l'app deve essere pubblicata (non in preview mode).

---

## Diagramma Riassuntivo

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLASSROOM FLOW                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────┐                                                            │
│   │   SU    │                                                            │
│   └────┬────┘                                                            │
│        │ 1. Crea stanza                                                  │
│        ▼                                                                 │
│   ┌─────────────────────┐      2. API crea e ritorna token               │
│   │ /superuser-classroom│ ─────────────────────────────────┐             │
│   └─────────────────────┘                                  │             │
│        │                                                   ▼             │
│        │ 3. SU copia link              ┌───────────────────────────┐     │
│        │    e lo distribuisce          │  API Vercel               │     │
│        │                               │  /api/admin/rooms         │     │
│        │                               │  (IN-MEMORY o REDIS)      │     │
│        │                               └───────────────────────────┘     │
│        │                                           ▲                     │
│   ┌────┴────┐                                      │                     │
│   │  NSU 1  │ 4. Clicca link ──► /join/:room ──────┤ claim               │
│   └─────────┘                                      │                     │
│                                                    │                     │
│   ┌─────────┐                                      │                     │
│   │  NSU 2  │ 4. Clicca link ──► /join/:room ──────┤ claim               │
│   └─────────┘                                      │                     │
│                                                    │                     │
│   ┌─────────┐                                      │                     │
│   │  NSU N  │ 4. Clicca link ──► /join/:room ──────┘ claim               │
│   └─────────┘                                                            │
│                                                                          │
│                      5. Tutti vedono RoomBanner                          │
│                         con polling ogni 3s                              │
│                                                                          │
│                      6. SU avvia turno                                   │
│                         API aggiorna stato                               │
│                                                                          │
│                      7. NSU vedono countdown                             │
│                         e scrivono durante turno                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Prossimi Passi

1. **Implementa API Vercel** con almeno `create` e `claim`
2. **Collega SuperuserClassroom** all'API
3. **Pubblica l'app** per test multi-browser
4. **Testa il flusso completo** end-to-end
