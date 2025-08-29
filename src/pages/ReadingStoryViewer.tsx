import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, BookOpen, Volume2, VolumeX, User, Calendar, Share2, Copy, Mail, ChevronDown, Palette, ImageIcon } from 'lucide-react';
import { getReadingStories, ReadingStory } from '@/utils/userStorage';
import { AuthBridge } from '@/utils/authBridge';
import StoryLayout from '@/components/shared/StoryLayout';
import { useToast } from '@/hooks/use-toast';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import { translateToEnglish } from '@/utils/translation';
import ImageViewModal from '@/components/shared/ImageViewModal';

const ReadingStoryViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [story, setStory] = useState<ReadingStory | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [language, setLanguage] = useState<'italian' | 'english'>('italian');
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadStory = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      
      setIsAuthenticated(true);
      
      if (id) {
        // Find the story in reading stories
        const readingStories = await getReadingStories();
        const foundStory = readingStories.find(s => s.id === id);
        
        if (foundStory) {
          setStory(foundStory);
          
          // Se la storia ha un'immagine, SEMPRE caricala dalla cache IndexedDB
          if (foundStory.image_url) {
            console.log('📖 Caricamento immagine per storia di lettura:', foundStory.id);
            const { getStoryImage } = await import('@/utils/imageStorage');
            try {
              const cachedImageUrl = await getStoryImage(foundStory.id, foundStory.image_url);
              if (cachedImageUrl) {
                // Aggiorna la storia con l'URL della cache locale
                setStory(prev => prev ? { ...prev, image_url: cachedImageUrl } : null);
              }
            } catch (error) {
              console.log('Could not load cached image, using original URL');
            }
          }
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

    const contentToRead = language === 'english' && translatedContent ? translatedContent : story.content;

    if ('speechSynthesis' in window) {
      if (isReading && !isPaused) {
        // Pause reading
        speechSynthesis.pause();
        setIsPaused(true);
      } else if (isPaused) {
        // Resume reading
        speechSynthesis.resume();
        setIsPaused(false);
      } else {
        // Start reading
        const utterance = new SpeechSynthesisUtterance(contentToRead);
        utterance.lang = language === 'english' ? 'en-US' : 'it-IT';
        
        utterance.onstart = () => {
          setIsReading(true);
          setIsPaused(false);
        };
        
        utterance.onend = () => {
          setIsReading(false);
          setIsPaused(false);
          setSpeechUtterance(null);
        };
        
        utterance.onerror = () => {
          setIsReading(false);
          setIsPaused(false);
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

  // Cleanup speech synthesis on component unmount and navigation
  useEffect(() => {
    return () => {
      // Stop any ongoing speech when component unmounts or user navigates away
      if (speechUtterance || speechSynthesis.speaking) {
        speechSynthesis.cancel();
        setIsReading(false);
        setIsPaused(false);
        setSpeechUtterance(null);
      }
    };
  }, [speechUtterance]);

  // Stop speech when navigating back
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

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
                    {story.author && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{story.author}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* TTS Button */}
                  <Button
                    onClick={handleTextToSpeech}
                    className={`${isReading ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  >
                    {isReading && isPaused ? (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Riprendi
                      </>
                    ) : isReading ? (
                      <>
                        <VolumeX className="w-4 h-4 mr-2" />
                        Pausa
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        LEGGI
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
                        <DropdownMenuItem onClick={() => setShowImageModal(true)} className="cursor-pointer">
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
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {displayContent}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </StoryLayout>
      
      {/* Image View Modal */}
      {story.image_url && (
        <ImageViewModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageUrl={story.image_url}
          storyTitle={story.title}
        />
      )}
    </>
  );
};

export default ReadingStoryViewer;