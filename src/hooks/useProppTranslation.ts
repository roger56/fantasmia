import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { translateToEnglish } from '@/utils/translation';

export const useProppTranslation = () => {
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalStory, setOriginalStory] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async (
    finalStory: string,
    storyTitle: string,
    setFinalStory: (story: string) => void,
    setStoryTitle: (title: string) => void
  ) => {
    setIsTranslating(true);
    
    try {
      if (!isTranslated) {
        // Translate to English
        setOriginalStory(finalStory);
        setOriginalTitle(storyTitle);
        
        const translatedStory = await translateToEnglish(finalStory);
        const translatedTitle = await translateToEnglish(storyTitle);
        
        setFinalStory(translatedStory);
        setStoryTitle(translatedTitle);
        setIsTranslated(true);
        
        toast({
          title: "Traduzione completata",
          description: "La storia è stata tradotta in inglese",
        });
      } else {
        // Return to Italian
        setFinalStory(originalStory);
        setStoryTitle(originalTitle);
        setIsTranslated(false);
        
        toast({
          title: "Traduzione completata",
          description: "La storia è stata riportata in italiano",
        });
      }
    } catch (error) {
      toast({
        title: "Errore traduzione",
        description: "Non è stato possibile tradurre la storia",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    isTranslated,
    isTranslating,
    handleTranslate
  };
};