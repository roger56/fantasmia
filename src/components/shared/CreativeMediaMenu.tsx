import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageIcon, Video, Music, Palette, Camera, Film, PenTool } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TextImprover from '@/components/shared/TextImprover';

interface CreativeMediaMenuProps {
  storyContent: string;
  storyTitle?: string;
  onContentChange?: (content: string) => void;
  className?: string;
}

const CreativeMediaMenu: React.FC<CreativeMediaMenuProps> = ({
  storyContent,
  storyTitle,
  onContentChange,
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
      <div className={className}>
        {/* Text Improvement Section */}
        {onContentChange && (
          <TextImprover
            storyContent={storyContent}
            onContentChange={onContentChange}
            className="mb-6"
          />
        )}
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5" />
              📺 MEDIA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sezione Testo */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Testo</h4>
                {onContentChange ? (
                  <div className="text-center text-xs text-muted-foreground p-2 border rounded bg-muted/20">
                    ✍️ Migliora testo disponibile sopra
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast({
                          title: "Funzione non disponibile",
                          description: "La funzione Migliora Testo è disponibile solo in modalità editing",
                          variant: "default"
                        })}
                        className="w-full justify-start"
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        ✍️ Migliora testo
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Riscrive la storia con diversi stili usando OpenAI</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Sezione Immagini */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Disegno</h4>
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

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImageGeneration('cartoon')}
                        className="w-full justify-start"
                      >
                        <Palette className="w-4 h-4 mr-2" />
                        Manga
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Genera immagini in stile manga dal testo della storia</p>
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
                        Acquarello
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Genera immagini in stile acquarello dal testo della storia</p>
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
                        Carboncino
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Genera immagini in stile carboncino dal testo della storia</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Sezione Video */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Filmato</h4>
                <div className="flex flex-col gap-2">
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
              </div>

              {/* Sezione Audio */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Voci</h4>
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
      </div>
    </TooltipProvider>
  );
};

export default CreativeMediaMenu;