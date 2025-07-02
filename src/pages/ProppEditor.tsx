
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Pause, Save, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProppEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [storyTitle, setStoryTitle] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [storyContent, setStoryContent] = useState('');

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

  const handleSuspend = () => {
    toast({
      title: "Storia sospesa",
      description: "La storia è stata salvata come 'Storia Sospesa' nell'archivio",
    });
    setTimeout(() => navigate('/archive'), 1500);
  };

  const handleSave = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Titolo richiesto",
        description: "Inserisci un titolo per la storia",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Storia salvata!",
      description: "La storia è stata salvata nell'archivio",
    });
    setTimeout(() => navigate('/archive'), 1500);
  };

  const handleFinish = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Titolo richiesto",
        description: "Inserisci un titolo per completare la storia",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Storia completata!",
      description: "La storia è stata completata e salvata nell'archivio",
    });
    setTimeout(() => navigate('/archive'), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-2">
              <Home className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={() => navigate('/create-story')} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Editor PROPP</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleSuspend} variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-1" />
              Sospendi
            </Button>
            <Button onClick={handleSave} variant="outline" size="sm">
              <Save className="w-4 h-4 mr-1" />
              Salva
            </Button>
            <Button onClick={handleFinish} size="sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Fine Storia
            </Button>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProppEditor;
