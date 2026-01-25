import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Volume2, SkipForward, ArrowRight, Pause, Play, Languages, Palette, Download, Loader2 } from 'lucide-react';
import { tts, TTSStateInfo, TTSState } from '@/utils/tts';
import { useToast } from '@/hooks/use-toast';
import { translateToEnglish } from '@/utils/translation';
import type { DailyStory } from '@/hooks/useDailyStory';

interface DailyStoryOverlayProps {
  isOpen: boolean;
  story: DailyStory;
  onClose: () => void;
  isInitializing?: boolean;
  hasTimedOut?: boolean;
}

type Screen = 'initial' | 'story' | 'quote';

const DailyStoryOverlay: React.FC<DailyStoryOverlayProps> = ({
  isOpen,
  story,
  onClose,
  isInitializing = false,
  hasTimedOut = false
}) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('initial');
  const [ttsState, setTtsState] = useState<TTSState>('idle');
  
  // Sottoscrizione allo stato TTS
  useEffect(() => {
    const unsubscribe = tts.onStateChange((info: TTSStateInfo) => {
      setTtsState(info.state);
    });
    return unsubscribe;
  }, []);
  
  const isPlaying = ttsState === 'speaking';
  const isPaused = ttsState === 'paused';
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
      tts.speak(story.story);
    }, 300);
  }, [story.story]);

  const handleSkip = useCallback(() => {
    tts.stop();
    onClose();
  }, [onClose]);

  const handleNextToQuote = useCallback(() => {
    tts.stop();
    setCurrentScreen('quote');
  }, []);

  const handleFinish = useCallback(() => {
    tts.stop();
    onClose();
  }, [onClose]);

  const handleTTSToggle = useCallback(() => {
    const textToRead = showEnglish && translatedText ? translatedText : story.story;
    
    if (isPlaying && !isPaused) {
      tts.pause();
    } else if (isPaused) {
      tts.resume();
    } else {
      tts.speak(textToRead);
    }
  }, [isPlaying, isPaused, story.story, showEnglish, translatedText]);

  // Translation handler - uses Google Translate API, temporary only
  const handleTranslationToggle = useCallback(async () => {
    if (showEnglish) {
      // Switch back to Italian
      setShowEnglish(false);
      tts.stop(); // Stop TTS when switching language
      return;
    }
    
    // If we already have translation, just show it
    if (translatedText) {
      setShowEnglish(true);
      tts.stop();
      return;
    }
    
    // Translate via Google Translate API (same as UserStoryViewer)
    setIsTranslating(true);
    try {
      const translated = await translateToEnglish(story.story);
      
      if (translated && translated !== story.story) {
        setTranslatedText(translated);
        setShowEnglish(true);
        tts.stop(); // Stop TTS when switching language
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
  }, [showEnglish, translatedText, story.story, toast]);

  // Drawing handler - uses Vercel API /image endpoint with fumetto style
  const handleGenerateDrawing = useCallback(async () => {
    setIsGeneratingImage(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch('https://fantasmia-ai.vercel.app/api/openai/image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          prompt: story.story,
          style: 'fumetto'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image API error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle response: image_base64 or image_url
      let imageUrl = '';
      if (data.image_base64) {
        imageUrl = `data:image/png;base64,${data.image_base64}`;
      } else if (data.image_url) {
        imageUrl = data.image_url;
      } else if (data.imageUrl) {
        imageUrl = data.imageUrl;
      }
      
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        setShowImageDialog(true);
      } else {
        throw new Error('No image returned');
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast({
        title: "Errore generazione",
        description: error.name === 'AbortError' 
          ? "Timeout: la generazione ha richiesto troppo tempo"
          : "Non è stato possibile generare il disegno",
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

  // Show timeout message if loading failed after 15 seconds
  if (hasTimedOut && !story?.story) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <Card className="w-full max-w-md mx-4 shadow-2xl border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-amber-600" />
            </div>
            <p className="text-amber-700 font-medium">
              Racconti del giorno non disponibili al momento
            </p>
            <p className="text-sm text-amber-600">
              Riprova più tardi
            </p>
            <Button 
              onClick={onClose}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Continua
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show ripple loading during initialization OR when story is not yet loaded
  if (isInitializing || !story?.story) {
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
                  IL RACCONTO DI OGGI — {story.date}
                </CardTitle>
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
                <p className="text-xs text-amber-500 mt-1">Racconto + Massima del giorno</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Story text container */}
                <div className="bg-white/80 rounded-lg p-4 max-h-[40vh] overflow-y-auto">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {displayText}
                  </p>
                </div>
                
                {/* Language indicator */}
                {showEnglish && (
                  <p className="text-xs text-amber-600 text-center">
                    🇬🇧 Versione inglese (temporanea)
                  </p>
                )}
                
                {/* Service buttons row: INGLESE + DISEGNO - prominent and visible */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleTranslationToggle}
                    variant="outline"
                    className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-100 font-medium"
                    disabled={isTranslating}
                  >
                    {isTranslating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Languages className="w-4 h-4 mr-2" />
                    )}
                    {showEnglish ? 'ITALIANO' : 'INGLESE'}
                  </Button>
                  <Button
                    onClick={handleGenerateDrawing}
                    variant="outline"
                    className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-100 font-medium"
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Palette className="w-4 h-4 mr-2" />
                    )}
                    DISEGNO
                  </Button>
                </div>
                
                {/* Navigation buttons row: ASCOLTA + AVANTI */}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleTTSToggle}
                    variant="outline"
                    className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-100 font-medium"
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
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium"
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
