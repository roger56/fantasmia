import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import { getReadingStories, ReadingStory } from '@/utils/userStorage';
import StoryLayout from '@/components/shared/StoryLayout';
import { useToast } from '@/hooks/use-toast';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const ReadingStories = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<ReadingStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      
      setIsAuthenticated(true);
      setLoading(false);
      loadReadingStories();
    };

    checkAuth();
  }, [navigate]);

  const loadReadingStories = async () => {
    setLoadingStories(true);
    try {
      // Get reading stories from localStorage (created by SuperUser)
      const readingStories = getReadingStories();
      setStories(readingStories);
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
        subtitle="Le storie che si raccontano nel mondo"
        onBack={() => navigate('/dashboard')}
        showHomeButton={true}
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
              <h3 className="text-lg font-medium mb-2">Nessuna storia disponibile</h3>
              <p className="text-muted-foreground">
                Il SuperUser non ha ancora pubblicato storie per la lettura.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Lista Storie ({stories.length})
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
                      <h3 className="font-medium text-slate-800 truncate">{story.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {story.author && `di ${story.author} • `}
                        Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </StoryLayout>
    </>
  );
};

export default ReadingStories;