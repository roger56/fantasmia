import React, { useState, useEffect } from 'react';
import StoryLayout from '@/components/shared/StoryLayout';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Image, 
  Volume2, 
  Trash2, 
  Edit, 
  Languages, 
  Palette, 
  Plus,
  BookOpen,
  VolumeX
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/useTTS';
import RecommendedBooksDialog from '@/components/shared/RecommendedBooksDialog';
import PoetryOverlay from '@/components/shared/PoetryOverlay';
import EditTextDialog from '@/components/shared/EditTextDialog';

interface ExplorerStory {
  id: string;
  title: string;
  content: string;
  hasImage: boolean;
  language: 'it' | 'en';
  createdAt: string;
}

const SuperuserExplorersManagement = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<ExplorerStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<ExplorerStory | null>(null);
  const [showBooks, setShowBooks] = useState(false);
  const [showPoetry, setShowPoetry] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { speak, stop, isPlaying } = useTTS();
  const { toast } = useToast();

  // Mock data - in real app would come from database
  useEffect(() => {
    const mockStories: ExplorerStory[] = [
      {
        id: '1',
        title: 'Marco Polo e la Via della Seta',
        content: 'Marco Polo intraprese un incredibile viaggio verso l\'Oriente, scoprendo terre sconosciute...',
        hasImage: true,
        language: 'it',
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        title: 'Cristoforo Colombo e il Nuovo Mondo',
        content: 'Nel 1492, Cristoforo Colombo salpò verso occidente alla ricerca di una nuova rotta per le Indie...',
        hasImage: false,
        language: 'it',
        createdAt: '2024-01-10'
      },
      {
        id: '3',
        title: 'Vasco da Gama e la Rotta per l\'India',
        content: 'Il coraggioso navigatore portoghese circumnavigò l\'Africa per raggiungere l\'India...',
        hasImage: true,
        language: 'it',
        createdAt: '2024-01-05'
      }
    ];
    setStories(mockStories);
  }, []);

  const handleReadStory = (story: ExplorerStory) => {
    const textToRead = `${story.title}. ${story.content}`;
    
    if (isPlaying) {
      stop();
    } else {
      speak(textToRead, story.language === 'it' ? 'italian' : 'english');
    }
  };

  const handleToggleLanguage = (story: ExplorerStory) => {
    // Mock language toggle
    const updatedStory = {
      ...story,
      language: story.language === 'it' ? 'en' as const : 'it' as const
    };
    
    setStories(prev => prev.map(s => s.id === story.id ? updatedStory : s));
    
    toast({
      title: "Lingua cambiata",
      description: `Storia tradotta in ${story.language === 'it' ? 'inglese' : 'italiano'}`
    });
  };

  const handleDeleteStory = (storyId: string) => {
    setStories(prev => prev.filter(s => s.id !== storyId));
    toast({
      title: "Storia eliminata",
      description: "La storia è stata rimossa con successo"
    });
  };

  const handleEditStory = (story: ExplorerStory) => {
    setSelectedStory(story);
    setShowEditDialog(true);
  };

  const handleSaveEdit = (newText: string, newTitle?: string) => {
    if (!selectedStory) return;
    
    const updatedStory = {
      ...selectedStory,
      content: newText,
      title: newTitle || selectedStory.title
    };
    
    setStories(prev => prev.map(s => s.id === selectedStory.id ? updatedStory : s));
    setSelectedStory(null);
    
    toast({
      title: "Storia modificata",
      description: "Le modifiche sono state salvate"
    });
  };

  const handleShowBooks = (story: ExplorerStory) => {
    setSelectedStory(story);
    setShowBooks(true);
  };

  const handleShowPoetry = (story: ExplorerStory) => {
    setSelectedStory(story);
    setShowPoetry(true);
  };

  const handleViewStory = (story: ExplorerStory) => {
    // Navigate to story viewer
    navigate(`/explorer-story-viewer/${story.id}`);
  };

  const handleAddNewStory = () => {
    // Navigate to story creation form
    navigate('/create-explorer-story');
  };

  return (
    <StoryLayout
      title="I Grandi Esploratori"
      subtitle="Gestione delle storie sui grandi esploratori"
      onBack={() => navigate('/superuser-story-type-selection')}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Storie Disponibili</h2>
          <Button onClick={handleAddNewStory} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Aggiungi Nuova Storia
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {stories.map((story) => (
                  <div key={story.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleViewStory(story)}
                    >
                      <div className="font-medium">{story.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Creata il {new Date(story.createdAt).toLocaleDateString('it-IT')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Recommended Books */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowBooks(story)}
                        title="Libri consigliati"
                      >
                        <BookOpen className="w-4 h-4" />
                      </Button>

                      {/* Image Status */}
                      <Badge variant={story.hasImage ? "default" : "secondary"}>
                        <Image className="w-3 h-3 mr-1" />
                        {story.hasImage ? "✓" : "✗"}
                      </Badge>

                      {/* TTS */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReadStory(story)}
                        title="Leggi storia"
                      >
                        {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>

                      {/* Language Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLanguage(story)}
                        title="Cambia lingua"
                      >
                        <Languages className="w-4 h-4" />
                        <span className="text-xs ml-1">{story.language.toUpperCase()}</span>
                      </Button>

                      {/* Edit Menu */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStory(story)}
                        title="Modifica testo"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      {/* Poetry */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowPoetry(story)}
                        title="Genera poesia"
                      >
                        📝
                      </Button>

                      {/* Drawing */}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Gestisci disegno"
                      >
                        <Palette className="w-4 h-4" />
                      </Button>

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            title="Elimina storia"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                            <AlertDialogDescription>
                              Vuoi eliminare la storia "{story.title}"? Questa azione non può essere annullata.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStory(story.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {stories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nessuna storia disponibile. Clicca su "Aggiungi Nuova Storia" per iniziare.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {selectedStory && (
        <>
          <RecommendedBooksDialog
            open={showBooks}
            onOpenChange={setShowBooks}
            storyId={selectedStory.id}
            storyTitle={selectedStory.title}
            isSuperuser={true}
          />

          <PoetryOverlay
            open={showPoetry}
            onOpenChange={setShowPoetry}
            storyContent={selectedStory.content}
            storyTitle={selectedStory.title}
          />

          <EditTextDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            initialText={selectedStory.content}
            initialTitle={selectedStory.title}
            onSave={handleSaveEdit}
            title="Modifica Storia Esploratori"
            showTitleField={true}
          />
        </>
      )}
    </StoryLayout>
  );
};

export default SuperuserExplorersManagement;