export interface ProppCard {
  id: number;
  title: string;
  name: string;
  description: string;
  icon: string;
  cluster: number;
}

export interface StoryPhase {
  card: ProppCard | null;
  content: string;
}

export type GamePhase = 'warning' | 'card-selection' | 'writing' | 'free-writing' | 'final';

export interface ProppEditorProps {
  profileId?: string;
  profileName?: string;
  editStory?: any;
}