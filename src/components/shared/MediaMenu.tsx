import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Image as ImageIcon, Wand2, Upload } from 'lucide-react';
import MediaGenerationDialog from './MediaGenerationDialog';
import FileUploadDialog from './FileUploadDialog';

interface MediaMenuProps {
  storyId: string;
  storyTitle: string;
  storyContent: string;
  userId?: string;
  isSuperuser?: boolean;
  onMediaUpdate?: () => void;
  className?: string;
}

const MediaMenu: React.FC<MediaMenuProps> = ({
  storyId,
  storyTitle,
  storyContent,
  userId = 'current-user',
  isSuperuser = false,
  onMediaUpdate,
  className = ""
}) => {
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleAIGeneration = () => {
    setShowAIDialog(true);
  };

  const handleFileUpload = () => {
    setShowUploadDialog(true);
  };

  const handleMediaUpdate = () => {
    onMediaUpdate?.();
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Media
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleAIGeneration} className="cursor-pointer">
            <Wand2 className="w-4 h-4 mr-2" />
            Disegno (AI)
          </DropdownMenuItem>
          {isSuperuser && (
            <DropdownMenuItem onClick={handleFileUpload} className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Carica da PC
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* AI Generation Dialog */}
      <MediaGenerationDialog
        open={showAIDialog}
        onOpenChange={(open) => {
          setShowAIDialog(open);
          if (!open) handleMediaUpdate();
        }}
        storyContent={storyContent}
        storyTitle={storyTitle}
        storyId={storyId}
        userId={userId}
      />

      {/* File Upload Dialog */}
      {isSuperuser && (
        <FileUploadDialog
          open={showUploadDialog}
          onOpenChange={(open) => {
            setShowUploadDialog(open);
            if (!open) handleMediaUpdate();
          }}
          storyId={storyId}
          storyTitle={storyTitle}
        />
      )}
    </div>
  );
};

export default MediaMenu;