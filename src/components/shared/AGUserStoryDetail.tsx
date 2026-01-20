import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StoryLayout from '@/components/shared/StoryLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Volume2, VolumeX, Globe, Image, BookOpen, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import { useStoryReading } from '@/hooks/useStoryReading';
import TranslationPreview from '@/components/shared/TranslationPreview';
import ImageViewerDialog from '@/components/shared/ImageViewerDialog';
import RecommendedBooksDialog from '@/components/shared/RecommendedBooksDialog';
import StoryImageIndicator from '@/components/shared/StoryImageIndicator';

interface AGStory {
  id: string;
  title: string;
  content: string;
  has_image: boolean;
  language: string;
  category: string;
  created_at: string;
}

const AGUserStoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<AGStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaAsset, setMediaAsset] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showBooksDialog, setShowBooksDialog] = useState(false);
  
  const reading = useStoryReading({
    story,
    onStoryUpdate: setStory,
    storyType: 'ag'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStory();

    // Listen for image saved events to refresh story state
    const handleImageSaved = (event: CustomEvent) => {
      if (event.detail.storyId === id) {
        console.log('🔄 Image saved event received, reloading story:', id);
        loadStory();
      }
    };

    const handleMediaUpdated = (event: CustomEvent) => {
      if (event.detail.storyId === id) {
        console.log('🔄 Media updated event received, reloading story:', id);
        loadStory();
      }
    };

    window.addEventListener('storyImageSaved', handleImageSaved as EventListener);
    window.addEventListener('media:updated', handleMediaUpdated as EventListener);

    return () => {
      window.removeEventListener('storyImageSaved', handleImageSaved as EventListener);
      window.removeEventListener('media:updated', handleMediaUpdated as EventListener);
    };
  }, [id]);

  const loadStory = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      await fantasMiaDB.init();
      const agStory = await fantasMiaDB.getAGStoryById(id);
      
      if (agStory) {
        // Default su inglese se disponibile, altrimenti fallback italiano
        const hasEnglishVersion = agStory.language === 'english';
        setStory({
          ...agStory,
          language: hasEnglishVersion ? 'english' : (agStory.language || 'italian')
        });
        loadMediaAsset(id);
      } else {
        toast({
          title: "Storia non trovata",
          description: "La storia richiesta non esiste",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading story:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento della storia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMediaAsset = async (storyId: string) => {
    try {
      const asset = await fantasMiaDB.getLatestMediaAssetByStoryId(storyId);
      if (asset && asset.data) {
        const reader = new FileReader();
        reader.onload = () => {
          setMediaAsset(reader.result as string);
        };
        reader.readAsDataURL(asset.data);
      }
    } catch (error) {
      console.error('Error loading media asset:', error);
    }
  };

  const handleRead = () => {
    reading.toggleTTS();
  };

  const handleImageClick = () => {
    if (mediaAsset) {
      setShowImageViewer(true);
    } else {
      toast({
        title: "Nessuna immagine",
        description: "Nessuna immagine associata a questa storia"
      });
    }
  };

  const handleBack = () => {
    navigate('/story-type-selection');
  };

  if (loading) {
    return (
      <StoryLayout title="Caricamento..." onBack={handleBack}>
        <div className="text-center py-8">Caricamento storia...</div>
      </StoryLayout>
    );
  }

  if (!story) {
    return (
      <StoryLayout title="Storia non trovata" onBack={handleBack}>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">La storia richiesta non è disponibile</p>
          </CardContent>
        </Card>
      </StoryLayout>
    );
  }

  return (
    <StoryLayout
      title={story.title}
      onBack={handleBack}
      headerContent={
      <div className="flex items-center gap-2">
          {/* Read Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRead}
            className="flex items-center gap-2"
          >
            {reading.isPlaying ? (
              <>
                <VolumeX className="h-4 w-4" />
                {reading.isPaused ? 'Riprendi' : 'Pausa'}
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                Leggi
              </>
            )}
          </Button>

          {/* Translation Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => reading.initiateTranslation()}
            disabled={reading.isTranslating}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            {reading.getTranslationButtonText()}
          </Button>

          {/* Image Indicator */}
          <StoryImageIndicator storyId={story.id} className="cursor-pointer" />

          {/* Books Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBooksDialog(true)}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Libri
          </Button>
        </div>
      }
    >
      {/* Avviso sulla possibile perdita di traduzione - solo in modalità inglese */}
      {story.language === 'english' && (
        <Alert variant="default" className="mb-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            ⚠️ La traduzione in inglese potrebbe andare persa in caso di aggiornamento della storia da parte dell'amministratore.
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardContent className="p-8">
          <ScrollArea className="h-[500px]">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {story.content}
            </p>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      {showImageViewer && mediaAsset && (
        <ImageViewerDialog
          open={showImageViewer}
          onOpenChange={setShowImageViewer}
          imageUrl={mediaAsset}
          storyTitle={story.title}
          style="ai-generated"
        />
      )}

      {/* Translation Preview Dialog - NSU cannot save */}
      <TranslationPreview
        open={reading.showPreview || reading.isTranslating}
        onOpenChange={() => {}}
        originalTitle={story?.title || ''}
        originalContent={story?.content || ''}
        translatedTitle={reading.pendingTranslation?.title || ''}
        translatedContent={reading.pendingTranslation?.content || ''}
        language={reading.getCurrentLanguage() === 'italian' ? 'english' : 'italian'}
        onConfirm={reading.cancelTranslation}
        onCancel={reading.cancelTranslation}
        isSuperuser={false}
      />

      {/* Books Dialog */}
      <RecommendedBooksDialog
        open={showBooksDialog}
        onOpenChange={setShowBooksDialog}
        storyId={story.id}
        storyTitle={story.title}
        isSuperuser={false}
      />

    </StoryLayout>
  );
};

export default AGUserStoryDetail;
