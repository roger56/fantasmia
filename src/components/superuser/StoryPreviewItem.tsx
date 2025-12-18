import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AMStory, fantasMiaDB } from '@/utils/indexedDB';
import { calculatePagesAllocation } from '@/utils/albumPdfGenerator';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StoryPreviewItemProps {
  story: AMStory;
  index: number;
  sortOrder: 'title' | 'date' | 'manual';
  storiesLength: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const StoryPreviewItem: React.FC<StoryPreviewItemProps> = ({
  story,
  index,
  sortOrder,
  storiesLength,
  onMoveUp,
  onMoveDown
}) => {
  const [mediaInfo, setMediaInfo] = useState<{ isSketch: boolean } | null>(null);
  const pagesAlloc = calculatePagesAllocation(story.mode);

  useEffect(() => {
    const loadMediaInfo = async () => {
      if (story.hasImage) {
        try {
          const media = await fantasMiaDB.getLatestMediaAssetByStoryId(story.id);
          setMediaInfo({ isSketch: media?.metadata?.isSketch ?? false });
        } catch (error) {
          console.error('Error loading media info:', error);
          setMediaInfo({ isSketch: false });
        }
      } else {
        setMediaInfo(null);
      }
    };
    loadMediaInfo();
  }, [story.id, story.hasImage]);

  return (
    <div className="flex items-center justify-between p-3 border rounded bg-muted/30">
      <div className="flex items-center gap-3 flex-1">
        {sortOrder === 'manual' && (
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
            >
              <ArrowUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onMoveDown(index)}
              disabled={index === storiesLength - 1}
            >
              <ArrowDown className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{story.title}</p>
          <p className="text-xs text-muted-foreground">
            {story.mode} • {pagesAlloc.text} pg testo + {pagesAlloc.image} pg immagine • {story.text.length} caratteri
          </p>
        </div>
        
        <div className={`text-xs px-2 py-1 rounded ${
          story.hasImage 
            ? mediaInfo?.isSketch 
              ? 'bg-orange-100 text-orange-700'
              : 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {story.hasImage 
            ? mediaInfo?.isSketch 
              ? '🖍️ Schizzo' 
              : '✓ Immagine'
            : '✗ No immagine'}
        </div>
      </div>
    </div>
  );
};

export default StoryPreviewItem;
