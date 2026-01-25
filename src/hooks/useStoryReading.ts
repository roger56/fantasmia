import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { translateStory, detectLanguage, TranslationResult } from '@/lib/i18n/storyTranslation';
import { tts, TTSStateInfo } from '@/utils/tts';
import { fantasMiaDB } from '@/utils/indexedDB';

interface Story {
  id: string;
  title: string;
  content?: string;
  text?: string;
  language?: string;
}

interface UseStoryReadingOptions {
  story: Story | null;
  onStoryUpdate?: (updatedStory: any) => void;
  storyType: 'ag' | 'am'; // AG stories or AM stories
}

/**
 * Unified hook for story reading (translation + TTS)
 * Combines translation and text-to-speech in a single API
 */
export const useStoryReading = ({ story, onStoryUpdate, storyType }: UseStoryReadingOptions) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingTranslation, setPendingTranslation] = useState<TranslationResult | null>(null);
  const [ttsState, setTTSState] = useState<TTSStateInfo>({ state: 'idle', idx: 0, total: 0 });
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const { toast } = useToast();

  // Subscribe to TTS state changes
  useEffect(() => {
    const unsubscribe = tts.onStateChange((info: TTSStateInfo) => {
      setTTSState(info);
    });
    return unsubscribe;
  }, []);

  // Get story content (handle both AG and AM story formats)
  const getContent = useCallback((): string => {
    if (!story) return '';
    return story.content || story.text || '';
  }, [story]);

  // Detect current language
  const getCurrentLanguage = useCallback((): 'italian' | 'english' => {
    if (!story) return 'italian';
    if (story.language) return story.language as 'italian' | 'english';
    return detectLanguage(getContent());
  }, [story, getContent]);

  // Get translation button text - shows opposite language
  const getTranslationButtonText = useCallback(() => {
    if (isTranslating) return 'Traduzione...';
    const currentLang = getCurrentLanguage();
    // Button shows the TARGET language (opposite of current)
    return currentLang === 'italian' ? 'INGLESE' : 'ITALIANO';
  }, [isTranslating, getCurrentLanguage]);

  // Get TTS button text
  const getTTSButtonText = useCallback(() => {
    const isThisStory = story && currentStoryId === story.id;
    if (isThisStory && ttsState.state === 'paused') return 'Riprendi';
    if (isThisStory && ttsState.state === 'speaking') return 'Pausa';
    return 'Leggi';
  }, [story, ttsState, currentStoryId]);

  // Initiate translation
  const initiateTranslation = useCallback(async () => {
    if (!story) return;

    setIsTranslating(true);

    try {
      const currentLang = getCurrentLanguage();
      const targetLang = currentLang === 'italian' ? 'english' : 'italian';
      const content = getContent();

      if (!content || content.trim() === '') {
        throw new Error('Nessun contenuto da tradurre');
      }

      const result = await translateStory({
        storyId: story.id,
        title: story.title,
        content: content,
        sourceLang: currentLang,
        targetLang: targetLang,
      });

      // Ensure we have both title and content
      if (!result.title || !result.content) {
        throw new Error('Traduzione incompleta');
      }

      setPendingTranslation(result);
      setShowPreview(true);
      setIsTranslating(false);
    } catch (error) {
      console.error('Translation error:', error);
      setIsTranslating(false);
      toast({
        title: 'Errore traduzione',
        description: error instanceof Error ? error.message : 'Non è stato possibile tradurre il contenuto',
        variant: 'destructive',
      });
    }
  }, [story, getCurrentLanguage, getContent, toast]);

  // Confirm and save translation
  const confirmTranslation = useCallback(async () => {
    if (!story || !pendingTranslation) return;

    try {
      const currentLang = getCurrentLanguage();
      const targetLang = currentLang === 'italian' ? 'english' : 'italian';
      
      const updatedStory = {
        ...story,
        title: pendingTranslation.title,
        ...(story.content !== undefined ? { content: pendingTranslation.content } : { text: pendingTranslation.content }),
        language: targetLang,
      };

      console.log('💾 Saving translation:', { 
        currentLang, 
        targetLang, 
        storyId: story.id,
        updatedLanguage: updatedStory.language 
      });

      // Save based on story type
      if (storyType === 'ag') {
        await fantasMiaDB.saveAGStory(updatedStory as any);
        window.dispatchEvent(new CustomEvent('ag-story-updated', { 
          detail: { storyId: story.id, action: 'text-updated', story: updatedStory } 
        }));
      } else {
        await fantasMiaDB.saveAMStory(updatedStory as any);
        window.dispatchEvent(new CustomEvent('am-story-updated', { 
          detail: { storyId: story.id, action: 'text-updated', story: updatedStory } 
        }));
        window.dispatchEvent(new CustomEvent('am:changed'));
      }

      // Update local state FIRST before clearing preview
      if (onStoryUpdate) {
        onStoryUpdate(updatedStory);
      }

      setPendingTranslation(null);
      setShowPreview(false);

      toast({
        title: 'Traduzione salvata',
        description: `La storia è stata tradotta e salvata in ${targetLang === 'italian' ? 'italiano' : 'inglese'}`,
      });
    } catch (error) {
      console.error('Error saving translation:', error);
      toast({
        title: 'Errore',
        description: 'Non è stato possibile salvare la traduzione',
        variant: 'destructive',
      });
    }
  }, [story, pendingTranslation, storyType, onStoryUpdate, getCurrentLanguage, toast]);

  // Cancel translation
  const cancelTranslation = useCallback(() => {
    setPendingTranslation(null);
    setShowPreview(false);
  }, []);

  // Play/pause TTS - uses unified tts singleton with chunking + voice preferences
  const toggleTTS = useCallback(() => {
    if (!story) return;

    try {
      const isThisStory = currentStoryId === story.id;
      
      // If already speaking this story, toggle pause/resume
      if (isThisStory && ttsState.state === 'speaking') {
        tts.pause();
        return;
      }
      
      if (isThisStory && ttsState.state === 'paused') {
        tts.resume();
        return;
      }
      
      // Start new reading
      tts.stop();
      const content = getContent();
      const fullText = `${story.title}. ${content}`;
      setCurrentStoryId(story.id);
      tts.speak(fullText);
    } catch (error) {
      toast({
        title: 'Errore TTS',
        description: 'Funzione non disponibile su questo browser',
        variant: 'destructive',
      });
    }
  }, [story, getContent, currentStoryId, ttsState, toast]);

  // Stop TTS
  const stopTTS = useCallback(() => {
    tts.stop();
    setCurrentStoryId(null);
  }, []);

  return {
    // Translation state
    isTranslating,
    showPreview,
    pendingTranslation,
    getCurrentLanguage,
    getTranslationButtonText,
    initiateTranslation,
    confirmTranslation,
    cancelTranslation,

    // TTS state
    isPlaying: ttsState.state === 'speaking' && story && currentStoryId === story.id,
    isPaused: ttsState.state === 'paused',
    getTTSButtonText,
    toggleTTS,
    stopTTS,
  };
};
