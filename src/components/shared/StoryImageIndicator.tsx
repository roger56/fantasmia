import React, { useState, useEffect } from 'react';
import { Image, ImageOff } from 'lucide-react';
import { fantasMiaDB } from '@/utils/indexedDB';
import ImageViewerDialog from './ImageViewerDialog';

interface StoryImageIndicatorProps {
  storyId: string;
  className?: string;
  storyContent?: string;
  canGenerateSketch?: boolean;
  userId?: string;
  onSketchSaved?: () => void;
}

const StoryImageIndicator: React.FC<StoryImageIndicatorProps> = ({ 
  storyId, 
  className = "",
  storyContent,
  canGenerateSketch,
  userId,
  onSketchSaved
}) => {
  const [hasImage, setHasImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState<string>("Generato da AI");
  const [showViewer, setShowViewer] = useState(false);

  const checkImage = async () => {
    try {
      const mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(storyId);
      setHasImage(!!mediaAsset);
      
      if (mediaAsset && mediaAsset.data) {
        const url = URL.createObjectURL(mediaAsset.data);
        setImageUrl(url);
        // Extract style from metadata if available
        const style = mediaAsset.metadata?.style || "Generato da AI";
        setImageStyle(style.charAt(0).toUpperCase() + style.slice(1)); // Capitalize
      }
    } catch (error) {
      console.error('Error checking image:', error);
      setHasImage(false);
    }
  };

  useEffect(() => {
    checkImage();

    // Listen for image saved events
    const handleImageSaved = (event: CustomEvent) => {
      if (event.detail.storyId === storyId) {
        checkImage();
      }
    };

    window.addEventListener('storyImageSaved', handleImageSaved as EventListener);
    return () => {
      window.removeEventListener('storyImageSaved', handleImageSaved as EventListener);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [storyId]);

  const handleClick = () => {
    if (hasImage && imageUrl) {
      setShowViewer(true);
    }
  };

  return (
    <>
      <div 
        className={`flex items-center ${hasImage ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
        onClick={handleClick}
        title={hasImage ? 'Clicca per visualizzare' : 'Nessuna immagine'}
      >
        {hasImage ? (
          <Image className="w-4 h-4 text-green-600" />
        ) : (
          <ImageOff className="w-4 h-4 text-red-600" />
        )}
      </div>

      {hasImage && imageUrl && (
        <ImageViewerDialog
          open={showViewer}
          onOpenChange={setShowViewer}
          imageUrl={imageUrl}
          storyId={storyId}
          style={imageStyle}
          storyContent={storyContent}
          canGenerateSketch={canGenerateSketch}
          userId={userId}
          onSketchSaved={onSketchSaved}
        />
      )}
    </>
  );
};

export default StoryImageIndicator;