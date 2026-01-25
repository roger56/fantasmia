/**
 * tts_speechsynthesis.ts
 * Sistema TTS ottimizzato per Fantasmia con:
 * - Voice picker con preferenza voci neural/natural italiane
 * - Chunking per frasi (max 220 caratteri) per stabilità Android/Chrome
 * - Controlli: speak, pause, resume, stop
 * - Persistenza preferenze in localStorage
 */

const TTS_PREF_KEY = "fantasmia_tts_prefs_v1";

interface TTSPrefs {
  voiceURI?: string | null;
  rate?: number;
  pitch?: number;
  volume?: number;
}

function loadPrefs(): TTSPrefs {
  try {
    return JSON.parse(localStorage.getItem(TTS_PREF_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePrefs(prefs: TTSPrefs): void {
  localStorage.setItem(TTS_PREF_KEY, JSON.stringify(prefs || {}));
}

/**
 * Spezza testo in frasi "ragionevoli" per evitare bug/stop su Android/Chrome
 */
function splitIntoChunks(text: string, maxLen: number = 220): string[] {
  const cleaned = (text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];

  // Split per punteggiatura forte, mantenendo frasi corte
  const parts = cleaned.split(/(?<=[\.\!\?\;\:])\s+/g);
  const chunks: string[] = [];
  let current = "";

  for (const p of parts) {
    if (!p) continue;
    if ((current + " " + p).trim().length <= maxLen) {
      current = (current ? current + " " : "") + p;
    } else {
      if (current) chunks.push(current.trim());
      // Se una frase è lunghissima, spezzala ulteriormente
      if (p.length > maxLen) {
        let i = 0;
        while (i < p.length) {
          chunks.push(p.slice(i, i + maxLen));
          i += maxLen;
        }
        current = "";
      } else {
        current = p;
      }
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

export type TTSState = "idle" | "speaking" | "paused";

export interface TTSStateInfo {
  state: TTSState;
  idx: number;
  total: number;
}

export interface TTSControllerOptions {
  lang?: string;
  defaultRate?: number;
  defaultPitch?: number;
  defaultVolume?: number;
  onStateChange?: (info: TTSStateInfo) => void;
  onVoicesReady?: (voices: SpeechSynthesisVoice[], selectedVoice: SpeechSynthesisVoice | null) => void;
}

export interface TTSController {
  getState: () => TTSStateInfo;
  getVoices: () => SpeechSynthesisVoice[];
  getSelectedVoice: () => SpeechSynthesisVoice | null;
  setVoiceByURI: (voiceURI: string) => void;
  getParams: () => { rate: number; pitch: number; volume: number };
  setParams: (params: { newRate?: number; newPitch?: number; newVolume?: number }) => void;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function createTTSController(options: TTSControllerOptions = {}): TTSController {
  const {
    lang = "it-IT",
    defaultRate = 1.0,
    defaultPitch = 1.0,
    defaultVolume = 1.0,
    onStateChange = () => {},
    onVoicesReady = () => {},
  } = options;

  const prefs = loadPrefs();

  let voices: SpeechSynthesisVoice[] = [];
  let selectedVoiceURI: string | null = prefs.voiceURI || null;
  let rate: number = prefs.rate ?? defaultRate;
  let pitch: number = prefs.pitch ?? defaultPitch;
  let volume: number = prefs.volume ?? defaultVolume;

  let queue: string[] = [];
  let idx = 0;
  let state: TTSState = "idle";

  let currentUtterance: SpeechSynthesisUtterance | null = null;
  let cancelToken = 0;

  function setState(s: TTSState): void {
    state = s;
    onStateChange({ state, idx, total: queue.length });
  }

  function getVoices(): SpeechSynthesisVoice[] {
    return voices.slice();
  }

  function pickBestVoice(vlist: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const it = vlist.filter(v => (v.lang || "").toLowerCase().startsWith("it"));
    // Preferisci: localService (spesso migliore), nomi "natural/neural" se presenti
    const scored = it.map(v => {
      const name = (v.name || "").toLowerCase();
      let score = 0;
      if (v.localService) score += 3;
      if (name.includes("neural")) score += 4;
      if (name.includes("natural")) score += 4;
      if (name.includes("premium")) score += 2;
      if (name.includes("google")) score += 1; // spesso ok su Android
      return { v, score };
    }).sort((a, b) => b.score - a.score);

    return scored[0]?.v || it[0] || vlist.find(v => v.lang === lang) || vlist[0] || null;
  }

  function resolveSelectedVoice(): SpeechSynthesisVoice | null {
    if (!voices.length) return null;
    if (selectedVoiceURI) {
      const found = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (found) return found;
    }
    const best = pickBestVoice(voices);
    selectedVoiceURI = best?.voiceURI || null;
    savePrefs({ ...loadPrefs(), voiceURI: selectedVoiceURI, rate, pitch, volume });
    return best;
  }

  // Android/Chrome: le voci possono arrivare dopo. Serve onvoiceschanged + poll leggero.
  function initVoices(): void {
    const synth = window.speechSynthesis;
    if (!synth) return;

    function refresh(): boolean {
      const v = synth.getVoices() || [];
      if (v.length) {
        voices = v;
        const sel = resolveSelectedVoice();
        onVoicesReady(getVoices(), sel);
        return true;
      }
      return false;
    }

    // Prova subito
    if (refresh()) return;

    // Event
    synth.onvoiceschanged = () => {
      refresh();
    };

    // Poll (max 1.5s) per casi in cui l'evento non scatta
    const start = Date.now();
    const t = setInterval(() => {
      if (refresh() || Date.now() - start > 1500) clearInterval(t);
    }, 150);
  }

  function setVoiceByURI(voiceURI: string): void {
    selectedVoiceURI = voiceURI;
    savePrefs({ ...loadPrefs(), voiceURI: selectedVoiceURI, rate, pitch, volume });
    onVoicesReady(getVoices(), resolveSelectedVoice());
  }

  function setParams(params: { newRate?: number; newPitch?: number; newVolume?: number }): void {
    if (typeof params.newRate === "number") rate = params.newRate;
    if (typeof params.newPitch === "number") pitch = params.newPitch;
    if (typeof params.newVolume === "number") volume = params.newVolume;
    savePrefs({ ...loadPrefs(), voiceURI: selectedVoiceURI, rate, pitch, volume });
  }

  function stop(): void {
    cancelToken++;
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    queue = [];
    idx = 0;
    currentUtterance = null;
    setState("idle");
  }

  function pause(): void {
    if (state !== "speaking") return;
    try { window.speechSynthesis?.pause(); } catch {}
    setState("paused");
  }

  function resume(): void {
    if (state !== "paused") return;
    try { window.speechSynthesis?.resume(); } catch {}
    setState("speaking");
  }

  function speakNext(localToken: number): void {
    if (localToken !== cancelToken) return;

    if (idx >= queue.length) {
      currentUtterance = null;
      setState("idle");
      return;
    }

    const synth = window.speechSynthesis;
    if (!synth) {
      setState("idle");
      return;
    }

    const text = queue[idx];
    const u = new SpeechSynthesisUtterance(text);
    currentUtterance = u;

    const voice = resolveSelectedVoice();
    if (voice) u.voice = voice;

    u.lang = voice?.lang || lang;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;

    u.onend = () => {
      if (localToken !== cancelToken) return;
      idx++;
      speakNext(localToken);
    };

    u.onerror = () => {
      // In caso di errore, prova a passare al chunk successivo
      if (localToken !== cancelToken) return;
      idx++;
      speakNext(localToken);
    };

    setState("speaking");
    // workaround Android: a volte serve cancel prima di speak se coda sporca
    try {
      synth.speak(u);
    } catch {
      // fallback: reset e prova una volta
      try { synth.cancel(); } catch {}
      try { synth.speak(u); } catch {}
    }
  }

  function speak(text: string): void {
    stop(); // reset pulito
    const chunks = splitIntoChunks(text);
    if (!chunks.length) return;

    queue = chunks;
    idx = 0;

    const localToken = cancelToken;
    speakNext(localToken);
  }

  // Init
  initVoices();

  return {
    // state
    getState: () => ({ state, idx, total: queue.length }),
    // voices & prefs
    getVoices,
    getSelectedVoice: resolveSelectedVoice,
    setVoiceByURI,
    getParams: () => ({ rate, pitch, volume }),
    setParams,
    // controls
    speak,
    pause,
    resume,
    stop,
  };
}
