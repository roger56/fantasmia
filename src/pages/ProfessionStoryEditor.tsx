import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Shuffle, Volume2 } from 'lucide-react';
import { professions } from '@/data/professions';
import { useUnifiedTTS } from '@/hooks/useUnifiedTTS';
import { useToast } from '@/hooks/use-toast';
import SpeechToText from '@/components/SpeechToText';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import SaveDialog from '@/components/SaveDialog';

const ProfessionStoryEditor = () => {
  const navigate = useNavigate();
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollSpeed, setScrollSpeed] = useState(30); // ms between changes, lower = faster
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { speak, isPlaying } = useUnifiedTTS();
  const { toast } = useToast();

  // Random selection animation - starts fast and slows down
  useEffect(() => {
    if (!isSelecting) return;
    
    const totalDuration = 3500; // 3.5 seconds total
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      
      // Easing function - slows down progressively
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      // Speed goes from 30ms to 400ms
      const currentSpeed = 30 + (easeOut * 370);
      
      // Update displayed profession
      setCurrentIndex(Math.floor(Math.random() * professions.length));
      
      if (progress < 1) {
        setTimeout(animate, currentSpeed);
      } else {
        // Final selection
        const finalIndex = Math.floor(Math.random() * professions.length);
        setSelectedProfession(professions[finalIndex]);
        setIsSelecting(false);
        toast({
          title: "Professione selezionata!",
          description: professions[finalIndex]
        });
      }
    };
    
    animate();
  }, [isSelecting, toast]);

  // Auto-scroll the list during selection for visual effect
  useEffect(() => {
    if (isSelecting && scrollAreaRef.current) {
      const element = scrollAreaRef.current;
      const itemHeight = 52; // approximate height of each item
      element.scrollTop = currentIndex * itemHeight - element.clientHeight / 2 + itemHeight / 2;
    }
  }, [currentIndex, isSelecting]);

  const handleStartRandomSelection = () => {
    setIsSelecting(true);
    setSelectedProfession(null);
  };

  const handleSpeechResult = (text: string) => {
    setStoryText(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleReadStory = () => {
    if (storyText) {
      speak(storyText, 'italian');
    }
  };

  const handleSave = () => {
    if (!storyText.trim()) {
      toast({
        title: "Errore",
        description: "Scrivi prima la tua storia!",
        variant: "destructive"
      });
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveComplete = async (title: string) => {
    setStoryTitle(title);
    setShowSaveDialog(false);
    
    try {
      const { saveUserStory } = await import('@/utils/storyManager');
      const storyId = await saveUserStory({
        title,
        text: storyText,
        mode: `PROFESSION_${selectedProfession || 'UNKNOWN'}`
      });
      
      toast({
        title: "Storia salvata!",
        description: "La tua storia è stata salvata con successo"
      });
      
      // Navigate direttamente alla pagina di dettaglio
      navigate(`/user-story-viewer/${storyId}`);
    } catch (error) {
      console.error('Errore salvataggio:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile salvare la storia",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <ProfileIndicator />
      <StoryLayout
        title="Cosa farei se fossi un..."
        subtitle="Lascia che il destino scelga la tua professione!"
        onBack={() => navigate('/create-story')}
        showHomeButton={true}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {!selectedProfession ? (
            <>
              {/* Professions List - Visual Display Only */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Lista Professioni</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={scrollAreaRef}
                    className="h-64 overflow-hidden bg-background border border-border rounded-lg p-4"
                  >
                    <div className="space-y-2">
                      {professions.map((profession, index) => (
                        <div
                          key={index}
                          className={`p-3 border rounded text-lg font-medium transition-all duration-100 ${
                            isSelecting && index === currentIndex
                              ? 'bg-primary text-primary-foreground border-primary scale-105'
                              : 'border-border bg-card'
                          }`}
                        >
                          {profession}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Random Selection Button */}
                  <div className="text-center mt-6">
                    <Button 
                      onClick={handleStartRandomSelection}
                      disabled={isSelecting}
                      size="lg"
                      className="gap-2 text-lg px-8 py-6"
                    >
                      <Shuffle className={`w-5 h-5 ${isSelecting ? 'animate-spin' : ''}`} />
                      {isSelecting ? 'Scegliendo...' : 'Scegli casualmente!'}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-3">
                      Premi il pulsante e lascia che il destino scelga per te!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Selected Profession Story Editor */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-center">
                    Cosa faresti se fossi un: {selectedProfession}?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Scrivi qui la tua storia oppure usa il microfono per dettarla..."
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    className="min-h-[5rem] max-h-[40vh] text-base leading-relaxed resize-none overflow-y-auto"
                    style={{
                      height: Math.min(Math.max(80, storyText.split('\n').length * 24 + 32), 300) + 'px'
                    }}
                  />
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <SpeechToText onResult={handleSpeechResult} />
                    
                    <Button
                      variant="outline"
                      onClick={handleReadStory}
                      disabled={!storyText || isPlaying}
                      className="flex items-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      Leggi
                    </Button>
                    
                    <Button onClick={handleSave} disabled={!storyText.trim()}>
                      Salva Storia
                    </Button>
                  </div>

                  {/* Back to random selection */}
                  <div className="text-center pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedProfession(null);
                        setStoryText('');
                      }}
                    >
                      Scegli altra professione
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <SaveDialog
            isOpen={showSaveDialog}
            onClose={() => setShowSaveDialog(false)}
            onSave={handleSaveComplete}
            title={storyTitle}
            dialogTitle="Salva la tua storia - Professione"
          />
        )}
      </StoryLayout>
    </>
  );
};

export default ProfessionStoryEditor;
