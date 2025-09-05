import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Volume2, VolumeX, Languages, Globe, Share2, Image, Trash2 } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import { getReadingStories, deleteReadingStory, ReadingStory } from '@/utils/userStorage';
import StoryLayout from '@/components/shared/StoryLayout';
import { useTTS } from '@/hooks/useTTS';
import { useToast } from '@/hooks/use-toast';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import CreativeMediaMenuEnhanced from '@/components/shared/CreativeMediaMenuEnhanced';
import { translateToEnglish } from '@/utils/translation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import StoryImageIndicator from '@/components/shared/StoryImageIndicator';

const ReadingStoryViewer = () => {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<ReadingStory | null>(null);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const { isPlaying, speak, stop, getButtonText } = useTTS();
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
      loadStory();
    };

    checkAuth();
  }, [navigate, storyId]);

  const loadStory = () => {
    if (!storyId) return;
    
    const readingStories = getReadingStories();
    const foundStory = readingStories.find(s => s.id === storyId);
    
    if (foundStory) {
      setStory(foundStory);
    } else {
      toast({
        title: "Errore",
        description: "Storia non trovata",
        variant: "destructive"
      });
      navigate('/reading-stories');
    }
  };

  const handleTTS = (content: string) => {
    speak(content, 'italian');
  };

  const handleTranslate = async () => {
    if (!story) return;
    
    if (showTranslated && translatedText) {
      // Switch back to Italian
      setShowTranslated(false);
      return;
    }
    
    if (!translatedText) {
      setIsTranslating(true);
      try {
        const translated = await translateToEnglish(story.content);
        setTranslatedText(translated);
        setShowTranslated(true);
        toast({
          title: "Traduzione completata",
          description: "Testo tradotto in inglese"
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: "Errore durante la traduzione",
          variant: "destructive"
        });
      } finally {
        setIsTranslating(false);
      }
    } else {
      setShowTranslated(true);
    }
  };

  const handleShare = () => {
    toast({
      title: "Condivisione",
      description: "Funzione di condivisione in sviluppo"
    });
  };

  const handleDeleteStory = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (story && deleteReadingStory(story.id)) {
      toast({
        title: "Successo",
        description: "Storia eliminata con successo"
      });
      navigate('/reading-stories');
    } else {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la storia",
        variant: "destructive"
      });
    }
    setShowDeleteDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  if (!isAuthenticated || !story) {
    return null;
  }

  return (
    <>
      <ProfileIndicator />
      <StoryLayout
        title={story.title}
        subtitle="Storia da leggere"
        onBack={() => navigate('/reading-story-type-selection')}
        showHomeButton={true}
        headerContent={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTranslate}
              disabled={isTranslating}
              className="flex items-center gap-2"
            >
              <Languages className="w-4 h-4" />
              {isTranslating ? 'Traducendo...' : (showTranslated ? 'Italiano' : 'Inglese')}
            </Button>
            
            {isSuperuser && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteStory}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Elimina
              </Button>
            )}
            
            <CreativeMediaMenuEnhanced 
              storyContent={story.content}
              storyTitle={story.title}
              storyId={story.id}
              userRole={isSuperuser ? 'superuser' : 'user'}
            />
          </div>
        }
      >
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {story.title}
                <StoryImageIndicator storyId={story.id} className="ml-2" />
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {showTranslated ? translatedText : story.content}
                </div>
              </ScrollArea>
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
      </StoryLayout>
    </>
  );
};

export default ReadingStoryViewer;