import React, { useState, useRef } from 'react';
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

interface PreviewSource {
  kind: 'blob' | 'dataURL' | 'objectURL';
  blob?: Blob;
  dataURL?: string;
  objectURL?: string;
  mime?: string;
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
  const [previewSource, setPreviewSource] = useState<PreviewSource | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
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
        // Determine the preview source type and prepare unified source
        let previewSourceData: PreviewSource;
        
        if (data.imageUrl.startsWith('data:image')) {
          // DataURL from API
          previewSourceData = {
            kind: 'dataURL',
            dataURL: data.imageUrl,
            mime: data.imageUrl.split(',')[0].split(':')[1].split(';')[0]
          };
          console.info({ step: 'preview-kind', kind: 'dataURL', dataURLlen: data.imageUrl.length });
        } else {
          // External URL - convert to objectURL for preview
          try {
            const response = await fetch(data.imageUrl, { mode: 'cors', cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) throw new Error(`Invalid content type: ${blob.type}`);
            
            const objectURL = URL.createObjectURL(blob);
            previewSourceData = {
              kind: 'blob',
              blob,
              objectURL,
              mime: blob.type
            };
            console.info({ step: 'preview-kind', kind: 'blob', blobSize: blob.size });
          } catch (fetchError) {
            console.warn('Failed to fetch for preview, using URL directly:', fetchError);
            previewSourceData = {
              kind: 'objectURL',
              objectURL: data.imageUrl,
              mime: 'image/png' // fallback
            };
            console.info({ step: 'preview-kind', kind: 'objectURL-fallback' });
          }
        }
        
        setPreviewSource(previewSourceData);
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

  const convertCanvasToBlob = (img: HTMLImageElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Cannot create canvas context'));
        return;
      }

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      
      ctx.drawImage(img, 0, 0);
      
      // Try WebP first, fallback to PNG
      canvas.toBlob((blob) => {
        if (blob && blob.size >= 10240) { // 10KB minimum
          resolve(blob);
        } else {
          // Fallback to PNG
          canvas.toBlob((pngBlob) => {
            if (pngBlob && pngBlob.size >= 10240) {
              resolve(pngBlob);
            } else {
              reject(new Error('Canvas conversion resulted in invalid blob'));
            }
          }, 'image/png', 0.92);
        }
      }, 'image/webp', 0.92);
    });
  };

  const handleConfirm = async () => {
    if (!previewSource) {
      console.error({ step: 'confirm-save-error', error: 'No preview source available' });
      toast({
        title: "Errore",
        description: "Nessuna immagine da salvare",
        variant: "destructive"
      });
      return;
    }

    try {
      // Normalize IDs to ensure consistency
      const normalizedStoryId = String(storyId);
      const normalizedOwnerId = String(userId);
      
      console.info({ step: 'saving-from', kind: previewSource.kind, storyId: normalizedStoryId });
      
      let blob: Blob;
      let source: string;
      
      // Convert preview source to blob - NO NETWORK CALLS
      if (previewSource.kind === 'blob' && previewSource.blob) {
        blob = previewSource.blob;
        source = 'openai';
        console.info({ step: 'blob-direct', size: blob.size, mime: blob.type });
      } else if (previewSource.kind === 'dataURL' && previewSource.dataURL) {
        // Convert dataURL to blob
        const base64Data = previewSource.dataURL.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: previewSource.mime || 'image/png' });
        source = 'openai';
        console.info({ step: 'dataurl-converted', size: blob.size, mime: blob.type });
      } else if (previewSource.kind === 'objectURL' && imgRef.current) {
        // Canvas fallback - extract from displayed image
        try {
          blob = await convertCanvasToBlob(imgRef.current);
          source = 'canvas-fallback';
          console.info({ step: 'canvas-fallback', size: blob.size, mime: blob.type });
        } catch (canvasError) {
          throw new Error(`Canvas fallback failed: ${canvasError.message}`);
        }
      } else {
        throw new Error('No valid preview source available for saving');
      }

      // Validate blob size (minimum 10KB, max 20MB)
      const minSize = 10 * 1024; // 10KB
      const maxSize = 20 * 1024 * 1024; // 20MB
      
      if (blob.size < minSize) {
        throw new Error(`Immagine non valida (${(blob.size / 1024).toFixed(1)}KB), rigenera`);
      }
      
      if (blob.size > maxSize) {
        throw new Error(`Image too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB (max: 20MB)`);
      }

      // Create media asset record with normalized IDs
      const mediaAsset = {
        id: `${normalizedStoryId}-generated-${Date.now()}`,
        storyId: normalizedStoryId,
        ownerProfileId: normalizedOwnerId,
        type: 'image' as const,
        source: source as 'openai' | 'canvas-fallback',
        mime: blob.type || 'image/png',
        size: blob.size,
        createdAt: new Date().toISOString(),
        data: blob
      };

      console.info({ step: 'saving-from', kind: previewSource.kind, finalMime: mediaAsset.mime, finalSize: blob.size });

      // Atomic transaction: save media asset and update story flag
      await fantasMiaDB.saveMediaAssetWithStoryUpdate(mediaAsset, normalizedStoryId, 'am');
      console.info({ step: 'idb-write-done', storyId: normalizedStoryId });
      
      // Post-write verification and UI update
      const mediaCount = await fantasMiaDB.getMediaCountByStoryId(normalizedStoryId);
      
      if (mediaCount >= 1) {
        // Emit event for real-time UI synchronization
        window.dispatchEvent(new CustomEvent('media:updated', { 
          detail: { 
            storyId: normalizedStoryId, 
            count: mediaCount,
            action: 'image-added'
          } 
        }));
      } else {
        throw new Error('Post-save verification failed: media count is 0');
      }
      
      // Show success toast
      toast({
        title: "Immagine salvata con successo!",
        description: "L'immagine è stata associata alla storia e sarà visibile nelle liste",
        duration: 2000
      });
      
      onOpenChange(false);
      resetDialog();
        
    } catch (error) {
      // Detailed telemetry
      console.error({ 
        step: 'confirm-save-error', 
        storyId: String(storyId), 
        errorName: error?.name, 
        errorMessage: error?.message,
        previewKind: previewSource?.kind
      });
      
      // Enhanced error messages
      let errorMessage = "Errore durante il salvataggio dell'immagine";
      
      if (error.message.includes('non valida') || error.message.includes('rigenera')) {
        errorMessage = error.message;
      } else if (error.message.includes('too large')) {
        errorMessage = error.message;
      } else if (error.message.includes('Canvas fallback failed')) {
        errorMessage = "Impossibile convertire l'immagine, rigenera";
      } else if (error.message.includes('Post-save verification failed')) {
        errorMessage = "Salvataggio immagine non riuscito - verifica fallita";
      }
      
      toast({
        title: "Errore salvataggio",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleDownload = async () => {
    if (!previewSource) return;
    
    try {
      let blob: Blob;
      let filename: string;
      
      if (previewSource.kind === 'blob' && previewSource.blob) {
        blob = previewSource.blob;
      } else if (previewSource.kind === 'dataURL' && previewSource.dataURL) {
        // Convert dataURL to blob
        const base64Data = previewSource.dataURL.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: previewSource.mime || 'image/png' });
      } else if (previewSource.kind === 'objectURL' && imgRef.current) {
        blob = await convertCanvasToBlob(imgRef.current);
      } else {
        throw new Error('No valid source for download');
      }
      
      // Determine file extension from MIME type
      const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
      filename = `${storyTitle}-${selectedStyle}.${ext}`;
      
      const objectURL = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectURL;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectURL);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Errore download",
        description: "Impossibile scaricare l'immagine",
        variant: "destructive"
      });
    }
  };

  const resetDialog = () => {
    setSelectedStyle('');
    setUserComment('');
    if (previewSource?.objectURL) {
      URL.revokeObjectURL(previewSource.objectURL);
    }
    setPreviewSource(null);
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
                ref={imgRef}
                src={previewSource?.kind === 'dataURL' ? previewSource.dataURL : previewSource?.objectURL} 
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