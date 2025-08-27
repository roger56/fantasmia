import { supabase } from '@/integrations/supabase/client';

// Configurazione per il bucket delle immagini
export const STORAGE_BUCKET = 'story-images';

// Funzione per inizializzare il bucket se non esiste
export const initializeStorageBucket = async (): Promise<void> => {
  try {
    // Verifica se il bucket esiste già
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      // Crea il bucket
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true, // Rende le immagini accessibili pubblicamente
        fileSizeLimit: 10 * 1024 * 1024, // 10MB limite
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log('Storage bucket created successfully');
      }
    }
  } catch (error) {
    console.error('Error initializing storage bucket:', error);
  }
};

// Funzione per ottenere informazioni su un file
export const getFileInfo = async (fileName: string): Promise<any> => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', {
        search: fileName
      });
    
    if (error) {
      throw error;
    }
    
    return data?.find(file => file.name === fileName) || null;
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

// Funzione per eliminare un'immagine dal storage
export const deleteImageFromStorage = async (fileName: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);
    
    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }
    
    console.log('Image deleted successfully:', fileName);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Funzione per ottenere l'URL di download di un'immagine
export const getImageDownloadUrl = async (fileName: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // URL valido per 7 giorni
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting download URL:', error);
    return null;
  }
};

// Funzione per verificare se un'immagine esiste nel storage
export const imageExistsInStorage = async (fileName: string): Promise<boolean> => {
  try {
    const fileInfo = await getFileInfo(fileName);
    return fileInfo !== null;
  } catch (error) {
    console.error('Error checking if image exists:', error);
    return false;
  }
};

// Inizializza il bucket al caricamento del modulo (solo nel browser)
if (typeof window !== 'undefined') {
  // Ritarda l'inizializzazione per evitare errori durante il build
  setTimeout(() => {
    initializeStorageBucket();
  }, 1000);
}