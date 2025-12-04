import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Save, X, Loader2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAILoading } from '@/hooks/useAILoading';
import { fantasMiaDB } from '@/utils/indexedDB';
import CopyrightWarningDialog from './CopyrightWarningDialog';

interface SketchGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyContent: string;
  storyTitle?: string;
  storyId?: string;
  userId?: string;
  /** Pre-selected detail level (1 or 2) */
  initialDetailLevel?: 1 | 2;
  /** If provided, generate sketch from this existing image URL */
  sourceImageUrl?: string;
  onSketchSaved?: () => void;
}

// Sanitize content for API
const sanitizePromptContent = (content: string): string => {
  let sanitized = content;
  sanitized = sanitized.replace(/\n+/g, ' ');
  sanitized = sanitized.replace(/\s{2,}/g, ' ');
  sanitized = sanitized.replace(/[""'']/g, '"');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  const MAX_PROMPT_LENGTH = 2000;
  if (sanitized.length > MAX_PROMPT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_PROMPT_LENGTH) + '...';
  }
  return sanitized.trim();
};

const SketchGenerationDialog: React.FC<SketchGenerationDialogProps> = ({
  open,
  onOpenChange,
  storyContent,
  storyTitle = 'Storia',
  storyId,
  userId,
  initialDetailLevel = 1,
  sourceImageUrl,
  onSketchSaved
}) => {
  const { toast } = useToast();
  const { showLoading, hideLoading } = useAILoading();
  
  const [showCopyrightWarning, setShowCopyrightWarning] = useState(false);
  const [showDetailSelection, setShowDetailSelection] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  const [detailLevel, setDetailLevel] = useState<1 | 2>(initialDetailLevel);
  const [userNotes, setUserNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSketchUrl, setGeneratedSketchUrl] = useState<string | null>(null);
  const [generatedSketchBlob, setGeneratedSketchBlob] = useState<Blob | null>(null);

  // When dialog opens - simplified without initialDetailLevel in deps
  useEffect(() => {
    console.log("🖍️ SketchGenerationDialog useEffect: open=", open, "initialDetailLevel=", initialDetailLevel);
    
    if (open) {
      console.log("🖍️ Dialog opening, setting detailLevel and showing copyright warning");
      // Always set detail level from prop and show copyright warning
      setDetailLevel(initialDetailLevel);
      setShowCopyrightWarning(true);
      console.log("🖍️ showCopyrightWarning set to true");
    } else {
      // Reset state when closing
      console.log("🖍️ Dialog closing, resetting all states");
      setShowCopyrightWarning(false);
      setShowDetailSelection(false);
      setShowNotesDialog(false);
      setShowResultDialog(false);
      setGeneratedSketchUrl(null);
      setGeneratedSketchBlob(null);
      setUserNotes('');
    }
  }, [open]); // Removed initialDetailLevel from dependencies

  const handleDetailSelected = (level: 1 | 2) => {
    setDetailLevel(level);
    setShowDetailSelection(false);
    setShowCopyrightWarning(true);
  };

  const handleCopyrightConfirm = () => {
    console.log("🖍️ Copyright confirmed, opening notes dialog");
    setShowCopyrightWarning(false);
    setShowNotesDialog(true);
  };

  const handleGenerate = async () => {
    setShowNotesDialog(false);
    setIsGenerating(true);
    showLoading('Generazione schizzo in corso...');

    try {
      const sanitizedContent = sanitizePromptContent(storyContent);
      
      // Build the sketch-specific prompt
      const detailDescription = detailLevel === 1 
        ? 'linee spesse e contorni semplici, minimo dettaglio, adatto a bambini piccoli per colorare facilmente'
        : 'linee sottili e dettagliate, contorni precisi, adatto a bambini più grandi per colorare con precisione';
      
      const sketchPrompt = `Crea uno schizzo a contorni in bianco e nero puro, stile line art per colorare. 
${detailDescription}. 
L'immagine deve essere SOLO in bianco e nero, senza sfumature di grigio, senza ombreggiature, senza riempimenti.
IMPORTANTE: L'immagine NON deve contenere testi, parole, scritte, numeri o lettere di alcun tipo.
Basato su: ${sanitizedContent}${userNotes ? ` Note aggiuntive: ${userNotes}` : ''}`;

      console.log('🖍️ Generating sketch with prompt:', sketchPrompt.substring(0, 200) + '...');

      const openAiImageUrl = import.meta.env.VITE_OPENAI_API_URL || 'https://fantasmia-ai.vercel.app/api/openai/image';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(openAiImageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          prompt: sketchPrompt,
          style: 'sketch' // Special style for black and white line art
        }),
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Sketch API error:', response.status, errorText);
        throw new Error(`Errore API: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Sketch API response:', { hasBase64: !!data.image_base64, hasUrl: !!data.image_url });

      let imageDataUrl: string | null = null;

      if (data.image_base64) {
        imageDataUrl = `data:image/png;base64,${data.image_base64}`;
      } else if (data.image_url) {
        imageDataUrl = data.image_url;
      }

      if (!imageDataUrl) {
        throw new Error('Nessuna immagine ricevuta dal server');
      }

      // Convert to blob for potential saving
      if (imageDataUrl.startsWith('data:')) {
        const [header, base64Data] = imageDataUrl.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        setGeneratedSketchBlob(new Blob([bytes], { type: mime }));
      }

      setGeneratedSketchUrl(imageDataUrl);
      setShowResultDialog(true);

      toast({
        title: 'Schizzo generato',
        description: 'Lo schizzo da colorare è pronto'
      });

    } catch (error) {
      console.error('💥 Sketch generation error:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Errore nella generazione dello schizzo',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
      hideLoading();
    }
  };

  const handleDownload = async () => {
    if (!generatedSketchUrl) return;

    try {
      let blobToDownload = generatedSketchBlob;
      
      if (!blobToDownload && generatedSketchUrl) {
        const response = await fetch(generatedSketchUrl);
        if (!response.ok) throw new Error('Failed to fetch sketch');
        blobToDownload = await response.blob();
      }

      if (!blobToDownload) {
        throw new Error('Blob non disponibile');
      }

      const url = URL.createObjectURL(blobToDownload);
      const safeFilename = storyTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFilename}-schizzo-livello${detailLevel}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download completato',
        description: 'Lo schizzo è stato scaricato'
      });
    } catch (error) {
      console.error('❌ Download error:', error);
      toast({
        title: 'Errore Download',
        description: 'Impossibile scaricare lo schizzo',
        variant: 'destructive'
      });
    }
  };

  const handleSaveAsMainImage = async () => {
    if (!storyId || !generatedSketchBlob) {
      toast({
        title: 'Errore',
        description: 'ID storia o schizzo non disponibile',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Check if existing image exists
      const existingMedia = await fantasMiaDB.getLatestMediaAssetByStoryId(storyId);
      
      if (existingMedia) {
        const confirmReplace = confirm(
          '⚠️ Esiste già un disegno associato a questa storia.\n\n' +
          'Vuoi sostituirlo con lo schizzo da colorare?\n\n' +
          '✅ OK = Sostituisci il disegno precedente\n' +
          '❌ Annulla = Mantieni il disegno esistente'
        );

        if (!confirmReplace) {
          toast({
            title: 'Operazione annullata',
            description: 'Il disegno esistente è stato mantenuto'
          });
          return;
        }

        // Delete existing media
        await fantasMiaDB.deleteMediaAsset(existingMedia.id);
        console.log('🗑️ Existing image deleted:', existingMedia.id);
      }

      // Save sketch as new media asset
      const assetId = `${storyId}-sketch-${Date.now()}`;
      const asset = {
        id: assetId,
        storyId: String(storyId),
        ownerProfileId: userId || 'superuser',
        type: 'image' as const,
        source: 'openai' as const,
        mime: generatedSketchBlob.type || 'image/png',
        size: generatedSketchBlob.size,
        createdAt: new Date().toISOString(),
        data: generatedSketchBlob,
        metadata: {
          style: 'sketch',
          isSketch: true,
          sketchDetailLevel: detailLevel
        }
      };

      await fantasMiaDB.saveMediaAsset(asset);
      console.log('💾 Sketch saved as main image:', assetId);

      // Update story hasImage flag
      const storyType = await fantasMiaDB.detectStoryType(storyId);
      if (storyType === 'am') {
        const amStory = await fantasMiaDB.getAMStoryById(storyId);
        if (amStory) {
          amStory.hasImage = true;
          await fantasMiaDB.saveAMStory(amStory);
        }
      } else if (storyType === 'ag') {
        const agStory = await fantasMiaDB.getAGStoryById(storyId);
        if (agStory) {
          agStory.has_image = true;
          await fantasMiaDB.saveAGStory(agStory);
        }
      }

      toast({
        title: 'Schizzo salvato',
        description: 'Lo schizzo è stato salvato come immagine della storia'
      });

      onSketchSaved?.();
      setShowResultDialog(false);
      onOpenChange(false);

    } catch (error) {
      console.error('❌ Error saving sketch:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare lo schizzo',
        variant: 'destructive'
      });
    }
  };

  const handleDiscard = () => {
    setShowResultDialog(false);
    setGeneratedSketchUrl(null);
    setGeneratedSketchBlob(null);
    onOpenChange(false);
  };

  return (
    <>
      {/* Copyright Warning Dialog */}
      <CopyrightWarningDialog
        open={showCopyrightWarning}
        onOpenChange={(open) => {
          setShowCopyrightWarning(open);
          if (!open) onOpenChange(false);
        }}
        onConfirm={handleCopyrightConfirm}
        selectedStyle="sketch"
      />

      {/* Detail Level Selection Dialog */}
      <Dialog open={showDetailSelection} onOpenChange={(open) => {
        setShowDetailSelection(open);
        if (!open) onOpenChange(false);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Seleziona livello di dettaglio
            </DialogTitle>
            <DialogDescription>
              Scegli il livello di dettaglio per lo schizzo da colorare
            </DialogDescription>
          </DialogHeader>
          
          <RadioGroup 
            value={String(detailLevel)} 
            onValueChange={(v) => setDetailLevel(Number(v) as 1 | 2)}
            className="space-y-4 py-4"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                 onClick={() => handleDetailSelected(1)}>
              <RadioGroupItem value="1" id="level-1" />
              <div className="flex-1">
                <Label htmlFor="level-1" className="font-medium cursor-pointer">
                  Livello 1 - Linee spesse (semplice)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Contorni grandi e semplici, ideale per bambini piccoli
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                 onClick={() => handleDetailSelected(2)}>
              <RadioGroupItem value="2" id="level-2" />
              <div className="flex-1">
                <Label htmlFor="level-2" className="font-medium cursor-pointer">
                  Livello 2 - Linee sottili (dettagliato)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Contorni precisi e dettagliati, per bambini più grandi
                </p>
              </div>
            </div>
          </RadioGroup>
        </DialogContent>
      </Dialog>

      {/* Additional Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={(open) => {
        setShowNotesDialog(open);
        if (!open) onOpenChange(false);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Note aggiuntive (opzionale)
            </DialogTitle>
            <DialogDescription>
              Aggiungi indicazioni specifiche per lo schizzo da colorare
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p><strong>Livello selezionato:</strong> {detailLevel === 1 ? 'Linee spesse (semplice)' : 'Linee sottili (dettagliato)'}</p>
            </div>
            
            <Textarea
              placeholder="Es: 'Metti in evidenza il protagonista', 'Aggiungi più fiori sullo sfondo'..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNotesDialog(false); onOpenChange(false); }}>
              Annulla
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generazione...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Genera schizzo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog with sketch preview */}
      <Dialog open={showResultDialog} onOpenChange={(open) => {
        if (!open) handleDiscard();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Schizzo da colorare generato
            </DialogTitle>
            <DialogDescription>
              Livello {detailLevel}: {detailLevel === 1 ? 'Linee spesse (semplice)' : 'Linee sottili (dettagliato)'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Sketch preview */}
            <div className="flex justify-center">
              {generatedSketchUrl ? (
                <img 
                  src={generatedSketchUrl} 
                  alt="Schizzo da colorare"
                  className="max-w-full max-h-[50vh] rounded-lg border shadow-sm"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <div className="h-64 w-full bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Anteprima non disponibile</p>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Scarica
              </Button>
              
              <Button onClick={handleSaveAsMainImage}>
                <Save className="w-4 h-4 mr-2" />
                Salva come immagine storia
              </Button>
              
              <Button variant="ghost" onClick={handleDiscard}>
                <X className="w-4 h-4 mr-2" />
                Scarta
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              💡 Stampa lo schizzo e fallo colorare ai bambini!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SketchGenerationDialog;
