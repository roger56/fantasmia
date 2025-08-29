import { supabase } from '@/integrations/supabase/client';

// IndexedDB per cache locale di immagini e storie
class FantasmiaDB {
  private dbName = 'fantasmia-cache';
  private version = 2;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // Se già inizializzato, ritorna
    if (this.db) return;
    
    // Se già in corso di inizializzazione, aspetta
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB inizializzato con successo');
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Store per le immagini
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'storyId' });
        }
        
        // Store per le storie
        if (!db.objectStoreNames.contains('stories')) {
          db.createObjectStore('stories', { keyPath: 'id' });
        }
      };
    });
    
    return this.initPromise;
  }

  async ensureInit(): Promise<void> {
    await this.init();
  }

  async saveImage(storyId: string, imageBlob: Blob): Promise<void> {
    await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      store.put({
        storyId,
        imageBlob,
        timestamp: Date.now()
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveStory(story: any): Promise<void> {
    await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      
      const storyToSave = {
        ...story,
        timestamp: Date.now()
      };
      
      console.log('Salvando storia in IndexedDB:', storyToSave.id, storyToSave.title);
      
      store.put(storyToSave);
      
      transaction.oncomplete = () => {
        console.log('Storia salvata in IndexedDB con successo:', storyToSave.id);
        resolve();
      };
      transaction.onerror = () => {
        console.error('Errore nel salvare storia in IndexedDB:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  async getStory(storyId: string): Promise<any | null> {
    await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stories'], 'readonly');
      const store = transaction.objectStore('stories');
      const request = store.get(storyId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAllStories(): Promise<any[]> {
    await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stories'], 'readonly');
      const store = transaction.objectStore('stories');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const stories = request.result || [];
        console.log('Recuperate storie da IndexedDB:', stories.length);
        resolve(stories);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getImage(storyId: string): Promise<Blob | null> {
    await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.get(storyId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.imageBlob : null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async hasImage(storyId: string): Promise<boolean> {
    const image = await this.getImage(storyId);
    return image !== null;
  }

  async clearOldImages(): Promise<void> {
    await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const images = request.result;
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        images.forEach(image => {
          if (image.timestamp < thirtyDaysAgo) {
            store.delete(image.storyId);
          }
        });
        
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldStories(): Promise<void> {
    await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const stories = request.result;
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        stories.forEach(story => {
          if (story.timestamp < thirtyDaysAgo) {
            store.delete(story.id);
          }
        });
        
        resolve();
      };
      
      request.onerror = () => reject(transaction.error);
    });
  }
}

export const fantasmiaDB = new FantasmiaDB();

// Funzione per caricare immagine su Supabase Storage
export const uploadImageToStorage = async (imageBlob: Blob, storyId: string, storyTitle: string): Promise<string> => {
  try {
    // Crea nome file sicuro
    const timestamp = Date.now();
    const safeTitle = storyTitle?.replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 50) || 'story';
    const fileName = `${safeTitle}_${storyId}_${timestamp}.png`;
    
    // Carica su Supabase Storage
    const { data, error } = await supabase.storage
      .from('story-images')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      throw error;
    }

    // Ottieni URL pubblico
    const { data: { publicUrl } } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Failed to upload image to storage:', error);
    throw error;
  }
};

// Funzione per scaricare e cachare immagine
export const downloadAndCacheImage = async (imageUrl: string, storyId: string): Promise<string> => {
  try {
    // Controlla prima se è già in cache
    const cachedImage = await fantasmiaDB.getImage(storyId);
    if (cachedImage) {
      return URL.createObjectURL(cachedImage);
    }

    // Scarica l'immagine
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBlob = await response.blob();
    
    // Salva in cache
    await fantasmiaDB.saveImage(storyId, imageBlob);
    
    // Ritorna object URL per visualizzazione
    return URL.createObjectURL(imageBlob);
  } catch (error) {
    console.error('Failed to download and cache image:', error);
    // Fallback: ritorna l'URL originale
    return imageUrl;
  }
};

// Funzione per ottenere immagine (da cache o da URL)
export const getStoryImage = async (storyId: string, fallbackUrl?: string): Promise<string | null> => {
  try {
    // Prima prova dalla cache locale
    const cachedImage = await fantasmiaDB.getImage(storyId);
    if (cachedImage) {
      return URL.createObjectURL(cachedImage);
    }

    // Se c'è un fallback URL, prova a scaricarlo
    if (fallbackUrl) {
      return await downloadAndCacheImage(fallbackUrl, storyId);
    }

    return null;
  } catch (error) {
    console.error('Failed to get story image:', error);
    return fallbackUrl || null;
  }
};

// Funzioni per gestire le storie in IndexedDB
export const saveStoryToCache = async (story: any): Promise<void> => {
  try {
    console.log('Tentativo di salvare storia in cache:', story.id, story.title);
    await fantasmiaDB.saveStory(story);
    console.log('Storia salvata in IndexedDB cache:', story.id);
  } catch (error) {
    console.error('Failed to save story to cache:', error);
  }
};

export const getStoryFromCache = async (storyId: string): Promise<any | null> => {
  try {
    return await fantasmiaDB.getStory(storyId);
  } catch (error) {
    console.error('Failed to get story from cache:', error);
    return null;
  }
};

export const getAllStoriesFromCache = async (): Promise<any[]> => {
  try {
    const stories = await fantasmiaDB.getAllStories();
    console.log('Recuperate tutte le storie da cache:', stories.length);
    return stories;
  } catch (error) {
    console.error('Failed to get stories from cache:', error);
    return [];
  }
};

// Pulizia periodica della cache
export const cleanupCache = async (): Promise<void> => {
  try {
    await fantasmiaDB.clearOldImages();
    await fantasmiaDB.clearOldStories();
    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup cache:', error);
  }
};

// Funzione per caricare e persistere immagini caricate da file
export const saveUploadedImageToPersistentStorage = async (file: File, storyId: string, storyTitle: string): Promise<string> => {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('Il file selezionato non è un\'immagine valida');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('L\'immagine è troppo grande. Dimensione massima: 10MB');
    }

    // Convert to blob
    const blob = new Blob([file], { type: file.type });
    
    let publicUrl: string | null = null;
    
    try {
      // Try to upload to Supabase Storage
      publicUrl = await uploadImageToStorage(blob, storyId, storyTitle);
      console.log('Image uploaded to Supabase Storage:', publicUrl);
    } catch (storageError) {
      console.warn('Storage upload failed, saving only locally:', storageError);
    }
    
    // Always save locally for persistence (CRITICAL for Superuser uploads)
    await fantasmiaDB.saveImage(storyId, blob);
    console.log('Image saved to IndexedDB for persistence:', storyId);
    
    // Return either the public URL or a local object URL
    return publicUrl || URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to save uploaded image:', error);
    throw error;
  }
};

// Inizializza la pulizia automatica quando il modulo viene caricato
if (typeof window !== 'undefined') {
  // Pulizia al caricamento della pagina
  window.addEventListener('load', () => {
    setTimeout(cleanupCache, 5000); // Dopo 5 secondi dal caricamento
  });
}
