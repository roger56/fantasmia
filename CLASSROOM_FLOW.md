# CLASSROOM: Documento Tecnico di Flusso

## Panoramica

La funzionalità **Classroom** permette a un Superuser (SU) di creare uno spazio collaborativo in cui guidare utenti Non-Superuser (NSU) attraverso attività di scrittura basate su turni e prompt condivisi.

---

## ✅ STATO ATTUALE: IMPLEMENTATO

L'API Vercel `/api/admin/rooms` è **attiva e funzionante** su `https://fantasmia-ai.vercel.app/api/admin/rooms`.

### Azioni supportate dall'API:
| Action | Auth | Scopo |
|--------|------|-------|
| `create` | Bearer JWT (ADMIN) | SU crea nuova stanza, ottiene room code + token + link |
| `claim` | Token nel body | NSU/SU entra nella stanza, riceve sessionInfo + roomState |
| `turn` | Bearer JWT (ADMIN) | SU avvia/ferma turno, imposta turnEndsAt |
| `room_patch` | Bearer JWT (ADMIN) | SU aggiorna promptSeed |

### Note:
- **Preview proxy**: Per test multi-browser, pubblicare l'app su URL pubblico (fantasmia.it)
- **Persistenza**: Lo stato stanza è in-memory sul server Vercel (reset al redeploy)

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

## ✅ IMPLEMENTAZIONE COMPLETATA

### SuperuserClassroom.tsx

Il file `src/pages/SuperuserClassroom.tsx` ora chiama l'API reale:

- **Creazione stanza**: `POST /api/admin/rooms` con `action: "create"`, `room_name`, `turn_s`, `ttl_h`
- **Controllo turni**: `action: "turn"` con `turnActive: true/false` e opzionale `turnEndsAt`
- **Aggiornamento spunto**: `action: "room_patch"` con `promptSeed`

### roomSessionManager.ts

Il file `src/utils/roomSessionManager.ts` gestisce:

- **claimRoom()**: Valida token e ottiene sessione
- **refreshRoomState()**: Polling ogni 3s per sincronizzare turnActive/turnEndsAt/promptSeed
- **setTurn() / setPromptSeed()**: Azioni SU per controllare turni e spunto

### Per testare

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
