import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, SkipForward } from 'lucide-react';
import { CSSStoryPhase } from '@/types/css';
import { guidedQuestions } from '@/data/cssThemes';
import StoryLayout from '@/components/shared/StoryLayout';
import WritingCard from '@/components/shared/WritingCard';
import ActionButtonGroup from '@/components/shared/ActionButtonGroup';

interface CSSGuidedQuestionsScreenProps {
  initialQuestion: string;
  phases: CSSStoryPhase[];
  currentQuestionIndex: number;
  onPhaseUpdate: (phases: CSSStoryPhase[]) => void;
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
  language: 'italian' | 'english';
  onLanguageToggle: () => void;
  isTranslating: boolean;
}

const CSSGuidedQuestionsScreen: React.FC<CSSGuidedQuestionsScreenProps> = ({
  initialQuestion,
  phases,
  currentQuestionIndex,
  onPhaseUpdate,
  onNext,
  onBack,
  onFinish,
  language,
  onLanguageToggle,
  isTranslating
}) => {
  const currentQuestion = guidedQuestions[currentQuestionIndex];
  const currentPhase = phases.find(p => p.question === currentQuestion);
  const [answer, setAnswer] = useState(currentPhase?.answer || '');

  useEffect(() => {
    setAnswer(currentPhase?.answer || '');
  }, [currentQuestionIndex, currentPhase]);

  const handleAnswerChange = (newAnswer: string) => {
    setAnswer(newAnswer);
    const updatedPhases = [...phases];
    const existingIndex = updatedPhases.findIndex(p => p.question === currentQuestion);
    
    if (existingIndex >= 0) {
      updatedPhases[existingIndex] = { question: currentQuestion, answer: newAnswer };
    } else {
      updatedPhases.push({ question: currentQuestion, answer: newAnswer });
    }
    
    onPhaseUpdate(updatedPhases);
  };

  const handleNext = () => {
    if (currentQuestionIndex < guidedQuestions.length - 1) {
      onNext();
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    const updatedPhases = phases.filter(p => p.question !== currentQuestion);
    onPhaseUpdate(updatedPhases);
    handleNext();
  };

  const getStoryContent = () => {
    const completedPhases = phases.filter(p => p.answer.trim());
    return completedPhases.map(p => p.answer.trim()).join('\n\n');
  };

  return (
    <StoryLayout
      title="Cosa Succede Se...?"
      subtitle={`Domanda iniziale: ${initialQuestion}`}
      onBack={onBack}
      backgroundColor="bg-gradient-to-br from-purple-50 to-blue-50"
      headerContent={
        <div className="text-sm text-slate-500">
          {phases.filter(p => p.answer.trim()).length} risposte date
        </div>
      }
    >
      {/* Story so far */}
      {phases.filter(p => p.answer.trim()).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">La tua storia finora:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg max-h-48 overflow-y-auto space-y-2">
              {phases.filter(p => p.answer.trim()).map((phase, index) => (
                <div key={index} className="border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                  <p className="text-sm text-slate-600 font-medium mb-1">{phase.question}</p>
                  <p className="text-slate-700">{phase.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <WritingCard
        title={currentQuestion}
        value={answer}
        onChange={handleAnswerChange}
        placeholder="Scrivi la tua risposta qui..."
      />

      <div className="flex flex-wrap gap-3 mt-6">
        <Button onClick={handleSkip} variant="outline">
          <SkipForward className="w-4 h-4 mr-2" />
          Salta
        </Button>
        
        <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
          <ArrowRight className="w-4 h-4 mr-2" />
          {currentQuestionIndex < guidedQuestions.length - 1 ? 'Avanti' : 'Finisci'}
        </Button>
        
        {phases.filter(p => p.answer.trim()).length >= 3 && (
          <Button onClick={onFinish} variant="outline" className="bg-green-600 hover:bg-green-700 text-white">
            Finisci Storia
          </Button>
        )}
        
        <ActionButtonGroup
          content={getStoryContent()}
          language={language}
          onLanguageToggle={onLanguageToggle}
          isTranslating={isTranslating}
          showSave={false}
        />
      </div>
    </StoryLayout>
  );
};

export default CSSGuidedQuestionsScreen;