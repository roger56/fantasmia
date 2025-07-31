import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Palette, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MediaButtonProps {
  storyContent: string;
  storyTitle?: string;
  storyId?: string;
  className?: string;
}

const MediaButton: React.FC<MediaButtonProps> = ({
  storyContent,
  storyTitle,
  storyId,
  className = ""
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const handleMediaAction = async (type: string, subtype: string) => {
    if (type === 'Disegno') {
      await handleImageGeneration(subtype.toLowerCase());
    } else {
      toast({
        title: "Funzione in sviluppo",
        description: `${type} - ${subtype} sarà presto disponibile`,
        variant: "default"
      });
    }
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
      // Get current user ID from localStorage
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) {
        throw new Error('Nessun utente attivo trovato');
      }

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: storyContent,
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
              <p className="text-sm text-muted-foreground">
                L'immagine è stata salvata nell'archivio delle storie
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MediaButton;