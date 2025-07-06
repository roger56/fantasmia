import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Volume2, Save, Share, Edit, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';

const AlovafEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName } = location.state || {};
  
  const [showIntro, setShowIntro] = useState(true);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [storyParts, setStoryParts] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const stories = {
    POLLICINO: {
      title: "Pollicino",
      phases: [
        "La povertà della famiglia: In un tempo di miseria, un taglialegna e sua moglie decidono di abbandonare nel bosco i loro sette figli, tra cui il più piccolo e astuto: Pollicino.",
        "Le briciole nel bosco: Pollicino, sospettando l'abbandono, lascia una scia di briciole per ritrovare la strada. Ma gli uccelli le mangiano e i fratellini si perdono.",
        "La casa dell'orco: I bambini trovano rifugio in una casa che scoprono essere di un orco che mangia i bambini. La moglie dell'orco li nasconde, ma l'orco li scopre.",
        "Lo scambio dei berretti: Pollicino inganna l'orco scambiando i berretti dei fratelli con le corone delle figlie dell'orco, che durante la notte uccide per errore le sue figlie.",
        "Gli stivali delle sette leghe: Pollicino ruba all'orco i suoi stivali magici che permettono di fare passi enormi e fugge con i fratelli.",
        "Ricompensa e ritorno: Pollicino usa gli stivali per fare fortuna, diventa messaggero del re e torna a casa ricco, salvando la famiglia dalla miseria."
      ]
    },
    CAPPUCCETTO: {
      title: "Cappuccetto Rosso",
      phases: [
        "La missione – Una bambina soprannominata Cappuccetto Rosso riceve dalla mamma il compito di portare una cesta di cibo alla nonna malata, attraversando il bosco.",
        "L'incontro – Nel bosco incontra un lupo furbo che la distrae con domande e le suggerisce due strade: lei prende quella più lunga, mentre il lupo sceglie la più corta.",
        "L'inganno – Il lupo arriva per primo a casa della nonna, la mangia e si traveste con i suoi vestiti per ingannare Cappuccetto Rosso.",
        "La trappola – Quando la bambina arriva, trova il lupo travestito e nota stranezze (\"Che occhi grandi hai…\"). Alla fine il lupo la divora.",
        "Il salvataggio – Un cacciatore o un boscaiolo (a seconda della versione) entra nella casa, uccide il lupo e salva Cappuccetto Rosso e la nonna, ancora vive nella pancia del lupo.",
        "La lezione – Cappuccetto Rosso promette di non disubbidire più alla mamma e di non parlare con gli sconosciuti."
      ]
    },
    CENERENTOLA: {
      title: "Cenerentola",
      phases: [
        "Una vita difficile: Cenerentola vive con la matrigna e le sorellastre che la trattano come una serva, facendole fare tutti i lavori di casa.",
        "L'invito al ballo: Il re organizza un grande ballo per trovare una sposa al principe, ma Cenerentola non può andarci perché la matrigna le proibisce di partecipare.",
        "L'aiuto della fata madrina: Una fata madrina appare e, con la magia, trasforma una zucca in carrozza e dona a Cenerentola un vestito meraviglioso e scarpette di cristallo. Ma l'incantesimo finirà a mezzanotte.",
        "Il ballo e la fuga: Al ballo, il principe rimane incantato da Cenerentola. Ma allo scoccare della mezzanotte, lei scappa di corsa e perde una scarpetta.",
        "La ricerca del principe: Il principe cerca in tutto il regno la ragazza che può calzare la scarpetta. Le sorellastre provano, ma solo Cenerentola riesce a infilarla.",
        "Il lieto fine: Cenerentola sposa il principe e va a vivere felice con lui, lasciando per sempre la casa della matrigna."
      ]
    },
    BIANCANEVE: {
      title: "Biancaneve",
      phases: [
        "Gelosia della regina: La regina cattiva, invidiosa della bellezza di Biancaneve, ordina al cacciatore di ucciderla. Lui la risparmia e la lascia fuggire nel bosco.",
        "La casa dei nani: Biancaneve trova rifugio nella casa di sette nani e si prende cura della loro casa, vivendo serena.",
        "Tre tentativi della regina: La regina, scoperto che Biancaneve è viva, la inganna più volte con travestimenti: un corpetto stretto, un pettine avvelenato e infine una mela avvelenata.",
        "La mela fatale: Biancaneve morde la mela avvelenata e cade in un sonno profondo, creduta morta dai nani che la pongono in una bara di vetro.",
        "Il bacio del principe: Un principe, vedendola, se ne innamora e la bacia. Grazie a quel bacio, Biancaneve si risveglia.",
        "Il lieto fine: Biancaneve e il principe si sposano. La regina viene punita e la storia si conclude con un matrimonio felice."
      ]
    }
  };

  const handleStorySelect = (storyKey: string) => {
    setSelectedStory(storyKey);
    setShowIntro(false);
  };

  const handleContinue = () => {
    if (!currentText.trim()) {
      toast({
        title: "Testo richiesto",
        description: "Scrivi la tua versione al contrario prima di continuare",
        variant: "destructive"
      });
      return;
    }

    const newParts = [...storyParts, currentText];
    setStoryParts(newParts);
    setCurrentText('');

    if (currentPhase < 5) {
      setCurrentPhase(currentPhase + 1);
    } else {
      setShowFinalScreen(true);
    }
  };

  const handleBack = () => {
    if (currentPhase > 0) {
      const previousText = storyParts[currentPhase - 1];
      setCurrentText(previousText);
      setStoryParts(storyParts.slice(0, currentPhase - 1));
      setCurrentPhase(currentPhase - 1);
    } else {
      setShowIntro(false);
      setSelectedStory(null);
      setCurrentPhase(0);
      setStoryParts([]);
      setCurrentText('');
    }
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

    const fullStory = storyParts.join('\n\n');
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
      mode: 'ALOVAF' as const,
      authorId: profileId || 'anonymous',
      authorName: profileName || 'Utente Anonimo',
      isPublic: false
    };

    saveStory(story);
    
    toast({
      title: "Storia salvata!",
      description: "La tua favola ALOVAF è stata salvata nell'archivio",
    });

    navigate('/archive', { state: { profileId, profileName } });
  };

  const handleTextToSpeech = () => {
    const fullStory = storyParts.join('\n\n');
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

  const handleShare = () => {
    const fullStory = storyParts.join('\n\n');
    if (fullStory.trim()) {
      navigator.clipboard.writeText(`${storyTitle}\n\n${fullStory}`);
      toast({
        title: "Copiato!",
        description: "La storia è stata copiata negli appunti",
      });
    }
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/home')}>
              <Home className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })} className="ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">Modalità ALOVAF - {profileName}</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Favola al Contrario - ALOVAF</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed mb-4">
                Per inventare una favola al contrario si parte da una storia nota, ribaltando ruoli e azioni: i cattivi diventano protettori e gli eroi traditori, mentre ogni gesto (come "cade") diventa il suo opposto ("si solleva"). Si riscrive la trama originale applicando queste inversioni, aggiungendo dettagli ironici o surreali per sottolineare il contrasto e mantenendo uno stile coerente. Infine si definisce un finale capovolto e si sceglie un titolo che ne riveli l'essenza rovesciata.
              </p>
              <Button onClick={() => setShowIntro(false)} className="w-full">
                Avanti
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedStory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/home')}>
              <Home className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={() => setShowIntro(true)} className="ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">Scegli una Favola - {profileName}</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seleziona la favola da riscrivere al contrario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(stories).map(([key, story]) => (
                  <Button
                    key={key}
                    variant="outline"
                    onClick={() => handleStorySelect(key)}
                    className="p-6 h-auto text-left"
                  >
                    <div className="text-lg font-semibold">{story.title}</div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showFinalScreen) {
    const fullStory = storyParts.join('\n\n');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/home')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">La tua Favola ALOVAF - {profileName}</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Input
                  placeholder="Inserisci il titolo della favola al contrario..."
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="text-xl font-bold"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={fullStory}
                onChange={(e) => setStoryParts(e.target.value.split('\n\n'))}
                className="min-h-[400px] text-base leading-relaxed"
                placeholder="La tua storia al contrario apparirà qui..."
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleSaveStory} className="px-6">
              <Save className="w-4 h-4 mr-2" />
              Salva
            </Button>
            <Button onClick={handleShare} variant="outline" className="px-6">
              <Share className="w-4 h-4 mr-2" />
              Condividi
            </Button>
            <Button onClick={handleTextToSpeech} variant="outline" className="px-6">
              <Volume2 className="w-4 h-4 mr-2" />
              {isSpeaking && !isPaused ? 'Pausa' : isPaused ? 'Riprendi' : 'Ascolta'}
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

  const currentStory = stories[selectedStory as keyof typeof stories];
  const currentPhaseText = currentStory.phases[currentPhase];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/home')} className="mr-2">
              <Home className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={handleBack} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Editor ALOVAF - {currentStory.title} - {profileName}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Fase {currentPhase + 1}/6</h2>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPhase + 1) / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Story written so far - show at top */}
        {storyParts.length > 0 && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Storia scritta finora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {storyParts.map((part, index) => (
                    <p key={index} className="mb-3 text-sm">{part}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex gap-6 h-[calc(100vh-300px)]">
          {/* Original Story - Left */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Versione Originale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-base leading-relaxed">{currentPhaseText}</p>
              </div>
            </CardContent>
          </Card>

          {/* Rewrite - Right */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>La tua Versione al Contrario</CardTitle>
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              <Textarea
                placeholder="Riscrivi questa parte della storia al contrario, ribaltando ruoli e azioni..."
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                className="flex-1 text-base leading-relaxed resize-none"
                maxLength={1000}
              />
              
              {/* Control buttons */}
              <div className="flex gap-3 pt-4 mt-auto">
                <Button 
                  onClick={handleContinue} 
                  className="flex-1"
                  disabled={!currentText.trim()}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continua
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AlovafEditor;