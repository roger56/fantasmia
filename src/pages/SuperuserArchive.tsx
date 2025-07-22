
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, Volume2 } from 'lucide-react';
import { getAllStoriesForSuperuser } from '@/utils/userStorage';
import { StoryScrollViewer } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

const SuperuserArchive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<any[]>([]);
  const [filteredStories, setFilteredStories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const allStories = getAllStoriesForSuperuser();
    // Ensure each story has the correct author name
    const storiesWithCorrectAuthors = allStories.map(story => ({
      ...story,
      authorName: story.authorName || 'Utente Sconosciuto' // Fallback if no author name
    }));
    setStories(storiesWithCorrectAuthors);
    setFilteredStories(storiesWithCorrectAuthors);
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredStories(stories);
    } else {
      setFilteredStories(stories.filter(story => story.mode === selectedCategory));
    }
  }, [selectedCategory, stories]);

  const [speechState, setSpeechState] = useState<{[key: string]: {playing: boolean, utterance?: SpeechSynthesisUtterance}}>({});

  const handleTextToSpeech = (content: string, storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if ('speechSynthesis' in window) {
      const currentState = speechState[storyId];
      
      if (currentState?.playing) {
        // Pause speech
        speechSynthesis.cancel();
        setSpeechState(prev => ({
          ...prev,
          [storyId]: { ...prev[storyId], playing: false }
        }));
      } else {
        // Stop any other playing speech
        speechSynthesis.cancel();
        
        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = 'it-IT';
        
        utterance.onend = () => {
          setSpeechState(prev => ({
            ...prev,
            [storyId]: { ...prev[storyId], playing: false }
          }));
        };
        
        setSpeechState(prev => ({
          ...prev,
          [storyId]: { playing: true, utterance }
        }));
        
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

  const categories = [
    { value: 'all', label: 'Tutte le categorie' },
    { value: 'GHOST', label: 'GHOST' },
    { value: 'PROPP', label: 'PROPP' },
    { value: 'ALOVAF', label: 'ALOVAF' },
    { value: 'PAROLE_CHIAMANO', label: 'Una Parola, Tante Storie' }
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/home')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Archivio Completo</h1>
              <p className="text-slate-600">Tutte le storie degli utenti</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">
                  Filtra per categoria:
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-slate-600">
                  {filteredStories.length} storie trovate
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Archivio Completo - {filteredStories.length} storie</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStories.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Nessuna storia trovata
                </h3>
                <p className="text-slate-600">
                  Non ci sono storie per la categoria selezionata
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <StoryScrollViewer
                  stories={filteredStories.map(story => ({
                    ...story,
                    lastModified: new Date(story.lastModified).toLocaleDateString(),
                    authorName: story.authorName || 'Utente Sconosciuto'
                  }))}
                  onStorySelect={(storyId) => navigate(`/story/${storyId}`)}
                  showAuthor={true}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperuserArchive;
