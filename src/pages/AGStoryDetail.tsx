import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Volume2, VolumeX, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import { useStoryReading } from '@/hooks/useStoryReading';
import StoryLayout from '@/components/shared/StoryLayout';
import FileUploadDialog from '@/components/shared/FileUploadDialog';
import MediaGenerationDialog from '@/components/shared/MediaGenerationDialog';
import TranslationPreview from '@/components/shared/TranslationPreview';
import RecommendedBooksDialog from '@/components/shared/RecommendedBooksDialog';
import StoryImageIndicator from '@/components/shared/StoryImageIndicator';
import ImageViewerDialog from '@/components/shared/ImageViewerDialog';
import ModifyMenu from '@/components/shared/ModifyMenu';

interface AGStory {
  id: string;
  title: string;
  content: string;
  category: 'world' | 'science' | 'greek_myths' | 'nordic_myths' | 'explorers';
  created_by: 'superuser';
  created_at: string;
  updated_at: string;
  has_image: boolean;
  language?: string;
}

const AGStoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [story, setStory] = useState<AGStory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedStory, setEditedStory] = useState<{ title: string; content: string }>({ title: '', content: '' });
  
  // Media dialogs
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showMediaGeneration, setShowMediaGeneration] = useState(false);
  const [showBooksDialog, setShowBooksDialog] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string>('');
  const [viewerImageStyle, setViewerImageStyle] = useState<string>('');
  
  // Unified reading service
  const reading = useStoryReading({
    story: story ? { ...story, content: story.content || '' } : null,
    onStoryUpdate: (updated) => setStory(updated),
    storyType: 'ag'
  });

  useEffect(() => {
    if (id) {
      loadStory(id);
    }

    // Listen for image saved events to refresh story state
    const handleImageSaved = (event: CustomEvent) => {
      if (event.detail.storyId === id) {
        console.log('🔄 Image saved event received, reloading story:', id);
        loadStory(id);
      }
    };

    const handleMediaUpdated = (event: CustomEvent) => {
      if (event.detail.storyId === id) {
        console.log('🔄 Media updated event received, reloading story:', id);
        loadStory(id);
      }
    };

    window.addEventListener('storyImageSaved', handleImageSaved as EventListener);
    window.addEventListener('media:updated', handleMediaUpdated as EventListener);

    return () => {
      window.removeEventListener('storyImageSaved', handleImageSaved as EventListener);
      window.removeEventListener('media:updated', handleMediaUpdated as EventListener);
    };
  }, [id]);

  const loadStory = async (storyId: string) => {
    try {
      const agStory = await fantasMiaDB.getAGStoryById(storyId);
      if (agStory) {
        setStory(agStory);
        setEditedStory({ title: agStory.title, content: agStory.content });
        console.log('📖 Loaded AG story:', { id: storyId, title: agStory.title });
      } else {
        toast({
          title: "Errore",
          description: "Storia non trovata",
          variant: "destructive",
        });
        navigate('/superuser-story-type-selection');
      }
    } catch (error) {
      console.error('❌ Error loading AG story:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento della storia",
        variant: "destructive",
      });
    }
  };

  const handleEditSave = async () => {
    if (!story || !editedStory.title.trim() || !editedStory.content.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci titolo e contenuto",
        variant: "destructive",
      });
      return;
    }

    const updatedStory = {
      ...story,
      title: editedStory.title,
      content: editedStory.content,
      updated_at: new Date().toISOString()
    };

    try {
      await fantasMiaDB.saveAGStory(updatedStory);
      setStory(updatedStory);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Storia aggiornata",
        description: "Le modifiche sono state salvate",
      });
      
      console.log('✅ AG story updated:', { id: story.id, title: updatedStory.title });
    } catch (error) {
      console.error('❌ Error updating AG story:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!story || !confirm('Sei sicuro di voler eliminare questa storia?')) return;

    try {
      await fantasMiaDB.deleteAGStory(story.id);
      
      toast({
        title: "Storia eliminata",
        description: "La storia è stata rimossa",
      });
      
      console.log('🗑️ AG story deleted:', story.id);
      navigate('/superuser-story-type-selection');
    } catch (error) {
      console.error('❌ Error deleting AG story:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione",
        variant: "destructive",
      });
    }
  };

  const handleTTSToggle = () => {
    reading.toggleTTS();
  };

  const handleMediaUpdate = () => {
    if (story) {
      loadStory(story.id);
    }
  };

  const openEditDialog = () => {
    if (story) {
      setEditedStory({ title: story.title, content: story.content });
      setIsEditDialogOpen(true);
    }
  };

  const handleViewImage = async () => {
    if (!story) return;
    
    try {
      const mediaAsset = await fantasMiaDB.getMediaAssetByStoryId(story.id);
      if (mediaAsset) {
        const blob = new Blob([mediaAsset.data], { type: mediaAsset.mime });
        const url = URL.createObjectURL(blob);
        setViewerImageUrl(url);
        setViewerImageStyle(mediaAsset.metadata?.style || 'Generato da AI');
        setShowImageViewer(true);
        console.log('🖼️ Opening image viewer for story:', story.id);
      } else {
        toast({
          title: "Nessuna immagine",
          description: "Non c'è un'immagine associata a questa storia",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error loading image:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento dell'immagine",
        variant: "destructive",
      });
    }
  };

  const handleImageViewerClose = () => {
    if (viewerImageUrl) {
      URL.revokeObjectURL(viewerImageUrl);
    }
    setShowImageViewer(false);
    setViewerImageUrl('');
    setViewerImageStyle('');
  };

  const getCategoryRoute = (category: string) => {
    const categoryRoutes: Record<string, string> = {
      'explorers': '/ag-explorers',
      'greek_myths': '/ag-greek-myths',
      'nordic_myths': '/ag-nordic-myths',
      'world': '/ag-reading-stories',
      'science': '/ag-science-stories'
    };
    return categoryRoutes[category] || '/superuser-story-type-selection';
  };

  if (!story) {
    return (
      <StoryLayout
        title="Caricamento..."
        subtitle="Caricamento storia in corso"
        onBack={() => navigate('/superuser-story-type-selection')}
      >
        <div className="text-center py-8">
          <p>Caricamento storia...</p>
        </div>
      </StoryLayout>
    );
  }

  return (
    <StoryLayout
      title={story.title}
      subtitle="Dettaglio storia pubblica"
      onBack={() => navigate(getCategoryRoute(story.category))}
    >
      <div className="space-y-6">
        {/* Action Menu - Top Bar */}
        <div className="flex flex-wrap justify-between items-center gap-3 p-4 bg-accent/30 rounded-lg border">
          <div className="flex flex-wrap gap-2">
            {/* MEDIA(AI) Menu unificato */}
            <ModifyMenu
              storyContent={story.content}
              storyTitle={story.title}
              storyId={story.id}
              isEditing={false}
              onEditToggle={() => {}}
              showEditButton={false}
              userRole="superuser"
              userId="superuser"
              onUploadClick={() => setShowUploadDialog(true)}
              onViewImageClick={handleViewImage}
              onMediaUpdate={handleMediaUpdate}
            />

            {/* Translation */}
            <Button 
              variant="outline" 
              onClick={() => reading.initiateTranslation()}
              disabled={reading.isTranslating}
              className="flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              {reading.getTranslationButtonText()}
            </Button>

            {/* TTS */}
            <Button variant="outline" onClick={handleTTSToggle}>
              {reading.isPlaying ? (
                <>
                  <VolumeX className="w-4 h-4 mr-2" />
                  {reading.getTTSButtonText()}
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Leggi
                </>
              )}
            </Button>
          </div>

          <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Elimina
          </Button>
        </div>

        {/* Story Content with Edit Capability */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{story.title}</h2>
                <StoryImageIndicator storyId={story.id} className="ml-2" />
              </div>
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Edit className="w-4 h-4 mr-2" />
                Modifica
              </Button>
            </div>
            <ScrollArea className="h-[550px]">
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {story.content}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Modifica Storia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Titolo storia"
                value={editedStory.title}
                onChange={(e) => setEditedStory(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Contenuto storia"
                value={editedStory.content}
                onChange={(e) => setEditedStory(prev => ({ ...prev, content: e.target.value }))}
                rows={15}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleEditSave}>
                  Salva modifiche
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        {story && (
          <FileUploadDialog
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            storyId={story.id}
            storyTitle={story.title}
            userId="superuser"
          />
        )}

        {/* Media Generation Dialog */}
        {story && (
          <MediaGenerationDialog
            open={showMediaGeneration}
            onOpenChange={setShowMediaGeneration}
            storyContent={story.content}
            storyTitle={story.title}
            storyId={story.id}
            userId="superuser"
          />
        )}

        {/* Translation Preview Dialog */}
        <TranslationPreview
          open={reading.showPreview || reading.isTranslating}
          onOpenChange={() => {}}
          originalTitle={story?.title || ''}
          originalContent={story?.content || ''}
          translatedTitle={reading.pendingTranslation?.title || ''}
          translatedContent={reading.pendingTranslation?.content || ''}
          language={reading.getCurrentLanguage() === 'italian' ? 'english' : 'italian'}
          onConfirm={reading.confirmTranslation}
          onCancel={reading.cancelTranslation}
          isSuperuser={true}
        />

        {/* Books Dialog */}
        <RecommendedBooksDialog
          open={showBooksDialog}
          onOpenChange={setShowBooksDialog}
          storyId={story?.id || ''}
          storyTitle={story?.title || ''}
          isSuperuser={true}
        />

        {/* Image Viewer Dialog */}
        <ImageViewerDialog
          open={showImageViewer}
          onOpenChange={handleImageViewerClose}
          imageUrl={viewerImageUrl}
          storyTitle={story?.title || ''}
          style={viewerImageStyle}
        />
      </div>
    </StoryLayout>
  );
};

export default AGStoryDetail;