import { supabase } from '@/integrations/supabase/client';

// Versione semplificata per evitare errori IndexedDB
export const fantasmiaDB = {
  async init() { return Promise.resolve(); },
  async saveImage(storyId: string, imageBlob: Blob) { return Promise.resolve(); },
  async saveStory(story: any) { return Promise.resolve(); },
  async getStory(storyId: string) { return Promise.resolve(null); },
  async getAllStories() { return Promise.resolve([]); },
  async getImage(storyId: string) { return Promise.resolve(null); },
  async hasImage(storyId: string) { return Promise.resolve(false); },
  async clearOldImages() { return Promise.resolve(); },
  async clearOldStories() { return Promise.resolve(); }
};

// Funzione per caricare immagine su Supabase Storage
export const uploadImageToStorage = async (imageBlob: Blob, storyId: string, storyTitle: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const safeTitle = storyTitle?.replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 50) || 'story';
    const fileName = `${safeTitle}_${storyId}_${timestamp}.png`;
    
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

    const { data: { publicUrl } } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Failed to upload image to storage:', error);
    throw error;
  }
};

export const downloadAndCacheImage = async (imageUrl: string, storyId: string): Promise<string> => {
  return imageUrl; // Semplificato - ritorna sempre l'URL originale
};

export const getStoryImage = async (storyId: string, fallbackUrl?: string): Promise<string | null> => {
  return fallbackUrl || null; // Semplificato
};

export const saveStoryToCache = async (story: any): Promise<void> => {
  // Semplificato - non fa nulla
};

export const getStoryFromCache = async (storyId: string): Promise<any | null> => {
  return null; // Semplificato
};

export const getAllStoriesFromCache = async (): Promise<any[]> => {
  return []; // Semplificato
};

export const cleanupCache = async (): Promise<void> => {
  // Semplificato - non fa nulla
};

export const saveUploadedImageToPersistentStorage = async (file: File, storyId: string, storyTitle: string): Promise<string> => {
  try {
    if (!file.type.startsWith('image/')) {
      throw new Error('Il file selezionato non è un\'immagine valida');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('L\'immagine è troppo grande. Dimensione massima: 10MB');
    }

    const blob = new Blob([file], { type: file.type });
    
    try {
      const publicUrl = await uploadImageToStorage(blob, storyId, storyTitle);
      console.log('Image uploaded to Supabase Storage:', publicUrl);
      return publicUrl;
    } catch (storageError) {
      console.warn('Storage upload failed:', storageError);
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error('Failed to save uploaded image:', error);
    throw error;
  }
};
