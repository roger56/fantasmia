/**
 * TTS Settings Manager
 * 
 * Gestisce i parametri TTS consigliati dall'archivio di sistema
 * e le modifiche locali del Superuser.
 * 
 * Logica:
 * - All'avvio, carica i default dall'archivio TTS_SETTINGS
 * - Se non esistono valori locali, applica i default
 * - Se esistono valori locali (modificati dal SU), li mantiene
 * - Il pulsante "Ripristina valori consigliati" sovrascrive i valori locali
 */

const TTS_SETTINGS_URL = '/tts-settings.json';
const LOCAL_STORAGE_KEY = 'fantasmia_tts_local_v1';
const USER_MODIFIED_KEY = 'fantasmia_tts_user_modified_v1';

export interface TTSLanguageSettings {
  rate: number;
  pitch: number;
  volume: number;
  lang: string;
}

export interface TTSSettingsArchive {
  version: string;
  updatedAt: string;
  defaults: {
    italian: TTSLanguageSettings;
    english: TTSLanguageSettings;
  };
  voicePreferences: {
    'it-IT': string[];
    'en-US': string[];
  };
}

export interface LocalTTSSettings {
  rate: number;
  pitch: number;
  volume: number;
  voiceURI?: string;
  lastModified?: string;
}

/**
 * Carica l'archivio TTS_SETTINGS dal server
 */
export const fetchTTSSettingsArchive = async (): Promise<TTSSettingsArchive | null> => {
  try {
    const response = await fetch(TTS_SETTINGS_URL, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) {
      console.warn('TTSSettingsManager: Failed to fetch TTS settings:', response.status);
      return null;
    }
    
    const archive = await response.json();
    console.log('TTSSettingsManager: Archive loaded, version:', archive.version);
    return archive;
  } catch (error) {
    console.error('TTSSettingsManager: Error fetching TTS settings:', error);
    return null;
  }
};

/**
 * Legge i valori TTS salvati localmente
 */
export const getLocalTTSSettings = (): LocalTTSSettings | null => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('TTSSettingsManager: Error reading local settings:', error);
    return null;
  }
};

/**
 * Salva i valori TTS localmente
 */
export const saveLocalTTSSettings = (settings: LocalTTSSettings): void => {
  try {
    settings.lastModified = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    console.log('TTSSettingsManager: Local settings saved:', settings);
  } catch (error) {
    console.error('TTSSettingsManager: Error saving local settings:', error);
  }
};

/**
 * Verifica se l'utente ha modificato le impostazioni
 */
export const isUserModified = (): boolean => {
  return localStorage.getItem(USER_MODIFIED_KEY) === 'true';
};

/**
 * Marca le impostazioni come modificate dall'utente
 */
export const markAsUserModified = (): void => {
  localStorage.setItem(USER_MODIFIED_KEY, 'true');
};

/**
 * Resetta il flag di modifica utente (per ripristino valori consigliati)
 */
export const clearUserModified = (): void => {
  localStorage.removeItem(USER_MODIFIED_KEY);
};

/**
 * Ottiene i valori TTS effettivi da usare
 * Priorità: valori locali (se esistono) > valori archivio > default hardcoded
 */
export const getEffectiveTTSSettings = async (): Promise<LocalTTSSettings> => {
  // Default hardcoded come fallback
  const hardcodedDefaults: LocalTTSSettings = {
    rate: 0.97,
    pitch: 1.0,
    volume: 1.0
  };
  
  // Check local settings first
  const localSettings = getLocalTTSSettings();
  if (localSettings && isUserModified()) {
    console.log('TTSSettingsManager: Using user-modified local settings');
    return localSettings;
  }
  
  // Try to get archive defaults
  const archive = await fetchTTSSettingsArchive();
  if (archive?.defaults?.italian) {
    const archiveDefaults: LocalTTSSettings = {
      rate: archive.defaults.italian.rate,
      pitch: archive.defaults.italian.pitch,
      volume: archive.defaults.italian.volume
    };
    console.log('TTSSettingsManager: Using archive defaults:', archiveDefaults);
    return archiveDefaults;
  }
  
  console.log('TTSSettingsManager: Using hardcoded defaults');
  return hardcodedDefaults;
};

