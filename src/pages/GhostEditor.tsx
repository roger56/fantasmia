
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Save, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GhostEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');

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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-2">
              <Home className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={() => navigate('/create-story')} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Editor GHOST</h1>
          </div>
          
          <div className="flex items-center gap-2">
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

      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Modalità Scrittura Libera</CardTitle>
            <p className="text-slate-600">
              Lascia fluire la tua creatività senza limiti strutturali
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Titolo della Storia
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
                Scrivi la tua favola
              </label>
              <Textarea
                placeholder="C'era una volta... Inizia a scrivere la tua storia qui!"
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                className="min-h-[500px] text-base leading-relaxed"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Suggerimenti per la scrittura:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Inizia con "C'era una volta..." per un inizio classico</li>
                <li>• Crea personaggi interessanti con nomi memorabili</li>
                <li>• Descrivi luoghi magici e fantastici</li>
                <li>• Includi una morale o un insegnamento</li>
                <li>• Concludi con un finale soddisfacente</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GhostEditor;
