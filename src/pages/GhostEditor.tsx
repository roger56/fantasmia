
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Home, Mic, Save, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const GhostEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '', '']);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showFinalDraft, setShowFinalDraft] = useState(false);
  const [finalStory, setFinalStory] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [showFinalScreen, setShowFinalScreen] = useState(false);

  const questions = [
    {
      question: "Chi era?",
      suggestion: "Scrivi un personaggio con almeno una caratteristica curiosa o particolare: colore, forma, materiale, dimensione o comportamento insolito."
    },
    {
      question: "Dove si trovava?",
      suggestion: "Indica un luogo originale o sorprendente, reale o immaginario. Può essere vicino, lontano, in alto, sotto o dentro qualcosa di inusuale."
    },
    {
      question: "Cosa faceva?",
      suggestion: "Descrivi un'azione insolita o buffa, qualcosa di impossibile o esagerato che faccia sorridere o stupire."
    },
    {
      question: "Cosa diceva?",
      suggestion: "Scrivi una frase che il personaggio pronuncia. Può essere divertente, poetica, assurda, misteriosa o senza senso."
    },
    {
      question: "Cosa diceva la gente?",
      suggestion: "Scrivi una frase collettiva o il commento di altri personaggi o creature presenti nella storia. Può essere una protesta, un consiglio, una domanda, un'esclamazione."
    },
    {
      question: "Come è andata a finire?",
      suggestion: "Scrivi un finale sorprendente, divertente, poetico o buffo. Può essere positivo, imprevisto o stravagante."
    }
  ];

  const handleSpeechToText = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCurrentAnswer(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Errore",
          description: "Impossibile utilizzare il riconoscimento vocale",
          variant: "destructive"
        });
      };

      recognition.start();
    } else {
      toast({
        title: "Non supportato",
        description: "Il riconoscimento vocale non è supportato da questo browser",
        variant: "destructive"
      });
    }
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
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleUpdatePreviousAnswers = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleFinalizeDraft = () => {
    setShowFinalScreen(true);
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

    const currentUser = JSON.parse(localStorage.getItem('fantasmia_currentUser') || '{}');
    const story = {
      id: Date.now().toString(),
      title: storyTitle,
      content: finalStory,
      status: 'completed' as const,
      lastModified: new Date().toISOString(),
      mode: 'GHOST' as const,
      authorId: currentUser.id || 'public',
      authorName: currentUser.name || 'Utente Pubblico',
      isPublic: !currentUser.id || currentUser.id === 'public'
    };

    saveStory(story);
    toast({
      title: "Storia salvata!",
      description: "La storia è stata salvata nell'archivio",
    });
    setTimeout(() => navigate('/archive'), 1500);
  };

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(finalStory);
      utterance.lang = 'it-IT';
      speechSynthesis.speak(utterance);
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
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Storia Completata - GHOST</h1>
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
                  placeholder="Inserisci il titolo della tua favola..."
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  La tua storia
                </label>
                <Textarea
                  value={finalStory}
                  onChange={(e) => setFinalStory(e.target.value)}
                  className="min-h-[300px] text-base leading-relaxed"
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
                  Ascolta
                </Button>
                <Button onClick={() => navigate('/create-story')} variant="outline" className="px-6">
                  Nuova Favola
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
            <Button variant="ghost" onClick={() => navigate('/')}>
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
                className="min-h-[400px] text-base leading-relaxed"
                placeholder="La tua storia apparirà qui..."
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
          <h1 className="text-xl font-bold text-slate-800">Modalità GHOST</h1>
          <div></div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Domanda {currentQuestion + 1} di 6
              </span>
              <span className="text-sm text-slate-500">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

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
            {/* Previous Answers */}
            {currentQuestion > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-slate-700 mb-2">La tua storia fino a ora:</h4>
                <div className="space-y-2">
                  {answers.slice(0, currentQuestion).map((answer, index) => (
                    <div key={index} className="border rounded p-3 bg-slate-50">
                      <div className="text-xs text-slate-500 mb-1">
                        {questions[index].question}
                      </div>
                      <Textarea
                        value={answer}
                        onChange={(e) => handleUpdatePreviousAnswers(index, e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
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
                className="min-h-[120px] text-base"
              />
              <Button
                onClick={handleSpeechToText}
                variant="outline"
                size="icon"
                className={`shrink-0 ${isListening ? 'bg-red-100 border-red-300' : ''}`}
                disabled={isListening}
              >
                <Mic className={`w-5 h-5 ${isListening ? 'text-red-600' : 'text-slate-600'}`} />
              </Button>
            </div>
            {isListening && (
              <p className="text-sm text-red-600">🎙️ Sto ascoltando...</p>
            )}
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