/**
 * Inizializza il TTS con i valori appropriati
 * Chiamato all'avvio dell'app
 */
export const initializeTTSFromArchive = async (
  setParams: (params: { newRate?: number; newPitch?: number; newVolume?: number }) => void
): Promise<LocalTTSSettings> => {
  const settings = await getEffectiveTTSSettings();
  
  // Apply settings to TTS controller
  setParams({
    newRate: settings.rate,
    newPitch: settings.pitch,
    newVolume: settings.volume
  });
  
  console.log('TTSSettingsManager: TTS initialized with:', settings);
  return settings;
};

/**
 * Ripristina i valori consigliati dall'archivio
 * Sovrascrive i valori locali
 */
export const restoreRecommendedSettings = async (
  setParams: (params: { newRate?: number; newPitch?: number; newVolume?: number }) => void
): Promise<LocalTTSSettings> => {
  // Clear user modified flag
  clearUserModified();
  
  // Get archive defaults
  const archive = await fetchTTSSettingsArchive();
  
  const defaults: LocalTTSSettings = archive?.defaults?.italian 
    ? {
        rate: archive.defaults.italian.rate,
        pitch: archive.defaults.italian.pitch,
        volume: archive.defaults.italian.volume
      }
    : {
        rate: 0.97,
        pitch: 1.0,
        volume: 1.0
      };
  
  // Save as local settings (but not marked as user-modified)
  saveLocalTTSSettings(defaults);
  
  // Apply to TTS controller
  setParams({
    newRate: defaults.rate,
    newPitch: defaults.pitch,
    newVolume: defaults.volume
  });
  
  console.log('TTSSettingsManager: Restored recommended settings:', defaults);
  return defaults;
};

/**
 * Salva le modifiche utente
 */
export const saveUserTTSSettings = (
  settings: LocalTTSSettings,
  setParams: (params: { newRate?: number; newPitch?: number; newVolume?: number }) => void
): void => {
  markAsUserModified();
  saveLocalTTSSettings(settings);
  
  setParams({
    newRate: settings.rate,
    newPitch: settings.pitch,
    newVolume: settings.volume
  });
  
  console.log('TTSSettingsManager: User settings saved:', settings);
};

/**
 * Trova la migliore voce disponibile in base alle preferenze dell'archivio
 */
export const findBestVoiceFromPreferences = async (
  availableVoices: SpeechSynthesisVoice[],
  lang: 'it-IT' | 'en-US' = 'it-IT'
): Promise<SpeechSynthesisVoice | null> => {
  if (availableVoices.length === 0) return null;
  
  const archive = await fetchTTSSettingsArchive();
  const preferences = archive?.voicePreferences?.[lang] || [];
  
  // Prima cerca nelle preferenze
  for (const pref of preferences) {
    const match = availableVoices.find(v => 
      v.name.toLowerCase().includes(pref.toLowerCase()) && 
      v.lang.startsWith(lang.split('-')[0])
    );
    if (match) {
      console.log('TTSSettingsManager: Found preferred voice:', match.name);
      return match;
    }
  }
  
  // Fallback: prima voce della lingua richiesta
  const langVoice = availableVoices.find(v => v.lang.startsWith(lang.split('-')[0]));
  if (langVoice) return langVoice;
  
  // Ultimo fallback: prima voce disponibile
  return availableVoices[0];
};

/**
 * Ottiene la versione dell'archivio TTS
 */
export const getTTSSettingsVersion = async (): Promise<string | null> => {
  const archive = await fetchTTSSettingsArchive();
  return archive?.version || null;
};
