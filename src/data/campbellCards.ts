export interface CampbellCard {
  id: number;
  title: string;
  name: string;
  description: string;
  icon: string;
}

export const campbellCards: CampbellCard[] = [
  {
    id: 1,
    title: "Il mondo di tutti i giorni",
    name: "Il mondo di tutti i giorni",
    description: "Dove vive il tuo personaggio? Cosa fa ogni giorno? È felice o annoiato?",
    icon: "Home"
  },
  {
    id: 2,
    title: "Qualcosa lo chiama",
    name: "Qualcosa lo chiama", 
    description: "Cosa succede che rompe la normalità? Riceve una missione, sente un richiamo?",
    icon: "Target"
  },
  {
    id: 3,
    title: "Non vuole partire (ma qualcosa lo spinge)",
    name: "Non vuole partire",
    description: "Perché non vuole cambiare? Cosa lo spaventa? Cosa o chi lo convince?",
    icon: "EyeOff"
  },
  {
    id: 4,
    title: "Un incontro che cambia tutto",
    name: "Un incontro che cambia tutto",
    description: "Chi aiuta il protagonista? Che consiglio o dono riceve?",
    icon: "Lightbulb"
  },
  {
    id: 5,
    title: "La soglia del viaggio",
    name: "La soglia del viaggio",
    description: "Qual è il momento in cui lascia tutto e inizia davvero l'avventura?",
    icon: "DoorOpen"
  },
  {
    id: 6,
    title: "Prove, amici, nemici",
    name: "Prove, amici, nemici",
    description: "Chi incontra lungo il cammino? Quali ostacoli affronta?",
    icon: "Swords"
  },
  {
    id: 7,
    title: "Vicino al cuore del problema",
    name: "Vicino al cuore del problema",
    description: "Cosa scopre di sé? Cosa rischia di perdere?",
    icon: "Heart"
  },
  {
    id: 8,
    title: "La sfida centrale",
    name: "La sfida centrale",
    description: "Qual è la prova più difficile? Cosa succede se fallisce?",
    icon: "Mountain"
  },
  {
    id: 9,
    title: "Una ricompensa inattesa",
    name: "Una ricompensa inattesa",
    description: "Cosa ottiene dopo la prova? Un oggetto, un potere, un segreto?",
    icon: "Gift"
  },
  {
    id: 10,
    title: "Strada del ritorno",
    name: "Strada del ritorno",
    description: "Come torna a casa? Cosa lo attende al ritorno?",
    icon: "ArrowLeft"
  },
  {
    id: 11,
    title: "Ultima prova",
    name: "Ultima prova",
    description: "C'è un ultimo ostacolo, magari imprevisto?",
    icon: "Zap"
  },
  {
    id: 12,
    title: "Il nuovo inizio",
    name: "Il nuovo inizio",
    description: "Com'è cambiato? E cosa cambia per gli altri grazie a lui?",
    icon: "Sunrise"
  }
];