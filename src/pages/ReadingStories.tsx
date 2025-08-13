import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Volume2, VolumeX } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import { getReadingStories, ReadingStory } from '@/utils/userStorage';
import StoryLayout from '@/components/shared/StoryLayout';
import { useTTS } from '@/hooks/useTTS';
import { useToast } from '@/hooks/use-toast';

const ReadingStories = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<ReadingStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<ReadingStory | null>(null);
  const [loadingStories, setLoadingStories] = useState(false);
  const { isPlaying, speak, stop, getButtonText } = useTTS();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/home');
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
      // Get stories from localStorage (created by SuperUser)
      const readingStories = getReadingStories();
      const sortedStories = readingStories.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setStories(sortedStories);
      if (sortedStories.length > 0) {
        setSelectedStory(sortedStories[0]);
      }
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

  const handleTTS = (content: string) => {
    speak(content, 'italian');
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
    <StoryLayout
      title="Lettura Storie"
      subtitle="Storie caricate dal SuperUser"
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
                Il SuperUser non ha ancora caricato storie per la lettura.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Story List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Lista Storie ({stories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {stories.map((story) => (
                      <div 
                        key={story.id} 
                        className="p-3 rounded-lg border cursor-pointer transition-colors bg-white border-slate-200 hover:bg-slate-50"
                        onClick={() => setSelectedStory(story)}
                      >
                        <h3 className="font-medium text-slate-800 truncate">{story.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Story Reader */}
            {selectedStory && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {selectedStory.title}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTTS(selectedStory.content)}
                      className="flex items-center gap-2"
                    >
                      {isPlaying ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                      {getButtonText()}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aggiornata il {new Date(selectedStory.updated_at).toLocaleDateString('it-IT')}
                  </p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedStory.content}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </StoryLayout>
  );
};

export default ReadingStories;