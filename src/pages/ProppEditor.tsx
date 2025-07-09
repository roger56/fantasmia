import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Home, Save, Volume2, Globe, Pause, Shuffle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';
import SpeechToText from '@/components/SpeechToText';
import { translateToEnglish, translateToItalian } from '@/utils/translation';

interface ProppCard {
  id: number;
  title: string;
  description: string;
  icon: string;
  cluster: number;
}

interface StoryPhase {
  card: ProppCard | null;
  content: string;
}

const ProppEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName, editStory } = location.state || {};

  // Game state
  const [gamePhase, setGamePhase] = useState<'warning' | 'card-selection' | 'writing' | 'final'>('warning');
  const [currentCluster, setCurrentCluster] = useState(1);
  const [selectedCard, setSelectedCard] = useState<ProppCard | null>(null);
  const [storyPhases, setStoryPhases] = useState<StoryPhase[]>([]);
  const [currentParagraph, setCurrentParagraph] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [finalStory, setFinalStory] = useState('');
  
  // Translation state
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalStory, setOriginalStory] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Propp cards organized by clusters
  const proppClusters = {
    1: [ // Partenza e Vincoli
      { id: 1, title: "Allontanamento", description: "Uno dei membri della famiglia si allontana da casa", icon: "🚶", cluster: 1 },
      { id: 2, title: "Divieto", description: "Viene formulato un divieto", icon: "🚫", cluster: 1 },
      { id: 3, title: "Infrazione", description: "Il divieto viene infranto", icon: "⚠️", cluster: 1 },
      { id: 4, title: "Investigazione", description: "L'antagonista tenta di ottenere informazioni", icon: "🔍", cluster: 1 },
      { id: 5, title: "Delazione", description: "L'antagonista riceve informazioni sulla vittima", icon: "👂", cluster: 1 }
    ],
    2: [ // Incontro con il Nemico e Inganno
      { id: 6, title: "Tranello", description: "L'antagonista tenta di ingannare la vittima", icon: "🪤", cluster: 2 },
      { id: 7, title: "Connivenza", description: "La vittima si lascia ingannare", icon: "🤝", cluster: 2 },
      { id: 8, title: "Danneggiamento", description: "L'antagonista arreca danno a un membro della famiglia", icon: "💥", cluster: 2 }
    ],
    3: [ // Chiamata all'Azione e Preparazione
      { id: 9, title: "Mediazione", description: "Si divulga la notizia della sciagura", icon: "📢", cluster: 3 },
      { id: 10, title: "Consenso dell'eroe", description: "L'eroe accetta di agire", icon: "✊", cluster: 3 },
      { id: 11, title: "Partenza dell'eroe", description: "L'eroe parte da casa", icon: "🌅", cluster: 3 },
      { id: 12, title: "L'eroe messo alla prova", description: "L'eroe viene messo alla prova da un donatore", icon: "⚖️", cluster: 3 },
      { id: 13, title: "Reazione dell'eroe", description: "L'eroe reagisce alle azioni del donatore", icon: "💪", cluster: 3 }
    ],
    4: [ // Aiuti e Complicazioni
      { id: 14, title: "Fornitura del mezzo magico", description: "L'eroe riceve un oggetto magico", icon: "✨", cluster: 4 },
      { id: 15, title: "Trasferimento dell'eroe", description: "L'eroe viene trasportato verso l'obiettivo", icon: "🌪️", cluster: 4 }
    ],
    5: [ // Conflitto e Conquista
      { id: 16, title: "Lotta", description: "L'eroe e l'antagonista si scontrano", icon: "⚔️", cluster: 5 },
      { id: 17, title: "Marchiatura dell'eroe", description: "L'eroe viene marchiato", icon: "🏷️", cluster: 5 },
      { id: 18, title: "Vittoria", description: "L'antagonista viene sconfitto", icon: "🏆", cluster: 5 }
    ],
    6: [ // Risoluzione e Ritorno
      { id: 19, title: "Rimozione", description: "La sciagura o mancanza viene riparata", icon: "🔧", cluster: 6 },
      { id: 20, title: "Ritorno", description: "L'eroe ritorna a casa", icon: "🏠", cluster: 6 }
    ],
    7: [ // Post-Ritorno e Nuove Prove
      { id: 21, title: "Persecuzione", description: "L'eroe viene perseguitato", icon: "🏃", cluster: 7 },
      { id: 22, title: "Salvataggio", description: "L'eroe si salva", icon: "🛡️", cluster: 7 },
      { id: 23, title: "Arrivo in incognito", description: "L'eroe arriva a casa in incognito", icon: "🎭", cluster: 7 }
    ],
    8: [ // Smarrimenti e Riconoscimenti
      { id: 24, title: "Pretese del falso eroe", description: "Un falso eroe avanza pretese infondate", icon: "👑", cluster: 8 },
      { id: 25, title: "Compito difficile", description: "All'eroe è imposto un compito difficile", icon: "🧩", cluster: 8 },
      { id: 26, title: "Esecuzione", description: "Il compito viene eseguito", icon: "✅", cluster: 8 },
      { id: 27, title: "Riconoscimento", description: "L'eroe viene riconosciuto", icon: "👁️", cluster: 8 },
      { id: 28, title: "Smascheramento", description: "Il falso eroe viene smascherato", icon: "😱", cluster: 8 }
    ],
    9: [ // Trasformazione Finale e Ricompense
      { id: 29, title: "Trasfigurazione", description: "L'eroe si trasfigura", icon: "🦋", cluster: 9 },
      { id: 30, title: "Punizione", description: "L'antagonista viene punito", icon: "⚡", cluster: 9 },
      { id: 31, title: "Nozze", description: "L'eroe si sposa e/o sale al trono", icon: "💒", cluster: 9 }
    ]
  };

  const clusterNames = {
    1: "Partenza e Vincoli",
    2: "Incontro con il Nemico e Inganno", 
    3: "Chiamata all'Azione e Preparazione",
    4: "Aiuti e Complicazioni",
    5: "Conflitto e Conquista",
    6: "Risoluzione e Ritorno",
    7: "Post-Ritorno e Nuove Prove",
    8: "Smarrimenti e Riconoscimenti",
    9: "Trasformazione Finale e Ricompense"
  };

  const narrativePhases = {
    1: "Situazione iniziale (Antefatto)",
    2: "Partenza dell'eroe", 
    3: "Peripezie e prove",
    4: "Ritorno a casa",
    5: "Conclusione (Ricompense e ristabilimento dell'equilibrio)"
  };

  const getCurrentNarrativePhase = () => {
    if (currentCluster <= 2) return 1; // Situazione iniziale
    if (currentCluster === 3) return 2; // Partenza dell'eroe
    if (currentCluster >= 4 && currentCluster <= 7) return 3; // Peripezie e prove
    if (currentCluster === 8) return 4; // Ritorno a casa
    return 5; // Conclusione
  };

  const handleCardSelect = (card: ProppCard) => {
    setSelectedCard(card);
    setGamePhase('writing');
  };

  const handleContinueParagraph = () => {
    if (!currentParagraph.trim()) {
      toast({
        title: "Testo richiesto",
        description: "Inserisci un paragrafo per continuare",
        variant: "destructive"
      });
      return;
    }

    // Save current phase
    const newPhase: StoryPhase = {
      card: selectedCard,
      content: currentParagraph
    };
    
    const updatedPhases = [...storyPhases, newPhase];
    setStoryPhases(updatedPhases);
    
    // Update final story
    const story = updatedPhases.map(phase => phase.content).join('\n\n');
    setFinalStory(story);
    
    // Clear current paragraph
    setCurrentParagraph('');
    
    // Move to next cluster or finish
    if (currentCluster < 9) {
      setCurrentCluster(currentCluster + 1);
      setSelectedCard(null);
      setGamePhase('card-selection');
    } else {
      setGamePhase('final');
    }
  };

  const handleBack = () => {
    if (storyPhases.length > 0) {
      const lastPhase = storyPhases[storyPhases.length - 1];
      setCurrentParagraph(lastPhase.content);
      setSelectedCard(lastPhase.card);
      setStoryPhases(storyPhases.slice(0, -1));
      setCurrentCluster(currentCluster - 1);
      setGamePhase('writing');
    }
  };

  const handleExit = () => {
    if (storyPhases.length > 0 || currentParagraph.trim()) {
      if (confirm("Sei sicuro di voler uscire? Tutte le modifiche andranno perse.")) {
        navigate('/create-story', { state: { profileId, profileName } });
      }
    } else {
      navigate('/create-story', { state: { profileId, profileName } });
    }
  };

  const handleSuspend = () => {
    // TODO: Implement story suspension
    toast({
      title: "Funzione non ancora disponibile",
      description: "La sospensione delle storie sarà disponibile presto",
    });
  };

  const handleStartGame = () => {
    setGamePhase('card-selection');
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    
    try {
      if (!isTranslated) {
        // Translate to English
        setOriginalStory(finalStory);
        setOriginalTitle(storyTitle);
        
        const translatedStory = await translateToEnglish(finalStory);
        const translatedTitle = await translateToEnglish(storyTitle);
        
        setFinalStory(translatedStory);
        setStoryTitle(translatedTitle);
        setIsTranslated(true);
        
        toast({
          title: "Traduzione completata",
          description: "La storia è stata tradotta in inglese",
        });
      } else {
        // Return to Italian
        setFinalStory(originalStory);
        setStoryTitle(originalTitle);
        setIsTranslated(false);
        
        toast({
          title: "Traduzione completata",
          description: "La storia è stata riportata in italiano",
        });
      }
    } catch (error) {
      toast({
        title: "Errore traduzione",
        description: "Non è stato possibile tradurre la storia",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Titolo richiesto",
        description: "Inserisci un titolo per salvare la storia",
        variant: "destructive"
      });
      return;
    }

    const story = {
      id: editStory ? editStory.id : Date.now().toString(),
      title: storyTitle,
      content: finalStory,
      status: 'completed' as const,
      lastModified: new Date().toISOString(),
      mode: 'PROPP' as const,
      authorId: profileId || 'anonymous',
      authorName: profileName || 'Utente Anonimo',
      isPublic: false,
      answers: storyPhases.map(phase => phase.content),
      language: (isTranslated ? 'english' : 'italian') as 'italian' | 'english'
    };

    saveStory(story);
    toast({
      title: "Storia salvata!",
      description: `La storia è stata salvata nell'archivio${isTranslated ? ' in inglese' : ''}`,
    });
    setTimeout(() => navigate('/create-story', { state: { profileId, profileName } }), 1500);
  };

  // Warning screen
  if (gamePhase === 'warning') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={handleExit}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Modalità PROPP</h1>
            <div></div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-center text-red-600">⚠️ ATTENZIONE ⚠️</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-lg font-medium text-slate-700">
                Questa modalità richiede tempo e attenzione: la stesura sarà lunga e piena di colpi di scena.
              </p>
              <p className="text-base text-slate-600">
                Alla fine otterrai una vera favola pronta per essere pubblicata!
              </p>
              <div className="flex gap-4 justify-center mt-6">
                <Button onClick={handleExit} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Indietro
                </Button>
                <Button onClick={handleStartGame} className="px-8">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Inizia Favola Propp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Card selection screen
  if (gamePhase === 'card-selection') {
    const currentCards = proppClusters[currentCluster as keyof typeof proppClusters] || [];
    const currentPhase = getCurrentNarrativePhase();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={handleExit}>
              <Home className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-800">Estrai Carta</h1>
              <p className="text-sm text-slate-600">Cluster {currentCluster}/9</p>
            </div>
            <Button variant="outline" onClick={handleSuspend}>
              <Pause className="w-4 h-4 mr-2" />
              Sospendi
            </Button>
          </div>

          <div className="mb-6">
            <Badge variant="outline" className="mb-2">
              Fase {currentPhase}: {narrativePhases[currentPhase as keyof typeof narrativePhases]}
            </Badge>
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800">
                  {clusterNames[currentCluster as keyof typeof clusterNames]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">Scegli una carta da questo cluster per continuare la tua favola:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentCards.map((card) => (
                    <Card 
                      key={card.id} 
                      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300"
                      onClick={() => handleCardSelect(card)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl mb-2">{card.icon}</div>
                        <h3 className="font-semibold text-slate-800 mb-2">{card.title}</h3>
                        <p className="text-sm text-slate-600">{card.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {storyPhases.length > 0 && (
            <div className="flex justify-center">
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla Carta Precedente
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Writing screen
  if (gamePhase === 'writing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={handleExit}>
              <Home className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-800">Scrivi il Paragrafo</h1>
              <p className="text-sm text-slate-600">Cluster {currentCluster}/9</p>
            </div>
            <Button variant="outline" onClick={handleSuspend}>
              <Pause className="w-4 h-4 mr-2" />
              Sospendi
            </Button>
          </div>

          {/* Current card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="text-3xl">{selectedCard?.icon}</div>
                <div>
                  <CardTitle className="text-blue-800">{selectedCard?.title}</CardTitle>
                  <p className="text-slate-600">{selectedCard?.description}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Story so far */}
          {storyPhases.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">La tua storia fino a ora:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {storyPhases.map((phase, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{phase.card?.icon}</span>
                        <span className="font-medium text-slate-700">{phase.card?.title}</span>
                      </div>
                      <p className="text-slate-800 text-sm">{phase.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Writing area */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Scrivi il nuovo paragrafo</CardTitle>
              <p className="text-slate-600">Massimo 10 righe suggerite</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  value={currentParagraph}
                  onChange={(e) => setCurrentParagraph(e.target.value)}
                  placeholder="Scrivi qui il paragrafo per questa carta..."
                  className="text-base resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '8rem' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                  }}
                />
                <SpeechToText
                  onResult={(text) => setCurrentParagraph(prev => prev + (prev ? ' ' : '') + text)}
                  className="shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3 justify-center">
            <Button onClick={handleExit} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            {storyPhases.length > 0 && (
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Indietro
              </Button>
            )}
            <Button 
              onClick={handleContinueParagraph} 
              disabled={!currentParagraph.trim()}
              className="px-8"
            >
              {currentCluster === 9 ? (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Fine Storia
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continua
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Final screen
  if (gamePhase === 'final') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">La Tua Favola Propp</h1>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>🎉 La tua favola è pronta!</CardTitle>
              <p className="text-slate-600">Inserisci un titolo e salva la tua creazione</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titolo della Favola *
                </label>
                <Textarea
                  placeholder="Inserisci il titolo della tua favola..."
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="text-lg resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  La tua favola completa
                </label>
                <Textarea
                  value={finalStory}
                  onChange={(e) => setFinalStory(e.target.value)}
                  className="text-base leading-relaxed resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '12rem' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, window.innerHeight * 0.6) + 'px';
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={handleSave} className="px-6" disabled={!storyTitle.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  Salva
                </Button>
                <Button 
                  onClick={handleTranslate} 
                  variant="outline" 
                  className="px-6" 
                  disabled={isTranslating || !finalStory.trim()}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {isTranslating ? 'Traduzione...' : (isTranslated ? 'ITALIANO' : 'INGLESE')}
                </Button>
                <Button 
                  onClick={() => navigator.clipboard.writeText(finalStory)}
                  variant="outline" 
                  className="px-6"
                  disabled={!finalStory.trim()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Copia
                </Button>
                <Button 
                  onClick={() => navigate('/create-story', { state: { profileId, profileName } })} 
                  variant="outline" 
                  className="px-6"
                >
                  Nuova Favola
                </Button>
                <Button 
                  onClick={() => navigate('/archive', { state: { profileId, profileName } })} 
                  variant="outline" 
                  className="px-6"
                >
                  Archivio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default ProppEditor;
