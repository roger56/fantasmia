import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { translateToEnglish, translateToItalian } from '@/utils/translation';

interface TranslationState {
  isTranslated: boolean;
  isTranslating: boolean;
  originalContent: string;
  originalTitle: string;
}

export const useTranslation = () => {
  const [state, setState] = useState<TranslationState>({
    isTranslated: false,
    isTranslating: false,
    originalContent: '',
    originalTitle: ''
  });
  const { toast } = useToast();

  const translateContent = useCallback(async (
    content: string,
    title: string,
    onContentChange: (content: string) => void,
    onTitleChange?: (title: string) => void
  ) => {
    setState(prev => ({ ...prev, isTranslating: true }));
    
    try {
      if (!state.isTranslated) {
        // Translate to English
        setState(prev => ({ 
          ...prev, 
          originalContent: content,
          originalTitle: title 
        }));
        
        const translatedContent = await translateToEnglish(content);
        const translatedTitle = title ? await translateToEnglish(title) : '';
        
        onContentChange(translatedContent);
        if (onTitleChange && translatedTitle) {
          onTitleChange(translatedTitle);
        }
        
        setState(prev => ({ ...prev, isTranslated: true }));
        
        toast({
          title: "Traduzione completata",
          description: "Il contenuto è stato tradotto in inglese",
        });
      } else {
        // Translate back to Italian
        const retranslatedContent = await translateToItalian(content);
        const retranslatedTitle = title ? await translateToItalian(title) : '';
        
        onContentChange(retranslatedContent);
        if (onTitleChange && retranslatedTitle) {
          onTitleChange(retranslatedTitle);
        }
        
        setState(prev => ({ ...prev, isTranslated: false }));
        
        toast({
          title: "Traduzione completata",
          description: "Il contenuto è stato riportato in italiano",
        });
      }
    } catch (error) {
      toast({
        title: "Errore traduzione",
        description: "Non è stato possibile tradurre il contenuto",
        variant: "destructive"
      });
    } finally {
      setState(prev => ({ ...prev, isTranslating: false }));
    }
  }, [state.isTranslated, toast]);

  const getButtonText = useCallback(() => {
    if (state.isTranslating) return 'Traduzione...';
    return state.isTranslated ? 'ITALIANO' : 'INGLESE';
  }, [state.isTranslating, state.isTranslated]);

  const getCurrentLanguage = useCallback((): 'italian' | 'english' => {
    return state.isTranslated ? 'english' : 'italian';
  }, [state.isTranslated]);

  const reset = useCallback(() => {
    setState({
      isTranslated: false,
      isTranslating: false,
      originalContent: '',
      originalTitle: ''
    });
  }, []);

  return {
    isTranslated: state.isTranslated,
    isTranslating: state.isTranslating,
    translateContent,
    getButtonText,
    getCurrentLanguage,
    reset
  };
};