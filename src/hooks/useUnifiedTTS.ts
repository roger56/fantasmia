import { useState, useEffect, useCallback } from 'react';
import { readingService } from '@/lib/tts/readingService';
import { useToast } from '@/hooks/use-toast';

interface UseUnifiedTTSOptions {
  storyId?: string;
  onError?: (error: Error) => void;
}

/**
 * Unified TTS Hook
 * Uses centralized readingService for consistent pause/resume behavior
 */
export const useUnifiedTTS = (options: UseUnifiedTTSOptions = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'italian' | 'english'>('italian');
  const { toast } = useToast();

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = readingService.subscribe(() => {
      const state = readingService.getState();
      setIsPlaying(state.isPlaying);
      setIsPaused(state.isPaused);
      setCurrentStoryId(state.currentStoryId);
      setCurrentLanguage(state.currentLanguage);
    });

    // Initial state sync
    const state = readingService.getState();
    setIsPlaying(state.isPlaying);
    setIsPaused(state.isPaused);
    setCurrentStoryId(state.currentStoryId);
    setCurrentLanguage(state.currentLanguage);

    return () => { unsubscribe(); };
  }, []);

  const speak = useCallback((
    text: string, 
    language: 'italian' | 'english' = 'italian',
    storyId?: string
  ) => {
    if (!('speechSynthesis' in window)) {
      const error = new Error('Speech synthesis not supported');
      toast({
        title: "Funzione non disponibile",
        description: "Il tuo browser non supporta la sintesi vocale",
        variant: "destructive"
      });
      options.onError?.(error);
      return;
    }

    try {
      const id = storyId || options.storyId || 'default';
      readingService.play(text, id, language);
    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: "Errore TTS",
        description: "Si è verificato un errore durante la lettura",
        variant: "destructive"
      });
      options.onError?.(error as Error);
    }
  }, [options, toast]);

  const stop = useCallback(() => {
    readingService.stop();
  }, []);

  const pause = useCallback(() => {
    readingService.pause();
  }, []);

  const setLanguage = useCallback((language: 'italian' | 'english') => {
    readingService.setLanguage(language);
  }, []);

  const getButtonText = useCallback(() => {
    if (isPlaying && isPaused) return 'Riprendi';
    if (isPlaying) return 'Pausa';
    return 'Leggi';
  }, [isPlaying, isPaused]);

  const isReadingStory = useCallback((storyId: string) => {
    return readingService.isReadingStory(storyId);
  }, []);

  return {
    isPlaying,
    isPaused,
    currentStoryId,
    currentLanguage,
    speak,
    stop,
    pause,
    setLanguage,
    getButtonText,
    isReadingStory
  };
};
