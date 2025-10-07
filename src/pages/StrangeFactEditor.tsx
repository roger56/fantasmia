import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStoryBridge } from '@/utils/storyBridge';
import SpeechToText from '@/components/SpeechToText';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const congratulationsMessages = [
  "Questa è veramente una storia strana!",
  "Wow! Che fatto incredibile!",
  "Non ci posso credere, davvero è successo?",
  "Questa storia è fantastica!",
  "Che avventura assurda!",
  "Incredibile! Racconta ancora!",
  "Una storia da non dimenticare!",
  "Che fatto straordinario!",
  "Questa sì che è una storia vera e strana!",
  "Ma dai! È davvero accaduto?",
  "Che esperienza unica!",
  "Una storia che solo tu potevi vivere!",
  "Fantastico! Che momento particolare!",
  "Che storia bizzarra e meravigliosa!",
  "Incredibilmente strano ma vero!",
  "Una storia che vale la pena raccontare!",
  "Che fatto curioso e affascinante!",
  "Questa storia è fuori dal comune!",
  "Ma che combinazione strana!",
  "Un fatto davvero singolare!"
];

const StrangeFactEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName } = location.state || {};
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '', '']);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratulationsMessage, setCongratulationsMessage] = useState('');

  const questions = [
    {
      question: "Dove ti trovavi?",
      suggestion: "Es: in un parco, a scuola, in macchina, al supermercato, in vacanza..."
    },
    {
      question: "Con chi eri?",
      suggestion: "Es: da solo/a, con un amico, con la famiglia, con il tuo animale domestico..."
    },
    {
      question: "Cosa stavate facendo?",
      suggestion: "Es: giocando, studiando, passeggiando, facendo la spesa, guardando la TV..."
    },
    {
      question: "Cosa è successo?",
      suggestion: "Es: qualcosa di inaspettato, un evento strano, una sorpresa, una coincidenza..."
    },
    {
      question: "Cosa hai detto?",
      suggestion: "Es: la tua prima reazione, un'esclamazione, una domanda, un commento..."
    },
    {
      question: "La persona con cui eri, cosa ti ha risposto?",
      suggestion: "Es: era sorpreso/a, ha riso, si è spaventato/a, ha commentato..."
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
      // Tutte le domande completate - salva e mostra congratulazioni
      handleSaveStory(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentAnswer(answers[currentQuestion - 1]);
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSaveStory = async (finalAnswers: string[]) => {
    // Genera la storia concatenando le risposte
    const storyContent = `Mi trovavo ${finalAnswers[0]}. Ero con ${finalAnswers[1]}. Stavamo ${finalAnswers[2]}. 

All'improvviso, ${finalAnswers[3]}. 

La mia reazione è stata immediata: "${finalAnswers[4]}"

${finalAnswers[5] ? `E la persona con me ha risposto: "${finalAnswers[5]}"` : ''}`;

    const story = {
      id: Date.now().toString(),
      title: "Un fatto strano che mi è capitato",
      content: storyContent,
      status: 'completed' as const,
      lastModified: new Date().toISOString(),
      mode: 'STRANGE_FACT' as const,
      authorId: profileId || 'anonymous',
      authorName: profileName || 'Utente Anonimo',
      isPublic: false,
      answers: finalAnswers,
      language: 'italian' as const
    };

    const savedId = await saveStoryBridge(story);
    
    // Seleziona un messaggio casuale
    const randomMessage = congratulationsMessages[Math.floor(Math.random() * congratulationsMessages.length)];
    setCongratulationsMessage(randomMessage);
    setShowCongratulations(true);

    // Salva l'ID per il redirect
    sessionStorage.setItem('lastSavedStoryId', savedId);
  };

  const handleCongratulationsClose = () => {
    setShowCongratulations(false);
    const storyId = sessionStorage.getItem('lastSavedStoryId') || Date.now().toString();
    sessionStorage.removeItem('lastSavedStoryId');
    navigate(`/user-story-viewer/${storyId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <ProfileIndicator />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">Fatto Strano</h1>
            <span className="text-lg font-semibold text-slate-600">{currentQuestion + 1}/6</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/profiles')}>
            <Home className="w-5 h-5" />
          </Button>
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
          {currentQuestion > 0 && (
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
          )}
          <Button onClick={handleContinue} disabled={!currentAnswer.trim()}>
            <ArrowRight className="w-4 h-4 mr-2" />
            {currentQuestion === 5 ? 'Completa Storia' : 'Avanti'}
          </Button>
        </div>
      </div>

      {/* Congratulations Dialog */}
      <AlertDialog open={showCongratulations} onOpenChange={setShowCongratulations}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl">🎉 Complimenti!</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg pt-4">
              {congratulationsMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <Button onClick={handleCongratulationsClose} className="w-full sm:w-auto">
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StrangeFactEditor;
