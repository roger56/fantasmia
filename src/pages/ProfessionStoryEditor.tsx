import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Play, Pause, Volume2 } from 'lucide-react';
import { professions, getProfessionDisplay, Profession } from '@/data/professions';
import { useUnifiedTTS } from '@/hooks/useUnifiedTTS';
import { useToast } from '@/hooks/use-toast';
import SpeechToText from '@/components/SpeechToText';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import SaveDialog from '@/components/SaveDialog';

const PROFESSION_SETTINGS_KEY = 'fantasmia_profession_settings';

const ProfessionStoryEditor = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [isScrolling, setIsScrolling] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5); // default speed (1-10)
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { speak, isPlaying } = useUnifiedTTS();
  const { toast } = useToast();

  // Load rotation speed from settings or calculate from age
  useEffect(() => {
    const loadSpeed = () => {
      try {
        // First try to load from SU settings
        const savedSettings = localStorage.getItem(PROFESSION_SETTINGS_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.rotationSpeed) {
            setScrollSpeed(parsed.rotationSpeed);
            console.log('profession-speed loaded from settings:', parsed.rotationSpeed);
            return;
          }
        }
        
        // Otherwise calculate from NSU age
        const profileJson = localStorage.getItem('fantasmia_current_profile');
        if (profileJson) {
          const profile = JSON.parse(profileJson);
          const age = profile.age || 5;
          const calculatedSpeed = Math.min(5 + Math.max(0, age - 5) * 2, 10);
          setScrollSpeed(calculatedSpeed);
          console.log('profession-speed calculated from age:', calculatedSpeed);
        }
      } catch (e) {
        console.warn('Error loading profession speed settings', e);
      }
    };
    loadSpeed();
  }, []);

  // Auto-scroll functionality with dynamic speed
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isScrolling && scrollAreaRef.current) {
      // Convert speed 1-10 to pixels per frame (1 = 1px, 10 = 8px)
      const pixelsPerFrame = Math.max(1, scrollSpeed * 0.8);
      
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
            element.scrollTop += pixelsPerFrame;
          }
        }
      }, 33); // ~30fps for smooth scrolling
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isScrolling, scrollSpeed]);

  // Handle any key press to stop scrolling (random selection behavior)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedProfession && isScrolling) {
        e.preventDefault();
        setIsScrolling(false);
        
        // Select the profession currently visible in the center
        const element = scrollAreaRef.current;
        if (element) {
          const items = element.querySelectorAll('[data-profession]');
          const containerRect = element.getBoundingClientRect();
          const centerY = containerRect.top + containerRect.height / 2;
          
          for (const item of items) {
            const rect = item.getBoundingClientRect();
            if (rect.top <= centerY && rect.bottom >= centerY) {
              const profession = item.getAttribute('data-profession');
              if (profession) {
                setSelectedProfession(profession);
                toast({
                  title: "Professione selezionata!",
                  description: `${profession} - Inizia a scrivere la tua storia`
                });
              }
              break;
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isScrolling, selectedProfession, toast]);

  // Filter professions based on search term (searches both M and F)
  const filteredProfessions = professions.filter(profession =>
    profession.maschile.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profession.femminile.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = () => {
    const found = professions.find(profession =>
      profession.maschile.toLowerCase() === searchTerm.toLowerCase() ||
      profession.femminile.toLowerCase() === searchTerm.toLowerCase()
    );
    
    if (found) {
      // Set the specific gender version that was searched
      const selectedVersion = found.maschile.toLowerCase() === searchTerm.toLowerCase() 
        ? found.maschile 
        : found.femminile;
      setSelectedProfession(selectedVersion);
      toast({
        title: "Professione trovata!",
        description: `${selectedVersion} selezionata`
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

  // Render profession item with both genders or click to select specific one
  const renderProfessionItem = (profession: Profession, index: number) => {
    const displayText = getProfessionDisplay(profession);
    const hasBothGenders = profession.maschile !== profession.femminile;
    
    return (
      <div
        key={index}
        data-profession={profession.maschile}
        className="p-3 border border-border rounded cursor-pointer hover:bg-muted transition-colors"
      >
        {hasBothGenders ? (
          <div className="flex justify-between items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleProfessionSelect(profession.maschile);
              }}
              className="flex-1 text-left text-lg font-medium hover:text-primary transition-colors py-1 px-2 rounded hover:bg-primary/10"
            >
              {profession.maschile}
            </button>
            <span className="text-muted-foreground">/</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleProfessionSelect(profession.femminile);
              }}
              className="flex-1 text-right text-lg font-medium hover:text-primary transition-colors py-1 px-2 rounded hover:bg-primary/10"
            >
              {profession.femminile}
            </button>
          </div>
        ) : (
          <div 
            className="text-lg font-medium text-center"
            onClick={() => handleProfessionSelect(profession.maschile)}
          >
            {profession.maschile}
          </div>
        )}
      </div>
    );
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
                    Premi un tasto qualsiasi per fermare e selezionare • Clicca su M o F per scegliere il genere
                  </p>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={scrollAreaRef}
                    className="h-64 overflow-auto bg-card border border-border rounded-lg p-4"
                  >
                    <div className="space-y-2">
                      {(searchTerm ? filteredProfessions : professions).map((profession, index) => 
                        renderProfessionItem(profession, index)
                      )}
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
