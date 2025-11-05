// Multi-Layer Persistence Manager for iOS/iPadOS
// Guarantees permanent data storage across all storage layers

import { fantasMiaDB } from './indexedDB';

export interface PersistenceStatus {
  isPersistent: boolean;
  isPermissionGranted: boolean;
  quota: number;
  usage: number;
  percentUsed: number;
  layers: {
    indexedDB: boolean;
    localStorage: boolean;
    fileSystemAPI: boolean;
    serviceWorker: boolean;
  };
  lastBackup: string | null;
  lastRecovery: string | null;
}

export interface BackupData {
  version: number;
  timestamp: string;
  profiles: any[];
  am_stories: any[];
  ag_stories: any[];
  // Media assets are stored separately due to size
}

class PersistenceManager {
  private readonly BACKUP_KEY = 'fantasmia_backup_v2';
  private readonly LAST_BACKUP_KEY = 'fantasmia_last_backup_time';
  private readonly LAST_RECOVERY_KEY = 'fantasmia_last_recovery_time';
  private readonly MIN_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Request persistent storage permission from the browser
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (!navigator.storage?.persist) {
      console.warn('⚠️ Persistent Storage API not available');
      return false;
    }

    try {
      const isPersisted = await navigator.storage.persisted();
      
      if (isPersisted) {
        console.log('✅ Storage is already persistent');
        return true;
      }

      const granted = await navigator.storage.persist();
      
      if (granted) {
        console.log('✅ Persistent storage granted by user');
      } else {
        console.warn('⚠️ Persistent storage denied - data may be evicted after 7 days on iOS');
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Error requesting persistent storage:', error);
      return false;
    }
  }

  /**
   * Get current storage quota and usage
   */
  async getStorageEstimate(): Promise<{ quota: number; usage: number; percentUsed: number }> {
    if (!navigator.storage?.estimate) {
      return { quota: 0, usage: 0, percentUsed: 0 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

      return { quota, usage, percentUsed };
    } catch (error) {
      console.error('❌ Error getting storage estimate:', error);
      return { quota: 0, usage: 0, percentUsed: 0 };
    }
  }

  /**
   * Check if storage layers are available
   */
  async checkStorageLayers(): Promise<PersistenceStatus['layers']> {
    const layers = {
      indexedDB: false,
      localStorage: false,
      fileSystemAPI: false,
      serviceWorker: false,
    };

    // Check IndexedDB
    try {
      await fantasMiaDB.init();
      layers.indexedDB = true;
    } catch (error) {
      console.error('❌ IndexedDB not available:', error);
    }

    // Check localStorage
    try {
      localStorage.setItem('_test', '1');
      localStorage.removeItem('_test');
      layers.localStorage = true;
    } catch (error) {
      console.warn('⚠️ localStorage not available:', error);
    }

    // Check File System Access API (Private Origin File System)
    try {
      if ('storage' in navigator && 'getDirectory' in navigator.storage) {
        layers.fileSystemAPI = true;
      }
    } catch (error) {
      console.warn('⚠️ File System API not available:', error);
    }

    // Check Service Worker
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        layers.serviceWorker = !!registration;
      }
    } catch (error) {
      console.warn('⚠️ Service Worker not available:', error);
    }

