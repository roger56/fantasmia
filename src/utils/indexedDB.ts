// IndexedDB Database Manager for Fantas-Mia V2
// Manages: profiles, am_stories (user stories), ag_stories (SU stories), media_assets

interface DatabaseConfig {
  name: string;
  version: number;
}

interface Profile {
  id: string;
  name: string;
  created_at: string;
  last_access: string;
}

interface AMStory {
  id: string;
  ownerProfileId: string;
  title: string;
  text: string;
  mode: string;
  createdAt: string;
  hasImage: boolean;
}

interface AGStory {
  id: string;
  title: string;
  content: string;
  category: 'reading' | 'science';
  created_by: 'superuser';
  created_at: string;
  updated_at: string;
  has_image: boolean;
}

interface MediaAsset {
  id: string;
  story_id: string;
  type: 'image' | 'audio';
  data: Blob;
  metadata: {
    filename: string;
    content_type: string;
    size: number;
  };
  created_at: string;
}

class FantasMiaDB {
  private db: IDBDatabase | null = null;
  private readonly dbConfig: DatabaseConfig = {
    name: 'FantasMiaV2',
    version: 2 // Increased version to force schema recreation
  };

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbConfig.name, this.dbConfig.version);

      request.onerror = () => {
        console.error('❌ IndexedDB init error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized:', this.dbConfig.name, 'v' + this.dbConfig.version);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🔄 IndexedDB upgrade from version', event.oldVersion, 'to', event.newVersion);

        // Delete existing stores to recreate with proper indices
        const storeNames = ['profiles', 'am_stories', 'ag_stories', 'media_assets'];
        storeNames.forEach(storeName => {
          if (db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName);
            console.log('🗑️ Deleted store:', storeName);
          }
        });

        // Profiles store
        const profileStore = db.createObjectStore('profiles', { keyPath: 'id' });
        profileStore.createIndex('name', 'name', { unique: false });
        console.log('✅ Created profiles store');

        // AM Stories store (Archivio Magico - User Stories)
        const amStore = db.createObjectStore('am_stories', { keyPath: 'id' });
        amStore.createIndex('ownerProfileId', 'ownerProfileId', { unique: false });
        amStore.createIndex('createdAt', 'createdAt', { unique: false });
        console.log('✅ Created am_stories store with ownerProfileId index');

        // AG Stories store (Archivio Generale - SU Stories)
        const agStore = db.createObjectStore('ag_stories', { keyPath: 'id' });
        agStore.createIndex('category', 'category', { unique: false });
        agStore.createIndex('updated_at', 'updated_at', { unique: false });
        console.log('✅ Created ag_stories store');

        // Media Assets store
        const mediaStore = db.createObjectStore('media_assets', { keyPath: 'id' });
        mediaStore.createIndex('story_id', 'story_id', { unique: false });
        mediaStore.createIndex('type', 'type', { unique: false });
        console.log('✅ Created media_assets store');
      };
    });
  }

  // Profiles Management
  async saveProfile(profile: Profile): Promise<void> {
    const transaction = this.db!.transaction(['profiles'], 'readwrite');
    const store = transaction.objectStore('profiles');
    await store.put(profile);
  }

  async getProfiles(): Promise<Profile[]> {
    const transaction = this.db!.transaction(['profiles'], 'readonly');
    const store = transaction.objectStore('profiles');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // AM Stories Management (User Stories)
  async saveAMStory(story: AMStory): Promise<void> {
    const transaction = this.db!.transaction(['am_stories'], 'readwrite');
    const store = transaction.objectStore('am_stories');
    await store.put(story);
  }

  async getAMStoriesByUser(ownerProfileId: string): Promise<AMStory[]> {
    if (!this.db) {
      await this.init();
    }
    
    const transaction = this.db!.transaction(['am_stories'], 'readonly');
    const store = transaction.objectStore('am_stories');
    
    try {
      const index = store.index('ownerProfileId');
      const request = index.getAll(ownerProfileId);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('📖 READ-AM:', { ownerProfileId, results: request.result.length });
          resolve(request.result);
        };
        request.onerror = () => {
          console.error('❌ Error reading AM stories:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('❌ Index not found, falling back to full scan:', error);
      // Fallback: scan all records
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const filtered = request.result.filter((story: AMStory) => story.ownerProfileId === ownerProfileId);
          console.log('📖 READ-AM (fallback):', { ownerProfileId, results: filtered.length });
          resolve(filtered);
        };
        request.onerror = () => reject(request.error);
      });
    }
  }

  async deleteAMStory(storyId: string): Promise<void> {
    const transaction = this.db!.transaction(['am_stories'], 'readwrite');
    const store = transaction.objectStore('am_stories');
    await store.delete(storyId);
  }

  // AG Stories Management (SU Stories)
  async saveAGStory(story: AGStory): Promise<void> {
    const transaction = this.db!.transaction(['ag_stories'], 'readwrite');
    const store = transaction.objectStore('ag_stories');
    await store.put(story);
  }

  async getAGStoriesByCategory(category: 'reading' | 'science'): Promise<AGStory[]> {
    const transaction = this.db!.transaction(['ag_stories'], 'readonly');
    const store = transaction.objectStore('ag_stories');
    const index = store.index('category');
    const request = index.getAll(category);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAGStory(storyId: string): Promise<void> {
    const transaction = this.db!.transaction(['ag_stories'], 'readwrite');
    const store = transaction.objectStore('ag_stories');
    await store.delete(storyId);
  }

  // Media Assets Management
  async saveMediaAsset(asset: MediaAsset): Promise<void> {
    const transaction = this.db!.transaction(['media_assets'], 'readwrite');
    const store = transaction.objectStore('media_assets');
    await store.put(asset);
  }

  async getMediaAssetByStoryId(storyId: string): Promise<MediaAsset | null> {
    const transaction = this.db!.transaction(['media_assets'], 'readonly');
    const store = transaction.objectStore('media_assets');
    const index = store.index('story_id');
    const request = index.get(storyId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMediaAsset(assetId: string): Promise<void> {
    const transaction = this.db!.transaction(['media_assets'], 'readwrite');
    const store = transaction.objectStore('media_assets');
    await store.delete(assetId);
  }

  // Utility Methods
  async hasImageForStory(storyId: string): Promise<boolean> {
    const asset = await this.getMediaAssetByStoryId(storyId);
    return asset !== null && asset.type === 'image';
  }

  async updateStoryImageStatus(storyId: string, storyType: 'am' | 'ag', hasImage: boolean): Promise<void> {
    const storeName = storyType === 'am' ? 'am_stories' : 'ag_stories';
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const getRequest = store.get(storyId);
    getRequest.onsuccess = () => {
      const story = getRequest.result;
      if (story) {
        story.has_image = hasImage;
        store.put(story);
      }
    };
  }
}

// Singleton instance
export const fantasMiaDB = new FantasMiaDB();

// Initialize database on import
fantasMiaDB.init().catch(console.error);

export type { Profile, AMStory, AGStory, MediaAsset };