import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Volume2, Edit, Save } from 'lucide-react';
import { getStories, saveStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

const StoryViewer = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [story, setStory] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const stories = getStories();
    const foundStory = stories.find(s => s.id === storyId);
    if (foundStory) {
      setStory(foundStory);
      setEditedContent(foundStory.content || '');
    }
  }, [storyId]);

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking && !isPaused) {
        speechSynthesis.pause();
        setIsPaused(true);
      } else if (isPaused) {
        speechSynthesis.resume();
        setIsPaused(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(story.content);
        utterance.lang = 'it-IT';
        
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
        lastModified: new Date().toISOString()
      };
      
      saveStory(updatedStory);
      setStory(updatedStory);
      setIsEditing(false);
      
      toast({
        title: "Favola aggiornata",
        description: "Le modifiche sono state salvate con successo"
      });
    }
  };

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-slate-600">Favola non trovata</p>
        </div>
      </div>
    );
  }

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
          
          <div className="flex gap-2">
            <Button onClick={handleTextToSpeech} variant="outline">
              <Volume2 className="w-4 h-4 mr-2" />
              {isSpeaking && !isPaused ? 'Pausa' : isPaused ? 'Riprendi' : 'Ascolta'}
            </Button>
            
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Modifica
              </Button>
            ) : (
              <Button onClick={handleSaveEdit}>
                <Save className="w-4 h-4 mr-2" />
                Salva
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{story.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>Autore: {story.authorName}</span>
              <span>Modalità: {story.mode}</span>
              <span>Modificato: {new Date(story.lastModified).toLocaleDateString()}</span>
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
                {story.content}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoryViewer;