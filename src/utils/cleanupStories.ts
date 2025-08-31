// Utility to clean up stories containing "russia" from IndexedDB
import { fantasmiaDB } from '@/utils/imageStorage';

export const cleanupRussiaStories = async () => {
  try {
    await fantasmiaDB.init();
    
    // Get all stories from cache
    const stories = await fantasmiaDB.getAllStories();
    
    // Find stories with "russia" in title or content
    const russiaStories = stories.filter(story => 
      story.title?.toLowerCase().includes('russia') || 
      story.content?.toLowerCase().includes('russia')
    );
    
    console.log('Found stories containing "russia":', russiaStories.length);
    
    // Delete these stories
    for (const story of russiaStories) {
      if (story.id) {
        // Delete the story from stories object store
        const request = indexedDB.open('FantasmiaDB', 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['stories', 'images'], 'readwrite');
          
          // Delete from stories
          const storyStore = transaction.objectStore('stories');
          storyStore.delete(story.id);
          
          // Delete associated image if exists
          const imageStore = transaction.objectStore('images');
          imageStore.delete(story.id);
          
          console.log('Deleted story:', story.title);
        };
      }
    }
    
    return russiaStories.length;
  } catch (error) {
    console.error('Error cleaning up russia stories:', error);
    return 0;
  }
};

// Auto cleanup function to run on app load
export const autoCleanupRussiaStories = () => {
  // Run cleanup after a short delay to allow IndexedDB to initialize
  setTimeout(async () => {
    const deletedCount = await cleanupRussiaStories();
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} stories containing "russia"`);
    }
  }, 2000);
};