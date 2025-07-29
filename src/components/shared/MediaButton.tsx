import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaButtonProps {
  storyContent: string;
  storyTitle?: string;
  className?: string;
}

const MediaButton: React.FC<MediaButtonProps> = ({
  storyContent,
  storyTitle,
  className = ""
}) => {
  const { toast } = useToast();

  const handleMediaAction = (type: string, subtype: string) => {
    toast({
      title: "Funzione in sviluppo",
      description: `${type} - ${subtype} sarà presto disponibile`,
      variant: "default"
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={`px-6 ${className}`}>
                <Palette className="w-4 h-4 mr-2" />
                MEDIA
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
                >
                  Fumetto
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleMediaAction('Disegno', 'Fotografico')}
                >
                  Fotografico
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleMediaAction('Disegno', 'Astratto')}
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

            {/* Colonna sonora */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                Colonna sonora
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-white border shadow-lg">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleMediaAction('Colonna sonora', 'Musica classica')}
                >
                  Musica classica
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleMediaAction('Colonna sonora', 'Musica rock')}
                >
                  Musica rock
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleMediaAction('Colonna sonora', 'Musica jazz')}
                >
                  Musica jazz
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MediaButton;