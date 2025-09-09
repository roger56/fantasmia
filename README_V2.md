# Fantas-Mia V2 - Specifiche Complete

## Overview
Fantas-Mia V2 è un'evoluzione del sistema originale che mantiene invariate le funzionalità core di creazione storie e autenticazione, riprogettando completamente dashboard, archivi e gestione media per una migliore user experience.

## Parti Invarianti (NON MODIFICARE)
### Sistema di Creazione Storie
- **Campbell Editor**: Metodologia dell'eroe di Campbell
- **CSS Editor**: Creazione storie con temi CSS
- **Propp Editor**: Funzioni di Propp
- **Modalità Propp**: Varianti dell'editor Propp
- **Storie Professionali**: Creazione basata su professioni
- **Airots Editor**: Editor specializzato Airots
- **Ghost Editor**: Editor fantasma
- **Parole-Chiamano Editor**: Editor basato su parole chiave

### Sistema Autenticazione e Profili
- Gestione utenti e profili
- Sistema di autenticazione
- Gestione permessi superuser

## Parti Riprogettate (V2)

### 1. Dashboard
- Layout completamente rinnovato
- Navigazione semplificata
- Integrazione archivi AM/AG

### 2. Sistema Archivi
#### AM (Archivio Magico)
- **Scopo**: Storie create dagli utenti
- **Accesso**: `/user-archive`
- **Visibilità**: Solo utenti autenticati
- **Contenuto**: Storie personali dell'utente

#### AG (Archivio Generale)
- **Scopo**: Storie create dai superuser
- **Accesso**: `/reading-stories` e `/science-stories`
- **Visibilità**: Tutti gli utenti
- **Contenuto**: Storie condivise e scientifiche

### 3. Gestione Media
- Storage persistente con IndexedDB
- Generazione immagini AI senza testo
- Visualizzazione in overlay (no nuove schede)
- Indicatori visivi verde/rosso per presenza immagini

### 4. Navigazione e UI/UX
- Nome utente sempre visibile e spostabile (drag-and-drop)
- Barra superiore unificata con tutte le azioni
- Pulsanti Indietro (sx) e Home (dx) sempre presenti
- Conferma esplicita per ogni eliminazione

## Funzioni Opzionali (Future)
- Export/Import storie
- Sincronizzazione offline
- Backup automatico

## Architettura Tecnica
### Stack Tecnologico
- React + TypeScript
- Tailwind CSS con design system semantico
- IndexedDB per storage locale
- React Router per navigazione

### Principi di Design
- Design system basato su token semantici HSL
- Componenti riutilizzabili e modulari
- Responsive design
- Accessibilità integrata

### Struttura Dati
```
Archivi:
├── AM (Archivio Magico)
│   ├── Storie Utente
│   └── Media Associati
└── AG (Archivio Generale)
    ├── Reading Stories (SU)
    ├── Science Stories (SU)
    └── Media Condivisi
```

## Implementazione
Vedere `MIGRATION_NOTES.md` per dettagli sulla migrazione e `ARCHITECTURE.md` per l'architettura dettagliata del sistema.