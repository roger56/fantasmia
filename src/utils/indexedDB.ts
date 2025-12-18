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
  email?: string;
  user_type?: string;
  password_hash?: string;
  updated_at?: string;
}

interface AMStory {
  id: string;
  ownerProfileId: string;
  title: string;
  text: string;
  mode: string;
  createdAt: string;
  hasImage: boolean;
  poem?: string;
}

interface Album {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  stories: Array<{
    storyId: string;
    title: string;
    type: string;
    pagesAlloc: { text: number; image: 1 };
    imageIdUsed?: string;
  }>;
  pdfBlob: Blob;
  zipBlob?: Blob;
  settingsSnapshot: {
    pageSize: string;
    margins: number;
    fontFamily: string;
    fontSizeBody: number;
    fontSizeTitles: number;
    imageStyleDefault: string;
  };
}

interface SystemSettings {
  id: 'email_config'; // single document pattern
  updatedAt: string;
  // Legacy fields - kept for backward compatibility but no longer used
  minStoriesForEmail?: number;
  maxStoriesForEmail?: number;
}

interface GroupStory {
  id: string;
  title?: string;
  status: 'in_progress' | 'pending_approval' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  finalAGStoryId?: string; // Reference to AG story after completion
  approvedBy?: string;
  approvedAt?: string;
}

interface GroupStoryContribution {
  id: string;
  groupStoryId: string;
  userId: string;
  userName: string;
  content: string; // 3 lines of text
  orderIndex: number;
  createdAt: string;
}

interface AGStory {
  id: string;
  title: string;
  content: string;
  category: 'world' | 'science' | 'greek_myths' | 'nordic_myths' | 'explorers';
  created_by: 'superuser';
  created_at: string;
  updated_at: string;
  has_image: boolean;
  language?: string;
}

interface MediaAsset {
  id: string;
  storyId: string;
  ownerProfileId: string;
  type: 'image' | 'audio' | 'video';
  source: 'openai' | 'upload' | 'canvas-fallback';
  mime: string;
  size: number;
  createdAt: string;
  data: Blob;                // OBBLIGATORIO per preview e download
  originalUrl?: string;      // opzionale, solo storico/diagnostica
  needsRefetch?: boolean;    // flag per indicare che il Blob è da ri-fetchare
  metadata?: {
    style?: string; // Store the style used for generation
    [key: string]: any;
  };
}

// Daily Story interface
interface DailyStory {
  date: string;   // "12 dicembre" - chiave primaria
  story: string;  // racconto breve ASCII
  quote: string;  // massima del giorno
}

class FantasMiaDB {
  private db: IDBDatabase | null = null;
  private readonly dbConfig: DatabaseConfig = {
    name: 'FantasMiaV2',
    version: 7 // Bump version for daily_stories store
  };

