import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoryLayout from '@/components/shared/StoryLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Volume2, VolumeX, Image, BookOpen } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import RecommendedBooksDialog from '@/components/shared/RecommendedBooksDialog';

interface AGStory {
  id: string;
  title: string;
  content: string;
  has_image: boolean;
  language: string;
  created_at: string;
  category: string;
}

interface AGUserStoryListProps {
  category: string;
  title: string;
  subtitle: string;
}

const AGUserStoryList: React.FC<AGUserStoryListProps> = ({ category, title, subtitle }) => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<AGStory[]>([]);
  const { speak, stop, isPlaying, currentStoryId } = useTTS();
  const { toast } = useToast();
  const [selectedStory, setSelectedStory] = useState<AGStory | null>(null);
  const [showBooksDialog, setShowBooksDialog] = useState(false);

  useEffect(() => {
    loadStories();
  }, [category]);

  const loadStories = async () => {
    try {
      await fantasMiaDB.init();
      const allStories = await fantasMiaDB.getAllAGStories();
      const categoryStories = allStories
        .filter(story => story.category === category)
        .map(story => ({
          ...story,
          language: story.language || 'italian'
        }));
      setStories(categoryStories);
    } catch (error) {
      console.error('Error loading stories:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle storie",
        variant: "destructive"
      });
    }
  };

  const handleRead = (story: AGStory, event: React.MouseEvent) => {
    event.stopPropagation();
    const fullText = `${story.title}. ${story.content}`;
    
    if (isPlaying && currentStoryId === story.id) {
      stop();
    } else {
      speak(fullText, 'italian', story.id);
    }
  };

  const handleImageClick = (story: AGStory, event: React.MouseEvent) => {
    event.stopPropagation();
    if (story.has_image) {
      navigate(`/ag-story-detail/${story.id}`);
    } else {
      toast({
        title: "Nessuna immagine",
        description: "Nessuna immagine associata a questa storia"
      });
    }
  };

  const handleBooksClick = (story: AGStory, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedStory(story);
    setShowBooksDialog(true);
  };

  const handleStoryClick = (story: AGStory) => {
    navigate(`/ag-story-detail/${story.id}`);
  };

  return (
    <StoryLayout
      title={title}
      subtitle={subtitle}
      onBack={() => navigate('/story-type-selection')}
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {stories.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Nessuna storia disponibile
                  </div>
                ) : (
                  stories.map((story) => (
                    <div 
                      key={story.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleStoryClick(story)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{story.title}</h3>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Read button with TTS */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleRead(story, e)}
                                className="h-9 w-9 p-0"
                              >
                                {isPlaying && currentStoryId === story.id ? (
                                  <VolumeX className="h-4 w-4 text-primary" />
                                ) : (
                                  <Volume2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isPlaying && currentStoryId === story.id ? 'Ferma' : 'Leggi'}</p>
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
                                onClick={(e) => handleImageClick(story, e)}
                                className="h-9 w-9 p-0"
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
                                onClick={(e) => handleBooksClick(story, e)}
                                className="h-9 w-9 p-0"
                              >
                                <BookOpen className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Libri consigliati</p>
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

export default AGUserStoryList;
