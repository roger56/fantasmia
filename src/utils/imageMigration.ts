import { fantasMiaDB } from './indexedDB';
import { getStoryImages, deleteStoryImage } from './userStorage';

/**
 * Migrates existing story images from localStorage to IndexedDB
 * and updates the hasImage field in AM stories
 */
export const migrateStoryImagesToIndexedDB = async (): Promise<void> => {
  try {
    console.log('Starting migration of story images from localStorage to IndexedDB...');
    
    // Get all images from localStorage
    const localStorageImages = getStoryImages();
    
    if (localStorageImages.length === 0) {
      console.log('No images found in localStorage to migrate');
      return;
    }
    
    console.log(`Found ${localStorageImages.length} images to migrate`);
    
    for (const image of localStorageImages) {
      try {
        // Check if image already exists in IndexedDB
        const existingAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(image.storyId);
        if (existingAsset) {
          console.log(`Image for story ${image.storyId} already exists in IndexedDB, skipping`);
          continue;
        }
        
        // Convert image URL to Blob
        const response = await fetch(image.imageUrl);
        const blob = await response.blob();
        
        // Use the common media pipeline for migration
        await fantasMiaDB.saveMediaFromPreview({
          storyId: image.storyId,
          ownerProfileId: 'migrated-user', // Default value for migration
          previewUrl: image.imageUrl,
          type: 'image',
          source: 'upload', // Treat migrated images as uploads
          filename: `migrated-story-${image.storyId}-${image.style}.png`
        });
        
        // Pipeline handles both saving and hasImage update automatically
        
        console.log(`Successfully migrated image for story ${image.storyId}`);
        
        // Remove from localStorage after successful migration
        deleteStoryImage(image.storyId);
        
      } catch (error) {
        console.error(`Error migrating image for story ${image.storyId}:`, error);
      }
    }
    
    // Emit event to refresh UI
    window.dispatchEvent(new CustomEvent('am-story-updated', { 
      detail: { migration: true } 
    }));
    
    console.log('Image migration completed');
    
  } catch (error) {
    console.error('Error during image migration:', error);
  }
};

/**
 * Auto-run migration on app startup - DISABLED (prevents CORS/403 errors)
 */
export const initImageMigration = () => {
  // Migration disabled to prevent remote fetch CORS/403 errors
  console.log('Image migration from localStorage disabled (prevents CORS errors)');
};