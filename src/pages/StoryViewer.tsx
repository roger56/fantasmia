import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Volume2, Edit, Save, Globe } from 'lucide-react';
import { getStories, saveStory, Story } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';
import { translateToEnglish, translateToItalian } from '@/utils/translation';

const StoryViewer = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [story, setStory] = useState<Story | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalStory, setOriginalStory] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState('');

  useEffect(() => {
    const stories = getStories();
    const foundStory = stories.find(s => s.id === storyId);
    if (foundStory) {
      setStory(foundStory);
      setEditedContent(foundStory.content || '');
      // Check if story was saved in a specific language
      if (foundStory.language === 'english') {
        setIsTranslated(true);
      }
    }
  }, [storyId]);

  const handleTranslate = async () => {
    if (!story) return;
    
    setIsTranslating(true);
    
    try {
      if (!isTranslated) {
        // Translate to English
        setOriginalStory(story.content);
        setOriginalTitle(story.title);
        
        const translatedStory = await translateToEnglish(story.content);
        const translatedStoryTitle = await translateToEnglish(story.title);
        
        setEditedContent(translatedStory);
        setTranslatedTitle(translatedStoryTitle);
        setIsTranslated(true);
        
        toast({
          title: "Traduzione completata",
          description: "La storia è stata tradotta in inglese",
        });
      } else {
        // Return to Italian
        setEditedContent(originalStory || story.content);
        setTranslatedTitle('');
        setIsTranslated(false);
        
        toast({
          title: "Traduzione completata",
          description: "La storia è stata riportata in italiano",
        });
      }
    } catch (error) {
      toast({
        title: "Errore traduzione",
        description: "Non è stato possibile tradurre la storia",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking && !isPaused) {
        speechSynthesis.pause();
        setIsPaused(true);
      } else if (isPaused) {
        speechSynthesis.resume();
        setIsPaused(false);
      } else {
        // Stop any existing speech
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(editedContent);
        utterance.lang = isTranslated ? 'en-US' : 'it-IT';
        
        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        
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

  const handleSaveEdit = () => {
    if (story) {
      const updatedStory = {
        ...story,
        content: editedContent,
        lastModified: new Date().toISOString(),
        language: isTranslated ? ('english' as const) : ('italian' as const)
      };
      
      // If we have a translated title, update that too
      if (isTranslated && translatedTitle) {
        updatedStory.title = translatedTitle;
      }
      
      saveStory(updatedStory);
      setStory(updatedStory);
      setIsEditing(false);
      
      toast({
        title: "Storia aggiornata",
        description: `Le modifiche sono state salvate con successo${isTranslated ? ' in inglese' : ''}`
      });
    }
  };

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-slate-600">Storia non trovata</p>
        </div>
      </div>
    );
  }

  const displayTitle = isTranslated && translatedTitle ? translatedTitle : story.title;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleTranslate} 
              variant="outline" 
              disabled={isTranslating}
              className="w-full sm:w-auto"
            >
              <Globe className="w-4 h-4 mr-2" />
              {isTranslating ? 'Traduzione...' : (isTranslated ? 'ITALIANO' : 'INGLESE')}
            </Button>
            
            <Button onClick={handleTextToSpeech} variant="outline" className="w-full sm:w-auto">
              <Volume2 className="w-4 h-4 mr-2" />
              ASCOLTA
            </Button>
            
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full sm:w-auto">
                <Edit className="w-4 h-4 mr-2" />
                MODIFICA
              </Button>
            ) : (
              <Button onClick={handleSaveEdit} className="w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Salva
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{displayTitle}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>Autore: {story.authorName}</span>
              <span>Modalità: {story.mode}</span>
              <span>Modificato: {new Date(story.lastModified).toLocaleDateString()}</span>
              {isTranslated && <span className="text-blue-600 font-medium">🇬🇧 English</span>}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="resize-none text-base leading-relaxed"
                style={{ height: 'auto', minHeight: '200px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 400) + 'px';
                }}
              />
            ) : (
              <div 
                className="text-base leading-relaxed whitespace-pre-wrap p-4 border rounded-lg"
                style={{ 
                  minHeight: 'auto',
                  maxHeight: '60vh',
                  overflowY: 'auto'
                }}
              >
                {editedContent}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoryViewer;
