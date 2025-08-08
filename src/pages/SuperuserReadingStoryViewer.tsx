import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Volume2 } from 'lucide-react';
import { getReadingStories, updateReadingStory, ReadingStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/useTTS';
import HomeButton from '@/components/HomeButton';
import CreativeMediaMenu from '@/components/shared/CreativeMediaMenu';

const SuperuserReadingStoryViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<ReadingStory | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const { isPlaying, isPaused, speak, stop, getButtonText } = useTTS();

  useEffect(() => {
    // Check if user is authenticated as superuser
    const authToken = localStorage.getItem('superuser-session');
    const authExpiry = localStorage.getItem('superuser-session-expiry');
    
    if (authToken && authExpiry && Date.now() < parseInt(authExpiry)) {
      setIsAuthenticated(true);
      loadStory();
    } else {
      navigate('/superuser');
    }
  }, [navigate, id]);

  const loadStory = () => {
    if (!id) return;
    
    const stories = getReadingStories();
    const foundStory = stories.find(s => s.id === id);
    
    if (foundStory) {
      setStory(foundStory);
      setTitle(foundStory.title);
      setContent(foundStory.content);
    } else {
      toast({
        title: "Errore",
        description: "Storia non trovata",
        variant: "destructive"
      });
      navigate('/superuser-reading-stories-view');
    }
  };

  const handleSave = () => {
    if (!story || !title.trim() || !content.trim()) {
      toast({
        title: "Errore",
        description: "Titolo e contenuto sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    updateReadingStory(story.id, {
      title: title.trim(),
      content: content.trim()
    });

    setStory(prev => prev ? {
      ...prev,
      title: title.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString()
    } : null);

    setIsEditing(false);
    
    toast({
      title: "Successo",
      description: "Storia aggiornata con successo"
    });
  };

  const handleCancel = () => {
    if (story) {
      setTitle(story.title);
      setContent(story.content);
    }
    setIsEditing(false);
  };

  const handleListen = () => {
    if (isPlaying) {
      stop();
    } else {
      speak(content, 'italian');
    }
  };

  if (!isAuthenticated || !story) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/superuser-reading-stories-view')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">📖 {story.title}</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleListen}
              className="flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              {getButtonText()}
            </Button>
            
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Modifica
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Annulla
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Salva
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titolo della storia"
                  className="text-lg font-semibold"
                />
              ) : (
                story.title
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Contenuto della storia"
                className="min-h-96 resize-none"
              />
            ) : (
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed min-h-96">
                {story.content}
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm text-slate-500">
              <span>Creata il {new Date(story.created_at).toLocaleDateString('it-IT')}</span>
              {story.updated_at !== story.created_at && (
                <span>Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Creative Media Menu */}
        <CreativeMediaMenu 
          storyContent={content}
          onContentChange={isEditing ? setContent : undefined}
        />
      </div>
    </div>
  );
};

export default SuperuserReadingStoryViewer;