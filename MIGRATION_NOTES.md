# Fantas-Mia V2 - Note di Migrazione

## Strategia di Migrazione

### Parti da NON TOCCARE (Invarianti)
Queste funzionalità sono stabili e testate, NON devono essere modificate:

#### Editor di Storie (7 Modalità)
```
src/pages/
├── CampbellEditor.tsx ❌ NON MODIFICARE
├── CSSEditor.tsx ❌ NON MODIFICARE  
├── ProppEditor.tsx ❌ NON MODIFICARE
├── ProppModeSelector.tsx ❌ NON MODIFICARE
├── ProfessionStoryEditor.tsx ❌ NON MODIFICARE
├── AirotsEditor.tsx ❌ NON MODIFICARE
├── GhostEditor.tsx ❌ NON MODIFICARE
└── ParoleChiamanoEditor.tsx ❌ NON MODIFICARE

src/components/
├── campbell/ ❌ NON MODIFICARE
├── css/ ❌ NON MODIFICARE
├── propp/ ❌ NON MODIFICARE
└── shared/WritingCard.tsx ❌ NON MODIFICARE
```

#### Sistema Autenticazione
```
src/utils/
├── authBridge.ts ❌ NON MODIFICARE
├── authSecurity.ts ❌ NON MODIFICARE
└── userStorage.ts ❌ NON MODIFICARE

src/pages/
├── NewProfile.tsx ❌ NON MODIFICARE
├── Profiles.tsx ❌ NON MODIFICARE
├── PrivacyAcceptanceScreen.tsx ❌ NON MODIFICARE
└── TermsAcceptance.tsx ❌ NON MODIFICARE
```

### Parti da RIPROGETTARE (V2)

#### Dashboard e Navigazione
```
src/pages/
├── Dashboard.tsx ✅ RIPROGETTARE
├── Index.tsx ✅ RIPROGETTARE
└── NewHome.tsx ✅ RIPROGETTARE

src/components/
├── HomeButton.tsx ✅ AGGIORNARE per V2
└── shared/StoryLayout.tsx ✅ AGGIORNARE per V2
```

#### Sistema Archivi
```
src/pages/
├── UserArchive.tsx ✅ RIPROGETTARE (AM)
├── ReadingStories.tsx ✅ RIPROGETTARE (AG)
├── ScienceStories.tsx ✅ RIPROGETTARE (AG)
└── StoryViewer.tsx ✅ AGGIORNARE per V2

src/pages/ (Superuser)
├── SuperuserArchive.tsx ✅ RIPROGETTARE (AG Management)
├── SuperuserReadingStories*.tsx ✅ RIPROGETTARE (AG Management)
└── SuperUser.tsx ✅ AGGIORNARE per V2
```

#### Gestione Media
```
src/components/shared/
├── ImageViewerDialog.tsx ✅ AGGIORNARE overlay
├── StoryImageIndicator.tsx ✅ MANTENERE indicatori
├── MediaGenerationDialog.tsx ✅ AGGIORNARE (no testo in AI)
└── CreativeMediaMenu*.tsx ✅ AGGIORNARE per V2
```

## Fasi di Implementazione

### Fase 1: Setup e Documentazione ✅
- [x] README_V2.md
- [x] MIGRATION_NOTES.md
- [x] ARCHITECTURE.md

### Fase 2: UI/UX Standardization
- [ ] Aggiornare StoryLayout per barra superiore V2
- [ ] Unificare stile pulsanti Indietro/Home
- [ ] Verificare ProfileIndicator drag-and-drop

### Fase 3: Gestione Media
- [ ] Implementare storage IndexedDB
- [ ] Aggiornare generazione AI (no testo)
- [ ] Confermare overlay media

### Fase 4: Architettura Archivi
- [ ] Implementare separazione AM/AG
- [ ] Aggiornare UserArchive (AM)
- [ ] Aggiornare ReadingStories/ScienceStories (AG)
- [ ] Riprogettare Dashboard

### Fase 5: Testing
- [ ] Test parti invarianti (non modificate)
- [ ] Test nuove implementazioni
- [ ] Validazione separazione AM/AG

## Principi di Sviluppo V2

### DO (Fare)
- ✅ Mantenere tutte le funzionalità esistenti
- ✅ Usare design system semantico (HSL tokens)
- ✅ Implementare conferme esplicite per eliminazioni
- ✅ Assicurare separazione netta AM/AG
- ✅ Visualizzare media in overlay
- ✅ Mantenere ProfileIndicator spostabile

### DON'T (Non Fare)
- ❌ Modificare logica di creazione storie
- ❌ Cambiare sistema autenticazione
- ❌ Usare colori diretti (solo tokens semantici)
- ❌ Aprire media in nuove schede
- ❌ Permettere contaminazione AM/AG
- ❌ Generare immagini AI con testo

## Compatibilità
Il sistema V2 deve essere completamente retrocompatibile con:
- Storie esistenti create con V1
- Profili utente esistenti  
- Media salvati precedentemente
- Sistema di autenticazione corrente

## Rollback Strategy
In caso di problemi, le parti invarianti garantiscono che:
- Gli utenti possano continuare a creare storie
- L'autenticazione funzioni correttamente
- I dati esistenti rimangano accessibili