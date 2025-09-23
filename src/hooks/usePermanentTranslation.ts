import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { translateToEnglish, translateToItalian } from '@/utils/translation';
import { AMStory, fantasMiaDB } from '@/utils/indexedDB';

interface PermanentTranslationState {
  isTranslating: boolean;
  pendingTranslation: { content: string; title: string; } | null;
  showConfirmDialog: boolean;
}

export const usePermanentTranslation = (story: AMStory | null, onStoryUpdate: (updatedStory: AMStory) => void) => {
  const [state, setState] = useState<PermanentTranslationState>({
    isTranslating: false,
    pendingTranslation: null,
    showConfirmDialog: false
  });
  const { toast } = useToast();

  // Detect current language based on content
  const getCurrentLanguage = useCallback((): 'italian' | 'english' => {
    if (!story?.text) return 'italian';
    
    // Simple heuristic: if contains common English words, assume English
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with', 'for', 'as', 'was', 'on'];
    const text = story.text.toLowerCase();
    const englishWordCount = englishWords.filter(word => text.includes(` ${word} `)).length;
    
    return englishWordCount > 3 ? 'english' : 'italian';
  }, [story?.text]);

  const getButtonText = useCallback(() => {
    if (state.isTranslating) return 'Traduzione...';
    return getCurrentLanguage() === 'italian' ? 'INGLESE' : 'ITALIANO';
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
        showConfirmDialog: true
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
        showConfirmDialog: false
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
      showConfirmDialog: false
    });
  }, []);

  return {
    isTranslating: state.isTranslating,
    showConfirmDialog: state.showConfirmDialog,
    pendingTranslation: state.pendingTranslation,
    getButtonText,
    getCurrentLanguage,
    initiateTranslation,
    confirmTranslation,
    cancelTranslation
  };
};