import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Volume2, Languages, Save, Share, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

interface CSSFinalScreenProps {
  initialQuestion: string;
  storyContent: string;
  onExit: () => void;
  onSave: (title: string) => void;
  profileName?: string;
  language: 'italian' | 'english';
  onLanguageToggle: () => void;
  isTranslating: boolean;
}

const CSSFinalScreen: React.FC<CSSFinalScreenProps> = ({
  initialQuestion,
  storyContent,
  onExit,
  onSave,
  profileName,
  language,
  onLanguageToggle,
  isTranslating
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(storyContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setEditedContent(storyContent);
  }, [storyContent]);

  useEffect(() => {
    if (textareaRef.current && editMode) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editedContent, editMode]);

  const handleListen = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        const content = editMode ? editedContent : storyContent;
        if (content) {
          const utterance = new SpeechSynthesisUtterance(content);
          utterance.lang = language === 'italian' ? 'it-IT' : 'en-US';
          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => setIsPlaying(false);
          speechSynthesis.speak(utterance);
          setIsPlaying(true);
        }
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
    const content = editMode ? editedContent : storyContent;
    navigator.clipboard.writeText(content).then(() => {
      toast({
        title: "Copiato!",
        description: "La storia è stata copiata negli appunti",
      });
    });
  };

  const handleSaveClick = () => {
    const content = editMode ? editedContent : storyContent;
    if (!content.trim()) {
      toast({
        title: "Attenzione",
        description: "Non c'è nessuna storia da salvare!",
        variant: "destructive"
      });
      return;
    }
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

  if (showSaveDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
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
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onExit} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                La tua storia è completa!
              </h1>
              <p className="text-slate-600">Domanda iniziale: {initialQuestion}</p>
              {profileName && (
                <p className="text-slate-500 text-sm">Autore: {profileName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Story Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">La tua storia</CardTitle>
              <Button
                variant="outline"
                onClick={() => setEditMode(!editMode)}
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                {editMode ? 'Visualizza' : 'Modifica'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editMode ? (
              <Textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[300px] resize-none overflow-hidden"
                style={{ height: 'auto' }}
                placeholder="Modifica la tua storia qui..."
              />
            ) : (
              <div className="bg-slate-50 p-6 rounded-lg min-h-[300px]">
                <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                  {editMode ? editedContent : storyContent}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button onClick={handleListen} variant="outline">
                <Volume2 className="w-4 h-4 mr-2" />
                {isPlaying ? 'PAUSA' : 'ASCOLTA'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onLanguageToggle}
                disabled={isTranslating}
              >
                <Languages className="w-4 h-4 mr-2" />
                {isTranslating ? 'Traduzione...' : (language === 'italian' ? 'ENGLISH' : 'ITALIANO')}
              </Button>
              
              <Button variant="outline" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                CONDIVIDI
              </Button>
              
              <Button onClick={handleSaveClick} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                SALVA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CSSFinalScreen;