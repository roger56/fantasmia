import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveStoryImage } from '@/utils/userStorage';
import { supabase } from '@/integrations/supabase/client';

interface MediaGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyContent: string;
  storyTitle: string;
  storyId: string;
  userId: string;
}

const MediaGenerationDialog: React.FC<MediaGenerationDialogProps> = ({
  open,
  onOpenChange,
  storyContent,
  storyTitle,
  storyId,
  userId
}) => {
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [userComment, setUserComment] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
  };

  const handleGenerate = async () => {
    if (!selectedStyle) {
      toast({
        title: "Seleziona uno stile",
        description: "Devi selezionare uno stile per generare l'immagine",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Always include "no text" instruction by default, then add user comments
      const baseInstruction = "nessun testo scritto interno al disegno";
      const prompt = userComment 
        ? `${storyContent}\n\nNote aggiuntive: ${baseInstruction}, ${userComment}`
        : `${storyContent}\n\nNote aggiuntive: ${baseInstruction}`;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt,
          style: selectedStyle,
          storyId,
          storyTitle,
          userId
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setShowPreview(true);
        toast({
          title: "Immagine generata!",
          description: "Anteprima pronta per la revisione"
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la generazione dell'immagine",
        variant: "destructive"
      });
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (generatedImage) {
      saveStoryImage(storyId, generatedImage, selectedStyle);
      toast({
        title: "Immagine salvata!",
        description: "L'immagine è stata associata alla storia"
      });
      onOpenChange(false);
      resetDialog();
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `${storyTitle}-${selectedStyle}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetDialog = () => {
    setSelectedStyle('');
    setUserComment('');
    setGeneratedImage('');
    setShowPreview(false);
    setIsGenerating(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  const styles = [
    { value: 'fumetto', label: '🎨 Fumetto', description: 'Stile cartoon colorato' },
    { value: 'fotografico', label: '📸 Fotografico', description: 'Realismo fotografico' },
    { value: 'astratto', label: '🎭 Astratto', description: 'Arte astratta' },
    { value: 'manga', label: '🎌 Manga', description: 'Stile anime giapponese' },
    { value: 'acquarello', label: '🖌️ Acquarello', description: 'Pittura ad acquarello' },
    { value: 'carboncino', label: '✏️ Carboncino', description: 'Disegno a carboncino' }
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Genera Disegno per la Storia</DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="style">Seleziona lo stile</Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Scegli uno stile artistico" />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div className="flex flex-col">
                        <span>{style.label}</span>
                        <span className="text-xs text-muted-foreground">{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comment">Commenti aggiuntivi (opzionale)</Label>
              <Textarea
                id="comment"
                placeholder="es: colori vivaci, stile specifico... (già incluso automaticamente: nessun testo nel disegno)"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <img 
                src={generatedImage} 
                alt="Immagine generata" 
                className="max-w-full h-auto rounded-lg border"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Stile: {styles.find(s => s.value === selectedStyle)?.label}
            </p>
          </div>
        )}

        <DialogFooter>
          {!showPreview ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !selectedStyle}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  'Genera Immagine'
                )}
              </Button>
            </>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Indietro
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Scarica
              </Button>
              <Button onClick={handleConfirm}>
                Conferma e Salva
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaGenerationDialog;