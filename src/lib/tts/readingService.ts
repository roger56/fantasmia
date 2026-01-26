/**
 * Centralized TTS Reading Service (Fantasmia)
 * - Play / Pause / Resume / Stop
 * - Keeps accurate resume position (charIndex) across pause/stop
 * - Selects a preferred voice (e.g., Microsoft Elsa it-IT) when available
 * - Persists voice + speed settings in localStorage
 *
 * Notes:
 * - No chunking here to preserve your onboundary-based resume precision.
 * - Voice loading is async-safe (voices often arrive late on Chrome/Android).
 */

type LanguageKey = "italian" | "english";

interface ReadingState {
  isPlaying: boolean;
  isPaused: boolean;
  currentStoryId: string | null;
  currentLanguage: LanguageKey;
  utterance: SpeechSynthesisUtterance | null;
  savedText: string | null;
  currentCharIndex: number;
  textHash: string | null; // Hash del testo per rilevare modifiche

  // Settings / preferences
  voiceURI: string | null;
  rateItalian: number; // default 0.97 (leggermente rallentato per bimbi 6-10)
  rateEnglish: number; // default 1.0
  pitch: number; // default 1.0
  volume: number; // default 1.0

  // Internal
  voicesReady: boolean;
}

class ReadingService {
  // --- LocalStorage keys (stable)
  private readonly LS_VOICE_URI = "fantasmia_tts_voiceURI_v1";
  private readonly LS_RATE_IT = "fantasmia_tts_rate_it_v1";
  private readonly LS_RATE_EN = "fantasmia_tts_rate_en_v1";
  private readonly LS_PITCH = "fantasmia_tts_pitch_v1";
  private readonly LS_VOLUME = "fantasmia_tts_volume_v1";

  // --- Defaults aligned with your screenshot/notes
  private readonly DEFAULT_RATE_IT = 0.97; // "Default: 0.97 (leggermente rallentato per bimbi 6-10 anni)"
  private readonly DEFAULT_RATE_EN = 1.0;
  private readonly DEFAULT_PITCH = 1.0;
  private readonly DEFAULT_VOLUME = 1.0;

  // Preferred voice (best effort): Microsoft Elsa it-IT when available
  private readonly PREFERRED_IT_NAME_INCLUDES = "microsoft elsa";

  private state: ReadingState = {
    isPlaying: false,
    isPaused: false,
    currentStoryId: null,
    currentLanguage: "italian",
    utterance: null,
    savedText: null,
    currentCharIndex: 0,
    textHash: null,

    voiceURI: this.safeGetLS(this.LS_VOICE_URI) || null,
    rateItalian: this.safeGetNumberLS(this.LS_RATE_IT, this.DEFAULT_RATE_IT),
    rateEnglish: this.safeGetNumberLS(this.LS_RATE_EN, this.DEFAULT_RATE_EN),
    pitch: this.safeGetNumberLS(this.LS_PITCH, this.DEFAULT_PITCH),
    volume: this.safeGetNumberLS(this.LS_VOLUME, this.DEFAULT_VOLUME),

    voicesReady: false,
  };

  private voices: SpeechSynthesisVoice[] = [];
  private listeners: Set<() => void> = new Set();
  private lastPlayTime = 0;
  private debounceMs = 300;

  // ---------- Public API ----------

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState() {
    return { ...this.state };
  }

  /**
   * Expose voices for a settings UI (dropdown)
   */
  getAvailableVoices() {
    return (this.voices || []).slice();
  }

  /**
   * Set preferred voice explicitly (e.g., from Settings UI)
   */
  setVoiceByURI(voiceURI: string | null) {
    this.state.voiceURI = voiceURI;
    if (voiceURI) localStorage.setItem(this.LS_VOICE_URI, voiceURI);
    else localStorage.removeItem(this.LS_VOICE_URI);
    this.notify();
  }

  /**
   * Set speed for a specific language (Settings UI)
   * Example: setRate("italian", 0.94)
   */
  setRate(language: LanguageKey, rate: number) {
    const clamped = this.clamp(rate, 0.7, 1.3);
    if (language === "italian") {
      this.state.rateItalian = clamped;
      localStorage.setItem(this.LS_RATE_IT, String(clamped));
    } else {
      this.state.rateEnglish = clamped;
      localStorage.setItem(this.LS_RATE_EN, String(clamped));
    }
    this.notify();
  }

  setPitch(pitch: number) {
    const clamped = this.clamp(pitch, 0.7, 1.3);
    this.state.pitch = clamped;
    localStorage.setItem(this.LS_PITCH, String(clamped));
    this.notify();
  }

  setVolume(volume: number) {
    const clamped = this.clamp(volume, 0.0, 1.0);
    this.state.volume = clamped;
    localStorage.setItem(this.LS_VOLUME, String(clamped));
    this.notify();
  }

