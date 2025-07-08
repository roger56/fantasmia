
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Home, Save, Volume2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';
import SpeechToText from '@/components/SpeechToText';

const AlovafEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName, editStory } = location.state || {};

  const [showIntro, setShowIntro] = useState(!editStory);
  const [showFairyTaleSelection, setShowFairyTaleSelection] = useState(false);
  const [selectedFairyTale, setSelectedFairyTale] = useState('');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentPhaseText, setCurrentPhaseText] = useState('');
  const [allAnswers, setAllAnswers] = useState<string[]>(['', '', '', '', '', '']);
  const [storyTitle, setStoryTitle] = useState(editStory ? editStory.title || '' : '');
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const fairyTales = {
    'POLLICINO': [
      'La povertà della famiglia: In un tempo di miseria, un taglialegna e sua moglie decidono di abbandonare nel bosco i loro sette figli, tra cui il più piccolo e astuto: Pollicino.',
      'Le briciole nel bosco: Pollicino, sospettando l\'abbandono, lascia una scia di briciole per ritrovare la strada. Ma gli uccelli le mangiano e i fratellini si perdono.',
      'La casa dell\'orco: I bambini trovano rifugio in una casa che scoprono essere di un orco che mangia i bambini. La moglie dell\'orco li nasconde, ma l\'orco li scopre.',
      'Lo scambio dei berretti: Pollicino inganna l\'orco scambiando i berretti dei fratelli con le corone delle figlie dell\'orco, che durante la notte uccide per errore le sue figlie.',
      'Gli stivali delle sette leghe: Pollicino ruba all\'orco i suoi stivali magici che permettono di fare passi enormi e fugge con i fratelli.',
      'Ricompensa e ritorno: Pollicino usa gli stivali per fare fortuna, diventa messaggero del re e torna a casa ricco, salvando la famiglia dalla miseria.'
    ],
    'CAPPUCCETTO ROSSO': [
      'La missione – Una bambina soprannominata Cappuccetto Rosso riceve dalla mamma il compito di portare una cesta di cibo alla nonna malata, attraversando il bosco.',
      'L\'incontro – Nel bosco incontra un lupo furbo che la distrae con domande e le suggerisce due strade: lei prende quella più lunga, mentre il lupo sceglie la più corta.',
      'L\'inganno – Il lupo arriva per primo a casa della nonna, la mangia e si traveste con i suoi vestiti per ingannare Cappuccetto Rosso.',
      'La trappola – Quando la bambina arriva, trova il lupo travestito e nota stranezze ("Che occhi grandi hai…"). Alla fine il lupo la divora.',
      'Il salvataggio – Un cacciatore o un boscaiolo (a seconda della versione) entra nella casa, uccide il lupo e salva Cappuccetto Rosso e la nonna, ancora vive nella pancia del lupo.',
      'La lezione – Cappuccetto Rosso promette di non disubbidire più alla mamma e di non parlare con gli sconosciuti.'
    ],
    'CENERENTOLA': [
      'Una vita difficile: Cenerentola vive con la matrigna e le sorellastre che la trattano come una serva, facendole fare tutti i lavori di casa.',
      'L\'invito al ballo: Il re organizza un grande ballo per trovare una sposa al principe, ma Cenerentola non può andarci perché la matrigna le proibisce di partecipare.',
      'L\'aiuto della fata madrina: Una fata madrina appare e, con la magia, trasforma una zucca in carrozza e dona a Cenerentola un vestito meraviglioso e scarpette di cristallo. Ma l\'incantesimo finirà a mezzanotte.',
      'Il ballo e la fuga: Al ballo, il principe rimane incantato da Cenerentola. Ma allo scoccare della mezzanotte, lei scappa di corsa e perde una scarpetta.',
      'La ricerca del principe: Il principe cerca in tutto il regno la ragazza che può calzare la scarpetta. Le sorellastre provano, ma solo Cenerentola riesce a infilarla.',
      'Il lieto fine: Cenerentola sposa il principe e va a vivere felice con lui, lasciando per sempre la casa della matrigna.'
    ],
    'BIANCANEVE': [
      'Gelosia della regina: La regina cattiva, invidiosa della bellezza di Biancaneve, ordina al cacciatore di ucciderla. Lui la risparmia e la lascia fuggire nel bosco.',
      'La casa dei nani: Biancaneve trova rifugio nella casa di sette nani e si prende cura della loro casa, vivendo serena.',
      'Tre tentativi della regina: La regina, scoperto che Biancaneve è viva, la inganna più volte con travestimenti: un corpetto stretto, un pettine avvelenato e infine una mela avvelenata.',
      'La mela fatale: Biancaneve morde la mela avvelenata e cade in un sonno profondo, creduta morta dai nani che la pongono in una bara di vetro.',
      'Il bacio del principe: Un principe, vedendola, se ne innamora e la bacia. Grazie a quel bacio, Biancaneve si risveglia.',
      'Il lieto fine: Biancaneve e il principe si sposano. La regina viene punita e la storia si conclude con un matrimonio felice.'
    ]
  };

  useEffect(() => {
    if (editStory) {
      setSelectedFairyTale(editStory.fairyTale || '');
      setAllAnswers(editStory.answers || ['', '', '', '', '', '']);
      setStoryTitle(editStory.title || '');
    }
  }, [editStory]);

  const handleIntroNext = () => {
    setShowIntro(false);
    setShowFairyTaleSelection(true);
  };

  const handleFairyTaleSelect = (tale: string) => {
    setSelectedFairyTale(tale);
    setShowFairyTaleSelection(false);
  };

  const handlePhaseTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentPhaseText(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoryTitle(e.target.value);
  };

  const handleNextPhase = () => {
    if (!currentPhaseText.trim()) {
      toast({
        title: "Testo richiesto",
        description: "Inserisci del testo prima di continuare",
        variant: "destructive"
      });
      return;
    }

    const newAnswers = [...allAnswers];
    newAnswers[currentPhase] = currentPhaseText;
    setAllAnswers(newAnswers);

    if (currentPhase < 5) {
      setCurrentPhase(currentPhase + 1);
      setCurrentPhaseText(newAnswers[currentPhase + 1] || '');
    } else {
      setShowFinalScreen(true);
    }
  };

  const handlePrevPhase = () => {
    if (currentPhase > 0) {
      const newAnswers = [...allAnswers];
      newAnswers[currentPhase] = currentPhaseText;
      setAllAnswers(newAnswers);
      setCurrentPhase(currentPhase - 1);
      setCurrentPhaseText(newAnswers[currentPhase - 1] || '');
    }
  };

  const handleExit = () => {
    if (allAnswers.some(answer => answer.trim()) || currentPhaseText.trim()) {
      if (confirm("Sei sicuro di voler uscire? Tutte le modifiche andranno perse.")) {
        navigate('/create-story', { state: { profileId, profileName } });
      }
    } else {
      navigate('/create-story', { state: { profileId, profileName } });
    }
  };

  const handleFinalize = () => {
    setShowEditScreen(true);
  };

  const getCompleteStory = () => {
    return allAnswers.filter(answer => answer.trim()).join('\n\n');
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
      content: getCompleteStory(),
      status: 'completed' as const,
      lastModified: new Date().toISOString(),
      mode: 'ALOVAF' as const,
      authorId: profileId || 'anonymous',
      authorName: profileName || 'Utente Anonimo',
      isPublic: false,
      fairyTale: selectedFairyTale,
      answers: allAnswers
    };

    saveStory(story);
    toast({
      title: "Storia salvata!",
      description: "La storia è stata salvata nell'archivio",
    });
    setTimeout(() => navigate('/create-story', { state: { profileId, profileName } }), 1500);
  };

  const handleTextToSpeech = () => {
    const textToSpeak = showEditScreen ? getCompleteStory() : getCompleteStory();
    
    if ('speechSynthesis' in window) {
      if (isSpeaking && !isPaused) {
        speechSynthesis.pause();
        setIsPaused(true);
      } else if (isPaused) {
        speechSynthesis.resume();
        setIsPaused(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'it-IT';
        
        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        
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

  // Intro screen
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={handleExit}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Modalità ALOVAF - {profileName}</h1>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-800">Favola ALOVAF - Al Contrario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-base leading-relaxed">
                Per inventare una favola al contrario si parte da una storia nota, ribaltando ruoli e azioni: 
                i cattivi diventano protettori e gli eroi traditori, mentre ogni gesto (come "cade") diventa 
                il suo opposto ("si solleva"). Si riscrive la trama originale applicando queste inversioni, 
                aggiungendo dettagli ironici o surreali per sottolineare il contrasto e mantenendo uno stile 
                coerente. Infine si definisce un finale capovolto e si sceglie un titolo che ne riveli 
                l'essenza rovesciata.
              </p>
              
              <div className="flex justify-center">
                <Button onClick={handleIntroNext} className="px-8">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Avanti
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fairy tale selection screen
  if (showFairyTaleSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={handleExit}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Scegli la Favola da Ribaltare - {profileName}</h1>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seleziona una favola classica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(fairyTales).map((tale) => (
                <Button
                  key={tale}
                  variant="outline"
                  className="w-full h-16 text-lg"
                  onClick={() => handleFairyTaleSelect(tale)}
                >
                  {tale}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Edit screen
  if (showEditScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Modifica Storia - ALOVAF</h1>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Modifica la tua storia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titolo della Storia *
                </label>
                <Input
                  type="text"
                  placeholder="Inserisci il titolo della tua favola..."
                  value={storyTitle}
                  onChange={handleTitleChange}
                  className="text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  La tua storia
                </label>
                <Textarea
                  value={getCompleteStory()}
                  onChange={(e) => {
                    const newAnswers = e.target.value.split('\n\n');
                    setAllAnswers([...newAnswers, ...Array(6 - newAnswers.length).fill('')].slice(0, 6));
                  }}
                  className="text-base leading-relaxed resize-none overflow-hidden"
                  placeholder="La tua storia apparirà qui..."
                  style={{ height: 'auto', minHeight: '12rem' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, window.innerHeight * 0.6) + 'px';
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={handleSave} className="px-6">
                  <Save className="w-4 h-4 mr-2" />
                  Salva
                </Button>
                <Button onClick={handleTextToSpeech} variant="outline" className="px-6">
                  <Volume2 className="w-4 h-4 mr-2" />
                  {isSpeaking && !isPaused ? 'Pausa' : isPaused ? 'Riprendi' : 'Ascolta'}
                </Button>
                <Button onClick={() => navigate('/create-story', { state: { profileId, profileName } })} variant="outline" className="px-6">
                  Nuova Favola
                </Button>
                <Button onClick={() => setShowEditScreen(false)} variant="outline" className="px-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Indietro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Final screen
  if (showFinalScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Storia Completata - ALOVAF - {profileName}</h1>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>La tua favola è pronta!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titolo della Storia *
                </label>
                <Input
                  type="text"
                  placeholder="Inserisci il titolo della tua favola..."
                  value={storyTitle}
                  onChange={handleTitleChange}
                  className="text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  La tua storia
                </label>
                <Textarea
                  value={getCompleteStory()}
                  className="text-base leading-relaxed resize-none overflow-hidden"
                  placeholder="La tua storia apparirà qui..."
                  style={{ height: 'auto', minHeight: '12rem' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, window.innerHeight * 0.6) + 'px';
                  }}
                  readOnly
                />
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={handleSave} className="px-6">
                  <Save className="w-4 h-4 mr-2" />
                  Salva
                </Button>
                <Button onClick={handleTextToSpeech} variant="outline" className="px-6">
                  <Volume2 className="w-4 h-4 mr-2" />
                  {isSpeaking && !isPaused ? 'Pausa' : isPaused ? 'Riprendi' : 'Ascolta'}
                </Button>
                <Button onClick={handleFinalize} variant="outline" className="px-6">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifica
                </Button>
                <Button onClick={() => navigate('/create-story', { state: { profileId, profileName } })} variant="outline" className="px-6">
                  Nuova Favola
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main editing screen with two columns
  const currentOriginalText = selectedFairyTale && fairyTales[selectedFairyTale as keyof typeof fairyTales] ? 
    fairyTales[selectedFairyTale as keyof typeof fairyTales][currentPhase] : '';

  const getPreviousAnswers = () => {
    return allAnswers.slice(0, currentPhase).filter(answer => answer.trim()).join('\n\n');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleExit}>
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">Modalità ALOVAF - {selectedFairyTale}</h1>
            <span className="text-lg font-semibold text-slate-600">{currentPhase + 1}/6</span>
          </div>
          <div></div>
        </div>

        {/* Previous story text */}
        {currentPhase > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">La tua storia finora:</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={getPreviousAnswers()}
                className="text-base leading-relaxed resize-none bg-slate-50"
                style={{ height: 'auto', minHeight: '8rem' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
                readOnly
              />
            </CardContent>
          </Card>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left column - Original text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">Testo Originale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 rounded border text-sm leading-relaxed">
                {currentOriginalText}
              </div>
            </CardContent>
          </Card>

          {/* Right column - User input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-800">La Tua Versione "Al Contrario"</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Scrivi qui la tua versione al contrario..."
                  className="text-base resize-none overflow-hidden"
                  value={currentPhaseText}
                  onChange={handlePhaseTextChange}
                  style={{ height: 'auto', minHeight: '8rem', maxHeight: '16rem' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 256) + 'px';
                  }}
                />
                <SpeechToText
                  onResult={(text) => setCurrentPhaseText(prev => prev + (prev ? ' ' : '') + text)}
                  className="shrink-0"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 justify-center">
          <Button onClick={handleExit} variant="outline">
            Exit
          </Button>
          {currentPhase > 0 && (
            <Button onClick={handlePrevPhase} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
          )}
          <Button onClick={handleNextPhase} disabled={!currentPhaseText.trim()}>
            <ArrowRight className="w-4 h-4 mr-2" />
            {currentPhase === 5 ? 'Finalizza' : 'Continua'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlovafEditor;
