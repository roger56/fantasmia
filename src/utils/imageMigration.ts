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
        const existingAsset = await fantasMiaDB.getMediaAssetByStoryId(image.storyId);
        if (existingAsset) {
          console.log(`Image for story ${image.storyId} already exists in IndexedDB, skipping`);
          continue;
        }
        
        // Convert image URL to Blob
        const response = await fetch(image.imageUrl);
        const blob = await response.blob();
        
        // Create media asset for IndexedDB
        const mediaAsset = {
          id: `${image.storyId}-migrated-${Date.now()}`,
          storyId: image.storyId,
          story_id: image.storyId, // legacy field
          type: 'image' as const,
          source: 'migrated' as const,
          data: blob,
          metadata: {
            filename: `story-${image.storyId}-${image.style}.png`,
            content_type: blob.type || 'image/png',
            size: blob.size,
            style: image.style,
            migrated_from_localstorage: true,
            original_created_at: image.created_at
          },
          createdAt: image.created_at,
          created_at: image.created_at // legacy field
        };
        
        // Save to IndexedDB
        await fantasMiaDB.saveMediaAsset(mediaAsset);
        
        // Update story hasImage status
        await fantasMiaDB.updateStoryImageStatus(image.storyId, 'am', true);
        
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
 * Auto-run migration on app startup
 */
export const initImageMigration = () => {
  // Run migration after a short delay to ensure everything is loaded
  setTimeout(() => {
    migrateStoryImagesToIndexedDB();
  }, 1000);
};