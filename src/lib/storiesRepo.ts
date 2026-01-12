// Stories Repository - Repository centralizzato per tutte le operazioni sulle storie
// Usa SOLO IndexedDB, nessun accesso rete o Supabase
// Gestisce: AM (Archivio Magico), AG (Archivio Generale - seed), AS (Archivio Superuser - locale)

import { fantasMiaDB, AMStory, AGStory, ASStory, MediaAsset } from '@/utils/indexedDB';
import { requireCurrentProfile } from '@/utils/profileManager';
import { toast } from '@/hooks/use-toast';

// Genera UUID semplice
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Payload per creazione/aggiornamento storia
export interface StoryPayload {
  id?: string;
  title: string;
  text: string; // Per AM stories
  content?: string; // Per AG stories (alias di text)
  mode?: string; // Per AM stories
  type?: string; // Per AG stories (o mode alternativo)
  category?: 'world' | 'science' | 'greek_myths' | 'nordic_myths' | 'explorers'; // Per AG stories
  hasImage?: boolean;
}

// ============= CREATE OPERATIONS =============

/**
 * Crea una storia AM (utente normale)
 * @param profileId ID del profilo proprietario
 * @param payload Dati della storia
 * @returns ID della storia creata
 */
export const createAMStory = async (profileId: string, payload: StoryPayload): Promise<string> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (createAMStory)');
  
  try {
    if (!payload.text?.trim()) {
      throw new Error('Il testo della storia non può essere vuoto');
    }

    const story: AMStory = {
      id: payload.id || generateUUID(),
      ownerProfileId: profileId,
      title: payload.title,
      text: payload.text,
      mode: payload.mode || 'default',
      createdAt: new Date().toISOString(),
      hasImage: payload.hasImage || false
    };

    await fantasMiaDB.saveAMStory(story);
    
    console.log('✅ Storia AM creata:', story.id);
    
    // Emit eventi per aggiornamento UI
    window.dispatchEvent(new CustomEvent('am-story-updated', { 
      detail: { storyId: story.id, action: 'created' } 
    }));
    window.dispatchEvent(new CustomEvent('am:changed'));
    
    return story.id;
  } catch (error) {
    console.error('❌ Errore createAMStory:', error);
    throw error;
  }
};

/**
 * Crea una storia AG (Superuser)
 * @param profileId ID del profilo Superuser
 * @param payload Dati della storia
 * @returns ID della storia creata
 */
export const createAGStory = async (profileId: string, payload: StoryPayload): Promise<string> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (createAGStory)');
  
  try {
    const content = payload.content || payload.text || '';
    if (!content.trim()) {
      throw new Error('Il testo della storia non può essere vuoto');
    }

    const story: AGStory = {
      id: payload.id || generateUUID(),
      title: payload.title,
      content: content,
      category: payload.category || 'world',
      created_by: 'superuser',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      has_image: payload.hasImage || false,
      language: 'it'
    };

    await fantasMiaDB.saveAGStory(story);
    
    console.log('✅ Storia AG creata:', story.id);
    
    // Emit eventi per aggiornamento UI
    window.dispatchEvent(new CustomEvent('ag-story-updated', { 
      detail: { storyId: story.id, action: 'created' } 
    }));
    window.dispatchEvent(new CustomEvent('ag:changed'));
    
    return story.id;
  } catch (error) {
    console.error('❌ Errore createAGStory:', error);
    throw error;
  }
};

// ============= UPDATE OPERATIONS =============

/**
 * Aggiorna una storia esistente (AM o AG)
 * @param id ID della storia
 * @param payload Nuovi dati
 * @returns true se l'aggiornamento è riuscito
 */
