import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, Volume2 } from 'lucide-react';
import { getStories } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

const SuperuserArchive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<any[]>([]);
  const [filteredStories, setFilteredStories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const allStories = getStories();
    setStories(allStories);
    setFilteredStories(allStories);
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredStories(stories);
    } else {
      setFilteredStories(stories.filter(story => story.mode === selectedCategory));
    }
  }, [selectedCategory, stories]);

  const handleTextToSpeech = (content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if ('speechSynthesis' in window) {
      // Stop any currently playing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = 'it-IT';
      speechSynthesis.speak(utterance);
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
    { value: 'PAROLE_CHIAMANO', label: 'Parole Chiamano' }
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
              onClick={() => navigate('/superuser')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Archivio Completo</h1>
              <p className="text-slate-600">Tutte le favole degli utenti</p>
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
                  {filteredStories.length} favole trovate
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {filteredStories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Nessuna favola trovata
              </h3>
              <p className="text-slate-600">
                Non ci sono favole per la categoria selezionata
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <Card 
                key={story.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-slate-300"
                onClick={() => navigate(`/story/${story.id}`)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-800 line-clamp-2">
                    {story.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                      {getStatusText(story.status)}
                    </span>
                    <Button
                      onClick={(e) => handleTextToSpeech(story.content, e)}
                      size="sm"
                      variant="ghost"
                      className="p-1 h-auto"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">Autore:</span>
                      <span className="text-slate-600">{story.authorName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">Categoria:</span>
                      <span className="text-slate-600">{story.mode}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">Modificata:</span>
                      <span className="text-slate-600">
                        {new Date(story.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                    {story.isPublic && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Pubblica
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperuserArchive;