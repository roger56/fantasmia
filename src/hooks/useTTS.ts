import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  utterance?: SpeechSynthesisUtterance;
}

export const useTTS = () => {
  const [state, setState] = useState<TTSState>({ isPlaying: false, isPaused: false });
  const { toast } = useToast();

  const speak = useCallback((text: string, language: 'italian' | 'english' = 'italian') => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Funzione non disponibile",
        description: "Il tuo browser non supporta la sintesi vocale",
        variant: "destructive"
      });
      return;
    }

    if (state.isPlaying && !state.isPaused) {
      // Pause current speech
      speechSynthesis.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    } else if (state.isPaused) {
      // Resume current speech
      speechSynthesis.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    } else {
      // Stop any existing speech and start new
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'italian' ? 'it-IT' : 'en-US';
      
      utterance.onstart = () => {
        setState(prev => ({ ...prev, isPlaying: true, isPaused: false, utterance }));
      };
      
      utterance.onend = () => {
        setState({ isPlaying: false, isPaused: false });
      };
      
      utterance.onerror = () => {
        setState({ isPlaying: false, isPaused: false });
        toast({
          title: "Errore TTS",
          description: "Si è verificato un errore durante la lettura",
          variant: "destructive"
        });
      };
      
      speechSynthesis.speak(utterance);
    }
  }, [state.isPlaying, state.isPaused, toast]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setState({ isPlaying: false, isPaused: false });
  }, []);

  const getButtonText = useCallback(() => {
    if (state.isPlaying && state.isPaused) return 'RIPRENDI';
    if (state.isPlaying) return 'PAUSA';
    return 'ASCOLTA';
  }, [state.isPlaying, state.isPaused]);

  return {
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    speak,
    stop,
    getButtonText
  };
};