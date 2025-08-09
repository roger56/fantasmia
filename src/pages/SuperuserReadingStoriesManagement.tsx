import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, BookOpen, Edit, Trash2, Plus } from 'lucide-react';
import { saveReadingStory, getReadingStories, updateReadingStory, deleteReadingStory, ReadingStory } from '@/utils/userStorage';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

const SuperuserReadingStoriesManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<ReadingStory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStory, setEditingStory] = useState<ReadingStory | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Errore",
        description: "Il titolo è obbligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Errore",
        description: "Il contenuto è obbligatorio",
        variant: "destructive",
      });
      return;
    }

    if (content.length > 2000) {
      toast({
        title: "Errore",
        description: "Il contenuto non può superare i 2000 caratteri",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate titles (only if not editing the same story)
    const existingStory = stories.find(s => s.title.toLowerCase() === title.toLowerCase());
    if (existingStory && (!editingStory || existingStory.id !== editingStory.id)) {
      toast({
        title: "Errore",
        description: "Esiste già una storia con questo titolo",
        variant: "destructive",
      });
      return;
    }

    if (editingStory) {
      // Update existing story
      updateReadingStory(editingStory.id, { title, content });
      toast({
        title: "Successo",
        description: "Storia aggiornata con successo",
      });
    } else {
      // Create new story
      const newStory: ReadingStory = {
        id: Date.now().toString(),
        title,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      saveReadingStory(newStory);
      toast({
        title: "Successo",
        description: "Storia creata con successo",
      });
    }

    setTitle('');
    setContent('');
    setIsEditing(false);
    setEditingStory(null);
    loadStories();
  };

  const handleEdit = (story: ReadingStory) => {
    setEditingStory(story);
    setTitle(story.title);
    setContent(story.content);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (deleteReadingStory(id)) {
      toast({
        title: "Successo",
        description: "Storia eliminata con successo",
      });
      loadStories();
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setIsEditing(false);
    setEditingStory(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                {isEditing ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isEditing ? 'Modifica Storia' : 'Inserisci nuova storia'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Titolo
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Inserisci il titolo della storia..."
                  maxLength={100}
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contenuto ({content.length}/2000 caratteri)
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Scrivi qui il contenuto della storia..."
                  rows={8}
                  maxLength={2000}
                  className="resize-none text-sm"
                />
              </div>

              <div className="flex gap-3">
                {isEditing && (
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                )}
                <Button 
                  onClick={handleSave}
                  disabled={!title.trim() || !content.trim()}
                  className="flex-1"
                >
                  {isEditing ? 'Aggiorna' : 'Salva'} Storia
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stories List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Storie Esistenti ({stories.length})
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
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stories.map((story) => (
                    <div key={story.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-slate-800 truncate">{story.title}</h3>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(story)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare la storia "{story.title}"? 
                                  Questa azione non può essere annullata.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(story.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm line-clamp-3 mb-2">
                        {story.content}
                      </p>
                      <p className="text-xs text-slate-500">
                        Aggiornata il {new Date(story.updated_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperuserReadingStoriesManagement;