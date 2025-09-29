import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Volume2, VolumeX, Globe, Edit, Image, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import RecommendedBooksDialog from './RecommendedBooksDialog';
import StoryLayout from './StoryLayout';

interface AGStoryManagementProps {
  category: 'world' | 'science' | 'greek_myths' | 'nordic_myths' | 'explorers';
  title: string;
  subtitle: string;
}

interface AGStory {
  id: string;
  title: string;
  content: string;
  category: 'world' | 'science' | 'greek_myths' | 'nordic_myths' | 'explorers';
  created_by: 'superuser';
  created_at: string;
  updated_at: string;
  has_image: boolean;
  language?: string;
}

const AGStoryManagement: React.FC<AGStoryManagementProps> = ({ category, title, subtitle }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<AGStory[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<AGStory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', content: '' });
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [booksDialogStory, setBooksDialogStory] = useState<AGStory | null>(null);

  useEffect(() => {
    loadStories();
  }, [category]);

  const loadStories = async () => {
    try {
      const agStories = await fantasMiaDB.getAGStoriesByCategory(category);
      setStories(agStories);
      console.log('📚 Loaded AG stories:', { category, count: agStories.length });
    } catch (error) {
      console.error('❌ Error loading AG stories:', error);
    }
  };

  const handleAddStory = async () => {
    if (!newStory.title.trim() || !newStory.content.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci titolo e contenuto",
        variant: "destructive",
      });
      return;
    }

    const story: AGStory = {
      id: crypto.randomUUID(),
      title: newStory.title,
      content: newStory.content,
      category,
      created_by: 'superuser',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      has_image: false,
      language: 'italian'
    };

    try {
      await fantasMiaDB.saveAGStory(story);
      setStories(prev => [...prev, story]);
      setNewStory({ title: '', content: '' });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Storia aggiunta",
        description: "La storia è stata salvata con successo",
      });
      
      console.log('✅ AG story added:', { id: story.id, title: story.title });
    } catch (error) {
      console.error('❌ Error saving AG story:', error);
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio",
        variant: "destructive",
      });
    }
  };

  const handleEditStory = async () => {
    if (!editingStory || !editingStory.title.trim() || !editingStory.content.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci titolo e contenuto",
        variant: "destructive",
      });
      return;
    }

    const updatedStory = {
      ...editingStory,
      updated_at: new Date().toISOString()
    };

    try {
      await fantasMiaDB.saveAGStory(updatedStory);
      setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
      setEditingStory(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Storia aggiornata",
        description: "Le modifiche sono state salvate",
      });
      
      console.log('✅ AG story updated:', { id: updatedStory.id, title: updatedStory.title });
    } catch (error) {
      console.error('❌ Error updating AG story:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa storia?')) return;

    try {
      await fantasMiaDB.deleteAGStory(storyId);
      setStories(prev => prev.filter(s => s.id !== storyId));
      
      toast({
        title: "Storia eliminata",
        description: "La storia è stata rimossa",
      });
      
      console.log('🗑️ AG story deleted:', storyId);
    } catch (error) {
      console.error('❌ Error deleting AG story:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione",
        variant: "destructive",
      });
    }
  };

  const handleTTSToggle = (storyId: string) => {
    if (isPlaying === storyId) {
      // Stop TTS
      window.speechSynthesis.cancel();
      setIsPlaying(null);
    } else {
      // Start TTS
      const story = stories.find(s => s.id === storyId);
      if (story) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(story.content);
        utterance.lang = 'it-IT';
        utterance.onend = () => setIsPlaying(null);
        utterance.onerror = () => setIsPlaying(null);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(storyId);
      }
    }
  };

  const openEditDialog = (story: AGStory) => {
    setEditingStory({ ...story });
    setIsEditDialogOpen(true);
  };

  return (
    <StoryLayout
      title={title}
      subtitle={subtitle}
      onBack={() => navigate('/superuser-story-type-selection')}
    >
      <div className="space-y-6">
        {/* Add Story Button */}
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Aggiungi storia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuova Storia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Titolo storia"
                  value={newStory.title}
                  onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Contenuto storia"
                  value={newStory.content}
                  onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                  rows={10}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleAddStory}>
                    Salva
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stories List */}
        <Card>
          <CardContent className="p-6">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {stories.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    Nessuna storia presente. Clicca "Aggiungi storia" per iniziare.
                  </p>
                ) : (
                  stories.map((story) => (
                    <div key={story.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <button
                          onClick={() => navigate(`/ag-story-detail/${story.id}`)}
                          className="text-left hover:text-blue-600 font-medium"
                        >
                          {story.title}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Books Icon */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBooksDialogStory(story)}
                          title="Libri consigliati"
                        >
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </Button>

                        {/* TTS Icon */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTTSToggle(story.id)}
                          title={isPlaying === story.id ? "Ferma lettura" : "Leggi"}
                        >
                          {isPlaying === story.id ? (
                            <VolumeX className="w-4 h-4 text-red-600" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-green-600" />
                          )}
                        </Button>

                        {/* Translation Icon */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Traduzione (in sviluppo)"
                          disabled
                        >
                          <Globe className="w-4 h-4 text-gray-400" />
                        </Button>

                        {/* Edit Icon */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(story)}
                          title="Modifica"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>

                        {/* Image Icon */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title={story.has_image ? "Immagine presente" : "Nessuna immagine"}
                          disabled
                        >
                          <Image className={`w-4 h-4 ${story.has_image ? 'text-green-600' : 'text-red-600'}`} />
                        </Button>

                        {/* Delete Icon */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStory(story.id)}
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifica Storia</DialogTitle>
            </DialogHeader>
            {editingStory && (
              <div className="space-y-4">
                <Input
                  placeholder="Titolo storia"
                  value={editingStory.title}
                  onChange={(e) => setEditingStory(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
                <Textarea
                  placeholder="Contenuto storia"
                  value={editingStory.content}
                  onChange={(e) => setEditingStory(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={10}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleEditStory}>
                    Salva modifiche
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Books Dialog */}
        {booksDialogStory && (
          <RecommendedBooksDialog
            open={!!booksDialogStory}
            onOpenChange={(open) => !open && setBooksDialogStory(null)}
            storyId={booksDialogStory.id}
            storyTitle={booksDialogStory.title}
            isSuperuser={true}
          />
        )}
      </div>
    </StoryLayout>
  );
};

export default AGStoryManagement;