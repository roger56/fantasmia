import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mic, MicOff, Volume2, Languages, Save, Share } from 'lucide-react';
import { CampbellCard } from '@/types/campbell';
import { useToast } from '@/hooks/use-toast';
import SpeechToText from '@/components/SpeechToText';
import HomeButton from '@/components/HomeButton';

interface CampbellWritingScreenProps {
  card: CampbellCard;
  currentContent: string;
  allContent: string;
  onContentChange: (content: string) => void;
  onBack: () => void;
  onSave: (title: string) => void;
  profileName?: string;
  language: 'italian' | 'english';
  onLanguageToggle: () => void;
}

const CampbellWritingScreen: React.FC<CampbellWritingScreenProps> = ({
  card,
  currentContent,
  allContent,
  onContentChange,
  onBack,
  onSave,
  profileName,
  language,
  onLanguageToggle
}) => {
  const [content, setContent] = useState(currentContent);
  const [isListening, setIsListening] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleContentUpdate = (newContent: string) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  const handleContinue = () => {
    if (content.trim()) {
      onBack();
    } else {
      toast({
        title: "Attenzione",
        description: "Scrivi qualcosa prima di continuare!",
        variant: "destructive"
      });
    }
  };

  const handleSpeechResult = (transcript: string) => {
    const newContent = content + (content ? ' ' : '') + transcript;
    handleContentUpdate(newContent);
    setIsListening(false);
  };

  const handleListen = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(allContent + (content ? '\n' + content : ''));
      utterance.lang = language === 'italian' ? 'it-IT' : 'en-US';
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Funzione non disponibile",
        description: "Il tuo browser non supporta la sintesi vocale",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    const fullStory = allContent + (content ? '\n' + content : '');
    navigator.clipboard.writeText(fullStory).then(() => {
      toast({
        title: "Copiato!",
        description: "La storia è stata copiata negli appunti",
      });
    });
  };

  const handleSaveClick = () => {
    if (!content.trim()) {
      toast({
        title: "Attenzione",
        description: "Scrivi qualcosa prima di salvare!",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Carta #{card.id}: {card.title}
              </h1>
              <p className="text-slate-600">{card.description}</p>
            </div>
          </div>
        </div>

        {/* Story so far */}
        {allContent && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">La tua storia finora:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-slate-700 whitespace-pre-line">{allContent}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Writing area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Continua la storia:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentUpdate(e.target.value)}
              placeholder="Scrivi qui il seguito della tua storia..."
              className="min-h-[120px] resize-none overflow-hidden"
              style={{ height: 'auto' }}
            />
            
            {/* Speech to text */}
            <SpeechToText
              onResult={handleSpeechResult}
            />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleContinue} className="bg-blue-600 hover:bg-blue-700">
                Continua
              </Button>
              
              <Button variant="outline" onClick={handleListen}>
                <Volume2 className="w-4 h-4 mr-2" />
                ASCOLTA
              </Button>
              
              <Button variant="outline" onClick={onLanguageToggle}>
                <Languages className="w-4 h-4 mr-2" />
                {language === 'italian' ? 'ENGLISH' : 'ITALIANO'}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CampbellWritingScreen;