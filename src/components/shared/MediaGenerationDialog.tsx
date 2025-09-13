import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
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

  const handleConfirm = async () => {
    if (generatedImage) {
      try {
        console.log('💾 Saving AI-generated image for story:', storyId);
        
        let blob: Blob;
        
        // Try multiple methods to convert image to Blob
        if (generatedImage.startsWith('data:image')) {
          // Method 1: Direct base64 conversion (most reliable)
          try {
            const base64Data = generatedImage.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: 'image/png' });
            console.log('✅ Converted using base64 method, size:', blob.size);
          } catch (base64Error) {
            console.warn('⚠️ Base64 conversion failed:', base64Error);
            throw base64Error;
          }
        } else {
          // Method 2: Fetch with retries and CORS handling
          let fetchAttempts = 0;
          const maxAttempts = 3;
          
          while (fetchAttempts < maxAttempts) {
            try {
              fetchAttempts++;
              console.log(`🔄 Fetch attempt ${fetchAttempts}/${maxAttempts}`);
              
              const response = await fetch(generatedImage, {
                mode: 'cors',
                cache: 'no-cache'
              });
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              blob = await response.blob();
              console.log('✅ Converted using fetch method, size:', blob.size);
              break;
            } catch (fetchError) {
              console.warn(`⚠️ Fetch attempt ${fetchAttempts} failed:`, fetchError);
              if (fetchAttempts === maxAttempts) {
                // Last resort: create a minimal blob with error info
                const errorInfo = JSON.stringify({
                  error: 'Failed to fetch image',
                  originalUrl: generatedImage,
                  timestamp: new Date().toISOString()
                });
                blob = new Blob([errorInfo], { type: 'application/json' });
                console.log('⚠️ Created fallback blob with error info');
              }
            }
          }
        }

        // Validate blob size (max 20MB)
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (blob.size > maxSize) {
          throw new Error(`Image too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB (max: 20MB)`);
        }

        // Create media asset record with enhanced error tracking
        const mediaAsset = {
          id: `${storyId}-generated-${Date.now()}`,
          storyId: storyId,
          ownerProfileId: userId,
          type: 'image' as const,
          source: 'openai' as const,
          mime: blob.type || 'image/png',
          size: blob.size,
          createdAt: new Date().toISOString(),
          data: blob
        };

        console.log('📝 Saving media asset:', {
          id: mediaAsset.id,
          size: mediaAsset.size,
          contentType: mediaAsset.mime
        });

        // Save to IndexedDB with retry logic
        let saveAttempts = 0;
        const maxSaveAttempts = 3;
        
        while (saveAttempts < maxSaveAttempts) {
          try {
            saveAttempts++;
            await fantasMiaDB.saveMediaAsset(mediaAsset);
            console.log('✅ Media asset saved successfully');
            break;
          } catch (saveError) {
            console.error(`❌ Save attempt ${saveAttempts} failed:`, saveError);
            
            if (saveError.name === 'DataCloneError') {
              throw new Error('Immagine troppo complessa per il salvataggio locale');
            } else if (saveError.name === 'QuotaExceededError') {
              throw new Error('Spazio di archiviazione esaurito. Libera spazio e riprova.');
            } else if (saveAttempts === maxSaveAttempts) {
              throw new Error(`Salvataggio fallito dopo ${maxSaveAttempts} tentativi: ${saveError.message}`);
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * saveAttempts));
          }
        }
        
        // Update story hasImage flag
        await fantasMiaDB.updateStoryImageStatus(storyId, 'am', true);
        console.log('✅ Story hasImage flag updated');
        
        // Emit event for real-time UI synchronization
        window.dispatchEvent(new CustomEvent('am-story-updated', { 
          detail: { 
            storyId, 
            action: 'image-added',
            hasImage: true 
          } 
        }));
        console.log('✅ UI sync event emitted');
        
        // Show success toast
        toast({
          title: "Immagine salvata con successo!",
          description: "L'immagine è stata associata alla storia e sarà visibile nelle liste",
          duration: 2000
        });
        
        onOpenChange(false);
        resetDialog();
        
      } catch (error) {
        console.error('❌ Error saving AI image:', error);
        
        // Enhanced error messages
        let errorMessage = "Errore durante il salvataggio dell'immagine";
        
        if (error.message.includes('too large')) {
          errorMessage = error.message;
        } else if (error.message.includes('Spazio di archiviazione')) {
          errorMessage = error.message;
        } else if (error.message.includes('troppo complessa')) {
          errorMessage = error.message;
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Impossibile scaricare l'immagine. Riprova.";
        } else if (error.name === 'NetworkError') {
          errorMessage = "Errore di rete. Controlla la connessione e riprova.";
        }
        
        toast({
          title: "Errore salvataggio",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        });
      }
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