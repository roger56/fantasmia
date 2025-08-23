import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, BookOpen, Plus, Eye, Trash2 } from 'lucide-react';
import { getReadingStories, deleteReadingStory, ReadingStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import HomeButton from '@/components/HomeButton';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const SuperuserReadingStoriesView = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<ReadingStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<ReadingStory | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated as superuser
    const authToken = localStorage.getItem('superuser-session');
    const authExpiry = localStorage.getItem('superuser-session-expiry');
    
    if (authToken && authExpiry && Date.now() < parseInt(authExpiry)) {
      setIsAuthenticated(true);
      loadStories();
    } else {
      navigate('/superuser');
    }
  }, [navigate]);

  const loadStories = () => {
    const readingStories = getReadingStories();
    setStories(readingStories.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ));
    if (readingStories.length > 0) {
      setSelectedStory(readingStories[0]);
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
      loadStories();
      if (selectedStory?.id === storyToDelete) {
        setSelectedStory(null);
      }
    }
    setShowDeleteDialog(false);
    setStoryToDelete('');
  };

  const handleViewStory = (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/superuser-reading-story-viewer/${storyId}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <ProfileIndicator />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <HomeButton />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/superuser')}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">📖 Gestione Storie da Leggere</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sezione A: Guarda storie presenti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Storie Presenti ({stories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stories.length === 0 ? (
                <div className="text-center text-slate-600 py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>Nessuna storia creata ancora.</p>
                  <p className="text-sm">Crea la prima storia per iniziare!</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {stories.map((story) => (
                      <div 
                        key={story.id} 
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStory?.id === story.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedStory(story)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-800 truncate">{story.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleViewStory(story.id, e)}
                              className="h-8 w-8 p-0"
                              title="Visualizza"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleDeleteClick(story.id, e)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Elimina"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sezione B: Aggiungi nuova storia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Aggiungi Nuova Storia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-200">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Crea una nuova storia magica
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Aggiungi una nuova storia al catalogo centrale per tutti gli utenti
              </p>
              <Button 
                onClick={() => navigate('/superuser-reading-stories-management')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Storia
              </Button>
            </div>
          </CardContent>
        </Card>

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
    </div>
    </>
  );
};

export default SuperuserReadingStoriesView;