import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CampbellCard, CampbellGamePhase, CampbellStoryPhase } from '@/types/campbell';
import { campbellCards } from '@/data/campbellCards';
import { saveStory, updateStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import { translateToEnglish, translateToItalian } from '@/utils/translation';
import CampbellWarningScreen from '@/components/campbell/CampbellWarningScreen';
import CampbellCardSelectionScreen from '@/components/campbell/CampbellCardSelectionScreen';
import CampbellWritingScreen from '@/components/campbell/CampbellWritingScreen';
import CampbellFinalScreen from '@/components/campbell/CampbellFinalScreen';

const CampbellEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileId, profileName, editStory } = location.state || {};
  const { toast } = useToast();

  const [currentPhase, setCurrentPhase] = useState<CampbellGamePhase>('warning');
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [storyPhases, setStoryPhases] = useState<CampbellStoryPhase[]>([]);
  const [currentCard, setCurrentCard] = useState<CampbellCard | null>(null);
  const [language, setLanguage] = useState<'italian' | 'english'>('italian');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (editStory) {
      // Load existing story for editing
      const content = editStory.content || '';
      const phases = content.split('\n\n').map((phase: string, index: number) => ({
        card: campbellCards[index] || null,
        content: phase
      }));
      setStoryPhases(phases);
      setSelectedCards(new Set(phases.map((_: any, index: number) => index + 1).slice(0, phases.length)));
      setCurrentPhase('card-selection');
      setLanguage(editStory.language || 'italian');
    }
  }, [editStory]);

  const handleExit = () => {
    navigate('/create-story', { state: { profileId, profileName } });
  };

  const handleCardSelect = (card: CampbellCard) => {
    setCurrentCard(card);
    setCurrentPhase('writing');
  };

  const handleContentChange = (content: string) => {
    if (!currentCard) return;

    const updatedPhases = [...storyPhases];
    const existingPhaseIndex = updatedPhases.findIndex(phase => 
      phase.card && phase.card.id === currentCard.id
    );

    if (existingPhaseIndex >= 0) {
      updatedPhases[existingPhaseIndex] = { card: currentCard, content };
    } else {
      updatedPhases.push({ card: currentCard, content });
    }

    setStoryPhases(updatedPhases);
    setSelectedCards(prev => new Set([...prev, currentCard.id]));
  };

  const handleBackToCards = () => {
    setCurrentCard(null);
    setCurrentPhase('card-selection');
  };

  const handleFinishStory = () => {
    setCurrentPhase('final');
  };

  const handleSaveStory = (title: string) => {
    // Check if we have a profile or allow anonymous save
    const authorId = profileId || 'anonymous';
    const authorName = profileName || 'Anonimo';

    const storyContent = storyPhases
      .filter(phase => phase.content.trim())
      .map(phase => phase.content.trim())
      .join('\n');

    const storyData = {
      id: editStory?.id || Date.now().toString(),
      title,
      content: storyContent,
      status: 'completed' as const,
      lastModified: new Date().toISOString(),
      mode: 'CAMPBELL' as const,
      authorId,
      authorName,
      isPublic: false,
      language
    };

    try {
      if (editStory) {
        updateStory(editStory.id, storyData);
        toast({
          title: "Storia aggiornata!",
          description: `"${title}" è stata aggiornata con successo.`
        });
      } else {
        saveStory(storyData);
        toast({
          title: "Storia salvata!",
          description: `"${title}" è stata salvata con successo.`
        });
      }
      
      setTimeout(() => {
        navigate('/archive', { state: { profileId, profileName } });
      }, 1500);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la storia",
        variant: "destructive"
      });
    }
  };

  const handleLanguageToggle = async () => {
    if (isTranslating) return;
    
    setIsTranslating(true);
    const newLanguage = language === 'italian' ? 'english' : 'italian';
    
    try {
      if (storyPhases.length === 0) {
        setLanguage(newLanguage);
        return;
      }

      const updatedPhases = await Promise.all(
        storyPhases.map(async (phase) => {
          if (!phase.content.trim()) return phase;
          
          const translatedContent = newLanguage === 'english' 
            ? await translateToEnglish(phase.content)
            : await translateToItalian(phase.content);
            
          return { ...phase, content: translatedContent };
        })
      );
      
      setStoryPhases(updatedPhases);
      setLanguage(newLanguage);
      
      toast({
        title: "Traduzione completata",
        description: `Testo tradotto in ${newLanguage === 'english' ? 'inglese' : 'italiano'}`,
      });
    } catch (error) {
      toast({
        title: "Errore traduzione",
        description: "Impossibile tradurre il testo",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const getCurrentContent = () => {
    if (!currentCard) return '';
    const phase = storyPhases.find(p => p.card && p.card.id === currentCard.id);
    return phase ? phase.content : '';
  };

  const getAllContent = () => {
    return storyPhases
      .filter(phase => phase.content.trim())
      .map(phase => phase.content.trim())
      .join('\n');
  };

  const getStoryContent = () => {
    return storyPhases
      .filter(phase => phase.content.trim())
      .map(phase => phase.content.trim())
      .join('\n');
  };

  if (currentPhase === 'warning') {
    return (
      <CampbellWarningScreen 
        onContinue={() => setCurrentPhase('card-selection')}
        onExit={handleExit}
      />
    );
  }

  if (currentPhase === 'card-selection') {
    return (
      <CampbellCardSelectionScreen
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
        onExit={handleExit}
        onFinish={handleFinishStory}
        storyContent={getAllContent()}
      />
    );
  }

  if (currentPhase === 'writing' && currentCard) {
    return (
      <CampbellWritingScreen
        card={currentCard}
        currentContent={getCurrentContent()}
        allContent={getAllContent()}
        onContentChange={handleContentChange}
        onBack={handleBackToCards}
        onSave={handleSaveStory}
        profileName={profileName}
        language={language}
        onLanguageToggle={handleLanguageToggle}
      />
    );
  }

  if (currentPhase === 'final') {
    return (
      <CampbellFinalScreen
        storyContent={getStoryContent()}
        onExit={handleExit}
        onSave={handleSaveStory}
        profileName={profileName}
        language={language}
        onLanguageToggle={handleLanguageToggle}
      />
    );
  }

  return null;
};

export default CampbellEditor;