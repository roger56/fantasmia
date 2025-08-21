import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Volume2, VolumeX, Calendar, Camera, Palette, ImageIcon, Video, Film, Music, ChevronDown, Share2, Copy, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getScienceStories, ScienceStory } from '@/utils/userStorage';
import { AuthBridge } from '@/utils/authBridge';
import { useToast } from '@/hooks/use-toast';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import { translateToEnglish, translateToItalian } from '@/utils/translation';

const ScienceStoryViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [story, setStory] = useState<ScienceStory | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [language, setLanguage] = useState<'italian' | 'english'>('italian');
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadStory = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/home');
        return;
      }
      
      setIsAuthenticated(true);
      
      if (id) {
        const scienceStories = getScienceStories();
        const foundStory = scienceStories.find(s => s.id === id);
        
        if (foundStory) {
          setStory(foundStory);
        } else {
          toast({
            title: "Storia non trovata",
            description: "La storia richiesta non è più disponibile",
            variant: "destructive"
          });
          navigate('/science-stories');
        }
      }
    };

    checkAuthAndLoadStory();
  }, [id, navigate, toast]);

  const handleTextToSpeech = () => {
    if (!story) return;

    const contentToRead = language === 'english' && translatedContent ? translatedContent : story.content;

    if ('speechSynthesis' in window) {
      if (isReading) {
        // Stop reading
        speechSynthesis.cancel();
        setIsReading(false);
        setSpeechUtterance(null);
      } else {
        // Start reading
        const utterance = new SpeechSynthesisUtterance(contentToRead);
        utterance.lang = language === 'english' ? 'en-US' : 'it-IT';
        
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

  const handleTranslate = async () => {
    if (!story) return;

    setIsTranslating(true);
    try {
      if (language === 'italian') {
        const translated = await translateToEnglish(story.content);
        setTranslatedContent(translated);
        setLanguage('english');
      } else {
        setLanguage('italian');
        setTranslatedContent('');
      }
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

  const handleShare = (method: 'copy' | 'email') => {
    if (!story) return;

    const contentToShare = language === 'english' && translatedContent ? translatedContent : story.content;
    const shareText = `${story.title}\n\n${contentToShare}`;

    if (method === 'copy') {
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          title: "Copiato!",
          description: "Storia copiata negli appunti"
        });
      });
    } else if (method === 'email') {
      const subject = encodeURIComponent(story.title);
      const body = encodeURIComponent(shareText);
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      window.open(mailtoLink);
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

  const displayContent = language === 'english' && translatedContent ? translatedContent : story.content;

  return (
    <>
      <ProfileIndicator />
      <StoryLayout
        title={story.title}
        subtitle="Storia scientifica"
        onBack={() => navigate('/science-stories')}
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
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Pubblicata il {new Date(story.created_at).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* TTS Button */}
                  <Button
                    onClick={handleTextToSpeech}
                    className={`${isReading ? 'bg-red-600 hover:bg-red-700' : ''}`}
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

                  {/* Translation Button */}
                  <Button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    variant="outline"
                  >
                    {isTranslating ? 'Traduzione...' : (language === 'italian' ? 'Inglese' : 'Italiano')}
                  </Button>

                  {/* Share Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Condividi
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleShare('copy')}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copia negli appunti
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('email')}>
                        <Mail className="w-4 h-4 mr-2" />
                        Invia via email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* MEDIA Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        📺 MEDIA
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[200px]" align="start">
                      {story.image_url ? (
                        <DropdownMenuItem onClick={() => window.open(story.image_url, '_blank')} className="cursor-pointer">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Visualizza immagine
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Nessuna immagine disponibile
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea 
                className="border rounded-md p-4"
                style={{ 
                  minHeight: '20em', 
                  maxHeight: '40em' 
                }}
              >
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {displayContent}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </StoryLayout>
    </>
  );
};

export default ScienceStoryViewer;