import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, ChevronDown, PenTool, Wand2, Feather } from 'lucide-react';
import TextImprover from '@/components/shared/TextImprover';
import PoetryGenerator from '@/components/shared/PoetryGenerator';

interface ModifyMenuProps {
  storyContent: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onContentChange?: (content: string) => void;
  storyTitle?: string;
  className?: string;
}

const ModifyMenu: React.FC<ModifyMenuProps> = ({
  storyContent,
  isEditing,
  onEditToggle,
  onContentChange,
  storyTitle = '',
  className = ""
}) => {
  const [showTextImprover, setShowTextImprover] = useState(false);
  const [showPoetryGenerator, setShowPoetryGenerator] = useState(false);

  const handleEditClick = () => {
    setShowTextImprover(false);
    setShowPoetryGenerator(false);
    onEditToggle();
  };

  const handleImproveTextClick = () => {
    setShowTextImprover(true);
    setShowPoetryGenerator(false);
  };

  const handlePoetryClick = () => {
    setShowPoetryGenerator(true);
    setShowTextImprover(false);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Edit className="w-5 h-5" />
            📝 MODIFICA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Scegli modalità di modifica
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[200px]" align="start">
              <DropdownMenuItem onClick={handleEditClick} className="cursor-pointer">
                <PenTool className="w-4 h-4 mr-2" />
                📝 Modifica testo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImproveTextClick} className="cursor-pointer">
                <Wand2 className="w-4 h-4 mr-2" />
                🤖 Migliora testo (AI)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePoetryClick} className="cursor-pointer">
                <Feather className="w-4 h-4 mr-2" />
                📝 Poesia
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Text Improver Component */}
      {showTextImprover && (
        <div className="mt-4">
          <TextImprover
            storyContent={storyContent}
            onContentChange={onContentChange}
            storyTitle={storyTitle}
          />
        </div>
      )}

      {/* Poetry Generator Component */}
      {showPoetryGenerator && (
        <div className="mt-4">
          <PoetryGenerator
            storyContent={storyContent}
            storyTitle={storyTitle}
          />
        </div>
      )}
    </div>
  );
};

export default ModifyMenu;