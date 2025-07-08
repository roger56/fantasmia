import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Home, Mic, Save, Volume2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';
import SpeechToText from '@/components/SpeechToText';
import { translateToEnglish, translateToItalian } from '@/utils/translation';

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const GhostEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName, editStory } = location.state || {};
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(editStory ? editStory.answers || ['', '', '', '', '', ''] : ['', '', '', '', '', '']);
  const [currentAnswer, setCurrentAnswer] = useState(editStory && editStory.answers ? editStory.answers[0] || '' : '');
  const [showFinalDraft, setShowFinalDraft] = useState(false);
  const [finalStory, setFinalStory] = useState(editStory ? editStory.content || '' : '');
  const [storyTitle, setStoryTitle] = useState(editStory ? editStory.title || '' : '');
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalStory, setOriginalStory] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const questions = [
    {
      question: "Chi era?",
      suggestion: "💡 Prova a immaginare un personaggio che abbia qualcosa di davvero strano o unico: può essere una persona, un animale, un oggetto fatto di qualcosa di bizzarro, avere una forma buffa o muoversi in modo imprevedibile."
    },
    {
      question: "Dove si trovava?",
      suggestion: "💡 Racconta dove si trovava questo personaggio: un posto speciale, magari nascosto o impossibile, come sopra una nuvola, dentro un orologio o in fondo a un barattolo magico."
    },
    {
      question: "Cosa faceva?",
      suggestion: "💡 Pensa a un gesto o un'azione fuori dal comune: magari stava facendo qualcosa che nessuno si aspetta, come cucinare il vento o insegnare a volare a un sasso."
    },
    {
      question: "Cosa diceva?",
      suggestion: "💡 Fai parlare il tuo personaggio! Inventagli una frase che suoni buffa, stramba, poetica o anche completamente pazza. L'importante è che sia originale!"
    },
    {
      question: "Cosa diceva la gente?",
      suggestion: "💡 Immagina come reagiscono gli altri: amici, animali o oggetti parlanti. Che cosa pensano? Dicono qualcosa insieme o a turno? Gridano, sussurrano, fanno domande?"
    },
    {
      question: "Come è andata a finire?",
      suggestion: "💡 Concludi con un finale speciale: può essere felice, tenero, assurdo o pieno di sorprese. Qualcosa che faccia dire \"Wow!\" o \"Che bella idea!\""
    }
  ];

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
    newAnswers[currentQuestion] = currentAnswer;
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQuestion < 5) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Mostra il draft finale
      const story = newAnswers.join('\n');
      setFinalStory(story);
      setShowFinalDraft(true);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentAnswer(answers[currentQuestion - 1]);
      setCurrentQuestion(currentQuestion - 1);
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

  const handleFinalizeDraft = () => {
    setShowFinalScreen(true);
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
      mode: 'GHOST' as const,
      authorId: profileId || 'anonymous',
      authorName: profileName || 'Utente Anonimo',
      isPublic: false,
      answers: answers,
      language: isTranslated ? 'english' : 'italian'
    };

    saveStory(story);
    toast({
      title: "Storia salvata!",
      description: `La storia è stata salvata nell'archivio${isTranslated ? ' in inglese' : ''}`,
    });
    setTimeout(() => navigate('/create-story', { state: { profileId, profileName } }), 1500);
  };

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking && !isPaused) {
        // Pause speech
        speechSynthesis.pause();
        setIsPaused(true);
      } else if (isPaused) {
        // Resume speech
        speechSynthesis.resume();
        setIsPaused(false);
      } else {
        // Start new speech
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

  const progress = ((currentQuestion + 1) / 6) * 100;

  if (showFinalScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Storia Completata - GHOST - {profileName}</h1>
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
                  readOnly
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

  if (showFinalDraft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Bozza Finale - GHOST</h1>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rivedi la tua storia</CardTitle>
              <p className="text-slate-600">
                Puoi modificare il testo finale prima di salvare
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                value={finalStory}
                onChange={(e) => setFinalStory(e.target.value)}
                className="text-base leading-relaxed resize-none overflow-hidden"
                placeholder="La tua storia apparirà qui..."
                style={{ height: 'auto', minHeight: '20rem' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, window.innerHeight * 0.6) + 'px';
                }}
              />

              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowFinalDraft(false)} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Torna alle Domande
                </Button>
                <Button onClick={handleFinalizeDraft}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Finalizza Storia
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
            <h1 className="text-xl font-bold text-slate-800">Modalità GHOST</h1>
            <span className="text-lg font-semibold text-slate-600">{currentQuestion + 1}/6</span>
          </div>
          <div></div>
        </div>

        {/* Current Question and Previous Answers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-blue-800">
              {questions[currentQuestion].question}
            </CardTitle>
            <p className="text-slate-600 text-sm">
              {questions[currentQuestion].suggestion}
            </p>
          </CardHeader>
          <CardContent>
            {/* Previous Answers - Compact Display */}
            {currentQuestion > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-slate-700 mb-2">La tua storia fino a ora:</h4>
                <div className="border rounded p-4 bg-slate-50 space-y-1">
                  {answers.slice(0, currentQuestion).map((answer, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-slate-700">{questions[index].question}</span>
                      <span className="text-slate-500 mx-2">–</span>
                      <span className="text-slate-800">{answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Answer Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Scrivi la tua risposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
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

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-center">
          <Button onClick={handleExit} variant="outline">
            Exit
          </Button>
          {currentQuestion > 0 && (
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

export default GhostEditor;
