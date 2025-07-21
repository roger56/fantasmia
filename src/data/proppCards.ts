import { ProppCard } from '@/types/propp';

export const proppClusters: Record<number, ProppCard[]> = {
  1: [ // Partenza e Vincoli
    { id: 1, title: "Allontanamento", name: "Allontanamento", description: "Uno dei membri della famiglia si allontana da casa", icon: "🚶", cluster: 1 },
    { id: 2, title: "Divieto", name: "Divieto", description: "Viene formulato un divieto", icon: "🚫", cluster: 1 },
    { id: 3, title: "Infrazione", name: "Infrazione", description: "Il divieto viene infranto", icon: "⚠️", cluster: 1 },
    { id: 4, title: "Investigazione", name: "Investigazione", description: "L'antagonista tenta di ottenere informazioni", icon: "🔍", cluster: 1 },
    { id: 5, title: "Delazione", name: "Delazione", description: "L'antagonista riceve informazioni sulla vittima", icon: "👂", cluster: 1 }
  ],
  2: [ // Incontro con il Nemico e Inganno
    { id: 6, title: "Tranello", name: "Tranello", description: "L'antagonista tenta di ingannare la vittima", icon: "🪤", cluster: 2 },
    { id: 7, title: "Connivenza", name: "Connivenza", description: "La vittima si lascia ingannare", icon: "🤝", cluster: 2 },
    { id: 8, title: "Danneggiamento", name: "Danneggiamento", description: "L'antagonista arreca danno a un membro della famiglia", icon: "💥", cluster: 2 }
  ],
  3: [ // Chiamata all'Azione e Preparazione
    { id: 9, title: "Mediazione", name: "Mediazione", description: "Si divulga la notizia della sciagura", icon: "📢", cluster: 3 },
    { id: 10, title: "Consenso dell'eroe", name: "Consenso dell'eroe", description: "L'eroe accetta di agire", icon: "✊", cluster: 3 },
    { id: 11, title: "Partenza dell'eroe", name: "Partenza dell'eroe", description: "L'eroe parte da casa", icon: "🌅", cluster: 3 },
    { id: 12, title: "L'eroe messo alla prova", name: "L'eroe messo alla prova", description: "L'eroe viene messo alla prova da un donatore", icon: "⚖️", cluster: 3 },
    { id: 13, title: "Reazione dell'eroe", name: "Reazione dell'eroe", description: "L'eroe reagisce alle azioni del donatore", icon: "💪", cluster: 3 }
  ],
  4: [ // Aiuti e Complicazioni
    { id: 14, title: "Fornitura del mezzo magico", name: "Fornitura del mezzo magico", description: "L'eroe riceve un oggetto magico", icon: "✨", cluster: 4 },
    { id: 15, title: "Trasferimento dell'eroe", name: "Trasferimento dell'eroe", description: "L'eroe viene trasportato verso l'obiettivo", icon: "🌪️", cluster: 4 }
  ],
  5: [ // Conflitto e Conquista
    { id: 16, title: "Lotta", name: "Lotta", description: "L'eroe e l'antagonista si scontrano", icon: "⚔️", cluster: 5 },
    { id: 17, title: "Marchiatura dell'eroe", name: "Marchiatura dell'eroe", description: "L'eroe viene marchiato", icon: "🏷️", cluster: 5 },
    { id: 18, title: "Vittoria", name: "Vittoria", description: "L'antagonista viene sconfitto", icon: "🏆", cluster: 5 }
  ],
  6: [ // Risoluzione e Ritorno
    { id: 19, title: "Rimozione", name: "Rimozione", description: "La sciagura o mancanza viene riparata", icon: "🔧", cluster: 6 },
    { id: 20, title: "Ritorno", name: "Ritorno", description: "L'eroe ritorna a casa", icon: "🏠", cluster: 6 }
  ],
  7: [ // Post-Ritorno e Nuove Prove
    { id: 21, title: "Persecuzione", name: "Persecuzione", description: "L'eroe viene perseguitato", icon: "🏃", cluster: 7 },
    { id: 22, title: "Salvataggio", name: "Salvataggio", description: "L'eroe si salva", icon: "🛡️", cluster: 7 },
    { id: 23, title: "Arrivo in incognito", name: "Arrivo in incognito", description: "L'eroe arriva a casa in incognito", icon: "🎭", cluster: 7 }
  ],
  8: [ // Smarrimenti e Riconoscimenti
    { id: 24, title: "Pretese del falso eroe", name: "Pretese del falso eroe", description: "Un falso eroe avanza pretese infondate", icon: "👑", cluster: 8 },
    { id: 25, title: "Compito difficile", name: "Compito difficile", description: "All'eroe è imposto un compito difficile", icon: "🧩", cluster: 8 },
    { id: 26, title: "Esecuzione", name: "Esecuzione", description: "Il compito viene eseguito", icon: "✅", cluster: 8 },
    { id: 27, title: "Riconoscimento", name: "Riconoscimento", description: "L'eroe viene riconosciuto", icon: "👁️", cluster: 8 },
    { id: 28, title: "Smascheramento", name: "Smascheramento", description: "Il falso eroe viene smascherato", icon: "😱", cluster: 8 }
  ],
  9: [ // Trasformazione Finale e Ricompense
    { id: 29, title: "Trasfigurazione", name: "Trasfigurazione", description: "L'eroe si trasfigura", icon: "🦋", cluster: 9 },
    { id: 30, title: "Punizione", name: "Punizione", description: "L'antagonista viene punito", icon: "⚡", cluster: 9 },
    { id: 31, title: "Nozze", name: "Nozze", description: "L'eroe si sposa e/o sale al trono", icon: "💒", cluster: 9 }
  ]
};

export const clusterNames: Record<number, string> = {
  1: "Partenza e Vincoli",
  2: "Incontro con il Nemico e Inganno", 
  3: "Chiamata all'Azione e Preparazione",
  4: "Aiuti e Complicazioni",
  5: "Conflitto e Conquista",
  6: "Risoluzione e Ritorno",
  7: "Post-Ritorno e Nuove Prove",
  8: "Smarrimenti e Riconoscimenti",
  9: "Trasformazione Finale e Ricompense"
};

export const narrativePhases: Record<number, string> = {
  1: "Situazione iniziale (Antefatto)",
  2: "Partenza dell'eroe", 
  3: "Peripezie e prove",
  4: "Ritorno a casa",
  5: "Conclusione (Ricompense e ristabilimento dell'equilibrio)"
};

export const getCurrentNarrativePhase = (currentCluster: number): number => {
  if (currentCluster <= 2) return 1; // Situazione iniziale
  if (currentCluster === 3) return 2; // Partenza dell'eroe
  if (currentCluster >= 4 && currentCluster <= 7) return 3; // Peripezie e prove
  if (currentCluster === 8) return 4; // Ritorno a casa
  return 5; // Conclusione
};