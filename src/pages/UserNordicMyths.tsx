import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoryLayout from '@/components/shared/StoryLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Pause, Image, BookOpen } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import RecommendedBooksDialog from '@/components/shared/RecommendedBooksDialog';

interface NordicStory {
  id: string;
  title: string;
  content: string;
  has_image: boolean;
  language: string;
  created_at: string;
}

const UserNordicMyths = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<NordicStory[]>([]);
  const { speak, stop, isPlaying } = useTTS();
  const [currentTextId, setCurrentTextId] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedStory, setSelectedStory] = useState<NordicStory | null>(null);
  const [showBooksDialog, setShowBooksDialog] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      await fantasMiaDB.init();
      const allStories = await fantasMiaDB.getAllAGStories();
      const nordicStories = allStories
        .filter(story => story.category === 'nordic_myths')
        .map(story => ({
          ...story,
          language: story.language || 'italian'
        }));
      setStories(nordicStories);
    } catch (error) {
      console.error('Error loading nordic myths:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento dei miti nordici",
        variant: "destructive"
      });
    }
  };

  const handleRead = (story: NordicStory) => {
    const textId = `story-${story.id}`;
    if (isPlaying && currentTextId === textId) {
      stop();
      setCurrentTextId(null);
    } else {
      speak(story.content, 'italian');
      setCurrentTextId(textId);
    }
  };

  const handleImageClick = (story: NordicStory) => {
    if (story.has_image) {
      toast({
        title: "Immagine disponibile",
        description: `Immagine associata a: ${story.title}`
      });
    } else {
      toast({
        title: "Nessuna immagine",
        description: "Nessuna immagine associata a questa storia"
      });
    }
  };

  const handleBooksClick = (story: NordicStory) => {
    setSelectedStory(story);
    setShowBooksDialog(true);
  };

  const handleStoryClick = (story: NordicStory) => {
    navigate(`/user-story-viewer/${story.id}`);
  };

  return (
    <StoryLayout
      title="I Miti del Nord"
      subtitle="Leggende e storie dei popoli nordici"
      onBack={() => navigate('/story-type-selection')}
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {stories.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Nessuna storia nordica disponibile
                  </div>
                ) : (
                  stories.map((story) => (
                    <div 
                      key={story.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleStoryClick(story)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{story.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(story.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        {/* Read button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRead(story)}
                                className="h-8 w-8 p-0"
                              >
                                {isPlaying && currentTextId === `story-${story.id}` ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Leggi ad alta voce</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Image indicator */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleImageClick(story)}
                                className="h-8 w-8 p-0"
                              >
                                <Image 
                                  className={`h-4 w-4 ${story.has_image ? 'text-green-600' : 'text-red-600'}`} 
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{story.has_image ? 'Immagine disponibile' : 'Nessuna immagine'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Books button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBooksClick(story)}
                                className="h-8 w-8 p-0"
                              >
                                <BookOpen className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Qui trovi libri che raccontano meglio del tuo eroe</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Books Dialog */}
      {selectedStory && (
        <RecommendedBooksDialog
          open={showBooksDialog}
          onOpenChange={setShowBooksDialog}
          storyId={selectedStory.id}
          storyTitle={selectedStory.title}
          isSuperuser={false}
        />
      )}
    </StoryLayout>
  );
};

export default UserNordicMyths;