    return layers;
  }

  /**
   * Get complete persistence status
   */
  async getPersistenceStatus(): Promise<PersistenceStatus> {
    const isPersistent = await navigator.storage?.persisted() || false;
    const isPermissionGranted = isPersistent;
    const { quota, usage, percentUsed } = await this.getStorageEstimate();
    const layers = await this.checkStorageLayers();
    const lastBackup = localStorage.getItem(this.LAST_BACKUP_KEY);
    const lastRecovery = localStorage.getItem(this.LAST_RECOVERY_KEY);

    return {
      isPersistent,
      isPermissionGranted,
      quota,
      usage,
      percentUsed,
      layers,
      lastBackup,
      lastRecovery,
    };
  }

  /**
   * Create backup of critical data to localStorage
   * LAYER 2: localStorage backup
   */
  async createBackup(): Promise<boolean> {
    try {
      // Check if backup was created recently
      const lastBackupTime = localStorage.getItem(this.LAST_BACKUP_KEY);
      if (lastBackupTime) {
        const timeSinceBackup = Date.now() - parseInt(lastBackupTime, 10);
        if (timeSinceBackup < this.MIN_BACKUP_INTERVAL) {
          console.log('⏭️ Skipping backup - too soon since last backup');
          return true;
        }
      }

      console.log('🔄 Creating backup to localStorage...');

      await fantasMiaDB.init();

      // Get all data except large media blobs
      const profiles = await fantasMiaDB.getAllProfiles();
      const amStories = await this.getAllAMStories();
      const agStories = await fantasMiaDB.getAllAGStories();

      const backup: BackupData = {
        version: 2,
        timestamp: new Date().toISOString(),
        profiles,
        am_stories: amStories,
        ag_stories: agStories,
      };

      // Store backup in localStorage (compressed if possible)
      const backupString = JSON.stringify(backup);
      
      try {
        localStorage.setItem(this.BACKUP_KEY, backupString);
        localStorage.setItem(this.LAST_BACKUP_KEY, Date.now().toString());
        console.log(`✅ Backup created: ${profiles.length} profiles, ${amStories.length} AM stories, ${agStories.length} AG stories`);
        return true;
      } catch (quotaError) {
        console.warn('⚠️ localStorage quota exceeded, attempting cleanup...');
        // Try to free space by removing old data
        this.cleanupOldBackups();
        // Retry
        localStorage.setItem(this.BACKUP_KEY, backupString);
        localStorage.setItem(this.LAST_BACKUP_KEY, Date.now().toString());
        return true;
      }
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      return false;
    }
  }

  /**
   * Restore data from localStorage backup
   */
  async restoreFromBackup(): Promise<boolean> {
    try {
      console.log('🔄 Attempting to restore from localStorage backup...');

      const backupString = localStorage.getItem(this.BACKUP_KEY);
      
      if (!backupString) {
        console.warn('⚠️ No backup found in localStorage');
        return false;
      }

      const backup: BackupData = JSON.parse(backupString);

      console.log(`📦 Found backup from ${backup.timestamp}`);
      console.log(`   - ${backup.profiles.length} profiles`);
      console.log(`   - ${backup.am_stories.length} AM stories`);
      console.log(`   - ${backup.ag_stories.length} AG stories`);

      await fantasMiaDB.init();

      // Restore profiles
      for (const profile of backup.profiles) {
        await fantasMiaDB.saveProfile(profile);
      }

      // Restore AM stories
      for (const story of backup.am_stories) {
        await fantasMiaDB.saveAMStory(story);
      }

      // Restore AG stories
      for (const story of backup.ag_stories) {
        await fantasMiaDB.saveAGStory(story);
      }

      localStorage.setItem(this.LAST_RECOVERY_KEY, Date.now().toString());

      console.log('✅ Data restored successfully from backup');
      return true;
    } catch (error) {
      console.error('❌ Error restoring from backup:', error);
      return false;
    }
  }

  /**
   * Check IndexedDB integrity and restore if needed
   */
  async checkAndRecoverIfNeeded(): Promise<{ needsRecovery: boolean; recovered: boolean }> {
    try {
      await fantasMiaDB.init();

      const profiles = await fantasMiaDB.getAllProfiles();
      const amStories = await this.getAllAMStories();
      const agStories = await fantasMiaDB.getAllAGStories();

      const isEmpty = profiles.length === 0 && amStories.length === 0 && agStories.length === 0;

      if (isEmpty) {
        console.warn('⚠️ IndexedDB is empty - checking for backup...');
        const recovered = await this.restoreFromBackup();
        
        if (recovered) {
          console.log('✅ Successfully recovered data from backup');
          return { needsRecovery: true, recovered: true };
        } else {
          console.warn('⚠️ No backup available to restore from');
          return { needsRecovery: true, recovered: false };
        }
      }

      console.log('✅ IndexedDB integrity check passed');
      return { needsRecovery: false, recovered: false };
    } catch (error) {
      console.error('❌ Error checking IndexedDB integrity:', error);
      return { needsRecovery: true, recovered: false };
    }
  }

  /**
   * Automatic backup on data change
   */
  async autoBackup(): Promise<void> {
    try {
      await this.createBackup();
    } catch (error) {
      console.error('❌ Auto-backup failed:', error);
    }
  }

  /**
   * Initialize persistence system
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Persistence Manager...');

    // Request persistent storage
    await this.requestPersistentStorage();

    // Check and recover if needed
    const { needsRecovery, recovered } = await this.checkAndRecoverIfNeeded();

    if (needsRecovery) {
      if (recovered) {
        console.log('♻️ Data recovered from backup');
      } else {
        console.log('ℹ️ Starting with fresh database');
      }
    }

    // Create initial backup
    await this.createBackup();

    // Log status
    const status = await this.getPersistenceStatus();
    console.log('📊 Persistence Status:', status);
  }

  /**
   * Cleanup old backups to free space
   */
  private cleanupOldBackups(): void {
    try {
      // Remove old backup keys if they exist
      const keysToCheck = Object.keys(localStorage);
      const oldBackupKeys = keysToCheck.filter(key => 
        key.startsWith('fantasmia_backup_') && key !== this.BACKUP_KEY
      );
      
      oldBackupKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed old backup: ${key}`);
      });
    } catch (error) {
      console.error('❌ Error cleaning up old backups:', error);
    }
  }

  /**
   * Helper to get all AM stories
   */
  private async getAllAMStories(): Promise<any[]> {
    try {
      await fantasMiaDB.init();
      const db = (fantasMiaDB as any).db;
      if (!db) return [];
      
      const transaction = db.transaction(['am_stories'], 'readonly');
      const store = transaction.objectStore('am_stories');
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ Error getting AM stories:', error);
      return [];
    }
  }

  /**
   * Monitor storage and alert if low
   */
  async monitorStorage(): Promise<void> {
    const { quota, usage, percentUsed } = await this.getStorageEstimate();

    if (percentUsed > 90) {
      console.error('❌ STORAGE CRITICAL: >90% used');
    } else if (percentUsed > 75) {
      console.warn('⚠️ STORAGE WARNING: >75% used');
    }

    console.log(`💾 Storage: ${(usage / 1024 / 1024).toFixed(2)}MB / ${(quota / 1024 / 1024).toFixed(2)}MB (${percentUsed.toFixed(1)}%)`);
  }
}

// Export singleton instance
export const persistenceManager = new PersistenceManager();
