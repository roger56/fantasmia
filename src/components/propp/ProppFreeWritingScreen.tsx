import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Pause, Save, Play, Volume2, Share2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SpeechToText from '@/components/SpeechToText';
import ProppFreeCardGrid from './ProppFreeCardGrid';
import { ProppCard } from '@/types/propp';
import HomeButton from '@/components/HomeButton';

interface ProppFreeWritingScreenProps {
  selectedCard: ProppCard | null;
  usedCards: number[];
  storyText: string;
  currentParagraph: string;
  onStoryTextChange: (text: string) => void;
  onCurrentParagraphChange: (text: string) => void;
  onCardSelect: (card: ProppCard) => void;
  onCardChange: () => void;
  onFinishStory: () => void;
  onSuspend: () => void;
  onSave: () => void;
  onExit: () => void;
}

const ProppFreeWritingScreen: React.FC<ProppFreeWritingScreenProps> = ({
  selectedCard,
  usedCards,
  storyText,
  currentParagraph,
  onStoryTextChange,
  onCurrentParagraphChange,
  onCardSelect,
  onCardChange,
  onFinishStory,
  onSuspend,
  onSave,
  onExit
}) => {
  const { toast } = useToast();
  const [isReading, setIsReading] = useState(false);

  const handleSpeechResult = (text: string) => {
    onCurrentParagraphChange(currentParagraph + ' ' + text);
  };

  const handleAddToStory = () => {
    if (!currentParagraph.trim()) {
      toast({
        title: "Testo richiesto",
        description: "Scrivi qualcosa prima di aggiungere alla storia",
        variant: "destructive"
      });
      return;
    }

    const newStoryText = storyText + (storyText ? '\n\n' : '') + currentParagraph;
    onStoryTextChange(newStoryText);
    onCurrentParagraphChange('');
    
    toast({
      title: "Aggiunto alla storia!",
      description: "Il testo è stato aggiunto alla storia completa"
    });
  };

  const handleListen = () => {
    if (!storyText) {
      toast({
        title: "Nessuna storia da leggere",
        description: "Scrivi qualcosa prima di usare la funzione di lettura",
        variant: "destructive"
      });
      return;
    }

    if ('speechSynthesis' in window) {
      if (isReading) {
        window.speechSynthesis.cancel();
        setIsReading(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(storyText);
        utterance.lang = 'it-IT';
        utterance.onend = () => setIsReading(false);
        utterance.onerror = () => setIsReading(false);
        window.speechSynthesis.speak(utterance);
        setIsReading(true);
      }
    } else {
      toast({
        title: "Funzione non supportata",
        description: "Il tuo browser non supporta la sintesi vocale",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    if (!storyText) {
      toast({
        title: "Nessuna storia da condividere",
        description: "Scrivi qualcosa prima di condividere",
        variant: "destructive"
      });
      return;
    }

    navigator.clipboard.writeText(storyText).then(() => {
      toast({
        title: "Storia copiata!",
        description: "Il testo è stato copiato negli appunti"
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onExit} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">Propp - Carte Libere</h1>
          </div>
          
        </div>

        <div className="space-y-6">
          {/* Remaining Cards */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>🃏 Carte disponibili ({31 - usedCards.length})</span>
                {selectedCard && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-blue-100 px-3 py-1 rounded-lg">
                      <span className="text-lg mr-2">{selectedCard.icon}</span>
                      <span className="font-medium text-blue-800">{selectedCard.name}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={onCardChange}>
                      Cambia Carta
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProppFreeCardGrid
                usedCards={usedCards}
                onCardSelect={onCardSelect}
              />
            </CardContent>
          </Card>

          {/* Current Writing */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                ✍️ Scrivi il capitolo corrente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={currentParagraph}
                onChange={(e) => onCurrentParagraphChange(e.target.value)}
                placeholder={selectedCard ? 
                  `Scrivi utilizzando la carta "${selectedCard.name}"...` : 
                  "Seleziona una carta per iniziare a scrivere..."
                }
                className="min-h-[150px] resize-none"
                disabled={!selectedCard}
              />
              
              {selectedCard && (
                <div className="mt-4 space-y-2">
                  <SpeechToText onResult={handleSpeechResult} />
                  <Button
                    onClick={handleAddToStory}
                    className="w-full"
                    disabled={!currentParagraph.trim()}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aggiungi alla Storia
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Story So Far */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                📖 Storia finora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={storyText}
                onChange={(e) => onStoryTextChange(e.target.value)}
                placeholder="La tua storia apparirà qui..."
                className="min-h-[200px] resize-none"
              />
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleListen}
                  className="flex-1"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  {isReading ? 'Stop' : 'Ascolta'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Condividi
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onFinishStory}>
              🏁 Fine Storia
            </Button>
            <Button variant="outline" onClick={onSuspend}>
              <Pause className="w-4 h-4 mr-2" />
              Sospendi
            </Button>
            <Button variant="outline" onClick={onSave}>
              <Save className="w-4 h-4 mr-2" />
              Salva
            </Button>
            <Button variant="outline" onClick={onExit}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProppFreeWritingScreen;