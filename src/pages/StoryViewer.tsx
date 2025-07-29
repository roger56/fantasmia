import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Volume2, Edit, Save, Globe } from 'lucide-react';
import { getStories, saveStory, Story } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/useTTS';
import { useTranslation } from '@/hooks/useTranslation';
import HomeButton from '@/components/HomeButton';
import MediaButton from '@/components/shared/MediaButton';

const StoryViewer = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [story, setStory] = useState<Story | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [translatedTitle, setTranslatedTitle] = useState('');
  
  const { speak, getButtonText } = useTTS();
  const { isTranslated, isTranslating, translateContent, getCurrentLanguage } = useTranslation();

  useEffect(() => {
    const stories = getStories();
    const foundStory = stories.find(s => s.id === storyId);
    if (foundStory) {
      setStory(foundStory);
      setEditedContent(foundStory.content || '');
      setEditedTitle(foundStory.title || '');
    }
  }, [storyId]);

  const handleTranslate = async () => {
    if (!story) return;
    
    await translateContent(
      editedContent,
      story.title,
      setEditedContent,
      setTranslatedTitle
    );
  };

  const handleTextToSpeech = () => {
    speak(editedContent, getCurrentLanguage());
  };

  const handleSaveEdit = () => {
    if (story) {
      const updatedStory = {
        ...story,
        title: editedTitle,
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

  const displayTitle = isTranslated && translatedTitle ? translatedTitle : (isEditing ? editedTitle : story.title);

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
              {getButtonText()}
            </Button>
            
            <MediaButton 
              storyContent={editedContent}
              storyTitle={displayTitle}
              className="w-full sm:w-auto"
            />
            
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
            {isEditing ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Titolo della Storia
                </label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-semibold"
                  placeholder="Inserisci il titolo..."
                />
              </div>
            ) : (
              <CardTitle className="text-2xl">{displayTitle}</CardTitle>
            )}
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
