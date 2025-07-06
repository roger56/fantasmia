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
      id: 2,
      title: "Incontro con il Nemico",
      cards: [
        { id: 6, title: "Tranello", icon: "🕳️", description: "L'antagonista tenta di ingannare la vittima." },
        { id: 7, title: "Connivenza", icon: "🤝", description: "La vittima si lascia ingannare." },
        { id: 8, title: "Danneggiamento", icon: "💥", description: "L'antagonista arreca danno a uno dei membri della famiglia." }
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
      id: 7,
      title: "Post-Ritorno",
      cards: [
        { id: 21, title: "Persecuzione", icon: "🏃‍♂️", description: "L'eroe viene perseguitato." },
        { id: 22, title: "Salvezza", icon: "🛡️", description: "L'eroe si salva dalla persecuzione." },
        { id: 23, title: "Rientro in incognito", icon: "🎭", description: "L'eroe rientra in incognito a casa." }
      ]
    },
    {
      id: 8,
      title: "Riconoscimenti",
      cards: [
        { id: 24, title: "Pretese", icon: "👑", description: "Un falso eroe avanza pretese infondate." },
        { id: 25, title: "Compito difficile", icon: "🏔️", description: "All'eroe viene proposto un compito difficile." },
        { id: 26, title: "Esecuzione", icon: "🎪", description: "Il compito viene eseguito." },
        { id: 27, title: "Riconoscimento", icon: "👁️", description: "L'eroe viene riconosciuto." },
        { id: 28, title: "Smascheramento", icon: "🎪", description: "Il falso eroe o l'antagonista viene smascherato." }
      ]
    },
    {
      id: 9,
      title: "Ricompense",
      cards: [
        { id: 29, title: "Trasfigurazione", icon: "🦋", description: "L'eroe riceve un nuovo aspetto." },
        { id: 30, title: "Punizione", icon: "⚖️", description: "Il falso eroe o l'antagonista viene punito." },
        { id: 31, title: "Nozze", icon: "💒", description: "L'eroe si sposa e sale al trono." }
      ]
    }
  ];

  const phases = [
    { 
      title: "Situazione iniziale", 
      clusters: [1, 2], 
      description: "Imposta l'antefatto della tua fiaba - Equilibrio iniziale e presentazione del protagonista" 
    },
    { 
      title: "Partenza dell'eroe", 
      clusters: [3], 
      description: "L'evento scatenante che avvia l'avventura" 
    },
    { 
      title: "Peripezie e Prove", 
      clusters: [4, 5, 7], 
      description: "L'eroe affronta ostacoli, riceve aiuti e si confronta con antagonisti" 
    },
    { 
      title: "Ritorno", 
      clusters: [6, 8], 
      description: "L'eroe torna nel luogo iniziale con nuove consapevolezze" 
    },
    { 
      title: "Conclusione", 
      clusters: [9], 
      description: "L'equilibrio viene ristabilito e l'eroe ottiene la ricompensa" 
    }
  ];

  const [currentClusterIndex, setCurrentClusterIndex] = useState(0);

  const getCurrentClusters = () => {
    const phase = phases[currentPhase];
    return phase.clusters.map(clusterId => clusters.find(c => c.id === clusterId)).filter(Boolean);
  };

  const getCurrentCluster = () => {
    const availableClusters = getCurrentClusters();
    return availableClusters[currentClusterIndex] || availableClusters[0];
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

    const availableClusters = getCurrentClusters();
    if (currentClusterIndex < availableClusters.length - 1) {
      setCurrentClusterIndex(currentClusterIndex + 1);
    } else if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
      setCurrentClusterIndex(0);
    } else {
      setShowFinalScreen(true);
    }
  };

  const handleSkipCluster = () => {
    const availableClusters = getCurrentClusters();
    if (currentClusterIndex < availableClusters.length - 1) {
      setCurrentClusterIndex(currentClusterIndex + 1);
      setSelectedCard(null);
    } else if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
      setCurrentClusterIndex(0);
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
            <Button onClick={() => navigate('/create-story', { state: { profileId, profileName } })} variant="outline" className="px-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
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

      {/* Updated initial warning */}
      {currentPhase === 0 && (
        <div className="max-w-7xl mx-auto p-4">
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-blue-800 text-sm">
                <strong>Avviso:</strong> La Modalità PROPP guida l'utente nella creazione di una fiaba attraverso una sequenza di carte ispirate alle funzioni di Propp, suddivise in gruppi narrativi. RICHIEDE ATTENZIONE E PAZIENZA: ogni carta rappresenta una tappa narrativa, e il bambino scriverà la storia passo dopo passo.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        {/* Progress and Phase Info */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Fase {currentPhase + 1}/5: {phases[currentPhase].title}</h2>
            <div className="text-sm text-slate-600">
              Cluster: {currentCluster?.title} ({currentClusterIndex + 1}/{getCurrentClusters().length})
            </div>
          </div>
          <p className="text-slate-600">{phases[currentPhase].description}</p>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
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

        {/* Horizontal Layout - Cards and Writing Side by Side */}
        <div className="flex gap-6 h-[calc(100vh-300px)]">
          {/* Cards Box - Left */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentCluster?.title}</span>
                <span className="text-sm text-slate-600">
                  Cluster {currentCluster?.id}/9
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {currentCluster?.cards.map((card) => (
                  <div
                    key={card.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 text-center hover-scale ${
                      selectedCard === card.id 
                        ? 'border-primary bg-primary/10' 
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
              
              {selectedCardData && (
                <div className="bg-slate-50 p-4 rounded-lg mb-4 animate-fade-in">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{selectedCardData.icon}</span>
                    <h4 className="font-semibold">{selectedCardData.title}</h4>
                  </div>
                  <p className="text-sm text-slate-700">{selectedCardData.description}</p>
                </div>
              )}
              
              <div className="border-t pt-4">
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

          {/* Writing/Text Box - Right */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>
                La tua Storia - Fase {currentPhase + 1}/5
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              {/* Story written so far - show only in larger preview at top */}
              {storyParagraphs.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg mb-4 max-h-60 overflow-y-auto">
                  <h4 className="font-semibold mb-2">Storia finora:</h4>
                  {storyParagraphs.map((paragraph, index) => (
                    <p key={index} className="mb-3 text-sm">{paragraph}</p>
                  ))}
                </div>
              )}
              
              {/* Editor for new paragraph */}
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {selectedCardData ? 
                    `Scrivi il paragrafo per: ${selectedCardData.title}` : 
                    "Seleziona prima una carta per iniziare a scrivere..."
                  }
                </label>
                <Textarea
                  placeholder={selectedCardData ? 
                    `Scrivi come si sviluppa la storia con: ${selectedCardData.title}...` : 
                    "Seleziona prima una carta per ricevere suggerimenti..."
                  }
                  value={currentParagraph}
                  onChange={(e) => setCurrentParagraph(e.target.value)}
                  className="flex-1 text-base leading-relaxed resize-none"
                  disabled={!selectedCardData}
                />
              </div>

              {/* Control buttons */}
              <div className="flex gap-3 pt-4 mt-auto">
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
