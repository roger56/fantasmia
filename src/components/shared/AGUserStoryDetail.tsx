import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StoryLayout from '@/components/shared/StoryLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Volume2, VolumeX, Globe, Image, BookOpen } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { usePermanentTranslation } from '@/hooks/usePermanentTranslation';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import TranslationPreview from '@/components/shared/TranslationPreview';
import ImageViewerDialog from '@/components/shared/ImageViewerDialog';
import RecommendedBooksDialog from '@/components/shared/RecommendedBooksDialog';

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
  
  const { speak, stop, isPlaying, currentStoryId } = useTTS();
  const translation = usePermanentTranslation(story as any, (updated: any) => setStory(updated));
  const { toast } = useToast();

  useEffect(() => {
    loadStory();
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
        setStory({
          ...agStory,
          language: agStory.language || 'italian'
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
    if (!story) return;
    
    const fullText = `${story.title}. ${story.content}`;
    
    if (isPlaying && currentStoryId === story.id) {
      stop();
    } else {
      speak(fullText, translation.getCurrentLanguage(), story.id);
    }
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
            {isPlaying && currentStoryId === story.id ? (
              <>
                <VolumeX className="h-4 w-4" />
                Ferma
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
            onClick={() => translation.initiateTranslation()}
            disabled={translation.isTranslating}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            {translation.getButtonText()}
          </Button>

          {/* Image Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImageClick}
            className="flex items-center gap-2"
          >
            <Image className={`h-4 w-4 ${story.has_image ? 'text-green-600' : 'text-muted-foreground'}`} />
            Immagine
          </Button>

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

      {/* Books Dialog */}
      <RecommendedBooksDialog
        open={showBooksDialog}
        onOpenChange={setShowBooksDialog}
        storyId={story.id}
        storyTitle={story.title}
        isSuperuser={false}
      />

      {/* Translation Preview */}
      <TranslationPreview
        open={translation.showPreview || translation.isTranslating}
        onOpenChange={() => {}}
        originalTitle={story.title}
        originalContent={story.content}
        translatedTitle={translation.pendingTranslation?.title || ''}
        translatedContent={translation.pendingTranslation?.content || ''}
        language={translation.getCurrentLanguage() === 'italian' ? 'english' : 'italian'}
        onConfirm={translation.confirmTranslation}
        onCancel={translation.cancelTranslation}
      />
    </StoryLayout>
  );
};

export default AGUserStoryDetail;
