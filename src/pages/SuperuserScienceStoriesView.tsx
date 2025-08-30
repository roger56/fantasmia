import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Eye, Image, Trash2 } from 'lucide-react';
import { getScienceStories, deleteScienceStory, ScienceStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import ImageViewModal from '@/components/shared/ImageViewModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { fantasmiaDB, getStoryImage } from '@/utils/imageStorage';

const SuperuserScienceStoriesView = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<ScienceStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [imageStatus, setImageStatus] = useState<Record<string, boolean>>({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedStoryTitle, setSelectedStoryTitle] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndLoadStories = async () => {
      // Check if user is authenticated as superuser
      const authToken = localStorage.getItem('superuser-session');
      const authExpiry = localStorage.getItem('superuser-session-expiry');
      
      if (authToken && authExpiry && Date.now() < parseInt(authExpiry)) {
        setIsAuthenticated(true);
        await loadStories();
      } else {
        navigate('/superuser');
      }
    };

    checkAuthAndLoadStories();
  }, [navigate]);

  const loadStories = async () => {
    try {
      const scienceStories = await getScienceStories();
      const sortedStories = scienceStories.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setStories(sortedStories);
      
      // Check image status for each story
      const statusMap: Record<string, boolean> = {};
      for (const story of sortedStories) {
        statusMap[story.id] = await fantasmiaDB.hasImage(story.id);
      }
      setImageStatus(statusMap);
    } catch (error) {
      console.error('Error loading science stories:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le storie",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const deleted = deleteScienceStory(id);
      
      if (deleted) {
        setStories(stories.filter(story => story.id !== id));
        
        // Update image status
        const newImageStatus = { ...imageStatus };
        delete newImageStatus[id];
        setImageStatus(newImageStatus);
        
        toast({
          title: "Successo",
          description: "Storia scientifica eliminata con successo"
        });
      } else {
        throw new Error('Storia non trovata');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione",
        variant: "destructive"
      });
    }
  };

  const handleImageClick = async (story: ScienceStory) => {
    try {
      const imageUrl = await getStoryImage(story.id);
      setSelectedImageUrl(imageUrl);
      setSelectedStoryTitle(story.title);
      setShowImageModal(true);
    } catch (error) {
      console.error('Error loading image:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare l'immagine",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">{loading ? 'Caricamento...' : 'Verifica autenticazione...'}</div>
      </div>
    );
  }

  return (
    <>
      <ProfileIndicator />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <HomeButton />
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/superuser-story-management-selection')}
                className="mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-800">🔬 Gestione Storie Scientifiche</h1>
            </div>
            <Button
              onClick={() => navigate('/superuser-science-stories-management')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuova Storia
            </Button>
          </div>

          {/* Stories List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔬 Storie Scientifiche ({stories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {stories.length === 0 ? (
                <div className="text-center text-slate-600 py-8">
                  <p>Nessuna storia scientifica trovata.</p>
                  <p className="text-sm mt-2">Crea la prima storia per iniziare!</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {stories.map((story) => (
                    <div key={story.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 truncate">{story.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(story.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/superuser-science-story-viewer/${story.id}`)}
                          className="h-8 w-8 p-0"
                          title="Visualizza"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImageClick(story)}
                          className="h-8 w-8 p-0"
                          title="Mostra immagine"
                        >
                          <Image 
                            className={`w-4 h-4 ${
                              imageStatus[story.id] ? 'text-green-600' : 'text-red-600'
                            }`} 
                          />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Elimina"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sei sicuro di voler eliminare la storia "{story.title}"? 
                                Questa azione non può essere annullata.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(story.id)}
                                className="bg-red-600 hover:bg-red-700"
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Image View Modal */}
      <ImageViewModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={selectedImageUrl}
        storyTitle={selectedStoryTitle}
      />
    </>
  );
};

export default SuperuserScienceStoriesView;