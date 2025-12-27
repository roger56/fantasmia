import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Volume2, SkipForward, ArrowRight, Pause, Play, Languages, Palette, Download, Loader2 } from 'lucide-react';
import { useUnifiedTTS } from '@/hooks/useUnifiedTTS';
import { useToast } from '@/hooks/use-toast';
import type { DailyStory } from '@/hooks/useDailyStory';

interface DailyStoryOverlayProps {
  isOpen: boolean;
  story: DailyStory;
  onClose: () => void;
  isInitializing?: boolean;
}

type Screen = 'initial' | 'story' | 'quote';

const DailyStoryOverlay: React.FC<DailyStoryOverlayProps> = ({
  isOpen,
  story,
  onClose,
  isInitializing = false
}) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('initial');
  const { speak, pause, isPlaying, isPaused, stop } = useUnifiedTTS({ storyId: 'daily-story' });
  const { toast } = useToast();
  
  // Translation state (temporary, not persisted)
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  
  // Drawing state
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const handleRead = useCallback(() => {
    setCurrentScreen('story');
  }, []);

  const handleListen = useCallback(() => {
    setCurrentScreen('story');
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
    const textToRead = showEnglish && translatedText ? translatedText : story.story;
    const language = showEnglish && translatedText ? 'english' : 'italian';
    
    if (isPlaying && !isPaused) {
      pause();
    } else {
      speak(textToRead, language, 'daily-story');
    }
  }, [isPlaying, isPaused, pause, speak, story.story, showEnglish, translatedText]);

  // Translation handler - uses Vercel API, temporary only
  const handleTranslationToggle = useCallback(async () => {
    if (showEnglish) {
      // Switch back to Italian
      setShowEnglish(false);
      stop(); // Stop TTS when switching language
      return;
    }
    
    // If we already have translation, just show it
    if (translatedText) {
      setShowEnglish(true);
      stop();
      return;
    }
    
    // Translate via Vercel API
    setIsTranslating(true);
    try {
      const response = await fetch('https://fantasmia-ai.vercel.app/api/openai/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: story.story,
          instruction: 'Translate this Italian text to English. Keep the same tone and style. Return only the translation, nothing else.'
        })
      });
      
      if (!response.ok) throw new Error('Translation failed');
      
      const data = await response.json();
      const translated = data.improvedText || data.text || '';
      
      if (translated) {
        setTranslatedText(translated);
        setShowEnglish(true);
        stop(); // Stop TTS when switching language
      } else {
        throw new Error('Empty translation');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Errore traduzione",
        description: "Non è stato possibile tradurre il testo",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  }, [showEnglish, translatedText, story.story, stop, toast]);

  // Drawing handler - uses Vercel API sketch, not saved
  const handleGenerateDrawing = useCallback(async () => {
    setIsGeneratingImage(true);
    try {
      const response = await fetch('https://fantasmia-ai.vercel.app/api/openai/sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: story.story,
          style: 'fumetto',
          detailLevel: 'medium'
        })
      });
      
      if (!response.ok) throw new Error('Image generation failed');
      
      const data = await response.json();
      const imageUrl = data.imageUrl || data.image || data.url || '';
      
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        setShowImageDialog(true);
      } else {
        throw new Error('No image returned');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Errore generazione",
        description: "Non è stato possibile generare il disegno",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [story.story, toast]);

  // Download handler
  const handleDownloadImage = useCallback(async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `racconto-del-giorno-${story.date.replace(/\s/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download completato",
        description: "L'immagine è stata scaricata"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Errore download",
        description: "Non è stato possibile scaricare l'immagine",
        variant: "destructive"
      });
    }
  }, [generatedImage, story.date, toast]);

  if (!isOpen) return null;

  // Show ripple loading during initialization
  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          {/* Ripple animation */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-amber-400/40 animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="absolute inset-4 rounded-full bg-amber-400/50 animate-ping" style={{ animationDelay: '0.4s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-amber-500" />
            </div>
          </div>
          <p className="text-amber-100 text-sm">Caricamento racconti...</p>
        </div>
      </div>
    );
  }

  const displayText = showEnglish && translatedText ? translatedText : story.story;

  return (
    <>
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
                <div className="flex gap-2">
                  {/* Story text container */}
                  <div className="flex-1 bg-white/80 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {displayText}
                    </p>
                  </div>
                  
                  {/* Right side buttons: Translation + Drawing */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleTranslationToggle}
                      variant="outline"
                      size="icon"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      disabled={isTranslating}
                      title={showEnglish ? "Mostra Italiano" : "Traduci in Inglese"}
                    >
                      {isTranslating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Languages className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={handleGenerateDrawing}
                      variant="outline"
                      size="icon"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      disabled={isGeneratingImage}
                      title="Genera Disegno"
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Palette className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Language indicator */}
                {showEnglish && (
                  <p className="text-xs text-amber-600 text-center">
                    🇬🇧 Versione inglese (temporanea)
                  </p>
                )}
                
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

      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent 
          className="max-w-lg bg-white text-slate-900 border-slate-200"
          style={{ colorScheme: 'light' }}
        >
          <DialogHeader>
            <DialogTitle className="text-slate-900">Disegno del Racconto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {generatedImage && (
              <img 
                src={generatedImage} 
                alt="Disegno generato" 
                className="w-full rounded-lg"
              />
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadImage}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Scarica
              </Button>
              <Button
                onClick={() => setShowImageDialog(false)}
                variant="outline"
                className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Chiudi
              </Button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              L'immagine non viene salvata in archivio
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DailyStoryOverlay;
