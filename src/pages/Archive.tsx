
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Plus, Play, Pause, Save, Edit, Volume2 } from 'lucide-react';
import { getStoriesForUser, getStories } from '@/utils/userStorage';
import { StoryScrollViewer } from '@/components/ui/scroll-area';
import HomeButton from '@/components/HomeButton';

const Archive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileName, profileId, isPublic } = location.state || {};
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    if (isPublic) {
      // Show all public stories
      const allStories = getStories();
      setStories(allStories.filter(s => s.isPublic));
    } else if (profileId) {
      // Show user's personal archive
      setStories(getStoriesForUser(profileId));
    }
  }, [profileId, isPublic]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completata';
      case 'suspended': return 'Sospesa';
      default: return 'In Corso';
    }
  };

  const handleStorySelect = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  const handleTextToSpeech = (content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = 'it-IT';
      speechSynthesis.speak(utterance);
    }
  };

  const handleEditStory = (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const story = stories.find(s => s.id === storyId);
    if (story) {
      if (story.mode === 'GHOST') {
        navigate('/ghost-editor', { state: { profileId, profileName, editStory: story } });
      } else if (story.mode === 'PAROLE_CHIAMANO') {
        navigate('/parole-chiamano', { state: { profileId, profileName, editStory: story } });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {isPublic ? 'Storie Pubbliche' : 'Archivio Storie'}
              </h1>
              {profileName && (
                <p className="text-slate-600">Profilo: {profileName}</p>
              )}
            </div>
          </div>
          
          {/* Temporary removal of archive functionality */}
          {false && !isPublic && profileId && (
            <Button 
              onClick={() => navigate('/create-story', { state: { profileId, profileName } })}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuova Storia
            </Button>
          )}
        </div>

        {/* Stories List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isPublic ? 'Storie Pubbliche' : 'Le Tue Storie'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stories.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {isPublic ? 'Nessuna storia pubblica trovata' : 'Nessuna storia trovata'}
                </h3>
                <p className="text-slate-600 mb-4">
                  {isPublic ? 'Non ci sono ancora storie pubbliche' : 'Inizia a creare la tua prima storia!'}
                </p>
                {!isPublic && (
                  <Button onClick={() => navigate('/create-story', { state: { profileId, profileName } })}>
                    Crea Nuova Storia
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <StoryScrollViewer
                  stories={stories}
                  onStorySelect={handleStorySelect}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Archive;
