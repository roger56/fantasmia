import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Play, Pause, Mic, MicOff, Volume2 } from 'lucide-react';
import { professions } from '@/data/professions';
import { useTTS } from '@/hooks/useTTS';
import { useToast } from '@/hooks/use-toast';
import SpeechToText from '@/components/SpeechToText';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import SaveDialog from '@/components/SaveDialog';

const ProfessionStoryEditor = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [isScrolling, setIsScrolling] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { speak, isPlaying } = useTTS();
  const { toast } = useToast();

  // Auto-scroll functionality
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isScrolling && scrollAreaRef.current) {
      intervalId = setInterval(() => {
        const element = scrollAreaRef.current;
        if (element) {
          const scrollTop = element.scrollTop;
          const scrollHeight = element.scrollHeight;
          const clientHeight = element.clientHeight;
          
          if (scrollTop + clientHeight >= scrollHeight) {
            // Reset to top when reaching bottom
            element.scrollTop = 0;
          } else {
            element.scrollTop += 3; // Velocità aumentata x3 per scelta casuale
          }
        }
      }, 33); // ~30fps for smooth scrolling
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isScrolling]);

  // Handle space key press for pause/resume
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !selectedProfession) {
        e.preventDefault();
        setIsScrolling(!isScrolling);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isScrolling, selectedProfession]);

  const filteredProfessions = professions.filter(profession =>
    profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = () => {
    const found = professions.find(profession =>
      profession.toLowerCase() === searchTerm.toLowerCase()
    );
    
    if (found) {
      setSelectedProfession(found);
      toast({
        title: "Professione trovata!",
        description: `${found} selezionata`
      });
    } else {
      toast({
        title: "Professione non trovata",
        description: "Controlla l'ortografia o prova con un altro termine",
        variant: "destructive"
      });
    }
  };

  const handleProfessionSelect = (profession: string) => {
    setSelectedProfession(profession);
    setIsScrolling(false);
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
        subtitle="Scegli una professione e racconta la tua storia"
        onBack={() => navigate('/create-story')}
        showHomeButton={true}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {!selectedProfession ? (
            <>
              {/* Search Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Cerca una professione</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Scrivi qui la professione..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="text-lg"
                    />
                    <Button onClick={handleSearch} className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Cerca
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Professions List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Lista Professioni</CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => setIsScrolling(!isScrolling)}
                      className="flex items-center gap-2"
                    >
                      {isScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isScrolling ? 'Ferma' : 'Riprendi'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Premi SPAZIO per fermare/riprendere lo scorrimento
                  </p>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={scrollAreaRef}
                    className="h-64 overflow-auto bg-white border border-gray-300 rounded-lg p-4"
                  >
                    <div className="space-y-2">
                      {(searchTerm ? filteredProfessions : professions).map((profession, index) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors text-lg font-medium"
                          onClick={() => handleProfessionSelect(profession)}
                        >
                          {profession}
                        </div>
                      ))}
                    </div>
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
                    className="min-h-48 text-base leading-relaxed"
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

                  {/* Back to professions */}
                  <div className="text-center pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedProfession(null);
                        setStoryText('');
                        setIsScrolling(true);
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