export const updateStory = async (id: string, payload: Partial<StoryPayload>): Promise<boolean> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (updateStory)');
  
  try {
    // Cerca prima in AM
    let amStory = await fantasMiaDB.getAMStoryById(id);
    
    if (amStory) {
      // Aggiorna storia AM
      const updatedStory: AMStory = {
        ...amStory,
        ...(payload.title && { title: payload.title }),
        ...(payload.text && { text: payload.text }),
        ...(payload.mode && { mode: payload.mode }),
        ...(payload.hasImage !== undefined && { hasImage: payload.hasImage })
      };
      
      await fantasMiaDB.saveAMStory(updatedStory);
      window.dispatchEvent(new CustomEvent('am-story-updated', { 
        detail: { storyId: id, action: 'updated' } 
      }));
      window.dispatchEvent(new CustomEvent('am:changed'));
      console.log('✅ Storia AM aggiornata:', id);
      return true;
    }
    
    // Se non trovata in AM, cerca in AG
    const agStory = await fantasMiaDB.getAGStoryById(id);
    
    if (agStory) {
      // Aggiorna storia AG
      const content = payload.content || payload.text;
      const updatedStory: AGStory = {
        ...agStory,
        ...(payload.title && { title: payload.title }),
        ...(content && { content: content }),
        ...(payload.category && { category: payload.category }),
        ...(payload.hasImage !== undefined && { has_image: payload.hasImage }),
        updated_at: new Date().toISOString()
      };
      
      await fantasMiaDB.saveAGStory(updatedStory);
      window.dispatchEvent(new CustomEvent('ag-story-updated', { 
        detail: { storyId: id, action: 'updated' } 
      }));
      window.dispatchEvent(new CustomEvent('ag:changed'));
      console.log('✅ Storia AG aggiornata:', id);
      return true;
    }
    
    throw new Error(`Storia ${id} non trovata`);
  } catch (error) {
    console.error('❌ Errore updateStory:', error);
    throw error;
  }
};

// ============= READ OPERATIONS =============

/**
 * Recupera una storia per ID (cerca sia in AM che in AG)
 * @param id ID della storia
 * @returns Storia trovata o null
 */
export const getStoryById = async (id: string): Promise<AMStory | AGStory | null> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (getStoryById)');
  
  try {
    // Cerca prima in AM
    const amStory = await fantasMiaDB.getAMStoryById(id);
    if (amStory) {
      return amStory;
    }
    
    // Poi in AG
    const agStory = await fantasMiaDB.getAGStoryById(id);
    if (agStory) {
      return agStory;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Errore getStoryById:', error);
    return null;
  }
};

/**
 * Lista tutte le storie AM di un profilo
 * @param profileId ID del profilo
 * @returns Array di storie AM
 */
export const listAMStories = async (profileId: string): Promise<AMStory[]> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (listAMStories)');
  
  try {
    const stories = await fantasMiaDB.getAMStoriesByUser(profileId);
    
    // Sicurezza: filtra per ownerProfileId
    const filtered = stories.filter(s => s.ownerProfileId === profileId);
    
    console.log('📖 Lista AM storie:', {
      profileId,
      count: filtered.length,
      filteredOut: stories.length - filtered.length
    });
    
    return filtered;
  } catch (error) {
    console.error('❌ Errore listAMStories:', error);
    return [];
  }
};

/**
 * Lista tutte le storie AG
 * @returns Array di storie AG
 */
export const listAGStories = async (): Promise<AGStory[]> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (listAGStories)');
  
  try {
    const stories = await fantasMiaDB.getAllAGStories();
    
    console.log('📖 Lista AG storie:', stories.length);
    
    return stories;
  } catch (error) {
    console.error('❌ Errore listAGStories:', error);
    return [];
  }
};

/**
 * Lista storie AG per categoria
 * @param category Categoria di storia
 * @returns Array di storie AG filtrate
 */
export const listAGStoriesByCategory = async (category: 'world' | 'science' | 'greek_myths' | 'nordic_myths' | 'explorers'): Promise<AGStory[]> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (listAGStoriesByCategory)');
  
  try {
    const stories = await fantasMiaDB.getAGStoriesByCategory(category);
    
    console.log('📖 Lista AG storie per categoria:', { category, count: stories.length });
    
    return stories;
  } catch (error) {
    console.error('❌ Errore listAGStoriesByCategory:', error);
    return [];
  }
};

// ============= MEDIA OPERATIONS =============

/**
 * Associa un'immagine a una storia
 * @param storyId ID della storia
 * @returns true se l'associazione è riuscita
 */
export const attachMediaToStory = async (storyId: string): Promise<boolean> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (attachMediaToStory)');
  
  try {
    // Verifica che ci siano media assets per questa storia
    const mediaAssets = await fantasMiaDB.getMediaAssetsByStoryId(storyId);
    if (mediaAssets.length === 0) {
      throw new Error(`Nessun media asset trovato per storia ${storyId}`);
    }
    
    // Aggiorna la storia con hasImage = true
    await updateStory(storyId, {
      hasImage: true
    });
    
    console.log('✅ Media associato alla storia:', { storyId, mediaCount: mediaAssets.length });
    
    return true;
  } catch (error) {
    console.error('❌ Errore attachMediaToStory:', error);
    throw error;
  }
};

/**
 * Recupera i media assets associati a una storia
 * @param storyId ID della storia
 * @returns Array di media assets
 */
export const getStoryMedia = async (storyId: string): Promise<MediaAsset[]> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (getStoryMedia)');
  
  try {
    return await fantasMiaDB.getMediaAssetsByStoryId(storyId);
  } catch (error) {
    console.error('❌ Errore getStoryMedia:', error);
    return [];
  }
};

