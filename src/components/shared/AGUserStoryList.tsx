import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoryLayout from '@/components/shared/StoryLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Volume2, VolumeX, Volume1, Image, BookOpen } from 'lucide-react';
import { useUnifiedTTS } from '@/hooks/useUnifiedTTS';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import RecommendedBooksDialog from '@/components/shared/RecommendedBooksDialog';
import ImageViewerDialog from '@/components/shared/ImageViewerDialog';

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
  const { speak, stop, pause, isPlaying, isPaused, currentStoryId } = useUnifiedTTS();
  const { toast } = useToast();
  const [selectedStory, setSelectedStory] = useState<AGStory | null>(null);
  const [showBooksDialog, setShowBooksDialog] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageStyle, setSelectedImageStyle] = useState<string>("Generato da AI");

  useEffect(() => {
    loadStories();
  }, [category]);

  const loadStories = async () => {
    try {
      await fantasMiaDB.init();
      // CRITICAL: Ensure seed stories are loaded BEFORE reading
      await fantasMiaDB.ensureAGSeedStoriesLoaded();
      console.log('AGUserStoryList: seed loaded, now reading stories for category:', category);
      
      const allStories = await fantasMiaDB.getAllAGStories();
      const categoryStories = allStories
        .filter(story => story.category === category)
        .map(story => ({
          ...story,
          language: story.language || 'italian'
        }));
      console.log('AGUserStoryList: loaded', categoryStories.length, 'stories for category:', category);
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
    
    // Se sta leggendo questa storia
    if (isPlaying && currentStoryId === story.id) {
      // Se è in pausa, riprendi
      if (isPaused) {
        speak(fullText, 'italian', story.id); // Il servizio gestisce automaticamente resume
      } else {
        // Altrimenti metti in pausa
        pause();
      }
    } else {
      // Nuova storia, inizia lettura
      speak(fullText, 'italian', story.id);
    }
  };

  const handleImageClick = async (story: AGStory, event: React.MouseEvent) => {
    event.stopPropagation();
    if (story.has_image) {
      try {
        // Carica l'immagine da IndexedDB e aprila in overlay
        const mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(story.id);
        if (mediaAsset && mediaAsset.data) {
          const url = URL.createObjectURL(mediaAsset.data);
          setSelectedImageUrl(url);
          setSelectedStory(story);
          // Extract style from metadata if available
          const style = mediaAsset.metadata?.style || "Generato da AI";
          setSelectedImageStyle(style.charAt(0).toUpperCase() + style.slice(1)); // Capitalize
          setImageDialogOpen(true);
        } else {
          toast({
            title: "Errore",
            description: "Impossibile caricare l'immagine"
          });
        }
      } catch (error) {
        console.error('Error loading image:', error);
        toast({
          title: "Errore",
          description: "Impossibile caricare l'immagine",
          variant: "destructive"
        });
      }
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
                      className="flex items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors gap-2 md:gap-4 min-h-[60px]"
                      onClick={() => handleStoryClick(story)}
                    >
                      {/* ✅ REQUISITO 3: Titolo principale, data secondaria su mobile */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-base md:text-lg leading-tight line-clamp-2">{story.title}</h3>
                        <p className="text-[10px] md:text-xs text-muted-foreground/70 mt-0.5 hidden sm:block">
                          {new Date(story.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      
                      {/* ✅ REQUISITO 4: Azioni compatte e ben spaziate su mobile */}
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        {/* Read button with TTS */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleRead(story, e)}
                                className="h-8 w-8 md:h-9 md:w-9 p-0"
                              >
                                {isPlaying && currentStoryId === story.id ? (
                                  isPaused ? (
                                    <Volume1 className="h-4 w-4 text-orange-600" />
                                  ) : (
                                    <VolumeX className="h-4 w-4 text-primary" />
                                  )
                                ) : (
                                  <Volume2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {isPlaying && currentStoryId === story.id 
                                  ? (isPaused ? 'Riprendi' : 'Pausa')
                                  : 'Leggi'
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Image indicator - SEMPRE visibile (verde/rossa) */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleImageClick(story, e)}
                                className="h-8 w-8 md:h-9 md:w-9 p-0"
                              >
                                <Image className={`h-4 w-4 ${story.has_image ? 'text-green-600' : 'text-red-600'}`} />
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
                                className="h-8 w-8 md:h-9 md:w-9 p-0"
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

      {/* Image Viewer Dialog */}
      {selectedStory && selectedImageUrl && (
        <ImageViewerDialog
          open={imageDialogOpen}
          onOpenChange={setImageDialogOpen}
          imageUrl={selectedImageUrl}
          storyTitle={selectedStory.title}
          storyId={selectedStory.id}
          style={selectedImageStyle}
        />
      )}
    </StoryLayout>
  );
};

export default AGUserStoryList;
