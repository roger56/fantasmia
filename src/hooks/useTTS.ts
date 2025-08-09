import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  utterance?: SpeechSynthesisUtterance;
}

export const useTTS = () => {
  const [state, setState] = useState<TTSState>({ isPlaying: false, isPaused: false });
  const [currentText, setCurrentText] = useState<string>('');
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

    // If playing the same text, pause/resume
    if (state.isPlaying && !state.isPaused && currentText === text) {
      speechSynthesis.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    } else if (state.isPaused && state.utterance && currentText === text) {
      speechSynthesis.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    } else {
      // Different text or not playing, start new speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'italian' ? 'it-IT' : 'en-US';
      
      utterance.onstart = () => {
        setState(prev => ({ ...prev, isPlaying: true, isPaused: false, utterance }));
      };
      
      utterance.onend = () => {
        setState({ isPlaying: false, isPaused: false });
        setCurrentText('');
      };
      
      utterance.onerror = () => {
        setState({ isPlaying: false, isPaused: false });
        setCurrentText('');
        toast({
          title: "Errore TTS",
          description: "Si è verificato un errore durante la lettura",
          variant: "destructive"
        });
      };
      
      utterance.onpause = () => {
        setState(prev => ({ ...prev, isPaused: true }));
      };
      
      utterance.onresume = () => {
        setState(prev => ({ ...prev, isPaused: false }));
      };
      
      setCurrentText(text);
      speechSynthesis.speak(utterance);
    }
  }, [state.isPlaying, state.isPaused, state.utterance, currentText, toast]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setState({ isPlaying: false, isPaused: false });
    setCurrentText('');
  }, []);

  const getButtonText = useCallback(() => {
    if (state.isPlaying && state.isPaused) return 'Riprendi';
    if (state.isPlaying) return 'Pausa';
    return 'Leggi';
  }, [state.isPlaying, state.isPaused]);

  return {
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    speak,
    stop,
    getButtonText
  };
};