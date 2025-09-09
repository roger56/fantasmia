// Story Manager per Fantas-Mia V2
// Gestisce salvataggio e recupero storie AM tramite IndexedDB

import { fantasMiaDB, AMStory } from './indexedDB';
import { getCurrentProfileId } from './profileManager';

export interface StoryData {
  id?: string;
  title: string;
  text: string;
  mode: string;
}

// Genera un UUID semplice
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Salva storia utente in IndexedDB am_stories
export const saveUserStory = async (storyData: StoryData): Promise<string> => {
  const currentProfileId = getCurrentProfileId();
  
  if (!currentProfileId) {
    throw new Error('Nessun profilo attivo trovato');
  }

  const story: AMStory = {
    id: storyData.id || generateUUID(),
    ownerProfileId: currentProfileId,
    title: storyData.title,
    text: storyData.text,
    mode: storyData.mode,
    createdAt: new Date().toISOString(),
    hasImage: false
  };

  await fantasMiaDB.saveAMStory(story);
  return story.id;
};

// Recupera storie dell'utente corrente da IndexedDB
export const getCurrentUserStories = async (): Promise<AMStory[]> => {
  const currentProfileId = getCurrentProfileId();
  
  if (!currentProfileId) {
    return [];
  }

  return await fantasMiaDB.getAMStoriesByUser(currentProfileId);
};

// Test automatico - salva e verifica storia
export const runAutomaticTest = async (): Promise<boolean> => {
  try {
    const testStory: StoryData = {
      title: 'Storia Test M1',
      text: 'Questa è una storia di test per verificare M1',
      mode: 'TEST'
    };

    const currentProfileId = getCurrentProfileId();
    if (!currentProfileId) {
      console.error('Test fallito: nessun profilo attivo');
      return false;
    }

    // Salva storia test
    const storyId = await saveUserStory(testStory);
    
    // Verifica che appaia in user-archive
    const userStories = await getCurrentUserStories();
    const savedStory = userStories.find(s => s.id === storyId);
    
    if (savedStory && savedStory.ownerProfileId === currentProfileId) {
      console.log('✅ Test M1 PASSED: Storia salvata e recuperata correttamente');
      
      // Cleanup - rimuovi storia test
      await fantasMiaDB.deleteAMStory(storyId);
      return true;
    } else {
      console.error('❌ Test M1 FAILED: Storia non trovata o profilo errato');
      return false;
    }
  } catch (error) {
    console.error('❌ Test M1 ERROR:', error);
    return false;
  }
};