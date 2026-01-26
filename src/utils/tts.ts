/**
 * Singleton TTS Controller per Fantasmia
 * Configurato con valori ottimali per bambini 6-10 anni:
 * - Velocità da archivio TTS_SETTINGS (default 0.94) o fallback 0.97
 * - Lingua italiana di default
 * - Chunking automatico per testi lunghi
 */

import { createTTSController, TTSController, TTSState, TTSStateInfo } from "./tts_speechsynthesis";
import { 
  getLocalTTSSettings, 
  saveLocalTTSSettings, 
  markAsUserModified,
  isUserModified,
  fetchTTSSettingsArchive,
  LocalTTSSettings
} from "./ttsSettingsManager";

// Singleton instance
let ttsInstance: TTSController | null = null;
let initializationPromise: Promise<void> | null = null;

// State change listeners (per componenti React)
type StateListener = (info: TTSStateInfo) => void;
const stateListeners: Set<StateListener> = new Set();

// Voices ready listeners
type VoicesListener = (voices: SpeechSynthesisVoice[], selected: SpeechSynthesisVoice | null) => void;
const voicesListeners: Set<VoicesListener> = new Set();

function notifyStateChange(info: TTSStateInfo): void {
  stateListeners.forEach(listener => {
    try {
      listener(info);
    } catch (e) {
      console.error('TTS state listener error:', e);
    }
  });
}

function notifyVoicesReady(voices: SpeechSynthesisVoice[], selected: SpeechSynthesisVoice | null): void {
  voicesListeners.forEach(listener => {
    try {
      listener(voices, selected);
    } catch (e) {
      console.error('TTS voices listener error:', e);
    }
  });
}

// Voice preferences from archive (loaded async)
let archiveVoicePreferences: string[] = ['Microsoft Elsa', 'Google italiano', 'Italian'];

/**
 * Carica i valori TTS iniziali:
 * - Se esistono valori locali modificati dall'utente → usa quelli
 * - Altrimenti → usa valori dall'archivio TTS_SETTINGS
 * - Fallback → usa default hardcoded
 */
async function loadInitialSettings(): Promise<LocalTTSSettings> {
  const localSettings = getLocalTTSSettings();
  
  // Se l'utente ha modificato le impostazioni, usa quelle
  if (localSettings && isUserModified()) {
    console.log('🔊 TTS: Using user-modified settings:', localSettings);
    return localSettings;
  }
  
  // Altrimenti, prova a caricare dall'archivio
  try {
    const archive = await fetchTTSSettingsArchive();
    if (archive?.defaults?.italian) {
      const archiveSettings: LocalTTSSettings = {
        rate: archive.defaults.italian.rate,
        pitch: archive.defaults.italian.pitch,
        volume: archive.defaults.italian.volume
      };
      // Salva anche le preferenze voce dall'archivio
      if (archive.voicePreferences?.['it-IT']) {
        archiveVoicePreferences = archive.voicePreferences['it-IT'];
      }
      console.log('🔊 TTS: Using archive defaults:', archiveSettings, 'voice prefs:', archiveVoicePreferences);
      // Salva come impostazioni locali (non marcate come modificate)
      saveLocalTTSSettings(archiveSettings);
      return archiveSettings;
    }
  } catch (error) {
    console.warn('🔊 TTS: Could not load archive settings:', error);
  }
  
  // Fallback hardcoded
  const defaults: LocalTTSSettings = { rate: 0.97, pitch: 1.0, volume: 1.0 };
  console.log('🔊 TTS: Using hardcoded defaults:', defaults);
  return defaults;
}

async function initializeTTS(): Promise<TTSController> {
  const settings = await loadInitialSettings();
  
  ttsInstance = createTTSController({
    lang: "it-IT",
    defaultRate: settings.rate,
    defaultPitch: settings.pitch,
    defaultVolume: settings.volume,
    preferredVoiceURI: settings.voiceURI,
    voicePreferences: archiveVoicePreferences,
    onStateChange: notifyStateChange,
    onVoicesReady: notifyVoicesReady,
  });
  
  console.log(`🔊 TTS Controller inizializzato (rate: ${settings.rate}, lang: it-IT)`);
  return ttsInstance;
}

