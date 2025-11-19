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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Edit className="w-4 h-4 mr-1" />
                Modifica
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[180px]" align="start">
              <DropdownMenuItem onClick={handleEditClick} className="cursor-pointer">
                <PenTool className="w-4 h-4 mr-2" />
                Modifica testo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImproveTextClick} className="cursor-pointer">
                <Wand2 className="w-4 h-4 mr-2" />
                Migliora testo (AI)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePoetryClick} className="cursor-pointer">
                <Feather className="w-4 h-4 mr-2" />
                Poesia
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

      {/* Text Improver Component */}
      {showTextImprover && (
        <div className="mt-4">
          <TextImprover
            storyContent={storyContent}
            onContentChange={onContentChange}
            storyTitle={storyTitle}
            storyId={storyId}
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