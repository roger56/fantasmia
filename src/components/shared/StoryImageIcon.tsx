import React from 'react';
import { Circle } from 'lucide-react';

interface StoryImageIconProps {
  storyId: string;
  hasImage?: boolean;
  className?: string;
  size?: number;
}

const StoryImageIcon: React.FC<StoryImageIconProps> = ({ 
  storyId, 
  hasImage = false, 
  className = "",
  size = 16 
}) => {
  return (
    <div title={hasImage ? 'Immagine presente' : 'Nessuna immagine'}>
      <Circle 
        size={size}
        className={`${className} ${hasImage ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
      />
    </div>
  );
};

export default StoryImageIcon;