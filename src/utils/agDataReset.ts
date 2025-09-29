// AG Data Reset Utility for Fantasmia Redesign
import { fantasMiaDB } from './indexedDB';

export class AGDataReset {
  
  static async performCompleteReset(): Promise<void> {
    try {
      console.log('🔄 Starting AG data reset...');
      
      // Initialize database if needed
      await fantasMiaDB.init();
      
      // Step 1: Clear all AG stories
      await fantasMiaDB.clearAllAGStories();
      
      // Step 2: Clear non-superuser profiles
      await fantasMiaDB.clearNonSuperuserProfiles();
      
      console.log('✅ AG data reset completed successfully');
      
      // Dispatch global event for UI updates
      window.dispatchEvent(new CustomEvent('ag:data-reset', { 
        detail: { timestamp: new Date().toISOString() } 
      }));
      
    } catch (error) {
      console.error('❌ Error during AG data reset:', error);
      throw error;
    }
  }
  
  static async resetAGStoriesOnly(): Promise<void> {
    try {
      console.log('🔄 Resetting AG stories only...');
      await fantasMiaDB.init();
      await fantasMiaDB.clearAllAGStories();
      console.log('✅ AG stories reset completed');
      
      window.dispatchEvent(new CustomEvent('ag:stories-reset', { 
        detail: { timestamp: new Date().toISOString() } 
      }));
    } catch (error) {
      console.error('❌ Error resetting AG stories:', error);
      throw error;
    }
  }
  
  static async resetProfilesOnly(): Promise<void> {
    try {
      console.log('🔄 Resetting non-superuser profiles only...');
      await fantasMiaDB.init();
      await fantasMiaDB.clearNonSuperuserProfiles();
      console.log('✅ Profiles reset completed');
      
      window.dispatchEvent(new CustomEvent('ag:profiles-reset', { 
        detail: { timestamp: new Date().toISOString() } 
      }));
    } catch (error) {
      console.error('❌ Error resetting profiles:', error);
      throw error;
    }
  }
}

// Auto-execute reset on module load if flag is set
if (typeof window !== 'undefined' && window.localStorage.getItem('ag-auto-reset') === 'true') {
  window.localStorage.removeItem('ag-auto-reset');
  AGDataReset.performCompleteReset().then(() => {
    console.log('🎯 Auto-reset completed');
  }).catch(error => {
    console.error('🚨 Auto-reset failed:', error);
  });
}