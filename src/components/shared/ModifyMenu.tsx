import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, ChevronDown, PenTool, Wand2 } from 'lucide-react';
import TextImprover from '@/components/shared/TextImprover';

interface ModifyMenuProps {
  storyContent: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onContentChange?: (content: string) => void;
  className?: string;
}

const ModifyMenu: React.FC<ModifyMenuProps> = ({
  storyContent,
  isEditing,
  onEditToggle,
  onContentChange,
  className = ""
}) => {
  const [showTextImprover, setShowTextImprover] = useState(false);

  const handleEditClick = () => {
    setShowTextImprover(false);
    onEditToggle();
  };

  const handleImproveTextClick = () => {
    setShowTextImprover(true);
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
              {onContentChange && (
                <DropdownMenuItem onClick={handleImproveTextClick} className="cursor-pointer">
                  <Wand2 className="w-4 h-4 mr-2" />
                  🤖 Migliora testo (AI)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Text Improver Component */}
      {showTextImprover && onContentChange && (
        <div className="mt-4">
          <TextImprover
            storyContent={storyContent}
            onContentChange={onContentChange}
          />
        </div>
      )}
    </div>
  );
};

export default ModifyMenu;