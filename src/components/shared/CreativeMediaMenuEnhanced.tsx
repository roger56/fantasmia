import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Languages, Volume2, Share2, Image, Video, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/useTTS';
import { translateToEnglish } from '@/utils/translation';

interface CreativeMediaMenuEnhancedProps {
  storyContent: string;
  storyTitle: string;
}

const CreativeMediaMenuEnhanced: React.FC<CreativeMediaMenuEnhancedProps> = ({
  storyContent,
  storyTitle
}) => {
  const { toast } = useToast();
  const { isPlaying, speak, stop } = useTTS();

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

  const handleMediaGeneration = (type: string, style: string) => {
    toast({
      title: "Generazione media",
      description: `${type}: ${style} - Funzione in sviluppo`
    });
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Media
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {/* Sottomenu Disegno */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Image className="w-4 h-4 mr-2" />
              Disegno
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMediaGeneration('Disegno', 'fumetto')}>
                🎨 Fumetto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMediaGeneration('Disegno', 'fotografico')}>
                📸 Fotografico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMediaGeneration('Disegno', 'astratto')}>
                🎭 Astratto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMediaGeneration('Disegno', 'manga')}>
                🎌 Manga
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMediaGeneration('Disegno', 'acquarello')}>
                🖌️ Acquarello
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMediaGeneration('Disegno', 'carboncino')}>
                ✏️ Carboncino
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Sottomenu Filmato */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Video className="w-4 h-4 mr-2" />
              Filmato
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMediaGeneration('Filmato', 'futuristica')}>
                🚀 Futuristica
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMediaGeneration('Filmato', 'storica')}>
                🏛️ Storica
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMediaGeneration('Filmato', 'odierna')}>
                🌆 Odierna
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMediaGeneration('Filmato', 'fantasy')}>
                🧙‍♂️ Fantasy
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </div>
  );
};

export default CreativeMediaMenuEnhanced;