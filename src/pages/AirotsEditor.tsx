import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Home, Save, Volume2, Share, Edit, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';
import { translateToEnglish, translateToItalian } from '@/utils/translation';
import SpeechToText from '@/components/SpeechToText';

const AirotsEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName, editStory } = location.state || {};

  const [showIntro, setShowIntro] = useState(!editStory);
  const [showFairyTaleSelection, setShowFairyTaleSelection] = useState(false);
  const [selectedFairyTale, setSelectedFairyTale] = useState<string | null>(editStory?.selectedFairyTale || null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [answers, setAnswers] = useState<string[]>(editStory?.answers || ['', '', '', '', '', '']);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [storyTitle, setStoryTitle] = useState(editStory?.title || '');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [language, setLanguage] = useState<'italian' | 'english'>('italian');
  const [isTranslating, setIsTranslating] = useState(false);

  const fairyTales = {
    "POLLICINO": [
      "In un tempo di miseria, un taglialegna e sua moglie decidono di abbandonare nel bosco i loro sette figli, tra cui il più piccolo e astuto: Pollicino.",
      "Pollicino, sospettando l'abbandono, lascia una scia di briciole per ritrovare la strada. Ma gli uccelli le mangiano e i fratellini si perdono.",
      "I bambini trovano rifugio in una casa che scoprono essere di un orco che mangia i bambini. La moglie dell'orco li nasconde, ma l'orco li scopre.",
      "Pollicino inganna l'orco scambiando i berretti dei fratelli con le corone delle figlie dell'orco, che durante la notte uccide per errore le sue figlie.",
      "Pollicino ruba all'orco i suoi stivali magici che permettono di fare passi enormi e fugge con i fratelli.",
      "Pollicino usa gli stivali per fare fortuna, diventa messaggero del re e torna a casa ricco, salvando la famiglia dalla miseria."
    ],
    "CAPPUCCETTO ROSSO": [
      "Una bambina soprannominata Cappuccetto Rosso riceve dalla mamma il compito di portare una cesta di cibo alla nonna malata, attraversando il bosco.",
      "Nel bosco incontra un lupo furbo che la distrae con domande e le suggerisce due strade: lei prende quella più lunga, mentre il lupo sceglie la più corta.",
      "Il lupo arriva per primo a casa della nonna, la mangia e si traveste con i suoi vestiti per ingannare Cappuccetto Rosso.",
      "Quando la bambina arriva, trova il lupo travestito e nota stranezze (\"Che occhi grandi hai…\"). Alla fine il lupo la divora.",
      "Un cacciatore o un boscaiolo entra nella casa, uccide il lupo e salva Cappuccetto Rosso e la nonna, ancora vive nella pancia del lupo.",
      "Cappuccetto Rosso promette di non disubbidire più alla mamma e di non parlare con gli sconosciuti."
    ],
    "CENERENTOLA": [
      "Cenerentola vive con la matrigna e le sorellastre che la trattano come una serva, facendole fare tutti i lavori di casa.",
      "Il re organizza un grande ballo per trovare una sposa al principe, ma Cenerentola non può andarci perché la matrigna le proibisce di partecipare.",
      "Una fata madrina appare e, con la magia, trasforma una zucca in carrozza e dona a Cenerentola un vestito meraviglioso e scarpette di cristallo. Ma l'incantesimo finirà a mezzanotte.",
      "Al ballo, il principe rimane incantato da Cenerentola. Ma allo scoccare della mezzanotte, lei scappa di corsa e perde una scarpetta.",
      "Il principe cerca in tutto il regno la ragazza che può calzare la scarpetta. Le sorellastre provano, ma solo Cenerentola riesce a infilarla.",
      "Cenerentola sposa il principe e va a vivere felice con lui, lasciando per sempre la casa della matrigna."
    ],
    "BIANCANEVE": [
      "La regina cattiva, invidiosa della bellezza di Biancaneve, ordina al cacciatore di ucciderla. Lui la risparmia e la lascia fuggire nel bosco.",
      "Biancaneve trova rifugio nella casa di sette nani e si prende cura della loro casa, vivendo serena.",
      "La regina, scoperto che Biancaneve è viva, la inganna più volte con travestimenti: un corpetto stretto, un pettine avvelenato e infine una mela avvelenata.",
      "Biancaneve morde la mela avvelenata e cade in un sonno profondo, creduta morta dai nani che la pongono in una bara di vetro.",
      "Un principe, vedendola, se ne innamora e la bacia. Grazie a quel bacio, Biancaneve si risveglia.",
      "Biancaneve e il principe si sposano. La regina viene punita e la storia si conclude con un matrimonio felice."
    ]
  };

  const handleStart = () => {
    setShowIntro(false);
    setShowFairyTaleSelection(true);
  };

  const handleFairyTaleSelection = (fairyTale: string) => {
    setSelectedFairyTale(fairyTale);
    setShowFairyTaleSelection(false);
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentAnswer(e.target.value);
  };

  const handleContinue = () => {
    if (!currentAnswer.trim()) {
      toast({
        title: "Risposta richiesta",
        description: "Inserisci una risposta prima di continuare",
        variant: "destructive"
      });
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentPhase] = currentAnswer;
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentPhase < 5) {
      setCurrentPhase(currentPhase + 1);
    } else {
      setShowFinalScreen(true);
    }
  };

  const handleBack = () => {
    if (currentPhase > 0) {
      setCurrentAnswer(answers[currentPhase - 1]);
      setCurrentPhase(currentPhase - 1);
    }
  };

  const handleExit = () => {
    if (answers.some(answer => answer.trim())) {
      if (confirm("Sei sicuro di voler uscire? Tutte le modifiche andranno perse.")) {
        navigate('/create-story', { state: { profileId, profileName } });
      }
    } else {
      navigate('/create-story', { state: { profileId, profileName } });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStoryTitle(e.target.value);
  };

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking && !isPaused) {
        speechSynthesis.pause();
        setIsPaused(true);
      } else if (isPaused) {
        speechSynthesis.resume();
        setIsPaused(false);
      } else {
        const finalStory = answers.join('\n');
        const utterance = new SpeechSynthesisUtterance(finalStory);
        utterance.lang = language === 'italian' ? 'it-IT' : 'en-US';

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

  const handleLanguageToggle = async () => {
    if (isTranslating) return;
    
    setIsTranslating(true);
    const newLanguage = language === 'italian' ? 'english' : 'italian';
    
    try {
      const updatedAnswers = await Promise.all(
        answers.map(async (answer) => {
          if (!answer.trim()) return answer;
          
          return newLanguage === 'english' 
            ? await translateToEnglish(answer)
            : await translateToItalian(answer);
        })
      );
      
      // Also translate title if it exists
      let translatedTitle = storyTitle;
      if (storyTitle.trim()) {
        translatedTitle = newLanguage === 'english' 
          ? await translateToEnglish(storyTitle)
          : await translateToItalian(storyTitle);
      }
      
      setAnswers(updatedAnswers);
      setStoryTitle(translatedTitle);
      setLanguage(newLanguage);
      
      toast({
        title: "Traduzione completata",
        description: `Testo tradotto in ${newLanguage === 'english' ? 'inglese' : 'italiano'}`,
      });
    } catch (error) {
      toast({
        title: "Errore traduzione",
        description: "Impossibile tradurre il testo",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Titolo richiesto",
        description: "Inserisci un titolo per salvare la storia",
        variant: "destructive"
      });
      return;
    }

    const finalStory = answers.join('\n');
    const story = {
      id: editStory ? editStory.id : Date.now().toString(),
      title: storyTitle,
      content: finalStory,
      status: 'completed' as const,
      lastModified: new Date().toISOString(),
      mode: 'AIROTS' as const,
      authorId: profileId || 'anonymous',
      authorName: profileName || 'Utente Anonimo',
      isPublic: false,
      answers: answers,
      selectedFairyTale: selectedFairyTale,
      language: language
    };

    await saveStory(story);
    toast({
      title: "Storia salvata!",
      description: "La storia è stata salvata nell'archivio",
    });
    setTimeout(() => navigate('/superuser-archive', { state: { profileId, profileName } }), 1500);
  };

  const handleShare = () => {
    const finalStory = `${storyTitle}\n\n${answers.join('\n')}`;
    navigator.clipboard.writeText(finalStory).then(() => {
      toast({
        title: "Copiato!",
        description: "La storia è stata copiata negli appunti",
      });
    });
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Modalità AIROTS - Storia al Contrario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">
                Per inventare una storia al contrario si parte da una storia nota, ribaltando ruoli e azioni: i cattivi diventano protettori e gli eroi traditori, mentre ogni gesto (come "cade") diventa il suo opposto ("si solleva"). Si riscrive la trama originale applicando queste inversioni, aggiungendo dettagli ironici o surreali per sottolineare il contrasto e mantenendo uno stile coerente. Infine si definisce un finale capovolto e si sceglie un titolo che ne riveli l'essenza rovesciata.
              </p>
              <Button onClick={handleStart}>Avanti</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showFairyTaleSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Scelta della Storia di Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Seleziona una storia classica da trasformare "al contrario":
              </p>
              <div className="grid gap-3">
                {Object.keys(fairyTales).map((fairyTale) => (
                  <Button 
                    key={fairyTale} 
                    onClick={() => handleFairyTaleSelection(fairyTale)}
                    variant="outline"
                    className="text-left justify-start p-4 h-auto"
                  >
                    {fairyTale}
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
    const finalStory = answers.join('\n');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Conclusione - AIROTS</h1>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>La tua storia al contrario è pronta!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titolo della Storia al Contrario *
                </label>
                <Textarea
                  placeholder="Inserisci un titolo che riveli l'essenza rovesciata..."
                  value={storyTitle}
                  onChange={handleTitleChange}
                  disabled={!isEditing}
                  className="text-lg resize-none overflow-hidden min-h-[80px]"
                  style={{ height: 'auto', minHeight: '80px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  La tua storia completa
                </label>
                <Textarea
                  value={finalStory}
                  disabled={!isEditing}
                  className="text-base leading-relaxed resize-none overflow-hidden min-h-[80px]"
                  style={{ height: 'auto', minHeight: '80px' }}
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
                  SALVA
                </Button>
                <Button onClick={handleShare} variant="outline" className="px-6">
                  <Share className="w-4 h-4 mr-2" />
                  CONDIVIDI
                </Button>
                <Button onClick={handleTextToSpeech} variant="outline" className="px-6">
                  <Volume2 className="w-4 h-4 mr-2" />
                  {isSpeaking && isPaused ? 'RIPRENDI' : isSpeaking ? 'PAUSA' : 'ASCOLTA'}
                </Button>
                <Button 
                  onClick={handleLanguageToggle} 
                  variant="outline" 
                  className="px-6"
                  disabled={isTranslating}
                >
                  <Languages className="w-4 h-4 mr-2" />
                  {isTranslating ? 'Traduzione...' : (language === 'italian' ? 'ENGLISH' : 'ITALIANO')}
                </Button>
                <Button 
                  onClick={() => setIsEditing(!isEditing)} 
                  variant="outline" 
                  className="px-6"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'SALVA MODIFICHE' : 'MODIFICA'}
                </Button>
                <Button onClick={() => navigate('/create-story', { state: { profileId, profileName } })} variant="outline" className="px-6">
                  NUOVA STORIA
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedFairyTale || !fairyTales[selectedFairyTale as keyof typeof fairyTales]) {
    return null;
  }

  const selectedFairyTaleData = fairyTales[selectedFairyTale as keyof typeof fairyTales];
  const originalPhrase = selectedFairyTaleData[currentPhase];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleExit}>
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">Modalità AIROTS - {selectedFairyTale}</h1>
            <span className="text-lg font-semibold text-slate-600">{currentPhase + 1}/6</span>
          </div>
          <div></div>
        </div>

        {/* Mostra storia scritta finora */}
        {answers.some(answer => answer.trim()) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">La tua storia fino a ora:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 rounded p-4 space-y-3">
                {answers.map((answer, index) => 
                  answer.trim() && (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-slate-700">Fase {index + 1}:</span>
                      <span className="text-slate-500 mx-2">–</span>
                      <span className="text-slate-800">{answer}</span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Layout a due colonne */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Colonna sinistra: Frase originale */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">Fase {currentPhase + 1} - Originale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 rounded p-4">
                <p className="text-sm leading-relaxed text-blue-900 whitespace-pre-line">
                  {originalPhrase}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Colonna destra: Riscrittura al contrario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-800">Riscrittura "al contrario"</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  value={currentAnswer}
                  onChange={handleAnswerChange}
                  placeholder="Riscrivi questa parte ribaltando ruoli, azioni e intenzioni... (massimo 10 righe)"
                  className="text-base resize-none overflow-hidden min-h-[80px]"
                  style={{ minHeight: '80px' }}
                  rows={3}
                  maxLength={800}
                />
                <SpeechToText
                  onResult={(text) => setCurrentAnswer(prev => prev + (prev ? ' ' : '') + text)}
                  className="shrink-0"
                />
              </div>
              <div className="text-xs text-slate-500">
                {currentAnswer.length}/800 caratteri
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigazione */}
        <div className="flex gap-3 justify-center">
          <Button onClick={handleExit} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          {currentPhase > 0 && (
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
          )}
          <Button onClick={handleContinue} disabled={!currentAnswer.trim()}>
            <ArrowRight className="w-4 h-4 mr-2" />
            {currentPhase < 5 ? 'Continua' : 'Finisci'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AirotsEditor;