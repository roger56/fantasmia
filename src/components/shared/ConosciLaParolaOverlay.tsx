/**
 * Overlay per "Conosci la parola?" con flow a 5 step
 * Step 1: Parola + TTS
 * Step 2-3: Significato IT + EN (stesso box)
 * Step 4: Ripetizione finale
 * Step 5: Chiusura
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, Volume2, ArrowRight, Check } from 'lucide-react';
import type { SelectedWord } from '@/hooks/useConosciLaParola';
import { tts, TTSStateInfo } from '@/utils/tts';

interface ConosciLaParolaOverlayProps {
  isOpen: boolean;
  selectedWord: SelectedWord | null;
  onClose: () => void;
}

const ConosciLaParolaOverlay: React.FC<ConosciLaParolaOverlayProps> = ({
  isOpen,
  selectedWord,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Reset step when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Sottoscrizione allo stato TTS
  useEffect(() => {
    const unsubscribe = tts.onStateChange((info: TTSStateInfo) => {
      setIsSpeaking(info.state === 'speaking');
    });
    return unsubscribe;
  }, []);

  // TTS function usando il nuovo controller con chunking
  const speakWord = useCallback(() => {
    if (!selectedWord) return;
    tts.speak(selectedWord.entry.word);
  }, [selectedWord]);

  const handleNextStep = useCallback(() => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  }, [currentStep, onClose]);

  if (!selectedWord) return null;

  const isItalian = selectedWord.language === 'it';
  const entry = selectedWord.entry;

  // Render content based on step
  const renderStepContent = () => {
    if (isItalian) {
      // Italian flow (simplified - 3 steps)
      switch (currentStep) {
        case 1:
          return (
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">La parola è...</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-bold text-primary uppercase tracking-wide">
                  {entry.word}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={speakWord}
                  disabled={isSpeaking}
                  className="h-10 w-10"
                >
                  <Volume2 className={`w-6 h-6 ${isSpeaking ? 'animate-pulse text-primary' : ''}`} />
                </Button>
              </div>
            </div>
          );
        case 2:
          return (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary uppercase mb-4">{entry.word}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Significato:</p>
                <p className="text-foreground font-medium text-lg">
                  {(entry as { definition: string }).definition}
                </p>
              </div>
            </div>
          );
        case 3:
        case 4:
        case 5:
          return (
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">Ricorda:</p>
              <p className="text-2xl font-bold text-primary uppercase">{entry.word}</p>
              <p className="text-foreground">{(entry as { definition: string }).definition}</p>
            </div>
          );
      }
    } else {
      // English flow (5 steps)
      const enEntry = entry as { word: string; meaningEN: string; meaningIT: string; translationIT: string };
      
      switch (currentStep) {
        case 1:
          return (
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">The word is...</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-bold text-primary uppercase tracking-wide">
                  {enEntry.word}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={speakWord}
                  disabled={isSpeaking}
                  className="h-10 w-10"
                  aria-label="Pronuncia"
                >
                  <Volume2 className={`w-6 h-6 ${isSpeaking ? 'animate-pulse text-primary' : ''}`} />
                </Button>
              </div>
            </div>
          );
        case 2:
          return (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary uppercase mb-4">{enEntry.word}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">🇮🇹 Significato in italiano:</p>
                  <p className="text-foreground font-medium">{enEntry.meaningIT}</p>
                </div>
              </div>
            </div>
          );
        case 3:
          return (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary uppercase mb-4">{enEntry.word}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">🇮🇹 Significato in italiano:</p>
                  <p className="text-foreground font-medium">{enEntry.meaningIT}</p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground mb-1">🇬🇧 Meaning in English:</p>
                  <p className="text-foreground font-medium">{enEntry.meaningEN}</p>
                </div>
              </div>
            </div>
          );
        case 4:
          return (
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">Ricorda:</p>
              <div className="flex items-center justify-center gap-4">
                <p className="text-2xl font-bold text-primary uppercase">{enEntry.word}</p>
                <span className="text-2xl">→</span>
                <p className="text-2xl font-bold text-foreground uppercase">{enEntry.translationIT}</p>
              </div>
            </div>
          );
        case 5:
          return (
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">Ottimo lavoro!</p>
              <div className="flex items-center justify-center gap-4">
                <p className="text-xl font-bold text-primary uppercase">{enEntry.word}</p>
                <span className="text-xl">=</span>
                <p className="text-xl font-bold text-foreground uppercase">{enEntry.translationIT}</p>
              </div>
            </div>
          );
      }
    }
  };

  const getButtonText = () => {
    const maxSteps = isItalian ? 3 : 5;
    if (currentStep >= maxSteps) return 'Ho capito!';
    return 'Avanti';
  };

  const maxSteps = isItalian ? 3 : 5;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-6 h-6 text-primary" />
            Conosci la parola?
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {currentStep}/{maxSteps}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 min-h-[180px] flex flex-col justify-center">
          {renderStepContent()}
        </div>
        
        <div className="flex justify-center">
          <Button
            variant="default"
            size="lg"
            onClick={handleNextStep}
            className="min-w-32 gap-2"
          >
            {currentStep >= maxSteps ? (
              <>
                <Check className="w-5 h-5" />
                {getButtonText()}
              </>
            ) : (
              <>
                {getButtonText()}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConosciLaParolaOverlay;
