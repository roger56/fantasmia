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
  savedText: string | null; // Testo completo per resume
  currentCharIndex: number; // Posizione corrente per resume
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
  };

  private listeners: Set<() => void> = new Set();

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
   * Play or resume text with offset tracking for proper resume
   */
  play(text: string, storyId: string, language: 'italian' | 'english' = 'italian') {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported');
    }

    const isSameStory = storyId === this.state.currentStoryId && this.state.savedText === text;

    // If same story and paused, resume from saved position
    if (isSameStory && this.state.isPaused && this.state.utterance) {
      speechSynthesis.resume();
      this.state.isPaused = false;
      this.notify();
      return;
    }

    // If playing same story, pause it
    if (isSameStory && this.state.isPlaying && !this.state.isPaused) {
      speechSynthesis.pause();
      this.state.isPaused = true;
      this.notify();
      return;
    }

    // Different story or first play - determine text to speak
    let textToSpeak = text;
    let startFromBeginning = true;

    if (isSameStory && this.state.currentCharIndex > 0 && this.state.savedText) {
      // Resume from saved position
      textToSpeak = text.substring(this.state.currentCharIndex);
      startFromBeginning = false;
    } else {
      // New story or restart
      this.state.currentCharIndex = 0;
      this.state.savedText = text;
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
      }
      this.notify();
    };

    utterance.onend = () => {
      this.state.isPlaying = false;
      this.state.isPaused = false;
      this.state.utterance = null;
      this.state.currentCharIndex = 0;
      this.state.savedText = null;
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
    this.notify();
  }

  /**
   * Set language for next playback
   */
  setLanguage(language: 'italian' | 'english') {
    this.state.currentLanguage = language;
    this.notify();
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
