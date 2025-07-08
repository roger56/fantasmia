import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Home, Save, Volume2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';
import SpeechToText from '@/components/SpeechToText';
import { translateToEnglish, translateToItalian } from '@/utils/translation';

const AlovafEditor = () => {
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
  const [finalStory, setFinalStory] = useState('');
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalStory, setOriginalStory] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const fairyTales = {
    "Cappuccetto Rosso": [
      "C'era una volta una bambina di nome Cappuccetto Rosso...",
      "Un giorno, la sua mamma le chiese di portare una torta alla nonna...",
      "Nel bosco incontrò il lupo...",
      "Il lupo arrivò prima alla casa della nonna e la mangiò...",
      "Poi si travestì da nonna e aspettò Cappuccetto Rosso...",
      "Quando Cappuccetto Rosso arrivò, il lupo la mangiò...",
      "Per fortuna, un cacciatore passò di lì e salvò nonna e nipote tagliando la pancia del lupo."
    ],
    "I Tre Porcellini": [
      "C'erano una volta tre porcellini...",
      "Decisero di costruirsi una casa...",
      "Il primo porcellino costruì una casa di paglia...",
      "Il secondo porcellino costruì una casa di legno...",
      "Il terzo porcellino costruì una casa di mattoni...",
      "Il lupo cattivo soffiò sulla casa di paglia e la distrusse...",
      "Soffiò anche sulla casa di legno e la distrusse...",
      "Ma non riuscì a distruggere la casa di mattoni...",
      "Alla fine, i porcellini sconfissero il lupo cattivo."
    ],
    "Biancaneve": [
      "C'era una volta una principessa di nome Biancaneve...",
      "La sua matrigna, la regina cattiva, era invidiosa della sua bellezza...",
      "Ordinò a un cacciatore di portare Biancaneve nel bosco e ucciderla...",
      "Ma il cacciatore ebbe pietà di lei e la lasciò scappare...",
      "Biancaneve trovò una casetta abitata da sette nani...",
      "La regina cattiva scoprì che Biancaneve era ancora viva...",
      "Si travestì da vecchia e le offrì una mela avvelenata...",
      "Biancaneve morse la mela e cadde in un sonno profondo...",
      "Un principe passò di lì, si innamorò di lei e la svegliò con un bacio."
    ]
  };

  const questions = [
    "Cosa è successo alla fine?",
    "Cosa dicevano i personaggi?",
    "Cosa facevano i personaggi?",
    "Dove si trovavano i personaggi?",
    "Chi erano i personaggi?",
    "Come inizia la storia?"
  ];

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
      // Genera la storia al contrario
      let story = '';
      for (let i = 0; i < 6; i++) {
        story += `${answers[i]}\n`;
      }
      setFinalStory(story);
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
        const utterance = new SpeechSynthesisUtterance(finalStory);
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
      mode: 'ALOVAF' as const,
      authorId: profileId || 'anonymous',
      authorName: profileName || 'Utente Anonimo',
      isPublic: false,
      answers: answers,
      selectedFairyTale: selectedFairyTale,
      language: isTranslated ? 'english' : 'italian'
    };

    saveStory(story);
    toast({
      title: "Storia salvata!",
      description: `La storia è stata salvata nell'archivio${isTranslated ? ' in inglese' : ''}`,
    });
    setTimeout(() => navigate('/create-story', { state: { profileId, profileName } }), 1500);
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
              <CardTitle>Benvenuto nella modalità ALOVAF!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                In questa modalità, creeremo una favola al contrario!
              </p>
              <Button onClick={handleStart}>Inizia</Button>
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
              <CardTitle>Seleziona una favola</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(fairyTales).map((fairyTale) => (
                <Button key={fairyTale} onClick={() => handleFairyTaleSelection(fairyTale)}>
                  {fairyTale}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showFinalScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Storia Completata - ALOVAF</h1>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>La tua favola al contrario è pronta!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titolo della Storia *
                </label>
                <Textarea
                  placeholder="Inserisci il titolo della tua favola al contrario..."
                  value={storyTitle}
                  onChange={handleTitleChange}
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
                  La tua storia
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
                <Button onClick={handleSave} className="px-6">
                  <Save className="w-4 h-4 mr-2" />
                  Salva
                </Button>
                <Button 
                  onClick={handleTranslate} 
                  variant="outline" 
                  className="px-6" 
                  disabled={isTranslating}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {isTranslating ? 'Traduzione...' : (isTranslated ? 'ITALIANO' : 'INGLESE')}
                </Button>
                <Button onClick={handleTextToSpeech} variant="outline" className="px-6">
                  <Volume2 className="w-4 h-4 mr-2" />
                  {isSpeaking && !isPaused ? 'Pausa' : isPaused ? 'Riprendi' : 'Ascolta'}
                </Button>
                <Button onClick={() => navigate('/create-story', { state: { profileId, profileName } })} variant="outline" className="px-6">
                  Nuova Favola
                </Button>
                <Button onClick={() => navigate('/create-story', { state: { profileId, profileName } })} variant="outline" className="px-6">
                  Indietro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleExit}>
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">Modalità ALOVAF</h1>
            <span className="text-lg font-semibold text-slate-600">{currentPhase + 1}/6</span>
          </div>
          <div></div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-blue-800">
              {questions[currentPhase]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPhase > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-slate-700 mb-2">La tua storia fino a ora:</h4>
                <div className="border rounded p-4 bg-slate-50 space-y-1">
                  {answers.slice(0, currentPhase).map((answer, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-slate-700">{questions[index]}</span>
                      <span className="text-slate-500 mx-2">–</span>
                      <span className="text-slate-800">{answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Scrivi la tua risposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                value={currentAnswer}
                onChange={handleAnswerChange}
                placeholder="Scrivi qui la tua risposta..."
                className="text-base resize-none overflow-hidden"
                style={{ height: 'auto', minHeight: '3rem' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <SpeechToText
                onResult={(text) => setCurrentAnswer(prev => prev + (prev ? ' ' : '') + text)}
                className="shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center">
          <Button onClick={handleExit} variant="outline">
            Exit
          </Button>
          {currentPhase > 0 && (
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
          )}
          <Button onClick={handleContinue} disabled={!currentAnswer.trim()}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Continua
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlovafEditor;
