import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CSSGamePhase, CSSStoryPhase } from '@/types/css';
import { guidedQuestions } from '@/data/cssThemes';
import { saveStory, updateStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import { translateToEnglish, translateToItalian } from '@/utils/translation';
import CSSWarningScreen from '@/components/css/CSSWarningScreen';
import CSSQuestionSelectionScreen from '@/components/css/CSSQuestionSelectionScreen';
import CSSGuidedQuestionsScreen from '@/components/css/CSSGuidedQuestionsScreen';
import CSSFinalScreen from '@/components/css/CSSFinalScreen';

const CSSEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileId, profileName, editStory } = location.state || {};
  const { toast } = useToast();

  const [currentPhase, setCurrentPhase] = useState<CSSGamePhase>('warning');
  const [initialQuestion, setInitialQuestion] = useState('');
  const [storyPhases, setStoryPhases] = useState<CSSStoryPhase[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [language, setLanguage] = useState<'italian' | 'english'>('italian');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (editStory) {
      // Load existing story for editing
      const content = editStory.content || '';
      const lines = content.split('\n\n').filter(line => line.trim());
      
      // Try to parse the story structure
      if (lines.length > 0) {
        setInitialQuestion(editStory.title || 'Cosa succede se...?');
        const phases = lines.map((line, index) => ({
          question: guidedQuestions[index] || `Domanda ${index + 1}`,
          answer: line
        }));
        setStoryPhases(phases);
        setCurrentPhase('question-selection');
        setLanguage(editStory.language || 'italian');
      }
    }
  }, [editStory]);

  const handleExit = () => {
    navigate('/create-story', { state: { profileId, profileName } });
  };

  const handleQuestionSelect = (question: string) => {
    setInitialQuestion(question);
    setCurrentPhase('guided-questions');
    setCurrentQuestionIndex(0);
  };

  const handlePhaseUpdate = (phases: CSSStoryPhase[]) => {
    setStoryPhases(phases);
  };

  const handleNext = () => {
    if (currentQuestionIndex < guidedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentPhase('final');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setCurrentPhase('question-selection');
    }
  };

  const handleFinish = () => {
    setCurrentPhase('final');
  };

  const handleSaveStory = (title: string) => {
    const authorId = profileId || 'anonymous';
    const authorName = profileName || 'Anonimo';

    const storyContent = getFullStoryWithQuestions();

    const storyData = {
      id: editStory?.id || Date.now().toString(),
      title,
      content: storyContent,
      status: 'completed' as const,
      lastModified: new Date().toISOString(),
      mode: 'CSS' as const,
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
        navigate('/superuser-archive', { state: { profileId, profileName } });
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
      if (storyPhases.length === 0 && !initialQuestion.trim()) {
        setLanguage(newLanguage);
        return;
      }

      // Translate initial question
      const translatedInitialQuestion = newLanguage === 'english' 
        ? await translateToEnglish(initialQuestion)
        : await translateToItalian(initialQuestion);
      
      setInitialQuestion(translatedInitialQuestion);

      // Translate all phases (both questions and answers)
      const updatedPhases = await Promise.all(
        storyPhases.map(async (phase) => {
          if (!phase.answer.trim()) return phase;
          
          const translatedQuestion = newLanguage === 'english' 
            ? await translateToEnglish(phase.question)
            : await translateToItalian(phase.question);
          
          const translatedAnswer = newLanguage === 'english' 
            ? await translateToEnglish(phase.answer)
            : await translateToItalian(phase.answer);
            
          return { ...phase, question: translatedQuestion, answer: translatedAnswer };
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

  const getStoryContent = () => {
    return storyPhases
      .filter(phase => phase.answer.trim())
      .map(phase => phase.answer.trim())
      .join('\n\n');
  };

  const getFullStoryWithQuestions = () => {
    const allParts = [
      { question: 'Domanda iniziale', answer: initialQuestion },
      ...storyPhases.filter(phase => phase.answer.trim())
    ];
    return allParts.map(part => `${part.question}:\n${part.answer}`).join('\n\n');
  };

  if (currentPhase === 'warning') {
    return (
      <CSSWarningScreen 
        onContinue={() => setCurrentPhase('question-selection')}
        onExit={handleExit}
      />
    );
  }

  if (currentPhase === 'question-selection') {
    return (
      <CSSQuestionSelectionScreen
        onQuestionSelect={handleQuestionSelect}
        onExit={handleExit}
      />
    );
  }

  if (currentPhase === 'guided-questions') {
    return (
      <CSSGuidedQuestionsScreen
        initialQuestion={initialQuestion}
        phases={storyPhases}
        currentQuestionIndex={currentQuestionIndex}
        onPhaseUpdate={handlePhaseUpdate}
        onNext={handleNext}
        onBack={handleBack}
        onFinish={handleFinish}
        language={language}
        onLanguageToggle={handleLanguageToggle}
        isTranslating={isTranslating}
      />
    );
  }

  if (currentPhase === 'final') {
    return (
      <CSSFinalScreen
        initialQuestion={initialQuestion}
        storyContent={getStoryContent()}
        storyPhases={storyPhases}
        onExit={handleExit}
        onSave={handleSaveStory}
        onPhaseUpdate={handlePhaseUpdate}
        profileName={profileName}
        language={language}
        onLanguageToggle={handleLanguageToggle}
        isTranslating={isTranslating}
      />
    );
  }

  return null;
};

export default CSSEditor;