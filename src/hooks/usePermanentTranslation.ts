import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { translateToEnglish, translateToItalian } from '@/utils/translation';
import { AMStory, fantasMiaDB } from '@/utils/indexedDB';

interface PermanentTranslationState {
  isTranslating: boolean;
  pendingTranslation: { content: string; title: string; } | null;
  showPreview: boolean;
}

export const usePermanentTranslation = (story: AMStory | null, onStoryUpdate: (updatedStory: AMStory) => void) => {
  const [state, setState] = useState<PermanentTranslationState>({
    isTranslating: false,
    pendingTranslation: null,
    showPreview: false
  });
  const { toast } = useToast();

  // Always return 'italian' as base language since app is natively Italian
  // The button should ALWAYS show "INGLESE" initially unless English translation was saved
  const getCurrentLanguage = useCallback((): 'italian' | 'english' => {
    if (!story?.text) return 'italian';
    
    // Check if we have explicit language metadata saved
    // For now, assume stories are always in Italian initially
    // Only detect English if the story was previously translated and saved
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with', 'for', 'as', 'was', 'on'];
    const text = story.text.toLowerCase();
    
    // Count English word occurrences with stricter matching
    let englishWordCount = 0;
    for (const word of englishWords) {
      if (text.includes(` ${word} `) || text.startsWith(`${word} `) || text.endsWith(` ${word}`)) {
        englishWordCount++;
      }
    }
    
    // Require higher threshold to detect English (at least 5 matches)
    // This ensures Italian stories stay marked as Italian
    return englishWordCount >= 5 ? 'english' : 'italian';
  }, [story?.text]);

  // Button text: always ready to translate to the OPPOSITE language
  // If content is Italian -> show "INGLESE" (ready to translate to English)
  // If content is English -> show "ITALIANO" (ready to translate back)
  const getButtonText = useCallback(() => {
    if (state.isTranslating) return 'Traduzione...';
    const currentLang = getCurrentLanguage();
    return currentLang === 'italian' ? 'INGLESE' : 'ITALIANO';
  }, [state.isTranslating, getCurrentLanguage]);

  const initiateTranslation = useCallback(async () => {
    if (!story) return;
    
    setState(prev => ({ ...prev, isTranslating: true }));
    
    try {
      const currentLang = getCurrentLanguage();
      let translatedContent: string;
      let translatedTitle: string;
      
      if (currentLang === 'italian') {
        translatedContent = await translateToEnglish(story.text || '');
        translatedTitle = await translateToEnglish(story.title || '');
      } else {
        translatedContent = await translateToItalian(story.text || '');
        translatedTitle = await translateToItalian(story.title || '');
      }
      
      setState(prev => ({
        ...prev,
        isTranslating: false,
        pendingTranslation: { content: translatedContent, title: translatedTitle },
        showPreview: true
      }));
      
    } catch (error) {
      setState(prev => ({ ...prev, isTranslating: false }));
      toast({
        title: "Errore traduzione",
        description: "Non è stato possibile tradurre il contenuto",
        variant: "destructive"
      });
    }
  }, [story, getCurrentLanguage, toast]);

  const confirmTranslation = useCallback(async () => {
    if (!story || !state.pendingTranslation) return;
    
    try {
      const updatedStory: AMStory = {
        ...story,
        title: state.pendingTranslation.title,
        text: state.pendingTranslation.content
      };
      
      await fantasMiaDB.saveAMStory(updatedStory);
      
      // Update local state
      onStoryUpdate(updatedStory);
      
      // Emit events for UI updates
      window.dispatchEvent(new CustomEvent('am-story-updated', { 
        detail: { storyId: story.id, action: 'text-updated', story: updatedStory } 
      }));
      window.dispatchEvent(new CustomEvent('am:changed'));
      
      setState({
        isTranslating: false,
        pendingTranslation: null,
        showPreview: false
      });
      
      const targetLang = getCurrentLanguage() === 'italian' ? 'inglese' : 'italiano';
      toast({
        title: "Traduzione salvata",
        description: `La storia è stata tradotta e salvata in ${targetLang}`,
      });
      
    } catch (error) {
      console.error('Error saving translation:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile salvare la traduzione",
        variant: "destructive"
      });
    }
  }, [story, state.pendingTranslation, onStoryUpdate, toast, getCurrentLanguage]);

  const cancelTranslation = useCallback(() => {
    setState({
      isTranslating: false,
      pendingTranslation: null,
      showPreview: false
    });
  }, []);

  return {
    isTranslating: state.isTranslating,
    showPreview: state.showPreview,
    pendingTranslation: state.pendingTranslation,
    getButtonText,
    getCurrentLanguage,
    initiateTranslation,
    confirmTranslation,
    cancelTranslation
  };
};