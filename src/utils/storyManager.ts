// Story Manager per Fantas-Mia V2
// Gestisce salvataggio e recupero storie AM tramite IndexedDB

import { fantasMiaDB, AMStory } from './indexedDB';
import { requireCurrentProfile, getCurrentProfileId } from './profileManager';
import { toast } from '@/hooks/use-toast';

export interface StoryData {
  id?: string;
  title: string;
  text: string;
  mode: string;
  content?: string; // Support both text and content for compatibility
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
  try {
    const currentProfileId = requireCurrentProfile();
    
    // Support both text and content fields for compatibility
    const storyText = storyData.text || storyData.content || '';
    
    if (!storyText.trim()) {
      toast({
        title: "Errore",
        description: "Il contenuto della storia non può essere vuoto",
        variant: "destructive"
      });
      throw new Error('Contenuto vuoto');
    }

    const story: AMStory = {
      id: storyData.id || generateUUID(),
      ownerProfileId: currentProfileId,
      title: storyData.title,
      text: storyText,
      mode: storyData.mode,
      createdAt: new Date().toISOString(),
      hasImage: false
    };

    // Validate required fields before saving
    if (!story.ownerProfileId) {
      console.error('❌ BLOCCO SALVATAGGIO: ownerProfileId mancante');
      toast({
        title: "Errore di salvataggio",
        description: "Profilo utente non identificato",
        variant: "destructive"
      });
      throw new Error('ownerProfileId mancante');
    }

    await fantasMiaDB.saveAMStory(story);
    
    // Log telemetry
    console.log('✅ WRITE-AM:', { action: 'write-am', id: story.id, ownerProfileId: story.ownerProfileId });
    
    // Emit custom event for UI refresh
    window.dispatchEvent(new CustomEvent('user-story-saved', { detail: { storyId: story.id } }));
    
    return story.id;
  } catch (error) {
    console.error('❌ Errore saveUserStory:', error);
    throw error;
  }
};

// Recupera storie dell'utente corrente da IndexedDB
export const getCurrentUserStories = async (): Promise<AMStory[]> => {
  try {
    const currentProfileId = requireCurrentProfile();
    
    const stories = await fantasMiaDB.getAMStoriesByUser(currentProfileId);
    
    // Log telemetry
    console.log('📖 READ-AM:', { action: 'read-am', ownerProfileId: currentProfileId, results: stories.length });
    
    return stories;
  } catch (error) {
    console.error('❌ Errore getCurrentUserStories:', error);
    return [];
  }
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