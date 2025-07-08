import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Home, Save, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';

const ProppEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName, editStory } = location.state || {};

  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentPhaseText, setCurrentPhaseText] = useState(editStory ? editStory.content || '' : '');
  const [storyTitle, setStoryTitle] = useState(editStory ? editStory.title || '' : '');
  const [answers, setAnswers] = useState<string[]>(editStory ? editStory.answers || ['', '', '', '', '', '', '', ''] : ['', '', '', '', '', '', '', '']);
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [finalStory, setFinalStory] = useState(editStory ? editStory.content || '' : '');

  const phases = [
    "Allontanamento",
    "Divieto",
    "Infrazione",
    "Investigazione",
    "Delazione",
    "Tranello",
    "Connivenza",
    "Danneggiamento",
    "Mancanza",
    "Partenza",
    "Prova",
    "Vittoria",
    "Marchio",
    "Aiuto",
    "Trasferimento",
    "Lotta",
    "Marchio",
    "Vittoria",
    "Rimozione",
    "Ritorno",
    "Persecuzione",
    "Salvataggio",
    "Arrivo",
    "Imposizione",
    "Compito",
    "Difficoltà",
    "Soluzione",
    "Riconoscimento",
    "Smascheramento",
    "Trasfigurazione",
    "Punizione",
    "Nozze"
  ];

  useEffect(() => {
    if (editStory) {
      setStoryTitle(editStory.title || '');
      setFinalStory(editStory.content || '');
      setAnswers(editStory.answers || ['', '', '', '', '', '', '', '']);
    }
  }, [editStory]);

  const handlePhaseTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentPhaseText(e.target.value);
  };

  const handleContinue = () => {
    if (!currentPhaseText.trim()) {
      toast({
        title: "Testo richiesto",
        description: "Inserisci un testo per continuare",
        variant: "destructive"
      });
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentPhase] = currentPhaseText;
    setAnswers(newAnswers);
    setCurrentPhaseText('');

    if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
    } else {
      // Mostra il draft finale
      const story = newAnswers.join('\n');
      setFinalStory(story);
      setShowFinalScreen(true);
    }
  };

  const handleBack = () => {
    if (currentPhase > 0) {
      setCurrentPhaseText(answers[currentPhase - 1]);
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

  const handleFinalizeDraft = () => {
    setShowEditScreen(true);
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
      answers: answers
    };

    saveStory(story);
    toast({
      title: "Storia salvata!",
      description: "La storia è stata salvata nell'archivio",
    });
    setTimeout(() => navigate('/create-story', { state: { profileId, profileName } }), 1500);
  };

  if (showFinalScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Anteprima - PROPP</h1>
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

  if (showEditScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Modifica Storia - PROPP</h1>
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
                <Button onClick={() => setShowEditScreen(false)} variant="outline">
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleExit}>
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">Modalità PROPP</h1>
            <span className="text-lg font-semibold text-slate-600">{currentPhase + 1}/{phases.length}</span>
          </div>
          <div></div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-blue-800">
              {phases[currentPhase]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPhase > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-slate-700 mb-2">La tua storia fino a ora:</h4>
                <div className="border rounded p-4 bg-slate-50 space-y-1">
                  {answers.slice(0, currentPhase).map((answer, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-slate-700">{phases[index]}</span>
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
            <Textarea
              value={currentPhaseText}
              onChange={handlePhaseTextChange}
              placeholder="Scrivi qui la tua risposta..."
              className="text-base resize-none overflow-hidden"
              style={{ height: 'auto', minHeight: '3rem' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
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
          <Button onClick={handleContinue} disabled={!currentPhaseText.trim()}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Continua
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProppEditor;
