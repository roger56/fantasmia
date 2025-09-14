import React, { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { fantasMiaDB } from '@/utils/indexedDB';
import ImageViewerDialog from './ImageViewerDialog';
import { useToast } from '@/hooks/use-toast';

interface StoryImageIconProps {
  storyId: string;
  hasImage?: boolean;
  className?: string;
  size?: number;
  storyTitle?: string;
}

const StoryImageIcon: React.FC<StoryImageIconProps> = ({ 
  storyId, 
  hasImage = false, 
  className = "",
  size = 16,
  storyTitle = ""
}) => {
  const [actualHasImage, setActualHasImage] = useState(hasImage);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [currentImageBlob, setCurrentImageBlob] = useState<Blob | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    // Check actual image status from IndexedDB
    checkImageStatus();
    
    // Listen for image updates
    const handleImageUpdate = (event: CustomEvent) => {
      if (event.detail.storyId === storyId) {
        checkImageStatus();
      }
    };

    window.addEventListener('am-story-updated', handleImageUpdate);
    window.addEventListener('ag-story-updated', handleImageUpdate);
    
    return () => {
      window.removeEventListener('am-story-updated', handleImageUpdate);
      window.removeEventListener('ag-story-updated', handleImageUpdate);
    };
  }, [storyId]);

  const checkImageStatus = async () => {
    try {
      const hasImageInDB = await fantasMiaDB.hasImageForStory(storyId);
      setActualHasImage(hasImageInDB);
    } catch (error) {
      console.error('Error checking image status:', error);
      setActualHasImage(hasImage);
    }
  };

  const handleClick = async () => {
    if (actualHasImage) {
      try {
        // Recupera tutti i media assets per questa storia
        const mediaAssets = await fantasMiaDB.getMediaAssetsByStoryId(storyId);
        
        if (mediaAssets.length === 0) {
          console.warn('⚠️ No media assets found:', { action: 'media-empty', storyId });
          toast({
            title: "Immagine non trovata",
            description: "Nessun media associato a questa storia",
            variant: "destructive"
          });
          return;
        }

        // Prendi il più recente (già ordinato per createdAt desc)
        const latestAsset = mediaAssets[0];
        
        // Validazioni
        if (!latestAsset.data || latestAsset.size === 0) {
          console.warn('⚠️ Invalid media asset:', { 
            action: 'media-empty', 
            storyId, 
            mediaId: latestAsset.id, 
            size: latestAsset.size 
          });
          toast({
            title: "Immagine non valida",
            description: "L'immagine associata è vuota o corrotta",
            variant: "destructive"
          });
          return;
        }

        // SEMPRE usa Blob locale da IndexedDB (no fetch remoti)
        if (!latestAsset.data || !(latestAsset.data instanceof Blob) || latestAsset.data.size === 0) {
          console.error('❌ No valid Blob available:', { 
            action: 'no-local-blob', 
            storyId, 
            mediaId: latestAsset.id,
            hasData: !!latestAsset.data,
            isBlob: latestAsset.data instanceof Blob,
            size: latestAsset.data instanceof Blob ? latestAsset.data.size : 'N/A',
            needsRefetch: latestAsset.needsRefetch
          });
          
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

        const imageBlob = latestAsset.data;

        // Crea ObjectURL e apri viewer
        const url = URL.createObjectURL(imageBlob);
        setImageUrl(url);
        setCurrentImageBlob(imageBlob);
        setImageViewerOpen(true);

        console.log('✅ Image loaded successfully:', { 
          action: 'media-loaded', 
          storyId, 
          mediaId: latestAsset.id,
          mime: latestAsset.mime,
          size: imageBlob.size 
        });

      } catch (error) {
        console.error('❌ Error loading image:', { action: 'media-load-error', storyId, error });
        toast({
          title: "Errore caricamento",
          description: "Impossibile caricare l'immagine",
          variant: "destructive"
        });
      }
    }
  };

  const handleViewerClose = (open: boolean) => {
    setImageViewerOpen(open);
    if (!open && imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl('');
      setCurrentImageBlob(undefined);
    }
  };

  return (
    <>
      <div 
        title={actualHasImage ? 'Immagine associata - clicca per visualizzare' : 'Nessuna immagine associata'}
        className={actualHasImage ? 'cursor-pointer' : ''}
        onClick={handleClick}
      >
        <Circle 
          size={size}
          className={`${className} ${actualHasImage ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
        />
      </div>
      
      {imageViewerOpen && imageUrl && (
        <ImageViewerDialog
          open={imageViewerOpen}
          onOpenChange={handleViewerClose}
          imageUrl={imageUrl}
          storyTitle={storyTitle}
          style="Storia"
          imageBlob={currentImageBlob}
          storyId={storyId}
        />
      )}
    </>
  );
};

export default StoryImageIcon;