  /**
   * Play or resume text with offset tracking for proper resume
   */
  async play(text: string, storyId: string, language: LanguageKey = "italian"): Promise<void> {
    if (!("speechSynthesis" in window)) {
      throw new Error("Speech synthesis not supported");
    }

    // Debounce rapid clicks
    const now = Date.now();
    if (now - this.lastPlayTime < this.debounceMs) return;
    this.lastPlayTime = now;

    // Ensure voices are loaded (Chrome/Android may load late)
    await this.loadVoices();

    const textHash = this.hashText(text);
    const isSameStory =
      storyId === this.state.currentStoryId && this.state.textHash === textHash && this.state.savedText === text;

    const languageChanged = language !== this.state.currentLanguage;

    // Language changed - stop and restart from beginning
    if (languageChanged && this.state.isPlaying) {
      try {
        speechSynthesis.cancel();
      } catch {}
      this.state.currentCharIndex = 0;
      this.state.currentLanguage = language;
      // Continue to start new playback below
    }

    // If same story and paused, resume from saved position
    if (isSameStory && !languageChanged && this.state.isPaused && this.state.utterance) {
      try {
        speechSynthesis.resume();
      } catch {}
      this.state.isPaused = false;
      this.notify();
      return;
    }

    // If playing same story (not paused), pause it
    if (isSameStory && !languageChanged && this.state.isPlaying && !this.state.isPaused) {
      try {
        speechSynthesis.pause();
      } catch {}
      this.state.isPaused = true;
      this.notify();
      return;
    }

    // Different story, text changed, or language changed - determine text to speak
    let textToSpeak = text;
    let startFromBeginning = true;
    let baseOffset = 0; // Track offset for resume

    if (isSameStory && !languageChanged && this.state.currentCharIndex > 0 && this.state.savedText) {
      // Resume from saved position
      baseOffset = this.state.currentCharIndex;
      textToSpeak = text.substring(this.state.currentCharIndex);
      startFromBeginning = false;
    } else {
      // New story, text changed, or language changed - restart
      this.state.currentCharIndex = 0;
      this.state.savedText = text;
      this.state.textHash = textHash;
    }

    console.log("🎵 TTS Action:", {
      action: isSameStory && !languageChanged ? (this.state.isPaused ? "RESUME" : "PAUSE") : "NEW",
      currentCharIndex: this.state.currentCharIndex,
      baseOffset,
      textLength: text.length,
      textToSpeakLength: textToSpeak.length,
      textHash,
      startFromBeginning,
      language,
      preferredVoiceURI: this.state.voiceURI,
      rate: language === "italian" ? this.state.rateItalian : this.state.rateEnglish,
    });

    // Stop any current speech
    try {
      speechSynthesis.cancel();
    } catch {}

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const langTag = language === "italian" ? "it-IT" : "en-US";
    utterance.lang = langTag;

    // ✅ Apply best voice (prefer saved; else Microsoft Elsa for IT if available; else best match)
    const bestVoice = this.pickBestVoice(langTag);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // ✅ Apply your defaults / settings
    utterance.rate = language === "italian" ? this.state.rateItalian : this.state.rateEnglish;
    utterance.pitch = this.state.pitch;
    utterance.volume = this.state.volume;

    utterance.onstart = () => {
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.state.currentStoryId = storyId;
      this.state.currentLanguage = language;

      if (startFromBeginning) {
        this.state.savedText = text;
        this.state.textHash = textHash;
      }

      // If we picked a voice now, persist it (stabilizza il "default" al prossimo avvio)
      if (utterance.voice?.voiceURI) {
        this.state.voiceURI = utterance.voice.voiceURI;
        localStorage.setItem(this.LS_VOICE_URI, utterance.voice.voiceURI);
      }

      this.notify();
    };

    utterance.onend = () => {
      this.state.isPlaying = false;
      this.state.isPaused = false;
      this.state.utterance = null;
      this.state.currentCharIndex = 0;
      this.state.savedText = null;
      this.state.textHash = null;
      this.notify();
    };

    utterance.onerror = (event) => {
      console.error("TTS error:", event);
      this.state.isPlaying = false;
      this.state.isPaused = false;
      this.state.utterance = null;
      this.notify();
    };

    utterance.onpause = () => {
      this.state.isPaused = true;
      this.notify();
    };

    utterance.onresume = () => {
      this.state.isPaused = false;
      this.notify();
    };

    // Track character progress for resume
    // CRITICAL: When resuming from offset, event.charIndex is relative to the substring
    // We must add the base offset to get the correct position in the original text
    utterance.onboundary = (event) => {
      if (event.name === "word" || event.name === "sentence") {
        this.state.currentCharIndex = baseOffset + event.charIndex;

        // Optional debug
        console.log("📍 TTS Progress:", {
          eventCharIndex: event.charIndex,
          baseOffset,
          actualCharIndex: this.state.currentCharIndex,
          total: text.length,
          progress: Math.round((this.state.currentCharIndex / text.length) * 100) + "%",
        });
      }
    };

    this.state.utterance = utterance;

    try {
      speechSynthesis.speak(utterance);
    } catch (e) {
      // Fallback: try one reset
      try {
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      } catch (e2) {
        console.error("TTS speak failed:", e2);
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.state.utterance = null;
        this.notify();
      }
    }
  }

