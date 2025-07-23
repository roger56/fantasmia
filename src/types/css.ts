export interface CSSQuestion {
  id: number;
  text: string;
  theme: string;
}

export interface CSSTheme {
  id: string;
  name: string;
  questions: string[];
}

export interface CSSStoryPhase {
  question: string;
  answer: string;
}

export type CSSGamePhase = 'warning' | 'question-selection' | 'guided-questions' | 'final';

export interface CSSStory {
  initialQuestion: string;
  phases: CSSStoryPhase[];
  title: string;
}