  async init(): Promise<void> {
    if (this.db) {
      return Promise.resolve(); // Already initialized
    }
    
    return new Promise(async (resolve, reject) => {
      const request = indexedDB.open(this.dbConfig.name, this.dbConfig.version);

      request.onerror = () => {
        console.error('❌ IndexedDB init error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        
        // Add error handler for the database connection
        this.db.onerror = (event) => {
          console.error('❌ IndexedDB connection error:', event);
        };
        
        // ⚠️ VERIFICA CRITICA: controlla la versione del database
        if (this.db.version !== this.dbConfig.version) {
          const errorMsg = `Version mismatch: expected v${this.dbConfig.version}, got v${this.db.version}`;
          console.error('❌ CRITICAL:', errorMsg);
          console.error('🔄 Database needs force reset. Run: fantasMiaDB.forceReset()');
          reject(new Error(errorMsg));
          return;
        }
        
        // VERIFICA CRITICA: controlla che tutti gli stores richiesti esistano
        const requiredStores = ['profiles', 'am_stories', 'ag_stories', 'media_assets', 'albums', 'system_settings', 'group_stories', 'group_story_contributions', 'daily_stories'];
        const missingStores = requiredStores.filter(
          name => !this.db!.objectStoreNames.contains(name)
        );
        
        if (missingStores.length > 0) {
          console.error('❌ CRITICAL: Missing object stores:', missingStores);
          console.error('🔄 Database needs reset. Call fantasMiaDB.forceReset()');
          reject(new Error(`Missing stores: ${missingStores.join(', ')}`));
          return;
        }
        
        console.log('✅ IndexedDB initialized:', this.dbConfig.name, 'v' + this.dbConfig.version);
        console.log('✅ All object stores present:', requiredStores);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🔄 IndexedDB upgrade from version', event.oldVersion, 'to', event.newVersion);

        // Delete existing stores to recreate with proper indices
        const storeNames = ['profiles', 'am_stories', 'ag_stories', 'media_assets', 'albums', 'system_settings', 'group_stories', 'group_story_contributions', 'daily_stories'];
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
        mediaStore.createIndex('by_storyId', 'storyId', { unique: false });
        mediaStore.createIndex('by_ownerProfileId', 'ownerProfileId', { unique: false });
        mediaStore.createIndex('by_createdAt', 'createdAt', { unique: false });
        mediaStore.createIndex('by_type', 'type', { unique: false });
        mediaStore.createIndex('by_source', 'source', { unique: false });
        console.log('✅ Created media_assets store with all indices');

        // Albums store
        const albumStore = db.createObjectStore('albums', { keyPath: 'id' });
        albumStore.createIndex('by_createdAt', 'createdAt', { unique: false });
        console.log('✅ Created albums store');

        // System Settings store
        const settingsStore = db.createObjectStore('system_settings', { keyPath: 'id' });
        console.log('✅ Created system_settings store');

        // Group Stories store
        const groupStoryStore = db.createObjectStore('group_stories', { keyPath: 'id' });
        groupStoryStore.createIndex('status', 'status', { unique: false });
        groupStoryStore.createIndex('createdAt', 'createdAt', { unique: false });
        console.log('✅ Created group_stories store');

        // Group Story Contributions store
        const groupContributionStore = db.createObjectStore('group_story_contributions', { keyPath: 'id' });
        groupContributionStore.createIndex('groupStoryId', 'groupStoryId', { unique: false });
        groupContributionStore.createIndex('userId', 'userId', { unique: false });
        groupContributionStore.createIndex('orderIndex', 'orderIndex', { unique: false });
        console.log('✅ Created group_story_contributions store');

        // Daily Stories store (Racconto del Giorno)
        const dailyStoryStore = db.createObjectStore('daily_stories', { keyPath: 'date' });
        console.log('✅ Created daily_stories store');
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

  async getAllProfiles(): Promise<Profile[]> {
    return this.getProfiles();
  }

  async deleteProfile(profileId: string): Promise<void> {
    const transaction = this.db!.transaction(['profiles'], 'readwrite');
    const store = transaction.objectStore('profiles');
    await store.delete(profileId);
  }

  // AM Stories Management (User Stories)
  async saveAMStory(story: AMStory): Promise<void> {
    const transaction = this.db!.transaction(['am_stories'], 'readwrite');
    const store = transaction.objectStore('am_stories');
    await store.put(story);
  }

  async getAMStoriesByOwner(ownerProfileId: string): Promise<AMStory[]> {
    return this.getAMStoriesByUser(ownerProfileId);
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

  async getAMStoryById(storyId: string): Promise<AMStory | null> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['am_stories'], 'readonly');
    const store = transaction.objectStore('am_stories');
    const request = store.get(storyId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
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

  async getAGStoriesByCategory(category: 'world' | 'science' | 'greek_myths' | 'nordic_myths' | 'explorers'): Promise<AGStory[]> {
    const transaction = this.db!.transaction(['ag_stories'], 'readonly');
    const store = transaction.objectStore('ag_stories');
    const index = store.index('category');
    const request = index.getAll(category);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAGStoryById(storyId: string): Promise<AGStory | null> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['ag_stories'], 'readonly');
    const store = transaction.objectStore('ag_stories');
    const request = store.get(storyId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Reset functions for redesign
  async clearAllAGStories(): Promise<void> {
    console.log('🧹 Clearing all AG stories for redesign...');
    const transaction = this.db!.transaction(['ag_stories'], 'readwrite');
    const store = transaction.objectStore('ag_stories');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log('✅ All AG stories cleared');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearNonSuperuserProfiles(): Promise<void> {
    console.log('🧹 Clearing non-superuser profiles...');
    const profiles = await this.getProfiles();
    const nonSuperuserProfiles = profiles.filter(p => p.id !== 'superuser' && p.user_type !== 'superuser');
    
    if (nonSuperuserProfiles.length === 0) {
      console.log('✅ No non-superuser profiles to clear');
      return;
    }

    const transaction = this.db!.transaction(['profiles', 'am_stories'], 'readwrite');
    const profileStore = transaction.objectStore('profiles');
    const storyStore = transaction.objectStore('am_stories');

    return new Promise((resolve, reject) => {
      let deletedCount = 0;
      const totalToDelete = nonSuperuserProfiles.length;

      nonSuperuserProfiles.forEach(async (profile) => {
        // Delete profile's stories first
        const userStories = await this.getAMStoriesByUser(profile.id);
        userStories.forEach(story => {
          storyStore.delete(story.id);
        });

        // Delete profile
        const request = profileStore.delete(profile.id);
        request.onsuccess = () => {
          deletedCount++;
          console.log('🗑️ Deleted profile and stories:', profile.name);
          if (deletedCount === totalToDelete) {
            console.log('✅ All non-superuser profiles cleared');
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getAllAGStories(): Promise<AGStory[]> {
    const transaction = this.db!.transaction(['ag_stories'], 'readonly');
    const store = transaction.objectStore('ag_stories');
    const request = store.getAll();
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
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['media_assets'], 'readwrite');
    const store = transaction.objectStore('media_assets');
    return new Promise((resolve, reject) => {
      const request = store.put(asset);
      request.onsuccess = () => {
        console.log('💾 Media asset saved:', { id: asset.id, storyId: asset.storyId, size: asset.size });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getMediaAssetsByStoryId(storyId: string): Promise<MediaAsset[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['media_assets'], 'readonly');
    const store = transaction.objectStore('media_assets');
    
    try {
      const index = store.index('by_storyId');
      const request = index.getAll(storyId);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const results = request.result.sort((a: MediaAsset, b: MediaAsset) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Index by_storyId not found, using fallback');
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const filtered = request.result
            .filter((asset: MediaAsset) => asset.storyId === storyId)
            .sort((a: MediaAsset, b: MediaAsset) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          resolve(filtered);
        };
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getLatestMediaAssetByStoryId(storyId: string): Promise<MediaAsset | null> {
    const assets = await this.getMediaAssetsByStoryId(storyId);
    return assets.length > 0 ? assets[0] : null;
  }

  // Alias for backwards compatibility
  async getMediaAssetByStoryId(storyId: string): Promise<MediaAsset | null> {
    return this.getLatestMediaAssetByStoryId(storyId);
  }

  async getAllMediaAssets(): Promise<MediaAsset[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['media_assets'], 'readonly');
    const store = transaction.objectStore('media_assets');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getMediaAssetCountByStoryId(storyId: string): Promise<number> {
    const assets = await this.getMediaAssetsByStoryId(storyId);
    return assets.length;
  }

  async deleteMediaAsset(assetId: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['media_assets'], 'readwrite');
    const store = transaction.objectStore('media_assets');
    return new Promise((resolve, reject) => {
      const request = store.delete(assetId);
      request.onsuccess = () => {
        console.log('🗑️ Media asset deleted:', assetId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMediaAssetsByStoryId(storyId: string): Promise<void> {
    if (!this.db) await this.init();
    const assets = await this.getMediaAssetsByStoryId(storyId);
    
    if (assets.length === 0) return;
    
    const transaction = this.db!.transaction(['media_assets'], 'readwrite');
    const store = transaction.objectStore('media_assets');
    
    return new Promise((resolve, reject) => {
      let deletedCount = 0;
      const totalAssets = assets.length;
      
      assets.forEach(asset => {
        const request = store.delete(asset.id);
        request.onsuccess = () => {
          deletedCount++;
          if (deletedCount === totalAssets) {
            console.log('🗑️ All media assets deleted for story:', storyId, '(count:', totalAssets, ')');
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

   // Pipeline comune per conversione e salvataggio media
  async saveMediaFromPreview(params: {
    storyId: string;
    ownerProfileId: string;
    previewUrl?: string;       // Può essere undefined se abbiamo originalUrl
    originalUrl?: string;      // URL remoto (SAS) per fetch iniziale
    previewBlob?: Blob;        // Blob già disponibile
    type: 'image' | 'audio' | 'video';
    source: 'openai' | 'upload';
    filename?: string;
  }): Promise<string> {
    // Ensure storyId is always string for consistency
    const storyIdString = String(params.storyId);
    console.log('🔄 Starting media save pipeline for story:', storyIdString);

    // Determina Blob finale (OBBLIGATORIO)
    let finalBlob: Blob;
    let mime: string;

    if (params.previewBlob) {
      // Blob già disponibile
      finalBlob = params.previewBlob;
      mime = finalBlob.type || (params.type === 'image' ? 'image/webp' : 'application/octet-stream');
    } else if (params.previewUrl && params.previewUrl.startsWith('data:')) {
      // Base64 data URL → Blob
      const [header, base64Data] = params.previewUrl.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      mime = mimeMatch ? mimeMatch[1] : (params.type === 'image' ? 'image/webp' : 'application/octet-stream');
      
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      finalBlob = new Blob([bytes], { type: mime });
    } else if (params.originalUrl) {
      // Fetch da URL remoto (SAS) per salvataggio iniziale
      console.log('📥 Fetching from remote URL for initial save:', { 
        originalUrl: params.originalUrl.substring(0, 100) + '...' 
      });
      
      try {
        const response = await fetch(params.originalUrl, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        finalBlob = await response.blob();
        mime = finalBlob.type || (params.type === 'image' ? 'image/webp' : 'application/octet-stream');
        
        // Correggi MIME se necessario
        if (!mime || mime === 'application/octet-stream') {
          if (params.originalUrl.includes('.webp')) mime = 'image/webp';
          else if (params.originalUrl.includes('.png')) mime = 'image/png';
          else if (params.originalUrl.includes('.jpg') || params.originalUrl.includes('.jpeg')) mime = 'image/jpeg';
          else mime = 'image/webp';
          
          finalBlob = new Blob([finalBlob], { type: mime });
        }
      } catch (fetchError) {
        console.error('❌ Failed to fetch remote URL:', fetchError);
        throw new Error(`Cannot fetch remote image: ${fetchError.message}`);
      }
    } else if (params.previewUrl) {
      // URL locale/temporaneo
      const response = await fetch(params.previewUrl, { mode: 'cors' });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      
      finalBlob = await response.blob();
      mime = finalBlob.type || (params.type === 'image' ? 'image/webp' : 'application/octet-stream');
    } else {
      throw new Error('No valid preview data provided (previewUrl, originalUrl, or previewBlob required)');
    }

    // Validazione Blob OBBLIGATORIA
    if (!finalBlob || finalBlob.size === 0) {
      throw new Error('Invalid or empty Blob generated - cannot save');
    }

    // Conversione WebP opzionale (per ridurre dimensioni)
    if (params.type === 'image' && !mime.includes('webp') && !mime.includes('svg') && finalBlob.size > 500000) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(finalBlob);
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const webpBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((result) => resolve(result!), 'image/webp', 0.85);
        });
        
        URL.revokeObjectURL(img.src);
        
        if (webpBlob && webpBlob.size < finalBlob.size) {
          console.log('✅ WebP conversion saved space:', { 
            originalSize: finalBlob.size, 
            newSize: webpBlob.size,
            savings: ((1 - webpBlob.size / finalBlob.size) * 100).toFixed(1) + '%'
          });
          finalBlob = webpBlob;
          mime = 'image/webp';
        }
      } catch (conversionError) {
        console.warn('⚠️ WebP conversion failed, keeping original:', conversionError);
      }
    }

    // Validazione dimensioni (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (finalBlob.size > maxSize) {
      throw new Error(`File too large: ${(finalBlob.size / 1024 / 1024).toFixed(2)}MB (max: 20MB)`);
    }

    // Crea record media asset
    const assetId = `${storyIdString}-${params.source}-${Date.now()}`;
    const asset: MediaAsset = {
      id: assetId,
      storyId: storyIdString,
      ownerProfileId: params.ownerProfileId,
      type: params.type,
      source: params.source,
      mime,
      size: finalBlob.size,
      createdAt: new Date().toISOString(),
      data: finalBlob,                    // SEMPRE Blob, mai undefined
      originalUrl: params.originalUrl,    // Solo storico/diagnostica
      needsRefetch: false
    };

    // Transazione atomica: salva media + aggiorna hasImage
    const transaction = this.db!.transaction(['media_assets', 'am_stories'], 'readwrite');
    
    return new Promise((resolve, reject) => {
      // Salva media asset
      const mediaStore = transaction.objectStore('media_assets');
      const mediaRequest = mediaStore.put(asset);
      
      mediaRequest.onsuccess = () => {
        // Aggiorna hasImage nella storia
        const storyStore = transaction.objectStore('am_stories');
        const getStoryRequest = storyStore.get(storyIdString);
        
        getStoryRequest.onsuccess = () => {
          const story = getStoryRequest.result;
          if (story) {
            story.hasImage = true;
            storyStore.put(story);
          }
        };
      };

      transaction.oncomplete = () => {
        console.log('✅ Media save pipeline completed successfully:', {
          assetId,
          storyId: storyIdString,
          size: finalBlob.size,
          mime,
          source: params.source,
          hasOriginalUrl: !!params.originalUrl
        });
        
        // Emit evento per sync UI (lazy imported to avoid circular deps)
        import('./eventDebounce').then(({ dispatchDebouncedEvent }) => {
          dispatchDebouncedEvent('am-story-updated', { 
            storyId: storyIdString, 
            action: 'media-added',
            hasImage: true 
          });
        });
        
        resolve(assetId);
      };

      transaction.onerror = () => {
        console.error('❌ Media save pipeline failed:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // Utility Methods
  async hasImageForStory(storyId: string): Promise<boolean> {
    const asset = await this.getLatestMediaAssetByStoryId(storyId);
    return asset !== null && asset.type === 'image';
  }

  async createImagePreviewUrl(asset: MediaAsset): Promise<string> {
    return URL.createObjectURL(asset.data);
  }

  async validateStoryImageAlignment(): Promise<void> {
    console.log('🔍 Validating story-image alignment...');
    
    const allAMStories = await this.getAllAMStories();
    let misalignments = 0;

    for (const story of allAMStories) {
      const mediaCount = await this.getMediaAssetCountByStoryId(story.id);
      const hasMedia = mediaCount > 0;
      
      if (story.hasImage !== hasMedia) {
        console.warn(`⚠️ Misalignment: Story ${story.id} hasImage=${story.hasImage} but media count=${mediaCount}`);
        
        // Auto-fix: update hasImage flag
        story.hasImage = hasMedia;
        await this.saveAMStory(story);
        misalignments++;
      }
    }

    if (misalignments > 0) {
      console.log(`✅ Fixed ${misalignments} story-image misalignments`);
    } else {
      console.log('✅ All stories aligned with media assets');
    }
  }

  private async getAllAMStories(): Promise<AMStory[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['am_stories'], 'readonly');
    const store = transaction.objectStore('am_stories');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Migrazione record esistenti senza Blob - DISABILITATA (evita fetch remoti CORS/403)
  async migrateExistingMediaAssets(): Promise<number> {
    console.log('🔄 Starting migration of existing media assets without Blob...');
    
    // Migration disabled to prevent CORS/403 errors from remote URLs
    console.log('✅ Migration completed: 0 assets restored from originalUrl (remote fetch disabled)');
    return 0;
  }

  // Migrazione dati legacy da localStorage
  async migrateMediaAssetsFromLocalStorage(): Promise<number> {
    console.log('🔄 Starting media assets migration from localStorage...');
    
    let migrated = 0;
    const allStories = await this.getAllAMStories();

    for (const story of allStories) {
      // Check for legacy localStorage keys
      const legacyKeys = [
        `story-image-${story.id}`,
        `am-story-image-${story.id}`,
        `user-story-image-${story.id}`
      ];

      for (const key of legacyKeys) {
        const legacyData = localStorage.getItem(key);
        if (legacyData && legacyData.startsWith('data:image')) {
          try {
            console.log(`🔄 Migrating legacy image for story ${story.id}`);
            
            await this.saveMediaFromPreview({
              storyId: story.id,
              ownerProfileId: story.ownerProfileId,
              previewUrl: legacyData,
              type: 'image',
              source: 'upload' // Legacy data treated as upload
            });
            
            // Rimuovi da localStorage dopo migrazione
            localStorage.removeItem(key);
            migrated++;
            
            console.log(`✅ Migrated legacy image for story ${story.id}`);
            break; // Una sola immagine per storia
          } catch (error) {
            console.error(`❌ Failed to migrate legacy image for story ${story.id}:`, error);
          }
        }
      }
    }
    
    console.log(`✅ Migration completed: ${migrated} legacy images migrated`);
    return migrated;
  }

  // Auto-detect story type if not provided
  async detectStoryType(storyId: string): Promise<'am' | 'ag' | null> {
    if (!this.db) await this.init();
    
    // Check AM stories first
    const amTx = this.db!.transaction(['am_stories'], 'readonly');
    const amStore = amTx.objectStore('am_stories');
    const amRequest = amStore.get(storyId);
    
    return new Promise((resolve) => {
      amRequest.onsuccess = () => {
        if (amRequest.result) {
          resolve('am');
          return;
        }
        
        // Check AG stories
        const agTx = this.db!.transaction(['ag_stories'], 'readonly');
        const agStore = agTx.objectStore('ag_stories');
        const agRequest = agStore.get(storyId);
        
        agRequest.onsuccess = () => {
          if (agRequest.result) {
            resolve('ag');
          } else {
            resolve(null);
          }
        };
        
        agRequest.onerror = () => resolve(null);
      };
      
      amRequest.onerror = () => resolve(null);
    });
  }

  // Atomic save: media asset + story update with correct flag names
  async saveMediaAssetWithStoryUpdate(asset: MediaAsset, storyId: string, storyType?: 'am' | 'ag'): Promise<void> {
    if (!this.db) await this.init();
    
    // Auto-detect story type if not provided
    let detectedType = storyType;
    if (!detectedType) {
      detectedType = await this.detectStoryType(storyId);
      if (!detectedType) {
        throw new Error(`Story ${storyId} not found in any store`);
      }
    }
    
    const storeName = detectedType === 'am' ? 'am_stories' : 'ag_stories';
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['media_assets', storeName], 'readwrite');
      
      // Save media asset
      const mediaStore = tx.objectStore('media_assets');
      mediaStore.put(asset);
      
      // Update story with correct flag name
      const storyStore = tx.objectStore(storeName);
      const getRequest = storyStore.get(storyId);
      getRequest.onsuccess = () => {
        const story = getRequest.result;
        if (story) {
          // Use correct flag name based on story type
          if (detectedType === 'am') {
            story.hasImage = true;  // AM stories use hasImage
          } else {
            story.has_image = true; // AG stories use has_image
          }
          storyStore.put(story);
        }
      };
      
      tx.oncomplete = () => {
        // Emit standardized event with debounce
        import('./eventDebounce').then(({ dispatchDebouncedEvent }) => {
          dispatchDebouncedEvent('media:updated', { 
            storyId: String(storyId),
            storyType: detectedType,
            action: 'image-added'
          });
        });
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  // Get media count by story ID
  async getMediaCountByStoryId(storyId: string): Promise<number> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(['media_assets'], 'readonly');
    const store = tx.objectStore('media_assets');
    const index = store.index('by_storyId');
    
    return new Promise((resolve, reject) => {
      const countRequest = index.count(storyId);
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  async updateStoryImageStatus(storyId: string, storyType: 'am' | 'ag', hasImage: boolean): Promise<void> {
    const storeName = storyType === 'am' ? 'am_stories' : 'ag_stories';
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(storyId);
      getRequest.onsuccess = () => {
        const story = getRequest.result;
        if (story) {
          if (storyType === 'am') {
            story.hasImage = hasImage; // AM stories use hasImage
          } else {
            story.has_image = hasImage; // AG stories use has_image
          }
          const putRequest = store.put(story);
          putRequest.onsuccess = () => {
            // Emit update event for real-time UI updates with debounce
            import('../utils/eventDebounce').then(({ dispatchDebouncedEvent }) => {
              dispatchDebouncedEvent('am-story-updated', { 
                storyId, action: 'image-updated', hasImage 
              });
            });
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Force Reset Database - Cancella completamente il database e lo ricrea
   * Utilizzare solo in caso di corruzione o problemi critici
   */
  async forceReset(): Promise<void> {
    console.log('🔄 Force resetting IndexedDB...');
    
    // Close current connection
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    // Delete database completely
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbConfig.name);
      
      deleteRequest.onsuccess = () => {
        console.log('✅ Database deleted successfully');
        resolve();
      };
      
      deleteRequest.onerror = () => {
        console.error('❌ Failed to delete database:', deleteRequest.error);
        reject(deleteRequest.error);
      };
      
      deleteRequest.onblocked = () => {
        console.warn('⚠️ Database deletion blocked - close all tabs using this database');
      };
    });
  }

  /**
   * Diagnostica Database - Restituisce informazioni sullo stato del database
   */
  async getDatabaseDiagnostics(): Promise<{
    version: number;
    storesPresent: string[];
    storesMissing: string[];
    isHealthy: boolean;
  }> {
    const requiredStores = ['profiles', 'am_stories', 'ag_stories', 'media_assets'];
    
    if (!this.db) {
      return {
        version: 0,
        storesPresent: [],
        storesMissing: requiredStores,
        isHealthy: false
      };
    }
    
    const storesPresent: string[] = [];
    for (let i = 0; i < this.db.objectStoreNames.length; i++) {
      storesPresent.push(this.db.objectStoreNames[i]);
    }
    
    const storesMissing = requiredStores.filter(name => !storesPresent.includes(name));
    
    return {
      version: this.db.version,
      storesPresent,
      storesMissing,
      isHealthy: storesMissing.length === 0
    };
  }

  // Albums Management
  async saveAlbum(album: Album): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['albums'], 'readwrite');
    const store = transaction.objectStore('albums');
    await store.put(album);
  }

  async getAlbums(): Promise<Album[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['albums'], 'readonly');
    const store = transaction.objectStore('albums');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAlbumById(albumId: string): Promise<Album | null> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['albums'], 'readonly');
    const store = transaction.objectStore('albums');
    const request = store.get(albumId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAlbum(albumId: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['albums'], 'readwrite');
    const store = transaction.objectStore('albums');
    await store.delete(albumId);
  }

  // System Settings Management
  async getSystemSettings(): Promise<SystemSettings> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['system_settings'], 'readonly');
    const store = transaction.objectStore('system_settings');
    const request = store.get('email_config');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result);
        } else {
          // Return default values if not found
          const defaults: SystemSettings = {
            id: 'email_config',
            updatedAt: new Date().toISOString()
          };
          resolve(defaults);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSystemSettings(settings: Omit<SystemSettings, 'id' | 'updatedAt'>): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['system_settings'], 'readwrite');
    const store = transaction.objectStore('system_settings');
    
    const settingsToSave: SystemSettings = {
      id: 'email_config',
      ...settings,
      updatedAt: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(settingsToSave);
      request.onsuccess = () => {
        console.log('✅ System settings saved:', settingsToSave);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Group Stories Management
  async saveGroupStory(story: GroupStory): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['group_stories'], 'readwrite');
    const store = transaction.objectStore('group_stories');
    await store.put(story);
  }

  async getGroupStoryById(storyId: string): Promise<GroupStory | null> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['group_stories'], 'readonly');
    const store = transaction.objectStore('group_stories');
    const request = store.get(storyId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getGroupStoriesByStatus(status: 'in_progress' | 'pending_approval' | 'completed'): Promise<GroupStory[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['group_stories'], 'readonly');
    const store = transaction.objectStore('group_stories');
    const index = store.index('status');
    const request = index.getAll(status);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllGroupStories(): Promise<GroupStory[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['group_stories'], 'readonly');
    const store = transaction.objectStore('group_stories');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteGroupStory(storyId: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['group_stories'], 'readwrite');
    const store = transaction.objectStore('group_stories');
    return new Promise((resolve, reject) => {
      const request = store.delete(storyId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Group Story Contributions Management
  async saveGroupStoryContribution(contribution: GroupStoryContribution): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['group_story_contributions'], 'readwrite');
    const store = transaction.objectStore('group_story_contributions');
    await store.put(contribution);
  }

  async getContributionsByGroupStoryId(groupStoryId: string): Promise<GroupStoryContribution[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['group_story_contributions'], 'readonly');
    const store = transaction.objectStore('group_story_contributions');
    const index = store.index('groupStoryId');
    const request = index.getAll(groupStoryId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const contributions = request.result;
        // Sort by orderIndex
        contributions.sort((a, b) => a.orderIndex - b.orderIndex);
        resolve(contributions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteGroupStoryContribution(contributionId: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['group_story_contributions'], 'readwrite');
    const store = transaction.objectStore('group_story_contributions');
    return new Promise((resolve, reject) => {
      const request = store.delete(contributionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============= Daily Stories Management (Racconto del Giorno) =============

  async saveDailyStory(story: DailyStory): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['daily_stories'], 'readwrite');
    const store = transaction.objectStore('daily_stories');
    return new Promise((resolve, reject) => {
      const request = store.put(story);
      request.onsuccess = () => {
        console.log('💾 Daily story saved:', story.date);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getDailyStoryByDate(date: string): Promise<DailyStory | null> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['daily_stories'], 'readonly');
    const store = transaction.objectStore('daily_stories');
    const request = store.get(date);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDailyStories(): Promise<DailyStory[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['daily_stories'], 'readonly');
    const store = transaction.objectStore('daily_stories');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDailyStory(date: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['daily_stories'], 'readwrite');
    const store = transaction.objectStore('daily_stories');
    return new Promise((resolve, reject) => {
      const request = store.delete(date);
      request.onsuccess = () => {
        console.log('🗑️ Daily story deleted:', date);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async importDailyStories(stories: DailyStory[]): Promise<number> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['daily_stories'], 'readwrite');
    const store = transaction.objectStore('daily_stories');
    
    let count = 0;
    for (const story of stories) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(story);
        request.onsuccess = () => {
          count++;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }
    
    console.log(`📚 Imported ${count} daily stories`);
    return count;
  }
}

// Singleton instance
export const fantasMiaDB = new FantasMiaDB();

// Initialize database on import with auto-recovery and persistence manager
fantasMiaDB.init()
  .catch(async (error) => {
    console.error('❌ Database initialization failed:', error);
    
    // Auto-recovery: gestisce sia stores mancanti che version mismatch
    if (error.message?.includes('Missing stores') || error.message?.includes('Version mismatch')) {
      console.log('🔄 Attempting automatic recovery...');
      console.log('⚠️ This will DELETE all local data and recreate the database');
      
      try {
        // Auto-reset e retry
        await fantasMiaDB.forceReset();
        console.log('✅ Database deleted');
        
        await fantasMiaDB.init();
        console.log('✅ Database recreated at correct version');
        
        console.log('✅ Database recovered successfully via auto-reset');
      } catch (recoveryError) {
        console.error('❌ Auto-recovery failed:', recoveryError);
        console.error('⚠️ Manual intervention required: Close ALL tabs and clear browser data');
        throw recoveryError;
      }
    } else {
      throw error;
    }
  })
  .then(() => {
    // Run automatic migrations after database initialization
    return fantasMiaDB.migrateMediaAssetsFromLocalStorage();
  })
  .then((migrated) => {
    if (migrated > 0) {
      console.log(`✅ Legacy migration completed: ${migrated} images migrated from localStorage`);
    }
    // Skip existing media assets migration (disabled to prevent CORS/403 errors)
    console.log('🔄 Starting migration of existing media assets without Blob...');
    console.log('✅ Migration completed: 0 assets restored from originalUrl (remote fetch disabled)');
    
    // Initialize persistence manager after all migrations
    return import('./persistenceManager').then(({ persistenceManager }) => {
      return persistenceManager.initialize();
    });
  })
  .catch(console.error);

export type { Profile, AMStory, AGStory, MediaAsset, Album, SystemSettings };