  pause() {
    if (this.state.isPlaying && !this.state.isPaused) {
      try {
        speechSynthesis.pause();
      } catch {}
    }
  }

  stop() {
    try {
      speechSynthesis.cancel();
    } catch {}

    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.utterance = null;
    this.state.currentStoryId = null;
    this.state.currentCharIndex = 0;
    this.state.savedText = null;
    this.state.textHash = null;
    this.notify();
  }

  setLanguage(language: LanguageKey) {
    if (this.state.currentLanguage !== language) {
      const wasPlaying = this.state.isPlaying;
      const currentStoryId = this.state.currentStoryId;
      const currentText = this.state.savedText;

      if (wasPlaying) this.stop();

      this.state.currentLanguage = language;
      this.notify();

      if (wasPlaying && currentStoryId && currentText) {
        // Fire and forget
        void this.play(currentText, currentStoryId, language);
      }
    }
  }

  isReadingStory(storyId: string): boolean {
    return this.state.currentStoryId === storyId && this.state.isPlaying;
  }

  // ---------- Internals ----------

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Loads voices reliably (Chrome/Android sometimes needs voiceschanged + retry)
   */
  private loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;

      const tryGet = () => {
        const v = synth.getVoices() || [];
        if (v.length) {
          this.voices = v;
          this.state.voicesReady = true;
          resolve(v);
          return true;
        }
        return false;
      };

      if (tryGet()) return;

      const onChanged = () => {
        if (tryGet()) {
          try {
            synth.removeEventListener?.("voiceschanged", onChanged as any);
          } catch {}
        }
      };

      // Prefer addEventListener if available
      try {
        synth.addEventListener?.("voiceschanged", onChanged as any);
      } catch {
        // Fallback
        (synth as any).onvoiceschanged = onChanged;
      }

      // Short retry window
      const start = Date.now();
      const t = setInterval(() => {
        if (tryGet() || Date.now() - start > 1200) {
          clearInterval(t);
          resolve(this.voices);
        }
      }, 150);
    });
  }

  /**
   * Voice selection strategy:
   * 1) use saved voiceURI if still available
   * 2) for it-IT, prefer "Microsoft Elsa" if present
   * 3) otherwise pick best match for exact lang, then heuristics
   */
  private pickBestVoice(langTag: string): SpeechSynthesisVoice | null {
    const voices = this.voices || [];
    if (!voices.length) return null;

    const want = langTag.toLowerCase(); // it-it / en-us

    // 1) saved voice
    if (this.state.voiceURI) {
      const saved = voices.find((v) => v.voiceURI === this.state.voiceURI);
      if (saved) return saved;
    }

    // 2) preferred name for Italian
    if (want === "it-it") {
      const elsa = voices.find(
        (v) =>
          (v.lang || "").toLowerCase() === "it-it" &&
          (v.name || "").toLowerCase().includes(this.PREFERRED_IT_NAME_INCLUDES),
      );
      if (elsa) return elsa;
    }

    // 3) candidates by language prefix (it / en)
    const prefix = want.split("-")[0]; // it / en
    const candidates = voices.filter((v) => (v.lang || "").toLowerCase().startsWith(prefix));
    const list = candidates.length ? candidates : voices;

    const scored = list
      .map((v) => {
        const name = (v.name || "").toLowerCase();
        const vlang = (v.lang || "").toLowerCase();
        let score = 0;

        // exact lang match is best
        if (vlang === want) score += 10;

        // heuristics
        if ((v as any).localService) score += 2;
        if (name.includes("neural")) score += 6;
        if (name.includes("natural")) score += 6;
        if (name.includes("premium")) score += 3;
        if (name.includes("google")) score += 1;

        // avoid legacy/compact when present
        if (name.includes("compact")) score -= 2;
        if (name.includes("legacy")) score -= 2;

        return { v, score };
      })
      .sort((a, b) => b.score - a.score);

    const best = scored[0]?.v || null;

    // Persist the picked one so next startup uses it as "default"
    if (best?.voiceURI) {
      this.state.voiceURI = best.voiceURI;
      localStorage.setItem(this.LS_VOICE_URI, best.voiceURI);
    }

    return best;
  }

  private safeGetLS(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeGetNumberLS(key: string, fallback: number): number {
    try {
      const v = localStorage.getItem(key);
      if (v == null) return fallback;
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    } catch {
      return fallback;
    }
  }

  private clamp(n: number, min: number, max: number): number {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }
}

// Singleton instance
export const readingService = new ReadingService();
