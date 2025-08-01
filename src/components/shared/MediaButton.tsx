import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Palette, Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface MediaButtonProps {
  storyContent: string;
  storyTitle?: string;
  storyId?: string;
  className?: string;
  userId?: string;
}

const MediaButton: React.FC<MediaButtonProps> = ({
  storyContent,
  storyTitle,
  storyId,
  className = "",
  userId
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [userComment, setUserComment] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('');

  const handleMediaAction = async (type: string, subtype: string) => {
    if (type === 'Disegno') {
      setSelectedStyle(subtype.toLowerCase());
      setShowCommentDialog(true);
    } else {
      toast({
        title: "Funzione in sviluppo",
        description: `${type} - ${subtype} sarà presto disponibile`,
        variant: "default"
      });
    }
  };

  const handleGenerateWithComment = async () => {
    setShowCommentDialog(false);
    await handleImageGeneration(selectedStyle);
  };

  const handleImageGeneration = async (style: string) => {
    if (!storyContent) {
      toast({
        title: "Errore",
        description: "Nessun contenuto della storia disponibile",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Use userId prop or fallback to localStorage
      const currentUserId = userId || localStorage.getItem('currentUserId');
      if (!currentUserId) {
        throw new Error('User ID is required');
      }

      // Create enhanced prompt with user comment
      const enhancedPrompt = userComment 
        ? `${storyContent}\n\nNote aggiuntive: ${userComment}`
        : storyContent;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: enhancedPrompt,
          style: style,
          storyId: storyId,
          storyTitle: storyTitle,
          userId: currentUserId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setShowImageDialog(true);
        setUserComment(''); // Reset comment after generation
        toast({
          title: "Immagine generata!",
          description: `Costo: €${data.cost.toFixed(3)}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Errore nella generazione immagine:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nella generazione dell'immagine",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      // Use a proxy or different approach for CORS-protected images
      const response = await fetch(generatedImage, {
        mode: 'cors',
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${storyTitle || 'immagine'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download completato",
        description: "L'immagine è stata scaricata sul tuo dispositivo",
        variant: "default"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Errore nel download",
        description: "Non è stato possibile scaricare l'immagine. Prova a cliccare destro sull'immagine e seleziona 'Salva immagine'.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <DropdownMenu>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`px-6 ${className}`} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Palette className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? 'Generando...' : 'MEDIA'}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Queste funzioni prevedono un utilizzo estensivo di package AI e pagamenti relativi</p>
            </TooltipContent>
            
            <DropdownMenuContent className="w-56 bg-white border shadow-lg z-50">
              {/* Disegno */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  Disegno
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white border shadow-lg">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Disegno', 'Fumetto')}
                    disabled={isGenerating}
                  >
                    Fumetto
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Disegno', 'Fotografico')}
                    disabled={isGenerating}
                  >
                    Fotografico
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Disegno', 'Astratto')}
                    disabled={isGenerating}
                  >
                    Astratto
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Filmato */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  Filmato
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white border shadow-lg">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Filmato', 'Ambientazione futuristica')}
                  >
                    Ambientazione futuristica
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Filmato', 'Ambientazione storica')}
                  >
                    Ambientazione storica
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Filmato', 'Ambientazione odierna')}
                  >
                    Ambientazione odierna
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Filmato', 'Ambientazione fantasy')}
                  >
                    Ambientazione fantasy
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Voci */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  Voci
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white border shadow-lg">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Voci', 'Uomo')}
                  >
                    Uomo
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Voci', 'Donna')}
                  >
                    Donna
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Voci', 'Bambino')}
                  >
                    Bambino
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleMediaAction('Voci', 'Bambina')}
                  >
                    Bambina
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </Tooltip>
      </TooltipProvider>

      {/* Image Display Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Immagine Generata - {storyTitle}</DialogTitle>
          </DialogHeader>
          {generatedImage && (
            <div className="flex flex-col items-center space-y-4">
              <img
                src={generatedImage}
                alt="Immagine generata per la storia"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleDownloadImage}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Scarica Immagine
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                L'immagine è temporanea e verrà persa alla chiusura della pagina.
                <br />
                Usa il pulsante "Scarica" per salvarla sul tuo dispositivo (tasto destro per condividere).
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aggiungi un commento (opzionale)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aggiungi delle specifiche per personalizzare l'immagine:
            </p>
            <Textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="es. 'in stile fiabesco', 'con ambientazione spaziale', 'con colori vivaci'..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCommentDialog(false)}
              >
                Annulla
              </Button>
              <Button onClick={handleGenerateWithComment}>
                Genera Immagine
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MediaButton;