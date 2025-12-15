import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Save, X, Loader2, Pencil, Scissors, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAILoading } from '@/hooks/useAILoading';
import { fantasMiaDB } from '@/utils/indexedDB';
import { getStoryById } from '@/lib/storiesRepo';
import { supabase } from '@/integrations/supabase/client';
import CopyrightWarningDialog from './CopyrightWarningDialog';

interface SketchGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyContent?: string;
  storyTitle?: string;
  storyId?: string;
  userId?: string;
  /** Pre-selected detail level (1 or 2) */
  initialDetailLevel?: 1 | 2;
  /** If provided, generate sketch from this existing image URL */
  sourceImageUrl?: string;
  onSketchSaved?: () => void;
}

// Sanitize content for API - MAX 720 chars for scene text only (excludes prompt prefix)
const sanitizeSceneContent = (content: string, maxLength: number = 720): string => {
  let sanitized = content;
  sanitized = sanitized.replace(/\n+/g, ' ');
  sanitized = sanitized.replace(/\s{2,}/g, ' ');
  sanitized = sanitized.replace(/[""'']/g, '"');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
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
  
  // Refs to track dialog lifecycle and prevent premature resets
  const hasOpenedOnce = useRef(false);
  const isFlowInProgress = useRef(false);
  
  const [showCopyrightWarning, setShowCopyrightWarning] = useState(false);
  const [showDetailSelection, setShowDetailSelection] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  const [detailLevel, setDetailLevel] = useState<1 | 2>(initialDetailLevel);
  const [userNotes, setUserNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSketchUrl, setGeneratedSketchUrl] = useState<string | null>(null);
  const [generatedSketchBlob, setGeneratedSketchBlob] = useState<Blob | null>(null);
  
  // Resolved story content - fetched from IndexedDB if prop is empty
  const [resolvedStoryContent, setResolvedStoryContent] = useState<string>('');
  
  // Text length warning states
  const [showTextLengthWarning, setShowTextLengthWarning] = useState(false);
  const [isAbbreviating, setIsAbbreviating] = useState(false);

  // Load story content from IndexedDB if prop is empty
  useEffect(() => {
    const loadStoryContent = async () => {
      // Se abbiamo già storyContent valido dal prop, usalo
      if (storyContent && storyContent.trim().length > 0) {
        console.log('🖍️ Using storyContent from props, length:', storyContent.length);
        setResolvedStoryContent(storyContent);
        return;
      }
      
      // Altrimenti, recupera da IndexedDB usando storyId
      if (storyId) {
        console.log('🖍️ storyContent vuoto/mancante, recupero da IndexedDB per storyId:', storyId);
        try {
          const story = await getStoryById(storyId);
          if (story) {
            // AMStory usa 'text', AGStory usa 'content'
            const content = 'text' in story ? story.text : ('content' in story ? story.content : '');
            setResolvedStoryContent(content || '');
            console.log('🖍️ Contenuto recuperato da IndexedDB, length:', content?.length, 'preview:', content?.substring(0, 50));
          } else {
            console.warn('🖍️ Storia non trovata in IndexedDB per storyId:', storyId);
          }
        } catch (error) {
          console.error('🖍️ Errore recupero storia da IndexedDB:', error);
        }
      } else {
        console.warn('🖍️ Nessun storyId disponibile per recuperare il contenuto');
      }
    };
    
    if (open) {
      loadStoryContent();
    }
  }, [open, storyId, storyContent]);

  // When dialog opens - with protection against premature resets
  useEffect(() => {
    console.log("🖍️ SketchGenerationDialog useEffect: open=", open, "initialDetailLevel=", initialDetailLevel, "hasOpenedOnce=", hasOpenedOnce.current, "isFlowInProgress=", isFlowInProgress.current);
    
    if (open) {
      // First time opening - initialize everything
      if (!hasOpenedOnce.current) {
        console.log("🖍️ Dialog opening for the first time, setting detailLevel and showing copyright warning");
        hasOpenedOnce.current = true;
        isFlowInProgress.current = true;
        setDetailLevel(initialDetailLevel);
        setShowCopyrightWarning(true);
        console.log("🖍️ showCopyrightWarning set to true");
      }
    } else {
      // Only reset if we've actually completed or intentionally closed the flow
      // Don't reset if a sub-dialog is still open
      if (hasOpenedOnce.current && !showNotesDialog && !showResultDialog && !showCopyrightWarning && !showTextLengthWarning && !isFlowInProgress.current) {
        console.log("🖍️ Dialog closing intentionally, resetting all states");
        hasOpenedOnce.current = false;
        setShowCopyrightWarning(false);
        setShowDetailSelection(false);
        setShowNotesDialog(false);
        setShowResultDialog(false);
        setShowTextLengthWarning(false);
        setGeneratedSketchUrl(null);
        setGeneratedSketchBlob(null);
        setUserNotes('');
        setResolvedStoryContent('');
      } else {
        console.log("🖍️ Skipping reset - flow in progress or sub-dialog open");
      }
    }
  }, [open]); // Only depend on open

  const handleDetailSelected = (level: 1 | 2) => {
    setDetailLevel(level);
    setShowDetailSelection(false);
    setShowCopyrightWarning(true);
  };

  const handleCopyrightConfirm = () => {
    console.log("🖍️ Copyright confirmed, resolvedStoryContent length:", resolvedStoryContent?.length);
    
    // Validazione contenuto minimo
    if (!resolvedStoryContent || resolvedStoryContent.trim().length < 10) {
      toast({
        title: 'Contenuto insufficiente',
        description: 'La storia deve contenere testo per generare uno schizzo',
        variant: 'destructive'
      });
      setShowCopyrightWarning(false);
      onOpenChange(false);
      return;
    }
    
    // Controlla lunghezza - limite 650 caratteri per lasciare spazio alle note e al prefix
    const MAX_SCENE_LENGTH = 650;
    if (resolvedStoryContent.length > MAX_SCENE_LENGTH) {
      console.log("🖍️ Testo troppo lungo:", resolvedStoryContent.length, "char, mostrando warning");
      setShowCopyrightWarning(false);
      setShowTextLengthWarning(true);
      return;
    }
    
    setShowCopyrightWarning(false);
    setShowNotesDialog(true);
  };

  // Tronca il testo a 600 caratteri
  const handleTruncateText = () => {
    console.log("🖍️ Troncamento testo a 600 caratteri");
    const truncated = resolvedStoryContent.substring(0, 600);
    setResolvedStoryContent(truncated);
    setShowTextLengthWarning(false);
    setShowNotesDialog(true);
  };

  // Abbrevia il testo usando AI
  const handleAbbreviateText = async () => {
    console.log("🖍️ Abbreviazione testo con AI");
    setIsAbbreviating(true);
    showLoading('Abbreviazione testo in corso...');
    
    try {
      const { data, error } = await supabase.functions.invoke('improve-text', {
        body: {
          storyContent: resolvedStoryContent,
          style: 'abbrevia'
        }
      });
      
      if (error) {
        console.error('❌ Errore abbreviazione:', error);
        throw error;
      }
      
      if (data?.improvedText) {
        console.log("✅ Testo abbreviato, nuova lunghezza:", data.improvedText.length);
        setResolvedStoryContent(data.improvedText);
        setShowTextLengthWarning(false);
        setShowNotesDialog(true);
      } else {
        throw new Error('Nessun testo abbreviato ricevuto');
      }
      
    } catch (error) {
      console.error('❌ Errore abbreviazione AI:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile abbreviare il testo. Prova a troncarlo manualmente.',
        variant: 'destructive'
      });
    } finally {
      setIsAbbreviating(false);
      hideLoading();
    }
  };

  const handleGenerate = async () => {
    // Validazione finale prima della chiamata API
    if (!resolvedStoryContent || resolvedStoryContent.trim().length < 10) {
      toast({
        title: 'Contenuto insufficiente',
        description: 'La storia deve contenere testo per generare uno schizzo',
        variant: 'destructive'
      });
      return;
    }
    
    setShowNotesDialog(false);
    setIsGenerating(true);
    showLoading('Generazione schizzo in corso...');

    try {
      // Fixed prompt prefix (NOT counted in 720 char limit)
      const promptPrefix = `A clean black and white line drawing, like a coloring book page for a 6-year-old child. The image should have bold, well-defined outlines, no shading, no color, and simple shapes. The style should be playful and easy to color. Show the following scene: `;
      
      // Scene content - MAX 720 characters - usa resolvedStoryContent
      const sanitizedStory = sanitizeSceneContent(resolvedStoryContent);
      const sceneWithNotes = userNotes 
        ? `${sanitizedStory}. Additional notes: ${userNotes}` 
        : sanitizedStory;
      
      // Enforce 720 char limit on scene only
      const finalScene = sceneWithNotes.length > 720 
        ? sceneWithNotes.substring(0, 720) 
        : sceneWithNotes;
      
      const sketchPrompt = promptPrefix + finalScene;

      console.log('🖍️ Generating sketch - scene length:', finalScene.length, 'total prompt length:', sketchPrompt.length);

      const sketchApiUrl = 'https://fantasmia-ai.vercel.app/api/openai/sketch';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(sketchApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          description: sketchPrompt
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
      console.log('✅ Sketch API response:', { hasImageUrl: !!data.imageUrl, hasBase64: !!data.image_base64 });

      let imageDataUrl: string | null = null;

      if (data.imageUrl) {
        imageDataUrl = data.imageUrl;
      } else if (data.image_base64) {
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
    // Download does NOT require storyId - only needs the sketch URL
    if (!generatedSketchUrl) {
      toast({
        title: 'Errore',
        description: 'Schizzo non disponibile per il download',
        variant: 'destructive'
      });
      return;
    }

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
      link.download = `${safeFilename}-schizzo.png`;
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
    console.log('💾 handleSaveAsMainImage - storyId:', storyId, 'hasBlob:', !!generatedSketchBlob);
    
    if (!generatedSketchBlob) {
      toast({
        title: 'Errore',
        description: 'Schizzo non disponibile per il salvataggio',
        variant: 'destructive'
      });
      return;
    }
    
    if (!storyId) {
      toast({
        title: 'Errore',
        description: 'ID storia non disponibile. Prova a scaricare lo schizzo e caricarlo manualmente.',
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
      // Reset refs for successful completion
      hasOpenedOnce.current = false;
      isFlowInProgress.current = false;
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
    console.log("🖍️ handleDiscard called - intentional close");
    // Reset refs for intentional closure
    hasOpenedOnce.current = false;
    isFlowInProgress.current = false;
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
          console.log("🖍️ CopyrightWarningDialog onOpenChange:", open, "showNotesDialog:", showNotesDialog);
          setShowCopyrightWarning(open);
          // Chiudi solo se l'utente cancella (non se sta procedendo al notes dialog)
          if (!open && !showNotesDialog) {
            console.log("🖍️ User cancelled copyright dialog - closing everything");
            hasOpenedOnce.current = false;
            isFlowInProgress.current = false;
            onOpenChange(false);
          }
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

      {/* Text Length Warning Dialog */}
      <Dialog open={showTextLengthWarning} onOpenChange={(open) => {
        setShowTextLengthWarning(open);
        if (!open) onOpenChange(false);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              ⚠️ Testo troppo lungo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Il testo della storia contiene <strong>{resolvedStoryContent.length}</strong> caratteri, 
              ma il limite per generare uno schizzo è di <strong>650 caratteri</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Come vuoi procedere?
            </p>
          </div>
          
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleTruncateText}
              className="justify-start"
            >
              <Scissors className="w-4 h-4 mr-2" />
              Tronca il testo a 600 caratteri
            </Button>
            
            <Button 
              onClick={handleAbbreviateText} 
              disabled={isAbbreviating}
              className="justify-start"
            >
              {isAbbreviating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Abbreviazione in corso...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Abbrevia con AI (mantiene il senso)
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowTextLengthWarning(false);
                onOpenChange(false);
              }}
            >
              Annulla
            </Button>
          </div>
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
