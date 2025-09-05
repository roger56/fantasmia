import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import { getReadingStories, ReadingStory } from '@/utils/userStorage';
import StoryLayout from '@/components/shared/StoryLayout';
import { useToast } from '@/hooks/use-toast';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import StoryImageIndicator from '@/components/shared/StoryImageIndicator';
import CreativeMediaMenuEnhanced from '@/components/shared/CreativeMediaMenuEnhanced';

const UserReadingSuperuserStories = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<ReadingStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      
      // Solo utenti non Superuser possono accedere a questa pagina
      if (authStatus.userName === 'superuser') {
        navigate('/reading-story-type-selection');
        return;
      }
      
      setIsAuthenticated(true);
      setIsUser(authStatus.userName !== 'superuser');
      setLoading(false);
      loadSuperuserStories();
    };

    checkAuth();
  }, [navigate]);

  const loadSuperuserStories = async () => {
    setLoadingStories(true);
    try {
      // Ottieni tutte le storie di lettura create dal Superuser
      const readingStories = getReadingStories();
      const superuserStories = readingStories.filter(story => 
        story.authorName === 'superuser' || story.authorId === 'superuser' || 
        (!story.authorName && !story.authorId) // Storie legacy senza autore sono del Superuser
      );
      const sortedStories = superuserStories.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setStories(sortedStories);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le storie del Superuser",
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
        title="Storie del Superuser"
        subtitle="Tutte le storie create dal Superuser"
        onBack={() => navigate('/reading-story-type-selection')}
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
                  Il Superuser non ha ancora creato storie di lettura.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <Card key={story.id} className="bg-white border-slate-200">
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
                    <ScrollArea className="h-32 mb-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{story.content}</p>
                    </ScrollArea>
                    
                    {/* Menu azioni per utenti non Superuser */}
                    <div className="flex justify-end">
                      <CreativeMediaMenuEnhanced
                        storyContent={story.content}
                        storyTitle={story.title}
                        storyId={story.id}
                        userRole="user"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </StoryLayout>
    </>
  );
};

export default UserReadingSuperuserStories;