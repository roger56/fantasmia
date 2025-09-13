import React, { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { fantasMiaDB } from '@/utils/indexedDB';
import ImageViewerDialog from './ImageViewerDialog';

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
        const mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(storyId);
        if (mediaAsset && mediaAsset.type === 'image') {
          const url = URL.createObjectURL(mediaAsset.data);
          setImageUrl(url);
          setImageViewerOpen(true);
        }
      } catch (error) {
        console.error('Error loading image:', error);
      }
    }
  };

  const handleViewerClose = (open: boolean) => {
    setImageViewerOpen(open);
    if (!open && imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl('');
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
        />
      )}
    </>
  );
};

export default StoryImageIcon;