function getTTS(): TTSController {
  if (!ttsInstance) {
    // Inizializzazione sincrona con valori default, poi aggiorna async
    const localSettings = getLocalTTSSettings();
    const rate = localSettings?.rate ?? 0.97;
    const pitch = localSettings?.pitch ?? 1.0;
    const volume = localSettings?.volume ?? 1.0;
    const voiceURI = localSettings?.voiceURI;
    
    ttsInstance = createTTSController({
      lang: "it-IT",
      defaultRate: rate,
      defaultPitch: pitch,
      defaultVolume: volume,
      preferredVoiceURI: voiceURI,
      voicePreferences: archiveVoicePreferences,
      onStateChange: notifyStateChange,
      onVoicesReady: notifyVoicesReady,
    });
    
    console.log(`🔊 TTS Controller inizializzato sync (rate: ${rate}, lang: it-IT)`);
    
    // Avvia inizializzazione async per aggiornare con valori archivio se necessario
    if (!initializationPromise) {
      initializationPromise = loadInitialSettings().then(settings => {
        if (ttsInstance) {
          ttsInstance.setParams({ 
            newRate: settings.rate,
            newPitch: settings.pitch, 
            newVolume: settings.volume 
          });
        }
      });
    }
  }
  return ttsInstance;
}

// Export singleton instance getter
export const tts = {
  /**
   * Legge il testo ad alta voce con chunking automatico
   */
  speak: (text: string): void => {
    getTTS().speak(text);
  },

  /**
   * Mette in pausa la lettura corrente
   */
  pause: (): void => {
    getTTS().pause();
  },

  /**
   * Riprende la lettura dalla pausa
   */
  resume: (): void => {
    getTTS().resume();
  },

  /**
   * Ferma completamente la lettura
   */
  stop: (): void => {
    getTTS().stop();
  },

  /**
   * Ottiene lo stato corrente del TTS
   */
  getState: (): TTSStateInfo => {
    return getTTS().getState();
  },

  /**
   * Ottiene la lista delle voci disponibili
   */
  getVoices: (): SpeechSynthesisVoice[] => {
    return getTTS().getVoices();
  },

  /**
   * Ottiene la voce attualmente selezionata
   */
  getSelectedVoice: (): SpeechSynthesisVoice | null => {
    return getTTS().getSelectedVoice();
  },

  /**
   * Imposta una voce specifica tramite URI
   * Salva anche in localStorage come preferenza utente
   */
  setVoiceByURI: (voiceURI: string): void => {
    getTTS().setVoiceByURI(voiceURI);
    
    // Salva la voce selezionata in localStorage
    const current = getLocalTTSSettings() || { rate: 0.97, pitch: 1.0, volume: 1.0 };
    const updated: LocalTTSSettings = {
      ...current,
      voiceURI
    };
    markAsUserModified();
    saveLocalTTSSettings(updated);
    console.log('🔊 TTS: Voice preference saved:', voiceURI);
  },

  /**
   * Ottiene i parametri correnti (rate, pitch, volume)
   */
  getParams: (): { rate: number; pitch: number; volume: number } => {
    return getTTS().getParams();
  },

  /**
   * Imposta nuovi parametri (rate, pitch, volume)
   * Marca automaticamente come modificato dall'utente se chiamato esplicitamente
   */
  setParams: (params: { newRate?: number; newPitch?: number; newVolume?: number }, markUserModified: boolean = true): void => {
    getTTS().setParams(params);
    
    // Salva in localStorage e marca come modificato dall'utente
    if (markUserModified && (params.newRate !== undefined || params.newPitch !== undefined || params.newVolume !== undefined)) {
      const current = getLocalTTSSettings() || { rate: 0.97, pitch: 1.0, volume: 1.0 };
      const updated: LocalTTSSettings = {
        rate: params.newRate ?? current.rate,
        pitch: params.newPitch ?? current.pitch,
        volume: params.newVolume ?? current.volume,
        voiceURI: current.voiceURI
      };
      markAsUserModified();
      saveLocalTTSSettings(updated);
    }
  },

  /**
   * Registra un listener per i cambiamenti di stato
   * Ritorna una funzione per rimuovere il listener
   */
  onStateChange: (listener: StateListener): (() => void) => {
    stateListeners.add(listener);
    return () => stateListeners.delete(listener);
  },

  /**
   * Registra un listener per quando le voci sono pronte
   * Ritorna una funzione per rimuovere il listener
   */
  onVoicesReady: (listener: VoicesListener): (() => void) => {
    voicesListeners.add(listener);
    // Se le voci sono già caricate, notifica subito
    const voices = getTTS().getVoices();
    if (voices.length > 0) {
      listener(voices, getTTS().getSelectedVoice());
    }
    return () => voicesListeners.delete(listener);
  },
};

// Export types
export type { TTSState, TTSStateInfo };
