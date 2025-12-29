/**
 * Content Update Manager
 * 
 * Gestisce il rilevamento e l'aggiornamento dei contenuti statici in /public
 * Confronta le versioni nel manifest con quelle salvate in localStorage
 */

const STORAGE_KEY = 'fantasmia_content_versions';
const MANIFEST_URL = '/content-manifest.json';

export interface DatasetInfo {
  file: string;
  version: string;
  label: string;
}

export interface ContentManifest {
  manifestVersion: string;
  updatedAt: string;
  datasets: Record<string, DatasetInfo>;
}

export interface ContentUpdate {
  key: string;
  label: string;
  oldVersion: string | null;
  newVersion: string;
}

export interface ContentUpdateResult {
  hasUpdates: boolean;
  updates: ContentUpdate[];
  manifest: ContentManifest | null;
}

/**
 * Recupera le versioni salvate in localStorage
 */
export const getSavedVersions = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('ContentUpdateManager: Error reading saved versions:', error);
    return {};
  }
};

/**
 * Salva le versioni in localStorage
 */
export const saveVersions = (versions: Record<string, string>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
    console.log('ContentUpdateManager: Versions saved:', versions);
  } catch (error) {
    console.error('ContentUpdateManager: Error saving versions:', error);
  }
};

/**
 * Fetch del manifest con cache disabilitata
 */
export const fetchManifest = async (): Promise<ContentManifest | null> => {
  try {
    const response = await fetch(MANIFEST_URL, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.warn('ContentUpdateManager: Manifest fetch failed:', response.status);
      return null;
    }
    
    const manifest = await response.json();
    console.log('ContentUpdateManager: Manifest fetched:', manifest);
    return manifest;
  } catch (error) {
    console.error('ContentUpdateManager: Error fetching manifest:', error);
    return null;
  }
};

/**
 * Controlla se ci sono aggiornamenti disponibili
 * Confronta le versioni nel manifest con quelle salvate
 */
export const checkContentUpdates = async (): Promise<ContentUpdateResult> => {
  const manifest = await fetchManifest();
  
  if (!manifest) {
    return { hasUpdates: false, updates: [], manifest: null };
  }
  
  const savedVersions = getSavedVersions();
  const updates: ContentUpdate[] = [];
  
  for (const [key, dataset] of Object.entries(manifest.datasets)) {
    const savedVersion = savedVersions[key] || null;
    
    if (savedVersion !== dataset.version) {
      updates.push({
        key,
        label: dataset.label,
        oldVersion: savedVersion,
        newVersion: dataset.version
      });
    }
  }
  
  console.log('ContentUpdateManager: Check complete, updates:', updates.length > 0 ? updates : 'none');
  
  return {
    hasUpdates: updates.length > 0,
    updates,
    manifest
  };
};

/**
 * Segna le versioni come accettate (dopo update effettivo)
 */
export const markVersionsAccepted = (updates: ContentUpdate[]): void => {
  const currentVersions = getSavedVersions();
  
  for (const update of updates) {
    currentVersions[update.key] = update.newVersion;
  }
  
  saveVersions(currentVersions);
};

/**
 * Pulisce tutte le cache e forza reload
 * Esegue in ordine: pulizia caches API, update service worker, salva versioni, reload
 */
export const clearCachesAndReload = async (updates: ContentUpdate[]): Promise<void> => {
  console.log('ContentUpdateManager: Starting cache clear and reload...');
  
  try {
    // 1. Pulisci Cache Storage (PWA caches)
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        console.log('ContentUpdateManager: Clearing caches:', keys);
        await Promise.all(keys.map(k => caches.delete(k)));
        console.log('ContentUpdateManager: Caches cleared successfully');
      } catch (cacheError) {
        console.warn('ContentUpdateManager: Error clearing caches:', cacheError);
      }
    }
    
    // 2. Forza update del Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('ContentUpdateManager: Updating service workers:', registrations.length);
        await Promise.all(registrations.map(r => r.update()));
        console.log('ContentUpdateManager: Service workers updated');
      } catch (swError) {
        console.warn('ContentUpdateManager: Error updating service workers:', swError);
      }
    }
    
    // 3. Salva le nuove versioni PRIMA del reload
    markVersionsAccepted(updates);
    
    // 4. Reload della pagina
    console.log('ContentUpdateManager: Reloading page...');
    window.location.reload();
    
  } catch (error) {
    console.error('ContentUpdateManager: Error during cache clear:', error);
    // Tenta comunque il reload
    window.location.reload();
  }
};

/**
 * Costruisce l'URL di un dataset con versioning per cache-busting
 * @param datasetKey - chiave del dataset nel manifest
 * @param manifest - manifest opzionale (se non fornito, usa il file base)
 */
export const getVersionedUrl = (datasetKey: string, manifest: ContentManifest | null): string => {
  if (manifest && manifest.datasets[datasetKey]) {
    const dataset = manifest.datasets[datasetKey];
    return `${dataset.file}?v=${dataset.version}`;
  }
  
  // Fallback senza versioning
  const fallbackFiles: Record<string, string> = {
    'racconti_del_giorno': '/daily-stories-default.json',
    'conosci_la_parola': '/conosci-la-parola.json'
  };
  
  return fallbackFiles[datasetKey] || '';
};

/**
 * Fetch di un dataset con versioning automatico
 */
export const fetchDatasetWithVersion = async <T>(
  datasetKey: string, 
  manifest?: ContentManifest | null
): Promise<T | null> => {
  try {
    // Se non fornito, recupera il manifest
    const activeManifest = manifest ?? await fetchManifest();
    const url = getVersionedUrl(datasetKey, activeManifest);
    
    if (!url) {
      console.warn('ContentUpdateManager: Unknown dataset key:', datasetKey);
      return null;
    }
    
    console.log('ContentUpdateManager: Fetching dataset:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('ContentUpdateManager: Error fetching dataset:', datasetKey, error);
    return null;
  }
};
