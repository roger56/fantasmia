import React from 'react';
import { Image, ImageOff } from 'lucide-react';
import { getStoryImage } from '@/utils/userStorage';

interface StoryImageIndicatorProps {
  storyId: string;
  className?: string;
}

const StoryImageIndicator: React.FC<StoryImageIndicatorProps> = ({ storyId, className = "" }) => {
  const hasImage = getStoryImage(storyId) !== null;

  return (
    <div className={`flex items-center ${className}`}>
      {hasImage ? (
        <Image className="w-4 h-4 text-green-600" />
      ) : (
        <ImageOff className="w-4 h-4 text-red-600" />
      )}
    </div>
  );
};

export default StoryImageIndicator;