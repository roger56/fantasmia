import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, ChevronDown, PenTool, Sparkles } from 'lucide-react';
import TextImprover from '@/components/shared/TextImprover';
import PoetryGenerator from '@/components/shared/PoetryGenerator';

interface ModifyMenuProps {
  storyContent: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onContentChange?: (content: string) => void;
  storyTitle?: string;
  storyId?: string;
  className?: string;
}

const ModifyMenu: React.FC<ModifyMenuProps> = ({
  storyContent,
  isEditing,
  onEditToggle,
  onContentChange,
  storyTitle = '',
  storyId,
  className = ""
}) => {
  const [showTextImprover, setShowTextImprover] = useState(false);
  const [showPoetryGenerator, setShowPoetryGenerator] = useState(false);
  const [selectedTextStyle, setSelectedTextStyle] = useState<"ironico" | "fantasy" | "semplice" | "fantasioso">("ironico");
  const [selectedPoetryStyle, setSelectedPoetryStyle] = useState<string>("lirica");

  const handleEditClick = () => {
    setShowTextImprover(false);
    setShowPoetryGenerator(false);
    onEditToggle();
  };

  const handleImproveTextClick = (style: "ironico" | "fantasy" | "semplice" | "fantasioso") => {
    setSelectedTextStyle(style);
    setShowTextImprover(true);
    setShowPoetryGenerator(false);
  };

  const handlePoetryClick = (style: string) => {
    setSelectedPoetryStyle(style);
    setShowPoetryGenerator(true);
    setShowTextImprover(false);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {/* Pulsante Modifica */}
        <Button variant="outline" size="sm" className="h-8" onClick={handleEditClick}>
          <Edit className="w-4 h-4 mr-1" />
          Modifica
        </Button>

        {/* Menu AI con submenu a due livelli */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Sparkles className="w-4 h-4 mr-1" />
              AI
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[200px] bg-background border shadow-lg z-50" align="start">
            {/* Submenu Miglioramento testo */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                Miglioramento testo
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-background border shadow-lg">
                <DropdownMenuItem onClick={() => handleImproveTextClick("ironico")} className="cursor-pointer">
                  Ironico
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImproveTextClick("fantasy")} className="cursor-pointer">
                  Fantasy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImproveTextClick("semplice")} className="cursor-pointer">
                  Semplice e leggero
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImproveTextClick("fantasioso")} className="cursor-pointer">
                  Fantasioso
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Submenu Poesia */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                Poesia
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-background border shadow-lg">
                <DropdownMenuItem onClick={() => handlePoetryClick("lirica")} className="cursor-pointer">
                  Lirica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePoetryClick("romantica")} className="cursor-pointer">
                  Romantica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePoetryClick("epica")} className="cursor-pointer">
                  Epica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePoetryClick("sonetto")} className="cursor-pointer">
                  Sonetto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePoetryClick("libera")} className="cursor-pointer">
                  Libera
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Text Improver Component */}
      {showTextImprover && (
        <div className="mt-4">
          <TextImprover
            storyContent={storyContent}
            onContentChange={onContentChange}
            storyTitle={storyTitle}
            storyId={storyId}
            initialStyle={selectedTextStyle}
          />
        </div>
      )}

      {/* Poetry Generator Component */}
      {showPoetryGenerator && (
        <div className="mt-4">
          <PoetryGenerator
            storyContent={storyContent}
            storyTitle={storyTitle}
            initialStyle={selectedPoetryStyle}
          />
        </div>
      )}
    </div>
  );
};

export default ModifyMenu;