import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Volume2, VolumeX, Languages, Globe, Share2, Image } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import { getReadingStories, ReadingStory } from '@/utils/userStorage';
import StoryLayout from '@/components/shared/StoryLayout';
import { useTTS } from '@/hooks/useTTS';
import { useToast } from '@/hooks/use-toast';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import CreativeMediaMenuEnhanced from '@/components/shared/CreativeMediaMenuEnhanced';
import { translateToEnglish } from '@/utils/translation';

const ReadingStoryViewer = () => {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<ReadingStory | null>(null);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
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
    
    setIsTranslating(true);
    try {
      const translated = await translateToEnglish(story.content);
      setTranslatedText(translated);
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
  };

  const handleShare = () => {
    toast({
      title: "Condivisione",
      description: "Funzione di condivisione in sviluppo"
    });
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
        onBack={() => navigate('/reading-stories')}
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
              {isTranslating ? 'Traducendo...' : 'Inglese'}
            </Button>
            
            <CreativeMediaMenuEnhanced 
              storyContent={story.content}
              storyTitle={story.title}
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
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {translatedText || story.content}
                </div>
              </ScrollArea>
              {translatedText && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Testo originale:</h4>
                  <ScrollArea className="h-32">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {story.content}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </StoryLayout>
    </>
  );
};

export default ReadingStoryViewer;