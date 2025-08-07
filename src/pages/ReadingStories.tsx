import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Volume2, VolumeX } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import StoryLayout from '@/components/shared/StoryLayout';
import { useTTS } from '@/hooks/useTTS';
import { useToast } from '@/hooks/use-toast';

interface SuperUserStory {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const ReadingStories = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<SuperUserStory[]>([]);
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
      loadSuperUserStories();
    };

    checkAuth();
  }, [navigate]);

  const loadSuperUserStories = async () => {
    setLoadingStories(true);
    try {
      // Placeholder for now - will show sample stories
      const sampleStories: SuperUserStory[] = [
        {
          id: '1',
          title: 'La Principessa e il Drago',
          content: 'C\'era una volta una principessa coraggiosa che viveva in un castello sul mare. Un giorno, un drago minaccioso arrivò nel regno, spaventando tutti gli abitanti. Ma la principessa, invece di fuggire, decise di parlare con il drago e scoprì che era solo molto solo e triste. Insieme diventarono grandi amici e protessero il regno per sempre.',
          created_at: '2024-01-15'
        },
        {
          id: '2',
          title: 'Il Piccolo Esploratore',
          content: 'Marco era un bambino molto curioso che amava esplorare. Un giorno, mentre giocava in giardino, trovò una porta misteriosa nascosta tra i cespugli. Aprendo la porta, scoprì un mondo magico pieno di creature fantastiche e colori meravigliosi. Visse mille avventure e quando tornò a casa, portò con sé la magia nel cuore.',
          created_at: '2024-01-10'
        },
        {
          id: '3',
          title: 'La Stella Cadente',
          content: 'Nina guardava spesso il cielo notturno dal suo balcone. Una sera vide una stella cadente più luminosa delle altre. La stella scese dal cielo e si trasformò in una piccola fatina che le disse di essere la guardiana dei sogni. La fatina regalò a Nina un cristallo magico che l\'avrebbe aiutata a realizzare i suoi sogni più belli.',
          created_at: '2024-01-08'
        }
      ];

      setStories(sampleStories);
      
      // In future, this would be a real API call:
      // const response = await supabase
      //   .from('superuser_stories')
      //   .select('*')
      //   .order('created_at', { ascending: false });
      
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
    if (isPlaying) {
      stop();
    } else {
      speak(content, 'italian');
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
          <div className="space-y-6">
            {stories.map((story) => (
              <Card key={story.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {story.title}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTTS(story.content)}
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
                    Pubblicata il {new Date(story.created_at).toLocaleDateString('it-IT')}
                  </p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {story.content}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StoryLayout>
  );
};

export default ReadingStories;