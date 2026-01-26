/**
 * TTS Controller basato su Web Speech API
 * Ottimizzato per stabilità su Android/Chrome con chunking automatico
 */

export type TTSState = 'idle' | 'speaking' | 'paused';

export interface TTSStateInfo {
  state: TTSState;
  idx: number;
  total: number;
  currentChunk?: number;
  totalChunks?: number;
  text: string;
}

export interface TTSControllerOptions {
  lang?: string;
  defaultRate?: number;
  defaultPitch?: number;
  defaultVolume?: number;
  preferredVoiceURI?: string;
  voicePreferences?: string[];
  onStateChange?: (info: TTSStateInfo) => void;
  onVoicesReady?: (voices: SpeechSynthesisVoice[], selected: SpeechSynthesisVoice | null) => void;
}

export interface TTSController {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  getState: () => TTSStateInfo;
  getVoices: () => SpeechSynthesisVoice[];
  getSelectedVoice: () => SpeechSynthesisVoice | null;
  setVoiceByURI: (voiceURI: string) => void;
  getParams: () => { rate: number; pitch: number; volume: number };
  setParams: (params: { newRate?: number; newPitch?: number; newVolume?: number }) => void;
}

// Chunk size ottimale per evitare interruzioni su Android/Chrome
const MAX_CHUNK_SIZE = 220;

function splitIntoChunks(text: string, maxLen: number = MAX_CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length <= maxLen) {
      current += (current ? ' ' : '') + sentence;
    } else {
      if (current) chunks.push(current);
      // Se la frase è troppo lunga, spezzala ulteriormente
      if (sentence.length > maxLen) {
        const words = sentence.split(/\s+/);
        current = '';
        for (const word of words) {
          if (current.length + word.length + 1 <= maxLen) {
            current += (current ? ' ' : '') + word;
          } else {
            if (current) chunks.push(current);
            current = word;
          }
        }
      } else {
        current = sentence;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [''];
}

export function createTTSController(options: TTSControllerOptions = {}): TTSController {
  const {
    lang = 'it-IT',
    defaultRate = 1.0,
    defaultPitch = 1.0,
    defaultVolume = 1.0,
    preferredVoiceURI,
    voicePreferences,
    onStateChange,
    onVoicesReady,
  } = options;

  let currentState: TTSState = 'idle';
  let chunks: string[] = [];
  let currentChunkIndex = 0;
  let currentText = '';
  let rate = defaultRate;
  let pitch = defaultPitch;
  let volume = defaultVolume;
  let selectedVoice: SpeechSynthesisVoice | null = null;
  let voices: SpeechSynthesisVoice[] = [];
  let currentUtterance: SpeechSynthesisUtterance | null = null;
  let storedVoiceURI = preferredVoiceURI;

  function notifyState(): void {
    if (onStateChange) {
      onStateChange({
        state: currentState,
        idx: currentChunkIndex,
        total: chunks.length,
        currentChunk: currentChunkIndex + 1,
        totalChunks: chunks.length,
        text: currentText,
      });
    }
  }

  function findBestVoice(voicePreferences?: string[]): SpeechSynthesisVoice | null {
    if (voices.length === 0) return null;
    
    // Se ci sono preferenze dall'archivio, cerca prima quelle
    if (voicePreferences && voicePreferences.length > 0) {
      for (const pref of voicePreferences) {
        const match = voices.find(v => 
          v.name.toLowerCase().includes(pref.toLowerCase()) && 
          v.lang.startsWith('it')
        );
        if (match) {
          console.log('🔊 TTS: Found preferred voice from archive:', match.name);
          return match;
        }
      }
    }
    
    // Priorità: voci italiane neural/natural
    const italianVoices = voices.filter(v => v.lang.startsWith('it'));
    if (italianVoices.length > 0) {
      // Preferisci voci "natural" o "neural"
      const naturalVoice = italianVoices.find(v => 
        v.name.toLowerCase().includes('natural') || 
        v.name.toLowerCase().includes('neural')
      );
      if (naturalVoice) return naturalVoice;
      return italianVoices[0];
    }
    
    return voices[0];
  }

  function loadVoices(): void {
    voices = speechSynthesis.getVoices();
    if (voices.length > 0 && !selectedVoice) {
      // Prima prova a usare la voce salvata dall'utente
      if (storedVoiceURI) {
        const savedVoice = voices.find(v => v.voiceURI === storedVoiceURI);
        if (savedVoice) {
          selectedVoice = savedVoice;
          console.log('🔊 TTS: Using saved voice:', savedVoice.name);
        }
      }
      // Altrimenti cerca la migliore voce in base alle preferenze archivio
      if (!selectedVoice) {
        selectedVoice = findBestVoice(voicePreferences);
      }
      if (onVoicesReady) {
        onVoicesReady(voices, selectedVoice);
      }
    }
  }

  // Carica voci all'avvio
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speakNextChunk(): void {
    if (currentChunkIndex >= chunks.length) {
      currentState = 'idle';
      chunks = [];
      currentChunkIndex = 0;
      currentText = '';
      currentUtterance = null;
      notifyState();
      return;
    }

    const chunkText = chunks[currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    currentUtterance = utterance;

    utterance.onend = () => {
      if (currentState === 'speaking') {
        currentChunkIndex++;
        notifyState();
        speakNextChunk();
      }
    };

    utterance.onerror = (event) => {
      // Ignora errori di interruzione (causati da stop/cancel)
      if (event.error === 'interrupted' || event.error === 'canceled') {
        return;
      }
      console.error('TTS error:', event.error);
      currentState = 'idle';
      notifyState();
    };

    speechSynthesis.speak(utterance);
    currentState = 'speaking';
    notifyState();
  }

  return {
    speak(text: string): void {
      if (!text?.trim()) return;
      
      // Ferma qualsiasi lettura in corso
      speechSynthesis.cancel();
      
      currentText = text;
      chunks = splitIntoChunks(text);
      currentChunkIndex = 0;
      
      speakNextChunk();
    },

    pause(): void {
      if (currentState === 'speaking') {
        speechSynthesis.pause();
        currentState = 'paused';
        notifyState();
      }
    },

    resume(): void {
      if (currentState === 'paused') {
        speechSynthesis.resume();
        currentState = 'speaking';
        notifyState();
      }
    },

    stop(): void {
      speechSynthesis.cancel();
      currentState = 'idle';
      chunks = [];
      currentChunkIndex = 0;
      currentText = '';
      currentUtterance = null;
      notifyState();
    },

    getState(): TTSStateInfo {
      return {
        state: currentState,
        idx: currentChunkIndex,
        total: chunks.length,
        currentChunk: currentChunkIndex + 1,
        totalChunks: chunks.length,
        text: currentText,
      };
    },

    getVoices(): SpeechSynthesisVoice[] {
      return voices;
    },

    getSelectedVoice(): SpeechSynthesisVoice | null {
      return selectedVoice;
    },

    setVoiceByURI(voiceURI: string): void {
      const voice = voices.find(v => v.voiceURI === voiceURI);
      if (voice) {
        selectedVoice = voice;
      }
    },

    getParams(): { rate: number; pitch: number; volume: number } {
      return { rate, pitch, volume };
    },

    setParams(params: { newRate?: number; newPitch?: number; newVolume?: number }): void {
      if (params.newRate !== undefined) rate = params.newRate;
      if (params.newPitch !== undefined) pitch = params.newPitch;
      if (params.newVolume !== undefined) volume = params.newVolume;
    },
  };
}
