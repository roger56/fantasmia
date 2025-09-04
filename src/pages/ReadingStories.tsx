import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Trash2 } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import { getReadingStories, deleteReadingStory, ReadingStory } from '@/utils/userStorage';
import StoryLayout from '@/components/shared/StoryLayout';
import { useToast } from '@/hooks/use-toast';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ReadingStories = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<ReadingStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string>('');
  const [isSuperuser, setIsSuperuser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      
      setIsAuthenticated(true);
      setIsSuperuser(authStatus.userName === 'superuser');
      setLoading(false);
      loadReadingStories();
    };

    checkAuth();
  }, [navigate]);

  const loadReadingStories = async () => {
    setLoadingStories(true);
    try {
      // Get stories from localStorage and filter for magic stories
      const readingStories = getReadingStories();
      // Filter for magic stories based on category or fallback to general stories
      const magicStories = readingStories.filter(story => 
        story.category === 'magic' || 
        (!story.category && story.category !== 'science') // Legacy stories without category
      );
      const sortedStories = magicStories.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setStories(sortedStories);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le storie",
        variant: "destructive"
      });
    } finally {
      setLoadingStories(false);
    }
  };

  const handleDeleteClick = (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStoryToDelete(storyId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteReadingStory(storyToDelete)) {
      toast({
        title: "Successo",
        description: "Storia eliminata con successo"
      });
      loadReadingStories();
    } else {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la storia",
        variant: "destructive"
      });
    }
    setShowDeleteDialog(false);
    setStoryToDelete('');
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <ProfileIndicator />
      <StoryLayout
        title="Storie Magiche"
        subtitle="Storie magiche che si raccontano nel mondo"
        onBack={() => navigate('/reading-story-type-selection')}
        showHomeButton={true}
        headerContent={
          isSuperuser ? (
            <Button 
              onClick={() => navigate('/magic-story-editor')}
              variant="default"
              size="sm"
            >
              Aggiungi Storia del Mondo
            </Button>
          ) : null
        }
      >
      <div className="max-w-4xl mx-auto">
        {loadingStories ? (
          <div className="text-center text-muted-foreground">
            Caricamento storie...
          </div>
        ) : stories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nessuna storia magica disponibile</h3>
              <p className="text-muted-foreground">
                Il SuperUser non ha ancora caricato storie magiche del mondo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Storie Magiche del Mondo ({stories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60">
                <div className="space-y-2">
                  {stories.map((story) => (
                    <div 
                      key={story.id} 
                      className="p-3 rounded-lg border cursor-pointer transition-colors bg-white border-slate-200 hover:bg-slate-50"
                      onClick={() => navigate(`/reading-story-viewer/${story.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-800 truncate">{story.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        {isSuperuser && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDeleteClick(story.id, e)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                            title="Elimina storia"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa storia? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StoryLayout>
    </>
  );
};

export default ReadingStories;