import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Pause, Save, CheckCircle, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStory } from '@/utils/userStorage';

const ProppEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profileId, profileName } = location.state || {};
  const [storyTitle, setStoryTitle] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [storyContent, setStoryContent] = useState('');
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Mock clusters with 6 icons each
  const clusters = [
    {
      id: 1,
      title: 'Inizio',
      icons: ['🏰', '👑', '🌟', '📚', '🗝️', '🌙'],
      description: 'Elementi per iniziare la storia'
    },
    {
      id: 2,
      title: 'Personaggi',
      icons: ['👸', '🤴', '🧙', '🐉', '🦄', '🧚'],
      description: 'Protagonisti e personaggi'
    },
    {
      id: 3,
      title: 'Luoghi',
      icons: ['🏔️', '🌊', '🌲', '🏖️', '🌋', '❄️'],
      description: 'Ambientazioni e luoghi magici'
    },
    {
      id: 4,
      title: 'Oggetti',
      icons: ['⚔️', '🛡️', '💎', '🔮', '📿', '🗡️'],
      description: 'Oggetti magici e strumenti'
    }
  ];

  const handleSaveStory = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Titolo richiesto",
        description: "Inserisci un titolo per la storia",
        variant: "destructive"
      });
      return;
    }

    if (!storyContent.trim()) {
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
      content: storyContent,
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

    setShowFinalScreen(true);
  };

  const handleTextToSpeech = () => {
    if (!storyContent.trim()) {
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
        
        const utterance = new SpeechSynthesisUtterance(storyContent);
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/home')}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">La tua Favola - PROPP</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{storyTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="text-base leading-relaxed bg-slate-50 p-4 rounded-lg"
                style={{ minHeight: '200px' }}
              >
                {storyContent}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleTextToSpeech} variant="outline" className="px-6">
              <Volume2 className="w-4 h-4 mr-2" />
              {isSpeaking && !isPaused ? 'Pausa' : isPaused ? 'Riprendi' : 'Ascolta'}
            </Button>
            <Button onClick={() => navigate('/create-story', { state: { profileId, profileName } })} variant="outline" className="px-6">
              Nuova Favola
            </Button>
            <Button onClick={() => navigate('/archive', { state: { profileId, profileName } })} variant="outline" className="px-6">
              Indietro
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-slate-800">Editor PROPP</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Dual Pane Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Pane - Clusters and Icons */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cluster Narrativi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {clusters.map((cluster) => (
                    <Card 
                      key={cluster.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedCluster === cluster.id 
                          ? 'border-2 border-blue-300 bg-blue-50' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedCluster(cluster.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <h4 className="font-semibold text-sm mb-1">{cluster.title}</h4>
                        <p className="text-xs text-slate-600 mb-3">{cluster.description}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {cluster.icons.map((icon, index) => (
                            <button
                              key={index}
                              className="text-2xl p-2 hover:bg-slate-100 rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStoryContent(prev => prev + icon + ' ');
                              }}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Pane - Story Editor */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>La Tua Storia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Titolo della Storia
                  </label>
                  <Input
                    placeholder="Inserisci il titolo..."
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    className="text-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contenuto
                  </label>
                  <Textarea
                    placeholder="Inizia a scrivere la tua favola... Clicca sulle icone per aggiungere elementi!"
                    value={storyContent}
                    onChange={(e) => setStoryContent(e.target.value)}
                    className="min-h-[400px] text-base leading-relaxed"
                  />
                </div>

                <div className="text-sm text-slate-600">
                  <p><strong>Suggerimento:</strong> Clicca sui cluster a sinistra per esplorare gli elementi narrativi, poi clicca sulle icone per aggiungerle alla tua storia!</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveStory} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Salva Storia
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProppEditor;