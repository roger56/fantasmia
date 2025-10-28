import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import { CLOUD_ENABLED, supabase } from '@/integrations/supabase/client';
import { base64ToBlobSafe, convertImageToBlob } from '@/utils/base64Utils';

interface MediaGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyContent: string;
  storyTitle: string;
  storyId: string;
  userId: string;
}

interface PreviewSource {
  kind: 'blob' | 'dataURL';
  blob?: Blob;
  dataURL?: string;
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
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<PreviewSource | null>(null);
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
      
      }
      
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
          userId,
          response_format: 'b64_json' // Force base64 response to avoid remote URLs
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        // FORCE LOCAL-ONLY: Convert all to local preview data
        let previewSourceData: PreviewSource;
        
        if (data.imageUrl.startsWith('data:image')) {
          // Base64 from API - convert to dataURL
          previewSourceData = {
            kind: 'dataURL',
            dataURL: data.imageUrl,
            mime: data.imageUrl.split(',')[0].split(':')[1].split(';')[0]
          };
          console.info('preview-ready', { kind: 'dataURL', dataLen: data.imageUrl.length, mime: previewSourceData.mime });
        } else {
          // Remote URL fallback - fetch ONCE immediately to create local blob
          try {
            console.warn('Remote URL received, fetching once for local preview:', data.imageUrl);
            const response = await fetch(data.imageUrl, { mode: 'cors', cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) throw new Error(`Invalid content type: ${blob.type}`);
            if (blob.size < 10240) throw new Error('Anteprima vuota');
            
            previewSourceData = {
              kind: 'blob',
              blob,
              mime: blob.type
            };
            console.info('preview-ready', { kind: 'blob', blobSize: blob.size, mime: blob.type });
          } catch (fetchError) {
            console.error('preview-error', { step: 'build-preview', message: fetchError?.message });
            toast({
              title: "Errore", 
              description: "Rigenera immagine (formato base64) - impossibile caricare anteprima",
              variant: "destructive"
            });
            return;
          }
        }
        
        previewRef.current = previewSourceData;
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
    const previewSource = previewRef.current;
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
      
      // Detailed telemetry
      console.info({ 
        step: 'preview-kind', 
        kind: previewSource.kind, 
        hasBlob: !!previewSource.blob, 
        dataURLlen: previewSource.dataURL?.length 
      });
      
      let blob: Blob;
      let source: string;
      
      // Convert preview source to blob - LOCAL DATA ONLY
      if (previewSource.kind === 'blob' && previewSource.blob) {
        console.info({ step: 'convert-start', path: 'blob' });
        blob = previewSource.blob;
        source = 'openai';
      } else if (previewSource.kind === 'dataURL' && previewSource.dataURL) {
        console.info({ step: 'convert-start', path: 'dataURL' });
        // Use safe base64 converter for robust conversion
        blob = base64ToBlobSafe(previewSource.dataURL);
        source = 'openai';
      } else {
        throw new Error('Only blob and dataURL preview sources are supported for saving. No remote fetching allowed.');
      }
      
      console.info({ step: 'convert-done', mime: blob.type, size: blob.size });

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

      // Atomic transaction: save media asset and update story flag (auto-detect type)
      await fantasMiaDB.saveMediaAssetWithStoryUpdate(mediaAsset, normalizedStoryId);
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
        window.dispatchEvent(new CustomEvent('am:changed')); // REQUISITO: Lista reattiva
      } else {
        throw new Error('Post-save verification failed: media count is 0');
      }
      
      // Show success toast
      toast({
        title: "Immagine salvata con successo!",
        description: "L'immagine è stata associata alla storia e sarà visibile nelle liste",
        duration: 2000
      });
      
      // Clean up any object URLs if they were created for display
      // (Object URLs are no longer stored in previewSource, but may exist from img display)
      
      onOpenChange(false);
      resetDialog();
        
    } catch (error) {
      // Detailed telemetry
      console.error({ 
        step: 'convert-error', 
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
    const previewSource = previewRef.current;
    if (!previewSource) return;
    
    try {
      let blob: Blob;
      let filename: string;
      
      if (previewSource.kind === 'blob' && previewSource.blob) {
        blob = previewSource.blob;
      } else if (previewSource.kind === 'dataURL' && previewSource.dataURL) {
        // Use safe base64 converter
        blob = base64ToBlobSafe(previewSource.dataURL);
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
    // Don't revoke objectURL here - only after successful save
    previewRef.current = null;
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

  const previewSource = previewRef.current;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="dlg-desc-media-generation">
        <DialogHeader>
          <DialogTitle>Genera Disegno per la Storia</DialogTitle>
        </DialogHeader>
        <DialogDescription id="dlg-desc-media-generation">
          Seleziona uno stile artistico e genera un'immagine per accompagnare la tua storia.
        </DialogDescription>

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
                src={previewSource?.kind === 'dataURL' ? previewSource.dataURL : previewSource?.blob ? URL.createObjectURL(previewSource.blob) : ''}
                alt="Immagine generata" 
                className="max-w-full h-auto rounded-lg border"
                onLoad={(e) => {
                  // Clean up object URL after image loads to prevent memory leaks
                  if (previewSource?.kind === 'blob' && e.currentTarget.src.startsWith('blob:')) {
                    // Store reference for cleanup on unmount/close
                  }
                }}
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