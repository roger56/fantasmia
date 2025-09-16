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
  poem?: string;
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
}

class FantasMiaDB {
  private db: IDBDatabase | null = null;
  private readonly dbConfig: DatabaseConfig = {
    name: 'FantasMiaV2',
    version: 3 // Bump version for complete media assets schema
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
        mediaStore.createIndex('by_storyId', 'storyId', { unique: false });
        mediaStore.createIndex('by_ownerProfileId', 'ownerProfileId', { unique: false });
        mediaStore.createIndex('by_createdAt', 'createdAt', { unique: false });
        mediaStore.createIndex('by_type', 'type', { unique: false });
        mediaStore.createIndex('by_source', 'source', { unique: false });
        console.log('✅ Created media_assets store with all indices');
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
        
        // Emit evento per sync UI
        window.dispatchEvent(new CustomEvent('am-story-updated', {
          detail: { 
            storyId: storyIdString, 
            action: 'media-added',
            hasImage: true 
          }
        }));
        
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

  // Migrazione record esistenti senza Blob
  async migrateExistingMediaAssets(): Promise<number> {
    console.log('🔄 Starting migration of existing media assets without Blob...');
    
    let migrated = 0;
    const allAssets = await this.getAllMediaAssets();
    
    for (const asset of allAssets) {
      // Skip se ha già un Blob valido
      if (asset.data && asset.data instanceof Blob && asset.data.size > 0) {
        continue;
      }
      
      // Prova a ricostruire da originalUrl se disponibile
      if (asset.originalUrl) {
        try {
          console.log(`🔄 Migrating asset ${asset.id} from originalUrl`);
          
          const response = await fetch(asset.originalUrl, { mode: 'cors' });
          if (!response.ok) {
            console.warn(`⚠️ Cannot fetch originalUrl for asset ${asset.id}: HTTP ${response.status}`);
            
            // Segna come "needs refetch"
            const updatedAsset = { ...asset, needsRefetch: true };
            await this.saveMediaAsset(updatedAsset);
            continue;
          }
          
          const blob = await response.blob();
          if (blob.size > 0) {
            // Aggiorna con Blob valido
            const updatedAsset = { 
              ...asset, 
              data: blob, 
              size: blob.size,
              mime: blob.type || asset.mime,
              needsRefetch: false
            };
            await this.saveMediaAsset(updatedAsset);
            migrated++;
            
            console.log(`✅ Migrated asset ${asset.id}: ${blob.size} bytes`);
          }
        } catch (error) {
          console.warn(`⚠️ Migration failed for asset ${asset.id}:`, error);
          
          // Segna come "needs refetch"
          const updatedAsset = { ...asset, needsRefetch: true };
          await this.saveMediaAsset(updatedAsset);
        }
      } else {
        console.warn(`⚠️ Asset ${asset.id} has no originalUrl and no valid Blob`);
        const updatedAsset = { ...asset, needsRefetch: true };
        await this.saveMediaAsset(updatedAsset);
      }
    }
    
    console.log(`✅ Migration completed: ${migrated} assets restored from originalUrl`);
    return migrated;
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

  // Atomic save: media asset + story update
  async saveMediaAssetWithStoryUpdate(asset: MediaAsset, storyId: string, storyType: 'am' | 'ag'): Promise<void> {
    if (!this.db) await this.init();
    const storeName = storyType === 'am' ? 'am_stories' : 'ag_stories';
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['media_assets', storeName], 'readwrite');
      
      // Save media asset
      const mediaStore = tx.objectStore('media_assets');
      mediaStore.put(asset);
      
      // Update story hasImage flag
      const storyStore = tx.objectStore(storeName);
      const getRequest = storyStore.get(storyId);
      getRequest.onsuccess = () => {
        const story = getRequest.result;
        if (story) {
          story.hasImage = true;
          storyStore.put(story);
        }
      };
      
      tx.oncomplete = () => resolve();
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
            // Emit update event for real-time UI updates
            window.dispatchEvent(new CustomEvent('am-story-updated', { 
              detail: { storyId, action: 'image-updated', hasImage } 
            }));
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
}

// Singleton instance
export const fantasMiaDB = new FantasMiaDB();

// Initialize database on import
fantasMiaDB.init()
  .then(() => {
    // Run automatic migrations after database initialization
    return fantasMiaDB.migrateMediaAssetsFromLocalStorage();
  })
  .then((migrated) => {
    if (migrated > 0) {
      console.log(`✅ Legacy migration completed: ${migrated} images migrated from localStorage`);
    }
    // Run existing media assets migration (for URL → Blob conversion)
    return fantasMiaDB.migrateExistingMediaAssets();
  })
  .then((migrated) => {
    if (migrated > 0) {
      console.log(`✅ Media migration completed: ${migrated} assets converted to Blob`);
    }
  })
  .catch(console.error);

export type { Profile, AMStory, AGStory, MediaAsset };