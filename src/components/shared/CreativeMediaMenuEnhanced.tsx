import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Languages, Volume2, Share2, Image, Video, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/useTTS';
import { translateToEnglish } from '@/utils/translation';
import { getStoryImage } from '@/utils/userStorage';
import MediaGenerationDialog from './MediaGenerationDialog';
import ImageViewerDialog from './ImageViewerDialog';

interface CreativeMediaMenuEnhancedProps {
  storyContent: string;
  storyTitle: string;
  storyId?: string;
  userRole?: 'superuser' | 'user';
}

const CreativeMediaMenuEnhanced: React.FC<CreativeMediaMenuEnhancedProps> = ({
  storyContent,
  storyTitle,
  storyId,
  userRole = 'user'
}) => {
  const { toast } = useToast();
  const { isPlaying, speak, stop } = useTTS();
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [existingImage, setExistingImage] = useState<any>(null);

  useEffect(() => {
    if (storyId) {
      const image = getStoryImage(storyId);
      setExistingImage(image);
    }
  }, [storyId]);

  const handleTranslate = async () => {
    try {
      const translatedContent = await translateToEnglish(storyContent);
      const translatedTitle = await translateToEnglish(storyTitle);
      
      toast({
        title: "Traduzione completata",
        description: "Storia tradotta in inglese"
      });
      
      // In futuro: aggiornare l'interfaccia con il contenuto tradotto
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la traduzione",
        variant: "destructive"
      });
    }
  };

  const handleTTS = (voiceType: string) => {
    if (isPlaying) {
      stop();
      return;
    }
    
    speak(storyContent, 'italian');
    toast({
      title: "Lettura avviata",
      description: `Voce: ${voiceType}`
    });
  };

  const handleShare = (type: 'copy' | 'email') => {
    const fullText = `${storyTitle}\n\n${storyContent}`;
    
    if (type === 'copy') {
      navigator.clipboard.writeText(fullText).then(() => {
        toast({
          title: "Copiato!",
          description: "Storia copiata negli appunti"
        });
      }).catch(() => {
        toast({
          title: "Errore",
          description: "Impossibile copiare negli appunti",
          variant: "destructive"
        });
      });
    } else if (type === 'email') {
      toast({
        title: "Invio via email",
        description: "Funzione non ancora implementata, testo copiato negli appunti"
      });
      navigator.clipboard.writeText(fullText);
    }
  };

  const handleMediaGeneration = () => {
    if (userRole === 'superuser' && storyId) {
      setShowMediaDialog(true);
    }
  };

  const handleViewImage = () => {
    if (existingImage) {
      setShowImageViewer(true);
    } else {
      toast({
        title: "Nessuna immagine",
        description: "Non è presente alcuna immagine per questa storia"
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Pulsante Inglese */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleTranslate}
        className="flex items-center gap-2"
      >
        <Languages className="w-4 h-4" />
        Inglese
      </Button>

      {/* Menu Leggi (Voci) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Leggi
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleTTS('uomo')}>
            👨 Voce Uomo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTTS('donna')}>
            👩 Voce Donna
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTTS('bambino')}>
            👦 Voce Bambino
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTTS('bambina')}>
            👧 Voce Bambina
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Menu Media */}
      {userRole === 'superuser' ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              Media
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleMediaGeneration}>
              🎨 Disegno
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ title: "In sviluppo", description: "Funzione filmato in fase di sviluppo" })}>
              🎬 Filmato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ title: "In sviluppo", description: "Funzione voci in fase di sviluppo" })}>
              🗣️ Voci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Per utenti normali: solo visualizzazione
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={handleViewImage}
        >
          <Image className="w-4 h-4" />
          Vedi
        </Button>
      )}

      {/* Menu Condividi */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Condividi
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleShare('copy')}>
            📋 Copia negli appunti
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('email')}>
            📧 Invia via mail
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      {userRole === 'superuser' && storyId && (
        <>
          <MediaGenerationDialog
            open={showMediaDialog}
            onOpenChange={setShowMediaDialog}
            storyContent={storyContent}
            storyTitle={storyTitle}
            storyId={storyId}
            userId="superuser"
          />
          
          {existingImage && (
            <ImageViewerDialog
              open={showImageViewer}
              onOpenChange={setShowImageViewer}
              imageUrl={existingImage.imageUrl}
              storyTitle={storyTitle}
              style={existingImage.style}
            />
          )}
        </>
      )}

      {userRole === 'user' && existingImage && (
        <ImageViewerDialog
          open={showImageViewer}
          onOpenChange={setShowImageViewer}
          imageUrl={existingImage.imageUrl}
          storyTitle={storyTitle}
          style={existingImage.style}
        />
      )}
    </div>
  );
};

export default CreativeMediaMenuEnhanced;