import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Globe, Volume2, VolumeX, Trash2, Upload, Wand2, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import StoryLayout from '@/components/shared/StoryLayout';
import FileUploadDialog from '@/components/shared/FileUploadDialog';
import MediaGenerationDialog from '@/components/shared/MediaGenerationDialog';
import CopyrightWarningDialog from '@/components/shared/CopyrightWarningDialog';
import TranslationPreview from '@/components/shared/TranslationPreview';
import { useTTS } from '@/hooks/useTTS';
import { useTranslation } from '@/hooks/useTranslation';
import { translateToEnglish, translateToItalian } from '@/utils/translation';

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
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showCopyrightWarning, setShowCopyrightWarning] = useState(false);
  
  // Translation
  const [showTranslationPreview, setShowTranslationPreview] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<'italian' | 'english'>('italian');
  
  // Hooks
  const { isPlaying, isPaused, speak, stop, getButtonText } = useTTS();
  const { isTranslating } = useTranslation();

  useEffect(() => {
    if (id) {
      loadStory(id);
    }
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
    if (!story) return;
    
    if (isPlaying && !isPaused) {
      stop();
    } else {
      const language = currentLanguage === 'english' ? 'english' : 'italian';
      speak(story.content, language);
    }
  };

  const handleTranslate = async () => {
    if (!story) return;
    
    try {
      if (currentLanguage === 'italian') {
        // Translate to English
        const newTranslatedTitle = await translateToEnglish(story.title);
        const newTranslatedContent = await translateToEnglish(story.content);
        
        setTranslatedTitle(newTranslatedTitle);
        setTranslatedContent(newTranslatedContent);
        setShowTranslationPreview(true);
      } else {
        // Translate back to Italian
        const newTranslatedTitle = await translateToItalian(story.title);
        const newTranslatedContent = await translateToItalian(story.content);
        
        setTranslatedTitle(newTranslatedTitle);
        setTranslatedContent(newTranslatedContent);
        setShowTranslationPreview(true);
      }
    } catch (error) {
      toast({
        title: "Errore traduzione",
        description: "Non è stato possibile tradurre il contenuto",
        variant: "destructive"
      });
    }
  };

  const handleConfirmTranslation = async () => {
    if (!story) return;
    
    const updatedStory = {
      ...story,
      title: translatedTitle,
      content: translatedContent,
      language: currentLanguage === 'italian' ? 'english' : 'italian',
      updated_at: new Date().toISOString()
    };

    try {
      await fantasMiaDB.saveAGStory(updatedStory);
      setStory(updatedStory);
      setEditedStory({ title: translatedTitle, content: translatedContent });
      setCurrentLanguage(currentLanguage === 'italian' ? 'english' : 'italian');
      setShowTranslationPreview(false);
      
      toast({
        title: "Traduzione salvata",
        description: `La storia è stata tradotta in ${currentLanguage === 'italian' ? 'inglese' : 'italiano'}`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio della traduzione",
        variant: "destructive",
      });
    }
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
      onBack={() => navigate('/superuser-story-type-selection')}
    >
      <div className="space-y-6">
        {/* Action Menu */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {/* Media Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Media
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Carica da PC
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCopyrightWarning(true)}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Disegno AI
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Video className="w-4 h-4 mr-2" />
                  Filmato AI (placeholder)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Translation */}
            <Button 
              variant="outline" 
              onClick={handleTranslate}
              disabled={isTranslating}
            >
              <Globe className="w-4 h-4 mr-2" />
              {isTranslating ? 'Traduzione...' : (currentLanguage === 'italian' ? 'Inglese' : 'Italiano')}
            </Button>

            {/* TTS */}
            <Button variant="outline" onClick={handleTTSToggle}>
              {isPlaying && !isPaused ? (
                <>
                  <VolumeX className="w-4 h-4 mr-2" />
                  {getButtonText()}
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  {getButtonText()}
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={openEditDialog}>
              Modifica
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina
            </Button>
          </div>
        </div>

        {/* Story Content */}
        <Card>
          <CardContent className="p-6">
            <ScrollArea className="h-[600px]">
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold mb-4">{story.title}</h2>
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
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

        {/* AI Generation Dialog */}
        {story && (
          <MediaGenerationDialog
            open={showAIDialog}
            onOpenChange={setShowAIDialog}
            storyContent={story.content}
            storyTitle={story.title}
            storyId={story.id}
            userId="superuser"
          />
        )}

        {/* Copyright Warning Dialog */}
        <CopyrightWarningDialog
          open={showCopyrightWarning}
          onOpenChange={setShowCopyrightWarning}
          onConfirm={() => setShowAIDialog(true)}
        />

        {/* Translation Preview Dialog */}
        <TranslationPreview
          open={showTranslationPreview}
          onOpenChange={setShowTranslationPreview}
          originalTitle={story?.title || ''}
          originalContent={story?.content || ''}
          translatedTitle={translatedTitle}
          translatedContent={translatedContent}
          language={currentLanguage === 'italian' ? 'english' : 'italian'}
          onConfirm={handleConfirmTranslation}
          onCancel={() => setShowTranslationPreview(false)}
        />
      </div>
    </StoryLayout>
  );
};

export default AGStoryDetail;