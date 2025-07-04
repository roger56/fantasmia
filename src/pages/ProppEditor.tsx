import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Pause, Save, CheckCircle, Volume2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';

const ProppEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName } = location.state || {};
  const [storyTitle, setStoryTitle] = useState('');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [storyParagraphs, setStoryParagraphs] = useState<string[]>([]);
  const [currentParagraph, setCurrentParagraph] = useState('');
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Definizione dei cluster e delle carte secondo le specifiche
  const clusters = [
    {
      id: 1,
      title: "Partenza e Vincoli",
      cards: [
        { id: 1, title: "Allontanamento", icon: "🚶", description: "Uno dei membri della famiglia si allontana da casa." },
        { id: 2, title: "Divieto", icon: "🚫", description: "All'eroe viene imposto un divieto." },
        { id: 3, title: "Infrazione", icon: "⚠️", description: "Il divieto viene infranto." },
        { id: 4, title: "Investigazione", icon: "🔍", description: "L'antagonista tenta di ottenere informazioni." },
        { id: 5, title: "Delazione", icon: "🗣️", description: "L'antagonista riceve informazioni sulla vittima." }
      ]
    },
    {
      id: 3,
      title: "Chiamata all'Azione",
      cards: [
        { id: 9, title: "Mediazione", icon: "📢", description: "La sciagura viene resa nota, l'eroe è chiamato." },
        { id: 10, title: "Consenso", icon: "✅", description: "L'eroe decide di agire." },
        { id: 11, title: "Partenza", icon: "🛤️", description: "L'eroe parte da casa." },
        { id: 12, title: "Prova", icon: "🎯", description: "L'eroe viene messo alla prova dal donatore." },
        { id: 13, title: "Reazione", icon: "💪", description: "L'eroe reagisce alle azioni del futuro donatore." }
      ]
    },
    {
      id: 4,
      title: "Aiuti",
      cards: [
        { id: 14, title: "Mezzo magico", icon: "✨", description: "L'eroe riceve un mezzo magico." },
        { id: 15, title: "Trasferimento", icon: "🌟", description: "L'eroe viene trasferito vicino all'oggetto della ricerca." }
      ]
    },
    {
      id: 5,
      title: "Conflitto",
      cards: [
        { id: 16, title: "Lotta", icon: "⚔️", description: "L'eroe e l'antagonista si affrontano in battaglia." },
        { id: 17, title: "Marchio", icon: "🏷️", description: "L'eroe riceve un marchio." },
        { id: 18, title: "Vittoria", icon: "🏆", description: "L'antagonista viene sconfitto." }
      ]
    },
    {
      id: 6,
      title: "Ritorno e Risoluzione",
      cards: [
        { id: 19, title: "Rimozione", icon: "🔧", description: "La sciagura iniziale viene riparata." },
        { id: 20, title: "Ritorno", icon: "🏃", description: "L'eroe ritorna a casa." }
      ]
    },
    {
      id: 9,
      title: "Trasformazione finale",
      cards: [
        { id: 29, title: "Trasfigurazione", icon: "🦋", description: "L'eroe riceve un nuovo aspetto." },
        { id: 30, title: "Punizione", icon: "⚖️", description: "Il falso eroe o l'antagonista viene punito." },
        { id: 31, title: "Nozze", icon: "💒", description: "L'eroe si sposa e sale al trono." }
      ]
    }
  ];

  const phases = [
    { title: "Situazione iniziale", cluster: 1, description: "Imposta l'antefatto della tua fiaba" },
    { title: "Partenza dell'eroe", cluster: 3, description: "L'eroe inizia la sua avventura" },
    { title: "Peripezie e Prove", cluster: 4, description: "L'eroe affronta sfide e riceve aiuti" },
    { title: "Conflitto", cluster: 5, description: "L'eroe affronta l'antagonista" },
    { title: "Ritorno", cluster: 6, description: "L'eroe torna a casa" },
    { title: "Conclusione", cluster: 9, description: "La storia si conclude" }
  ];

  const getCurrentCluster = () => {
    const phase = phases[currentPhase];
    return clusters.find(c => c.id === phase.cluster);
  };

  const handleCardSelect = (cardId: number) => {
    setSelectedCard(cardId);
  };

  const handleContinue = () => {
    if (!currentParagraph.trim()) {
      toast({
        title: "Testo richiesto",
        description: "Scrivi qualcosa prima di continuare",
        variant: "destructive"
      });
      return;
    }

    const newParagraphs = [...storyParagraphs, currentParagraph];
    setStoryParagraphs(newParagraphs);
    setCurrentParagraph('');
    setSelectedCard(null);

    if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
    } else {
      setShowFinalScreen(true);
    }
  };

  const handleSkipCluster = () => {
    if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
      setSelectedCard(null);
    } else {
      setShowFinalScreen(true);
    }
  };

  const handleSuspend = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Titolo richiesto",
        description: "Inserisci un titolo per sospendere la storia",
        variant: "destructive"
      });
      return;
    }

    const story = {
      id: Date.now().toString(),
      title: storyTitle + " (Sospesa)",
      content: [...storyParagraphs, currentParagraph].join('\n\n'),
      status: 'suspended' as const,
      lastModified: new Date().toISOString(),
      mode: 'PROPP' as const,
      authorId: profileId || 'anonymous',
      authorName: profileName || 'Utente Anonimo',
      isPublic: false
    };

    saveStory(story);
    
    toast({
      title: "Storia sospesa!",
      description: "Puoi riprenderla dall'archivio",
    });

    navigate('/archive', { state: { profileId, profileName } });
  };

  const handleSaveStory = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Titolo richiesto",
        description: "Inserisci un titolo per la storia",
        variant: "destructive"
      });
      return;
    }

    const fullStory = storyParagraphs.join('\n\n');
    if (!fullStory.trim()) {
      toast({
        title: "Contenuto richiesto",
        description: "Scrivi il contenuto della storia",
        variant: "destructive"
      });
      return;
    }

    const story = {
      id: Date.now().toString(),
      title: storyTitle,
      content: fullStory,
      status: 'completed' as const,
      lastModified: new Date().toISOString(),
      mode: 'PROPP' as const,
      authorId: profileId || 'anonymous',
      authorName: profileName || 'Utente Anonimo',
      isPublic: false
    };

    saveStory(story);
    
    toast({
      title: "Storia salvata!",
      description: "La tua favola è stata salvata nell'archivio",
    });

    navigate('/archive', { state: { profileId, profileName } });
  };

  const handleTextToSpeech = () => {
    const fullStory = storyParagraphs.join('\n\n');
    if (!fullStory.trim()) {
      toast({
        title: "Nessun contenuto",
        description: "Non c'è testo da leggere",
        variant: "destructive"
      });
      return;
    }

    if ('speechSynthesis' in window) {
      if (isPaused && currentUtterance) {
        speechSynthesis.resume();
        setIsSpeaking(true);
        setIsPaused(false);
      } else if (isSpeaking) {
        speechSynthesis.pause();
        setIsSpeaking(false);
        setIsPaused(true);
      } else {
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(fullStory);
        utterance.lang = 'it-IT';
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentUtterance(null);
        };
        
        setCurrentUtterance(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
        
        speechSynthesis.speak(utterance);
      }
    } else {
      toast({
        title: "Non supportato",
        description: "La sintesi vocale non è supportata da questo browser",
        variant: "destructive"
      });
    }
  };

  if (showFinalScreen) {
    const fullStory = storyParagraphs.join('\n\n');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/home')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">La tua Favola PROPP - {profileName}</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Input
                  placeholder="Inserisci il titolo della favola..."
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="text-xl font-bold"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={fullStory}
                onChange={(e) => setStoryParagraphs(e.target.value.split('\n\n'))}
                className="min-h-[400px] text-base leading-relaxed"
                placeholder="La tua storia apparirà qui..."
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleTextToSpeech} variant="outline" className="px-6">
              <Volume2 className="w-4 h-4 mr-2" />
              {isSpeaking && !isPaused ? 'Pausa' : isPaused ? 'Riprendi' : 'Ascolta'}
            </Button>
            <Button onClick={handleSaveStory} className="px-6">
              <Save className="w-4 h-4 mr-2" />
              Salva Storia
            </Button>
            <Button onClick={() => navigate('/create-story', { state: { profileId, profileName } })} variant="outline" className="px-6">
              Nuova Favola
            </Button>
            <Button onClick={() => navigate('/archive', { state: { profileId, profileName } })} variant="outline" className="px-6">
              Indietro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentCluster = getCurrentCluster();
  const currentPhaseInfo = phases[currentPhase];
  const selectedCardData = selectedCard ? currentCluster?.cards.find(c => c.id === selectedCard) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/home')} className="mr-2">
              <Home className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Editor PROPP - {profileName}</h1>
          </div>
        </div>
      </div>

      {/* Avviso iniziale */}
      {currentPhase === 0 && (
        <div className="max-w-7xl mx-auto p-4">
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-blue-800 text-sm">
                <strong>Avviso:</strong> La Modalità PROPP guida l'utente nella creazione di una fiaba attraverso una sequenza di carte ispirate alle 31 funzioni di Propp, suddivise in 9 cluster narrativi. Richiede attenzione e pazienza: ogni carta rappresenta una tappa narrativa, e il bambino scriverà la storia passo dopo passo.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        {/* Progress and Phase Info */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Fase {currentPhase + 1}/6: {currentPhaseInfo.title}</h2>
            <div className="text-sm text-slate-600">
              Cluster: {currentCluster?.title}
            </div>
          </div>
          <p className="text-slate-600">{currentPhaseInfo.description}</p>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPhase + 1) / phases.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Title Input */}
        <div className="mb-6">
          <Input
            placeholder="Inserisci il titolo della tua favola..."
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Story Progress */}
        {storyParagraphs.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>La tua storia finora:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                {storyParagraphs.map((paragraph, index) => (
                  <p key={index} className="mb-3">{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dual Pane Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Pane - Cards */}
          <Card>
            <CardHeader>
              <CardTitle>{currentCluster?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currentCluster?.cards.map((card) => (
                  <div
                    key={card.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 text-center ${
                      selectedCard === card.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    onClick={() => handleCardSelect(card.id)}
                    title={card.description}
                  >
                    <div className="text-3xl mb-2">{card.icon}</div>
                    <div className="text-sm font-medium">{card.title}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleSkipCluster}
                  className="w-full"
                >
                  Salta questo cluster
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Pane - Card Description and Editor */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCardData ? selectedCardData.title : 'Seleziona una carta'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCardData && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{selectedCardData.icon}</span>
                    <h4 className="font-semibold">{selectedCardData.title}</h4>
                  </div>
                  <p className="text-sm text-slate-700">{selectedCardData.description}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Scrivi il tuo paragrafo
                </label>
                <Textarea
                  placeholder={selectedCardData ? 
                    `Scrivi come si sviluppa la storia con: ${selectedCardData.title}...` : 
                    "Seleziona prima una carta per ricevere suggerimenti..."
                  }
                  value={currentParagraph}
                  onChange={(e) => setCurrentParagraph(e.target.value)}
                  className="min-h-[200px] text-base leading-relaxed"
                  disabled={!selectedCardData}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleContinue} 
                  className="flex-1"
                  disabled={!selectedCardData || !currentParagraph.trim()}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continua
                </Button>
                <Button onClick={handleSuspend} variant="outline">
                  <Pause className="w-4 h-4 mr-2" />
                  Sospendi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProppEditor;