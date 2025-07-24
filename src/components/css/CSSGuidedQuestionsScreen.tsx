import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, SkipForward, Volume2, Languages, Save, Share } from 'lucide-react';
import { CSSStoryPhase } from '@/types/css';
import { guidedQuestions } from '@/data/cssThemes';
import { useToast } from '@/hooks/use-toast';
import SpeechToText from '@/components/SpeechToText';
import HomeButton from '@/components/HomeButton';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setAnswer(currentPhase?.answer || '');
  }, [currentQuestionIndex, currentPhase]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [answer]);

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

  const handleSpeechResult = (transcript: string) => {
    const newAnswer = answer + (answer ? ' ' : '') + transcript;
    handleAnswerChange(newAnswer);
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

  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleListen = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying && isPaused) {
        // Resume from pause
        speechSynthesis.resume();
        setIsPaused(false);
      } else if (isPlaying) {
        // Pause current speech
        speechSynthesis.pause();
        setIsPaused(true);
      } else {
        // Start new speech
        const content = getStoryContent();
        if (content) {
          const utterance = new SpeechSynthesisUtterance(content);
          utterance.lang = language === 'italian' ? 'it-IT' : 'en-US';
          utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
            setSpeechUtterance(null);
          };
          utterance.onerror = () => {
            setIsPlaying(false);
            setIsPaused(false);
            setSpeechUtterance(null);
          };
          speechSynthesis.speak(utterance);
          setSpeechUtterance(utterance);
          setIsPlaying(true);
          setIsPaused(false);
        }
      }
    } else {
      toast({
        title: "Funzione non disponibile",
        description: "Il tuo browser non supporta la sintesi vocale",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    const content = getStoryContent();
    if (content) {
      navigator.clipboard.writeText(content).then(() => {
        toast({
          title: "Copiato!",
          description: "La storia è stata copiata negli appunti",
        });
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Cosa Succede Se...?
              </h1>
              <p className="text-slate-600">Domanda iniziale: {initialQuestion}</p>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            {phases.filter(p => p.answer.trim()).length} risposte date
          </div>
        </div>

        {/* Story so far */}
        {phases.filter(p => p.answer.trim()).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">La tua storia finora:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-slate-700 whitespace-pre-line">{getStoryContent()}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Question */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Scrivi la tua risposta qui..."
              className="min-h-[80px] resize-none overflow-hidden"
              style={{ height: 'auto', minHeight: '80px' }}
            />
            
            {/* Speech to text */}
            <SpeechToText onResult={handleSpeechResult} />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
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
              
              <Button variant="outline" onClick={handleListen}>
                <Volume2 className="w-4 h-4 mr-2" />
                {isPlaying && isPaused ? 'RIPRENDI' : isPlaying ? 'PAUSA' : 'ASCOLTA'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onLanguageToggle}
                disabled={isTranslating}
              >
                <Languages className="w-4 h-4 mr-2" />
                {language === 'italian' ? 'ENGLISH' : 'ITALIANO'}
              </Button>
              
              <Button variant="outline" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                CONDIVIDI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CSSGuidedQuestionsScreen;