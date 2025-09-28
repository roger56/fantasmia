import React, { useState, useEffect } from 'react';
import StoryLayout from '@/components/shared/StoryLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ImageIcon, Eye, Edit, Trash2, Languages, PlayCircle, Plus } from 'lucide-react';
import { fantasMiaDB } from '@/utils/indexedDB';
import { useToast } from '@/hooks/use-toast';
import ImageViewerDialog from '@/components/shared/ImageViewerDialog';
import { usePermanentTranslation } from '@/hooks/usePermanentTranslation';
import { useTTS } from '@/hooks/useTTS';
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

const SuperuserReadingStoriesView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [worldStories, setWorldStories] = useState<AGStory[]>([]);
  const [scienceStories, setScienceStories] = useState<AGStory[]>([]);
  const [greekMythsStories, setGreekMythsStories] = useState<AGStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedStoryTitle, setSelectedStoryTitle] = useState<string>('');
  const [modifyMenuOpen, setModifyMenuOpen] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<AGStory | null>(null);
  
  const { isTranslating } = usePermanentTranslation(null, () => {});
  const { speak, stop, isPlaying } = useTTS();

  const loadStories = async () => {
    try {
      await fantasMiaDB.init();
      const allStories = await fantasMiaDB.getAllAGStories();
      
      setWorldStories(allStories.filter(s => s.category === 'world'));
      setScienceStories(allStories.filter(s => s.category === 'science'));
      setGreekMythsStories(allStories.filter(s => s.category === 'greek_myths'));
      setLoading(false);
    } catch (error) {
      console.error('Error loading stories:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle storie",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
    
    const handleStoryUpdate = () => loadStories();
    window.addEventListener('story:updated', handleStoryUpdate);
    
    return () => {
      window.removeEventListener('story:updated', handleStoryUpdate);
    };
  }, []);

  const handleImageClick = async (storyId: string, storyTitle: string) => {
    try {
      const mediaAsset = await fantasMiaDB.getMediaAssetByStoryId(storyId);
      if (mediaAsset && mediaAsset.data) {
        const url = URL.createObjectURL(mediaAsset.data);
        setSelectedImageUrl(url);
        setSelectedStoryTitle(storyTitle);
        setImageViewerOpen(true);
      }
    } catch (error) {
      console.error('Error loading image:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento dell'immagine",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await fantasMiaDB.deleteAGStory(storyId);
      await loadStories();
      
      toast({
        title: "Storia eliminata",
        description: "La storia è stata eliminata con successo"
      });
      
      window.dispatchEvent(new CustomEvent('story:updated'));
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione della storia",
        variant: "destructive"
      });
    }
  };

  const handleTranslateStory = async (story: AGStory, toEnglish: boolean) => {
    try {
      // Import translation utilities
      const { translateToEnglish, translateToItalian } = await import('@/utils/translation');
      
      let translatedTitle: string;
      let translatedContent: string;
      
      if (toEnglish) {
        translatedTitle = await translateToEnglish(story.title);
        translatedContent = await translateToEnglish(story.content);
      } else {
        translatedTitle = await translateToItalian(story.title);
        translatedContent = await translateToItalian(story.content);
      }
      
      const updatedStory = {
        ...story,
        title: translatedTitle,
        content: translatedContent,
        updated_at: new Date().toISOString()
      };
      
      await fantasMiaDB.saveAGStory(updatedStory);
      await loadStories();
      
      toast({
        title: "Traduzione completata",
        description: `Storia tradotta in ${toEnglish ? 'inglese' : 'italiano'} e salvata`
      });
      
      window.dispatchEvent(new CustomEvent('story:updated'));
    } catch (error) {
      console.error('Error translating story:', error);
      toast({
        title: "Errore",
        description: "Errore nella traduzione della storia",
        variant: "destructive"
      });
    }
  };

  const handleContentChange = async (newContent: string, storyId: string) => {
    try {
      const story = [...worldStories, ...scienceStories, ...greekMythsStories].find(s => s.id === storyId);
      if (story) {
        const updatedStory = {
          ...story,
          content: newContent,
          updated_at: new Date().toISOString()
        };
        
        await fantasMiaDB.saveAGStory(updatedStory);
        await loadStories();
        
        window.dispatchEvent(new CustomEvent('story:updated'));
      }
    } catch (error) {
      console.error('Error updating story content:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const handleReadStory = (story: AGStory) => {
    const textToRead = `${story.title}. ${story.content}`;
    
    if (isPlaying) {
      stop();
    } else {
      speak(textToRead, 'italian');
    }
  };

  const StoryRow = ({ story, onImageClick, onDelete, onTranslate, onRead }: {
    story: AGStory;
    onImageClick: (id: string, title: string) => void;
    onDelete: (id: string) => void;
    onTranslate: (story: AGStory, toEnglish: boolean) => void;
    onRead: (story: AGStory) => void;
  }) => (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <h3 
          className="font-medium text-sm text-blue-600 hover:text-blue-800 cursor-pointer truncate"
          onClick={() => navigate(`/superuser-reading-story-viewer/${story.id}`)}
        >
          {story.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Creato: {formatDate(story.created_at)}
        </p>
      </div>
      
      <div className="flex items-center gap-2 ml-4">
        {/* Image Icon */}
        <Button
          variant="ghost"
          size="sm"
          className={`p-1 h-8 w-8 ${story.has_image ? 'text-green-600 hover:text-green-700' : 'text-red-600'}`}
          onClick={() => story.has_image && onImageClick(story.id, story.title)}
          disabled={!story.has_image}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>

        {/* TTS Read Button */}
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-8 w-8 text-green-600 hover:text-green-700"
          onClick={() => onRead(story)}
        >
          <PlayCircle className="w-4 h-4" />
        </Button>

        {/* View Button */}
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-8 w-8 text-blue-600 hover:text-blue-700"
          onClick={() => navigate(`/superuser-reading-story-viewer/${story.id}`)}
        >
          <Eye className="w-4 h-4" />
        </Button>

        {/* Modify Dropdown */}
        <DropdownMenu open={modifyMenuOpen === story.id} onOpenChange={(open) => setModifyMenuOpen(open ? story.id : null)}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8 text-yellow-600 hover:text-yellow-700">
              <Edit className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => {
              setSelectedStory(story);
              setModifyMenuOpen(null);
            }}>
              Modifica testo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSelectedStory(story);
              setModifyMenuOpen(null);
            }}>
              Migliora con AI
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSelectedStory(story);
              setModifyMenuOpen(null);
            }}>
              Poesia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-8 w-8 text-purple-600 hover:text-purple-700"
          onClick={() => onTranslate(story, true)}
          disabled={isTranslating}
        >
          <Languages className="w-4 h-4" />
        </Button>

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8 text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare la storia "{story.title}"? Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(story.id)}>
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  const StorySection = ({ title, stories, addPath, category }: {
    title: string;
    stories: AGStory[];
    addPath: string;
    category: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button
          onClick={() => navigate(addPath)}
          className="flex items-center gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Aggiungi {category}
        </Button>
      </div>
      
      <ScrollArea className="h-64 border rounded-md">
        {stories.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Nessuna storia presente
          </div>
        ) : (
          <div>
            {stories.map((story) => (
              <StoryRow
                key={story.id}
                story={story}
                onImageClick={handleImageClick}
                onDelete={handleDeleteStory}
                onTranslate={handleTranslateStory}
                onRead={handleReadStory}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (loading) {
    return (
      <StoryLayout
        title="Gestione Storie SU"
        subtitle="Area Superuser - Caricamento..."
        onBack={() => navigate('/superuser-story-type-selection')}
      >
        <div className="text-center">Caricamento storie...</div>
      </StoryLayout>
    );
  }

  return (
    <StoryLayout
      title="Gestione Storie SU"
      subtitle="Area Superuser - Gestisci tutte le categorie di storie"
      onBack={() => navigate('/superuser-story-type-selection')}
    >
      <div className="space-y-6">
        {/* Storie del Mondo */}
        <StorySection
          title="Storie del Mondo"
          stories={worldStories}
          addPath="/superuser-reading-stories-management"
          category="storia del mondo"
        />

        {/* Storie di Scienza */}
        <StorySection
          title="Storie di Scienza"
          stories={scienceStories}
          addPath="/superuser-science-stories-management"
          category="storia scientifica"
        />

        {/* I Miti Greci */}
        <StorySection
          title="I Miti Greci"
          stories={greekMythsStories}
          addPath="/superuser-greek-myths-management"
          category="mito greco"
        />
      </div>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
        imageUrl={selectedImageUrl}
        storyTitle={selectedStoryTitle}
        style="Generata"
      />

      {/* Modify Menu */}
      {selectedStory && (
        <ModifyMenu
          storyContent={selectedStory.content}
          storyTitle={selectedStory.title}
          storyId={selectedStory.id}
          isEditing={false}
          onEditToggle={() => {}}
          onContentChange={(newContent) => handleContentChange(newContent, selectedStory.id)}
        />
      )}
    </StoryLayout>
  );
};

export default SuperuserReadingStoriesView;