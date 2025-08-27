import { supabase } from '@/integrations/supabase/client';

// IndexedDB per cache locale delle immagini
class ImageCacheDB {
  private dbName = 'fantasmia-image-cache';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'storyId' });
        }
      };
    });
  }

  async saveImage(storyId: string, imageBlob: Blob): Promise<void> {
    if (!this.db) await this.init();
    
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

  async getImage(storyId: string): Promise<Blob | null> {
    if (!this.db) await this.init();
    
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
    if (!this.db) await this.init();
    
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
}

export const imageCacheDB = new ImageCacheDB();

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
    const cachedImage = await imageCacheDB.getImage(storyId);
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
    await imageCacheDB.saveImage(storyId, imageBlob);
    
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
    const cachedImage = await imageCacheDB.getImage(storyId);
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

// Pulizia periodica della cache
export const cleanupImageCache = async (): Promise<void> => {
  try {
    await imageCacheDB.clearOldImages();
    console.log('Image cache cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup image cache:', error);
  }
};

// Inizializza la pulizia automatica quando il modulo viene caricato
if (typeof window !== 'undefined') {
  // Pulizia al caricamento della pagina
  window.addEventListener('load', () => {
    setTimeout(cleanupImageCache, 5000); // Dopo 5 secondi dal caricamento
  });
}