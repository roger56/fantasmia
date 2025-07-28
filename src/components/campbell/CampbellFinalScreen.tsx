import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share, Volume2, Languages, Save, ArrowLeft, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

interface CampbellFinalScreenProps {
  storyContent: string;
  onExit: () => void;
  onSave: (title: string) => void;
  profileName?: string;
  language: 'italian' | 'english';
  onLanguageToggle: () => void;
}

const CampbellFinalScreen: React.FC<CampbellFinalScreenProps> = ({
  storyContent,
  onExit,
  onSave,
  profileName,
  language,
  onLanguageToggle
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [editableContent, setEditableContent] = useState(storyContent);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentContent, setCurrentContent] = useState(storyContent);
  const { toast } = useToast();

  const cleanedContent = currentContent.replace(/\n\n+/g, '\n');

  // Update content when props change (for translation)
  React.useEffect(() => {
    setCurrentContent(storyContent);
    setEditableContent(storyContent);
  }, [storyContent]);

  const handleListen = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying && !isPaused) {
        speechSynthesis.pause();
        setIsPaused(true);
      } else if (isPaused) {
        speechSynthesis.resume();
        setIsPaused(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(cleanedContent);
        utterance.lang = language === 'italian' ? 'it-IT' : 'en-US';
        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };
        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
        speechSynthesis.speak(utterance);
      }
    } else {
      toast({
        title: "Funzione non disponibile",
        description: "Il tuo browser non supporta la sintesi vocale",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(cleanedContent).then(() => {
      toast({
        title: "Copiato!",
        description: "La storia è stata copiata negli appunti",
      });
    });
  };

  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = () => {
    if (!storyTitle.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci un titolo per la storia!",
        variant: "destructive"
      });
      return;
    }
    onSave(storyTitle);
    setShowSaveDialog(false);
  };

  const handleEditClick = () => {
    setShowEditDialog(true);
  };

  const handleEditSave = () => {
    setCurrentContent(editableContent);
    setShowEditDialog(false);
    toast({
      title: "Modifiche salvate",
      description: "Il testo è stato aggiornato con successo",
    });
  };

  if (showSaveDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle>Salva la tua storia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Titolo della storia:</label>
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Inserisci il titolo..."
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Annulla
                </Button>
                <Button onClick={handleSaveConfirm} className="bg-green-600 hover:bg-green-700">
                  Salva
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showEditDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle>Modifica la tua storia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[400px] font-mono text-sm"
                placeholder="Modifica il testo della tua storia..."
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Annulla
                </Button>
                <Button onClick={handleEditSave} className="bg-blue-600 hover:bg-blue-700">
                  Salva modifiche
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
      <HomeButton />
      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onExit} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">La tua storia è completa!</h1>
              <p className="text-slate-600">Il Viaggio dell'Eroe di {profileName || 'Anonimo'}</p>
            </div>
          </div>
        </div>

        {/* Story display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-center">Il Viaggio dell'Eroe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <p className="text-slate-800 leading-relaxed whitespace-pre-line text-lg">
                  {cleanedContent}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={handleListen} className="bg-blue-600 hover:bg-blue-700">
            <Volume2 className="w-4 h-4 mr-2" />
            {isPlaying && isPaused ? 'RIPRENDI' : isPlaying ? 'PAUSA' : 'ASCOLTA'}
          </Button>
          
          <Button variant="outline" onClick={onLanguageToggle}>
            <Languages className="w-4 h-4 mr-2" />
            {language === 'italian' ? 'ENGLISH' : 'ITALIANO'}
          </Button>
          
          <Button variant="outline" onClick={handleEditClick}>
            <Edit className="w-4 h-4 mr-2" />
            MODIFICA
          </Button>
          
          <Button variant="outline" onClick={handleSaveClick}>
            <Save className="w-4 h-4 mr-2" />
            SALVA
          </Button>
          
          <Button variant="outline" onClick={handleShare}>
            <Share className="w-4 h-4 mr-2" />
            CONDIVIDI
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CampbellFinalScreen;