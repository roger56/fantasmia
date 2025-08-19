import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Play, Pause, Volume2 } from 'lucide-react';
import { getSavedProfessions, addProfession } from '@/data/professions';
import { useTTS } from '@/hooks/useTTS';
import { useToast } from '@/hooks/use-toast';
import SpeechToText from '@/components/SpeechToText';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import SaveDialog from '@/components/SaveDialog';
import { AuthBridge } from '@/utils/authBridge';
import { saveStory } from '@/utils/userStorage';

const ProfessionStoryEditor = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [isScrolling, setIsScrolling] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [userGender, setUserGender] = useState<'male' | 'female'>('male');
  const [professions, setProfessions] = useState<string[]>([]);
  const [centeredProfession, setCenteredProfession] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { speak, isPlaying } = useTTS();
  const { toast } = useToast();

  // Load user gender and professions on mount
  useEffect(() => {
    const loadUserData = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (authStatus.authenticated) {
        const bridgedSession = AuthBridge.getCurrentBridgedSession();
        const gender = bridgedSession?.user?.user_metadata?.gender || 'male';
        setUserGender(gender);
        
        const professionsList = getSavedProfessions(gender);
        setProfessions(professionsList);
      }
    };
    
    loadUserData();
  }, []);

  // Auto-scroll functionality with much higher speed
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isScrolling && scrollAreaRef.current && !selectedProfession) {
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
            element.scrollTop += 10; // Much faster scrolling - 300px/sec approx
          }
          
          // Calculate centered profession
          const containerCenter = scrollTop + clientHeight / 2;
          const professionElements = element.querySelectorAll('.profession-item');
          let closestProfession = '';
          let closestDistance = Infinity;
          
          professionElements.forEach((profEl) => {
            const rect = profEl.getBoundingClientRect();
            const containerRect = element.getBoundingClientRect();
            const professionCenter = rect.top - containerRect.top + rect.height / 2 + scrollTop;
            const distance = Math.abs(professionCenter - containerCenter);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestProfession = profEl.textContent || '';
            }
          });
          
          setCenteredProfession(closestProfession);
        }
      }, 16); // ~60fps for very smooth scrolling
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isScrolling, selectedProfession]);

  // Handle space key press to select centered profession
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !selectedProfession) {
        e.preventDefault();
        if (isScrolling && centeredProfession) {
          // Select the centered profession
          setSelectedProfession(centeredProfession);
          setStoryText(`Se io fossi ${centeredProfession.toLowerCase()}, `);
          setIsScrolling(false);
          toast({
            title: "Professione selezionata!",
            description: `${centeredProfession} selezionata`
          });
        } else {
          setIsScrolling(!isScrolling);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isScrolling, selectedProfession, centeredProfession, toast]);

  const filteredProfessions = professions.filter(profession =>
    profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = () => {
    const found = professions.find(profession =>
      profession.toLowerCase() === searchTerm.toLowerCase()
    );
    
    if (found) {
      setSelectedProfession(found);
      setStoryText(`Se io fossi ${found.toLowerCase()}, `);
      toast({
        title: "Professione trovata!",
        description: `${found} selezionata`
      });
    } else {
      // Professione non trovata - permettere di aggiungerla
      const professionToAdd = searchTerm.trim();
      if (professionToAdd) {
        addProfession(professionToAdd, userGender);
        const updatedProfessions = getSavedProfessions(userGender);
        setProfessions(updatedProfessions);
        setSelectedProfession(professionToAdd);
        setStoryText(`Se io fossi ${professionToAdd.toLowerCase()}, `);
        toast({
          title: "Nuova professione aggiunta!",
          description: `${professionToAdd} è stata aggiunta alla lista e selezionata`
        });
      } else {
        toast({
          title: "Professione non trovata",
          description: "Controlla l'ortografia o prova con un altro termine",
          variant: "destructive"
        });
      }
    }
  };

  const handleProfessionSelect = (profession: string) => {
    setSelectedProfession(profession);
    setStoryText(`Se io fossi ${profession.toLowerCase()}, `);
    setIsScrolling(false);
  };

  const handleSpeechResult = (text: string) => {
    setStoryText(prev => prev + (prev.endsWith(' ') ? '' : ' ') + text);
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
    const authStatus = await AuthBridge.isAuthenticated();
    
    if (authStatus.authenticated) {
      const bridgedSession = AuthBridge.getCurrentBridgedSession();
      
      const story = {
        id: Date.now().toString(),
        title: title,
        content: storyText,
        status: 'completed' as const,
        lastModified: new Date().toISOString(),
        mode: 'PROFESSION' as const,
        authorId: bridgedSession?.user?.id || '',
        authorName: bridgedSession?.user?.user_metadata?.name || 'Utente Anonimo',
        isPublic: false,
        language: 'italian' as const
      };

      await saveStory(story);
      
      setStoryTitle(title);
      setShowSaveDialog(false);
      toast({
        title: "Storia salvata!",
        description: "La tua storia è stata salvata con successo"
      });
      navigate('/create-story');
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
                    <CardTitle>Lista Professioni ({userGender === 'female' ? 'Femminili' : 'Maschili'})</CardTitle>
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
                    Premi SPAZIO per selezionare la professione centrata
                  </p>
                  {centeredProfession && (
                    <p className="text-sm font-medium text-blue-600">
                      Centrata: {centeredProfession}
                    </p>
                  )}
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
                          className={`profession-item p-3 border border-gray-200 rounded cursor-pointer transition-colors text-lg font-medium ${
                            profession === centeredProfession 
                              ? 'bg-blue-100 border-blue-500 text-blue-700' 
                              : 'hover:bg-gray-50'
                          }`}
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
                    Ecco cosa farei se fossi {selectedProfession.toLowerCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Continua la tua storia..."
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