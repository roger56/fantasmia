import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageIcon, Video, Music, Palette, Camera, Film } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreativeMediaMenuProps {
  storyContent: string;
  storyTitle?: string;
  className?: string;
}

const CreativeMediaMenu: React.FC<CreativeMediaMenuProps> = ({
  storyContent,
  storyTitle,
  className = ""
}) => {
  const { toast } = useToast();

  const handleImageGeneration = (style: 'realistic' | 'cartoon' | 'photo') => {
    toast({
      title: "Funzione in sviluppo",
      description: `Generazione immagini ${style} sarà presto disponibile`,
      variant: "default"
    });
  };

  const handleVideoGeneration = () => {
    toast({
      title: "Funzione in sviluppo", 
      description: "Generazione video dalla storia sarà presto disponibile",
      variant: "default"
    });
  };

  const handleMusicGeneration = () => {
    toast({
      title: "Funzione in sviluppo",
      description: "Generazione musica di sottofondo sarà presto disponibile", 
      variant: "default"
    });
  };

  return (
    <TooltipProvider>
      <Card className={`mb-6 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5" />
            Media Creativi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sezione Immagini */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Immagini</h4>
              <div className="flex flex-col gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageGeneration('realistic')}
                      className="w-full justify-start"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Realistica
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Genera immagini realistiche dal testo della storia</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageGeneration('cartoon')}
                      className="w-full justify-start"
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      Cartoon
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Genera immagini in stile cartoon dal testo della storia</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageGeneration('photo')}
                      className="w-full justify-start"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Fotografica
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Genera immagini fotografiche dal testo della storia</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Sezione Video */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Video</h4>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVideoGeneration}
                    className="w-full justify-start"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Genera Video
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Crea un filmato animato dal testo della storia</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVideoGeneration}
                    className="w-full justify-start"
                  >
                    <Film className="w-4 h-4 mr-2" />
                    Video Avanzato
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Genera video con transizioni e effetti dalla storia</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Sezione Audio */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Audio</h4>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMusicGeneration}
                    className="w-full justify-start"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Musica di Sottofondo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Genera musica ambientale adatta al tono della storia</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default CreativeMediaMenu;