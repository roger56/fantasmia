/**
 * Centralized TTS Reading Service
 * Manages text-to-speech with pause/resume functionality
 */

interface ReadingState {
  isPlaying: boolean;
  isPaused: boolean;
  currentStoryId: string | null;
  currentLanguage: 'italian' | 'english';
  utterance: SpeechSynthesisUtterance | null;
  savedText: string | null;
  currentCharIndex: number;
  textHash: string | null; // Hash del testo per rilevare modifiche
}

class ReadingService {
  private state: ReadingState = {
    isPlaying: false,
    isPaused: false,
    currentStoryId: null,
    currentLanguage: 'italian',
    utterance: null,
    savedText: null,
    currentCharIndex: 0,
    textHash: null,
  };

  private listeners: Set<() => void> = new Set();
  private lastPlayTime = 0;
  private debounceMs = 300;

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notify() {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Generate simple hash for text change detection
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Play or resume text with offset tracking for proper resume
   */
  play(text: string, storyId: string, language: 'italian' | 'english' = 'italian') {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported');
    }

    // Debounce rapid clicks
    const now = Date.now();
    if (now - this.lastPlayTime < this.debounceMs) {
      return;
    }
    this.lastPlayTime = now;

    const textHash = this.hashText(text);
    const isSameStory = storyId === this.state.currentStoryId && 
                        this.state.textHash === textHash &&
                        this.state.savedText === text;
    const languageChanged = language !== this.state.currentLanguage;

    // Language changed - stop and restart from beginning
    if (languageChanged && this.state.isPlaying) {
      speechSynthesis.cancel();
      this.state.currentCharIndex = 0;
      this.state.currentLanguage = language;
      // Continue to start new playback below
    }

    // If same story and paused, resume from saved position
    if (isSameStory && !languageChanged && this.state.isPaused && this.state.utterance) {
      speechSynthesis.resume();
      this.state.isPaused = false;
      this.notify();
      return;
    }

    // If playing same story (not paused), pause it
    if (isSameStory && !languageChanged && this.state.isPlaying && !this.state.isPaused) {
      speechSynthesis.pause();
      this.state.isPaused = true;
      this.notify();
      return;
    }

    // Different story, text changed, or language changed - determine text to speak
    let textToSpeak = text;
    let startFromBeginning = true;

    if (isSameStory && !languageChanged && this.state.currentCharIndex > 0 && this.state.savedText) {
      // Resume from saved position
      textToSpeak = text.substring(this.state.currentCharIndex);
      startFromBeginning = false;
    } else {
      // New story, text changed, or language changed - restart
      this.state.currentCharIndex = 0;
      this.state.savedText = text;
      this.state.textHash = textHash;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'italian' ? 'it-IT' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.state.currentStoryId = storyId;
      this.state.currentLanguage = language;
      if (startFromBeginning) {
        this.state.savedText = text;
        this.state.textHash = textHash;
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
      console.error('TTS error:', event);
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
    utterance.onboundary = (event) => {
      if (event.name === 'word' || event.name === 'sentence') {
        // Update current position (relative to full text)
        if (startFromBeginning) {
          this.state.currentCharIndex = event.charIndex;
        } else {
          this.state.currentCharIndex = this.state.currentCharIndex + event.charIndex;
        }
      }
    };

    this.state.utterance = utterance;
    speechSynthesis.speak(utterance);
  }

  /**
   * Pause current speech
   */
  pause() {
    if (this.state.isPlaying && !this.state.isPaused) {
      speechSynthesis.pause();
    }
  }

  /**
   * Stop current speech
   */
  stop() {
    speechSynthesis.cancel();
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.utterance = null;
    this.state.currentStoryId = null;
    this.state.currentCharIndex = 0;
    this.state.savedText = null;
    this.state.textHash = null;
    this.notify();
  }

  /**
   * Set language and restart playback if currently playing
   */
  setLanguage(language: 'italian' | 'english') {
    if (this.state.currentLanguage !== language) {
      const wasPlaying = this.state.isPlaying;
      const currentStoryId = this.state.currentStoryId;
      const currentText = this.state.savedText;
      
      // Stop current playback
      if (wasPlaying) {
        this.stop();
      }
      
      this.state.currentLanguage = language;
      this.notify();
      
      // If was playing, restart from beginning with new language
      if (wasPlaying && currentStoryId && currentText) {
        this.play(currentText, currentStoryId, language);
      }
    }
  }

  /**
   * Check if currently reading a specific story
   */
  isReadingStory(storyId: string): boolean {
    return this.state.currentStoryId === storyId && this.state.isPlaying;
  }
}

// Singleton instance
export const readingService = new ReadingService();
