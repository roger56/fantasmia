import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Image as ImageIcon, Wand2, Upload, Eye } from 'lucide-react';
import MediaGenerationDialog from './MediaGenerationDialog';
import FileUploadDialog from './FileUploadDialog';
import ImageViewerDialog from './ImageViewerDialog';
import { fantasMiaDB } from '@/utils/indexedDB';
import { useToast } from '@/hooks/use-toast';

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
  const [showViewer, setShowViewer] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageBlob, setImageBlob] = useState<Blob | undefined>();
  const [hasAssociatedImage, setHasAssociatedImage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkImageStatus();
  }, [storyId]);

  const checkImageStatus = async () => {
    try {
      const hasImage = await fantasMiaDB.hasImageForStory(storyId);
      setHasAssociatedImage(hasImage);
    } catch (error) {
      console.error('Error checking image status:', error);
    }
  };

  const handleAIGeneration = () => {
    setShowAIDialog(true);
  };

  const handleFileUpload = () => {
    setShowUploadDialog(true);
  };

  const handleViewImage = async () => {
    try {
      const mediaAssets = await fantasMiaDB.getMediaAssetsByStoryId(storyId);
      
      if (mediaAssets.length === 0) {
        toast({
          title: "Nessuna immagine",
          description: "Non ci sono immagini associate a questa storia",
          variant: "destructive"
        });
        return;
      }

      const latestAsset = mediaAssets[0];
      
      if (!latestAsset.data || latestAsset.size === 0) {
        toast({
          title: "Immagine non valida",
          description: "L'immagine associata è vuota o corrotta",
          variant: "destructive"
        });
        return;
      }

      // SEMPRE usa Blob locale da IndexedDB (no fetch remoti)
      if (!latestAsset.data || !(latestAsset.data instanceof Blob) || latestAsset.data.size === 0) {
        const errorMsg = latestAsset.needsRefetch 
          ? "Immagine da rigenerare (sorgente scaduta)"
          : "Nessun Blob locale disponibile";
          
        toast({
          title: "Immagine non disponibile",
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }

      const blob = latestAsset.data;

      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setImageBlob(blob);
      setShowViewer(true);
    } catch (error) {
      console.error('Error loading image:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare l'immagine",
        variant: "destructive"
      });
    }
  };

  const handleMediaUpdate = () => {
    checkImageStatus();
    onMediaUpdate?.();
  };

  const handleViewerClose = (open: boolean) => {
    setShowViewer(open);
    if (!open && imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl('');
      setImageBlob(undefined);
    }
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
          {hasAssociatedImage && (
            <DropdownMenuItem onClick={handleViewImage} className="cursor-pointer">
              <Eye className="w-4 h-4 mr-2" />
              Vedi disegno associato
            </DropdownMenuItem>
          )}
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
          userId={userId}
        />
      )}

      {/* Image Viewer Dialog */}
      {showViewer && imageUrl && (
        <ImageViewerDialog
          open={showViewer}
          onOpenChange={handleViewerClose}
          imageUrl={imageUrl}
          storyTitle={storyTitle}
          style="Storia"
          imageBlob={imageBlob}
          storyId={storyId}
        />
      )}
    </div>
  );
};

export default MediaMenu;