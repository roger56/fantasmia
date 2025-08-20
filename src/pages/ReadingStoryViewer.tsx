import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Volume2, VolumeX, User, Calendar } from 'lucide-react';
import { getPublishedStories, PublishedStory } from '@/utils/userStorage';
import { AuthBridge } from '@/utils/authBridge';
import StoryLayout from '@/components/shared/StoryLayout';
import { useToast } from '@/hooks/use-toast';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const ReadingStoryViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [story, setStory] = useState<PublishedStory | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const checkAuthAndLoadStory = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/home');
        return;
      }
      
      setIsAuthenticated(true);
      
      if (id) {
        // Find the story in published stories
        const publishedStories = getPublishedStories();
        const foundStory = publishedStories.find(s => s.id === id);
        
        if (foundStory) {
          setStory(foundStory);
        } else {
          toast({
            title: "Storia non trovata",
            description: "La storia richiesta non è più disponibile",
            variant: "destructive"
          });
          navigate('/reading-stories');
        }
      }
    };

    checkAuthAndLoadStory();
  }, [id, navigate, toast]);

  const handleTextToSpeech = () => {
    if (!story) return;

    if ('speechSynthesis' in window) {
      if (isReading) {
        // Stop reading
        speechSynthesis.cancel();
        setIsReading(false);
        setSpeechUtterance(null);
      } else {
        // Start reading
        const utterance = new SpeechSynthesisUtterance(story.content);
        utterance.lang = 'it-IT';
        
        utterance.onstart = () => {
          setIsReading(true);
        };
        
        utterance.onend = () => {
          setIsReading(false);
          setSpeechUtterance(null);
        };
        
        utterance.onerror = () => {
          setIsReading(false);
          setSpeechUtterance(null);
          toast({
            title: "Errore",
            description: "Errore nella sintesi vocale",
            variant: "destructive"
          });
        };
        
        setSpeechUtterance(utterance);
        speechSynthesis.speak(utterance);
      }
    } else {
      toast({
        title: "Non supportato",
        description: "La sintesi vocale non è supportata da questo browser",
        variant: "destructive"
      });
    }
  };

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (speechUtterance) {
        speechSynthesis.cancel();
      }
    };
  }, [speechUtterance]);

  if (!isAuthenticated || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">
          {!isAuthenticated ? 'Verifica autenticazione...' : 'Caricamento storia...'}
        </div>
      </div>
    );
  }

  return (
    <>
      <ProfileIndicator />
      <StoryLayout
        title={story.title}
        subtitle="Storia pubblicata per la lettura"
        onBack={() => navigate('/reading-stories')}
        showHomeButton={true}
      >
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl text-slate-800 mb-2">
                    {story.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    {story.original_author && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{story.original_author}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Pubblicata il {new Date(story.published_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleTextToSpeech}
                  className={`ml-4 ${isReading ? 'bg-red-600 hover:bg-red-700' : ''}`}
                >
                  {isReading ? (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Ascolta
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {story.content}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </StoryLayout>
    </>
  );
};

export default ReadingStoryViewer;