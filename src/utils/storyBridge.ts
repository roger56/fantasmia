// Story Bridge - Connette vecchio sistema userStorage con nuovo IndexedDB
// Sostituisce saveStory per utilizzare IndexedDB am_stories

import { saveUserStory, StoryData } from './storyManager';

// Interface per compatibilità con userStorage
export interface LegacyStory {
  id?: string;
  title: string;
  content?: string;
  text?: string;
  mode: string;
  status?: string;
  authorId?: string;
  authorName?: string;
  isPublic?: boolean;
  language?: string;
  lastModified?: string;
}

// Bridge function che sostituisce saveStory da userStorage
export const saveStoryBridge = async (legacyStory: LegacyStory): Promise<void> => {
  console.log('🌉 BRIDGE: Convertendo storia legacy in IndexedDB format');
  
  try {
    const storyData: StoryData = {
      id: legacyStory.id,
      title: legacyStory.title,
      text: legacyStory.content || legacyStory.text || '',
      mode: legacyStory.mode
    };
    
    const savedId = await saveUserStory(storyData);
    console.log('✅ BRIDGE: Storia salvata con ID:', savedId);
    
  } catch (error) {
    console.error('❌ BRIDGE: Errore salvataggio:', error);
    throw error;
  }
};