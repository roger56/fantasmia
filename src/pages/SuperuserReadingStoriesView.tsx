import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, BookOpen, Plus, Eye } from 'lucide-react';
import { getReadingStories, ReadingStory } from '@/utils/userStorage';
import HomeButton from '@/components/HomeButton';

const SuperuserReadingStoriesView = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<ReadingStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<ReadingStory | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated as superuser
    const authToken = localStorage.getItem('superuser-session');
    const authExpiry = localStorage.getItem('superuser-session-expiry');
    
    if (authToken && authExpiry && Date.now() < parseInt(authExpiry)) {
      setIsAuthenticated(true);
      loadStories();
    } else {
      navigate('/superuser');
    }
  }, [navigate]);

  const loadStories = () => {
    const readingStories = getReadingStories();
    setStories(readingStories.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ));
    if (readingStories.length > 0) {
      setSelectedStory(readingStories[0]);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/superuser')}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">📖 Gestione Storie da Leggere</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sezione A: Guarda storie presenti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Storie Presenti ({stories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stories.length === 0 ? (
                <div className="text-center text-slate-600 py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>Nessuna storia creata ancora.</p>
                  <p className="text-sm">Crea la prima storia per iniziare!</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {stories.map((story) => (
                      <div 
                        key={story.id} 
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStory?.id === story.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedStory(story)}
                      >
                        <h3 className="font-medium text-slate-800 truncate">{story.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Sezione B: Inserisci nuova storia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Inserisci Nuova Storia
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Plus className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 mb-4">
                Crea una nuova storia da leggere per gli utenti
              </p>
              <Button 
                onClick={() => navigate('/superuser-reading-stories-management')}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Storia
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Anteprima storia selezionata */}
        {selectedStory && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Anteprima: {selectedStory.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {selectedStory.content}
                </div>
              </ScrollArea>
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm text-slate-500">
                  Creata il {new Date(selectedStory.created_at).toLocaleDateString('it-IT')}
                  {selectedStory.updated_at !== selectedStory.created_at && (
                    <span> • Aggiornata il {new Date(selectedStory.updated_at).toLocaleDateString('it-IT')}</span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/superuser-reading-stories-management')}
                >
                  Modifica Storie
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuperuserReadingStoriesView;