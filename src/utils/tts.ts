/**
 * Singleton TTS Controller per Fantasmia
 * Configurato con valori ottimali per bambini 6-10 anni:
 * - Velocità leggermente ridotta (0.97) per migliore comprensione
 * - Lingua italiana di default
 * - Chunking automatico per testi lunghi
 */

import { createTTSController, TTSController, TTSState, TTSStateInfo } from "./tts_speechsynthesis";

// Singleton instance
let ttsInstance: TTSController | null = null;

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

function getTTS(): TTSController {
  if (!ttsInstance) {
    ttsInstance = createTTSController({
      lang: "it-IT",
      defaultRate: 0.97, // Leggermente più lento per bambini
      defaultPitch: 1.0,
      defaultVolume: 1.0,
      onStateChange: notifyStateChange,
      onVoicesReady: notifyVoicesReady,
    });
    console.log('🔊 TTS Controller inizializzato (rate: 0.97, lang: it-IT)');
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
   */
  setVoiceByURI: (voiceURI: string): void => {
    getTTS().setVoiceByURI(voiceURI);
  },

  /**
   * Ottiene i parametri correnti (rate, pitch, volume)
   */
  getParams: (): { rate: number; pitch: number; volume: number } => {
    return getTTS().getParams();
  },

  /**
   * Imposta nuovi parametri (rate, pitch, volume)
   */
  setParams: (params: { newRate?: number; newPitch?: number; newVolume?: number }): void => {
    getTTS().setParams(params);
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
