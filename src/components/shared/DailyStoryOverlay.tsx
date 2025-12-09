import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Volume2, SkipForward, ArrowRight, Pause, Play } from 'lucide-react';
import { useUnifiedTTS } from '@/hooks/useUnifiedTTS';
import type { DailyStory } from '@/hooks/useDailyStory';

interface DailyStoryOverlayProps {
  isOpen: boolean;
  story: DailyStory;
  onClose: () => void;
}

type Screen = 'initial' | 'story' | 'quote';

const DailyStoryOverlay: React.FC<DailyStoryOverlayProps> = ({
  isOpen,
  story,
  onClose
}) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('initial');
  const { speak, pause, isPlaying, isPaused, stop } = useUnifiedTTS({ storyId: 'daily-story' });

  const handleRead = useCallback(() => {
    setCurrentScreen('story');
  }, []);

  const handleListen = useCallback(() => {
    setCurrentScreen('story');
    // Start TTS after showing story
    setTimeout(() => {
      speak(story.story, 'italian', 'daily-story');
    }, 300);
  }, [speak, story.story]);

  const handleSkip = useCallback(() => {
    stop();
    onClose();
  }, [stop, onClose]);

  const handleNextToQuote = useCallback(() => {
    stop();
    setCurrentScreen('quote');
  }, [stop]);

  const handleFinish = useCallback(() => {
    stop();
    onClose();
  }, [stop, onClose]);

  const handleTTSToggle = useCallback(() => {
    if (isPlaying && !isPaused) {
      pause();
    } else {
      speak(story.story, 'italian', 'daily-story');
    }
  }, [isPlaying, isPaused, pause, speak, story.story]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-lg mx-4 shadow-2xl border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        {currentScreen === 'initial' && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-amber-800">
                IL RACCONTO DI OGGI
              </CardTitle>
              <p className="text-amber-600 font-medium mt-1">
                {story.date}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Button 
                onClick={handleRead}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                size="lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                LEGGI
              </Button>
              <Button 
                onClick={handleListen}
                variant="outline"
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                size="lg"
              >
                <Volume2 className="w-5 h-5 mr-2" />
                ASCOLTA
              </Button>
              <Button 
                onClick={handleSkip}
                variant="ghost"
                className="w-full text-amber-600 hover:text-amber-800 hover:bg-amber-100"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                SALTA
              </Button>
            </CardContent>
          </>
        )}

        {currentScreen === 'story' && (
          <>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg text-amber-800">
                IL RACCONTO DI OGGI — {story.date}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/80 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {story.story}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleTTSToggle}
                  variant="outline"
                  className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  {isPlaying && !isPaused ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      PAUSA
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {isPaused ? 'RIPRENDI' : 'ASCOLTA'}
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleNextToQuote}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  AVANTI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {currentScreen === 'quote' && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💡</span>
                </div>
              </div>
              <CardTitle className="text-lg text-orange-800">
                La massima del giorno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/80 rounded-lg p-6 text-center">
                <p className="text-xl text-slate-700 italic font-medium">
                  "{story.quote}"
                </p>
              </div>
              
              <Button 
                onClick={handleFinish}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                size="lg"
              >
                AVANTI
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default DailyStoryOverlay;