// ============= DELETE OPERATIONS =============

/**
 * Elimina una storia (AM o AG)
 * @param id ID della storia
 * @returns true se l'eliminazione è riuscita
 */
export const deleteStory = async (id: string): Promise<boolean> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (deleteStory)');
  
  try {
    // Prova prima in AM
    const amStory = await fantasMiaDB.getAMStoryById(id);
    if (amStory) {
      await fantasMiaDB.deleteAMStory(id);
      window.dispatchEvent(new CustomEvent('am-story-updated', { 
        detail: { storyId: id, action: 'deleted' } 
      }));
      window.dispatchEvent(new CustomEvent('am:changed'));
      console.log('✅ Storia AM eliminata:', id);
      return true;
    }
    
    // Poi prova in AG
    const agStory = await fantasMiaDB.getAGStoryById(id);
    if (agStory) {
      await fantasMiaDB.deleteAGStory(id);
      window.dispatchEvent(new CustomEvent('ag-story-updated', { 
        detail: { storyId: id, action: 'deleted' } 
      }));
      window.dispatchEvent(new CustomEvent('ag:changed'));
      console.log('✅ Storia AG eliminata:', id);
      return true;
    }
    
    throw new Error(`Storia ${id} non trovata`);
  } catch (error) {
    console.error('❌ Errore deleteStory:', error);
    throw error;
  }
};

// ============= AS STORY OPERATIONS (Archivio Superuser - locale) =============

/**
 * Crea una storia AS (locale del Superuser)
 * @param profileId ID del profilo SU proprietario
 * @param payload Dati della storia
 * @returns ID della storia creata
 */
export const createASStory = async (profileId: string, payload: StoryPayload): Promise<string> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (createASStory)');
  
  try {
    const content = payload.content || payload.text || '';
    if (!content.trim()) {
      throw new Error('Il testo della storia non può essere vuoto');
    }

    const story: ASStory = {
      id: payload.id || generateUUID(),
      title: payload.title,
      content: content,
      category: payload.category || 'world',
      created_by: profileId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      has_image: payload.hasImage || false,
      language: 'it',
      source: 'local'
    };

    await fantasMiaDB.saveASStory(story);
    
    console.log('✅ Storia AS creata:', story.id);
    
    // Emit eventi per aggiornamento UI
    window.dispatchEvent(new CustomEvent('as-story-updated', { 
      detail: { storyId: story.id, action: 'created' } 
    }));
    window.dispatchEvent(new CustomEvent('as:changed'));
    
    return story.id;
  } catch (error) {
    console.error('❌ Errore createASStory:', error);
    throw error;
  }
};

/**
 * Aggiorna una storia AS esistente
 * @param id ID della storia AS
 * @param payload Nuovi dati
 * @returns true se l'aggiornamento è riuscito
 */
export const updateASStory = async (id: string, payload: Partial<StoryPayload>): Promise<boolean> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (updateASStory)');
  
  try {
    const asStory = await fantasMiaDB.getASStoryById(id);
    
    if (!asStory) {
      throw new Error(`Storia AS ${id} non trovata`);
    }
    
    const content = payload.content || payload.text;
    const updatedStory: ASStory = {
      ...asStory,
      ...(payload.title && { title: payload.title }),
      ...(content && { content: content }),
      ...(payload.category && { category: payload.category }),
      ...(payload.hasImage !== undefined && { has_image: payload.hasImage }),
      updated_at: new Date().toISOString()
    };
    
    await fantasMiaDB.saveASStory(updatedStory);
    window.dispatchEvent(new CustomEvent('as-story-updated', { 
      detail: { storyId: id, action: 'updated' } 
    }));
    window.dispatchEvent(new CustomEvent('as:changed'));
    console.log('✅ Storia AS aggiornata:', id);
    return true;
  } catch (error) {
    console.error('❌ Errore updateASStory:', error);
    throw error;
  }
};

/**
 * Elimina una storia AS
 * @param id ID della storia AS
 * @returns true se l'eliminazione è riuscita
 */
export const deleteASStory = async (id: string): Promise<boolean> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (deleteASStory)');
  
  try {
    const asStory = await fantasMiaDB.getASStoryById(id);
    if (!asStory) {
      throw new Error(`Storia AS ${id} non trovata`);
    }
    
    await fantasMiaDB.deleteASStory(id);
    window.dispatchEvent(new CustomEvent('as-story-updated', { 
      detail: { storyId: id, action: 'deleted' } 
    }));
    window.dispatchEvent(new CustomEvent('as:changed'));
    console.log('✅ Storia AS eliminata:', id);
    return true;
  } catch (error) {
    console.error('❌ Errore deleteASStory:', error);
    throw error;
  }
};

