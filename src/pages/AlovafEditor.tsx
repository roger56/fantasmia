import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Home, Save, Volume2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';

const AlovafEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName, editStory } = location.state || {};

  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentPhaseText, setCurrentPhaseText] = useState(editStory ? editStory.content || '' : '');
  const [storyTitle, setStoryTitle] = useState(editStory ? editStory.title || '' : '');
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const phases = [
    "C'era una volta...",
    "Ma un brutto giorno...",
    "Per questo...",
    "Per questo...",
    "Per questo...",
    "E da quel giorno..."
  ];

  useEffect(() => {
    if (editStory) {
      setCurrentPhaseText(editStory.content || '');
      setStoryTitle(editStory.title || '');
    }
  }, [editStory]);

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

    if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
      setCurrentPhaseText('');
    } else {
      setShowFinalScreen(true);
    }
  };

  const handlePrevPhase = () => {
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
    }
  };

  const handleExit = () => {
    if (currentPhase > 0 || currentPhaseText.trim()) {
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
      content: currentPhaseText,
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
      description: "La storia è stata salvata nell'archivio",
    });
    setTimeout(() => navigate('/create-story', { state: { profileId, profileName } }), 1500);
  };

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
        const utterance = new SpeechSynthesisUtterance(currentPhaseText);
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
                  value={currentPhaseText}
                  onChange={handlePhaseTextChange}
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
                  value={currentPhaseText}
                  onChange={handlePhaseTextChange}
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleExit}>
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">Modalità ALOVAF</h1>
            <span className="text-lg font-semibold text-slate-600">{currentPhase + 1}/{phases.length}</span>
          </div>
          <div></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-blue-800">
              {phases[currentPhase]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Scrivi qui la tua storia..."
              className="text-base resize-none overflow-hidden"
              value={currentPhaseText}
              onChange={handlePhaseTextChange}
              style={{ height: 'auto', minHeight: '10rem' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center mt-4">
          <Button onClick={handleExit} variant="outline">
            Exit
          </Button>
          {currentPhase > 0 && (
            <Button onClick={handlePrevPhase} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
          )}
          {!showFinalScreen && (
            <Button onClick={handleNextPhase} disabled={!currentPhaseText.trim()}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Continua
            </Button>
          )}
          {currentPhase === phases.length - 1 && !showFinalScreen && (
            <Button onClick={handleFinalize} disabled={!currentPhaseText.trim()}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Finalizza
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlovafEditor;
