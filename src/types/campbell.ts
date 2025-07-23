export interface CampbellCard {
  id: number;
  title: string;
  name: string;
  description: string;
  icon: string;
}

export interface CampbellStoryPhase {
  card: CampbellCard | null;
  content: string;
}

export type CampbellGamePhase = 'warning' | 'card-selection' | 'writing' | 'final';

export interface CampbellEditorProps {
  profileId?: string;
  profileName?: string;
  editStory?: any;
}