/**
 * Lista tutte le storie AS
 * @returns Array di storie AS
 */
export const listASStories = async (): Promise<ASStory[]> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (listASStories)');
  
  try {
    const stories = await fantasMiaDB.getAllASStories();
    console.log('📖 Lista AS storie:', stories.length);
    return stories;
  } catch (error) {
    console.error('❌ Errore listASStories:', error);
    return [];
  }
};

/**
 * Lista storie AS per categoria
 * @param category Categoria di storia
 * @returns Array di storie AS filtrate
 */
export const listASStoriesByCategory = async (category: 'world' | 'science' | 'greek_myths' | 'nordic_myths' | 'explorers'): Promise<ASStory[]> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (listASStoriesByCategory)');
  
  try {
    const stories = await fantasMiaDB.getASStoriesByCategory(category);
    console.log('📖 Lista AS storie per categoria:', { category, count: stories.length });
    return stories;
  } catch (error) {
    console.error('❌ Errore listASStoriesByCategory:', error);
    return [];
  }
};

/**
 * Recupera una storia AS per ID
 * @param id ID della storia
 * @returns Storia AS o null
 */
export const getASStoryById = async (id: string): Promise<ASStory | null> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (getASStoryById)');
  
  try {
    return await fantasMiaDB.getASStoryById(id);
  } catch (error) {
    console.error('❌ Errore getASStoryById:', error);
    return null;
  }
};

/**
 * Copia una storia AG in AS per modifica locale
 * @param agStoryId ID della storia AG da copiare
 * @param suProfileId ID del profilo SU che copia
 * @returns ID della nuova storia AS
 */
export const copyAGtoAS = async (agStoryId: string, suProfileId: string): Promise<string> => {
  console.log('📦 IndexedDB mode OK → Nessuna chiamata Supabase (copyAGtoAS)');
  
  try {
    const agStory = await fantasMiaDB.getAGStoryById(agStoryId);
    if (!agStory) {
      throw new Error(`Storia AG ${agStoryId} non trovata`);
    }

    const asStory: ASStory = {
      id: generateUUID(),
      title: agStory.title + ' (copia)',
      content: agStory.content,
      category: agStory.category,
      created_by: suProfileId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      has_image: false, // Non copiamo l'immagine, andrà rigenerata
      language: agStory.language || 'it',
      source: 'local',
      topic: agStory.topic,
      ageRange: agStory.ageRange,
      copied_from_ag_id: agStoryId
    };

    await fantasMiaDB.saveASStory(asStory);
    
    console.log('✅ Storia AG copiata in AS:', { from: agStoryId, to: asStory.id });
    
    window.dispatchEvent(new CustomEvent('as-story-updated', { 
      detail: { storyId: asStory.id, action: 'created' } 
    }));
    window.dispatchEvent(new CustomEvent('as:changed'));
    
    return asStory.id;
  } catch (error) {
    console.error('❌ Errore copyAGtoAS:', error);
    throw error;
  }
};

/**
 * Conta le storie AS per categoria
 * @param category Categoria di storia
 * @returns Numero di storie
 */
export const countASStoriesByCategory = async (category: 'world' | 'science' | 'greek_myths' | 'nordic_myths' | 'explorers'): Promise<number> => {
  const stories = await listASStoriesByCategory(category);
  return stories.length;
};

// ============= UTILITY FUNCTIONS =============

/**
 * Verifica se una storia ha un'immagine associata
 * @param storyId ID della storia
 * @returns true se ha un'immagine
 */
export const storyHasImage = async (storyId: string): Promise<boolean> => {
  const story = await getStoryById(storyId);
  if (!story) return false;
  
  // Check hasImage flag for AM stories
  if ('hasImage' in story) return story.hasImage;
  
  // Check has_image flag for AG/AS stories
  if ('has_image' in story) return story.has_image;
  
  return false;
};

/**
 * Conta le storie AM di un profilo
 * @param profileId ID del profilo
 * @returns Numero di storie
 */
export const countAMStories = async (profileId: string): Promise<number> => {
  const stories = await listAMStories(profileId);
  return stories.length;
};

/**
 * Conta le storie AG per categoria
 * @param category Categoria di storia
 * @returns Numero di storie
 */
export const countAGStoriesByCategory = async (category: 'world' | 'science' | 'greek_myths' | 'nordic_myths' | 'explorers'): Promise<number> => {
  const stories = await listAGStoriesByCategory(category);
  return stories.length;
};
