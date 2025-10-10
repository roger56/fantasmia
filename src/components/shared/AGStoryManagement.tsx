import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Volume2, VolumeX, Globe, Edit, ImageIcon, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import RecommendedBooksDialog from './RecommendedBooksDialog';
import StoryLayout from './StoryLayout';
import { useUnifiedTTS } from '@/hooks/useUnifiedTTS';

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
  const [booksDialogStory, setBooksDialogStory] = useState<AGStory | null>(null);
  
  const { isPlaying, speak, stop, currentStoryId } = useUnifiedTTS();

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
    const story = stories.find(s => s.id === storyId);
    if (!story) return;
    
    if (isPlaying && currentStoryId === storyId) {
      stop();
    } else {
      speak(story.content, 'italian', storyId);
    }
  };

  const openEditDialog = (story: AGStory) => {
    setEditingStory({ ...story });
    setIsEditDialogOpen(true);
  };

  const handleBack = () => {
    navigate('/superuser-story-type-selection');
  };

  return (
    <StoryLayout
      title={title}
      subtitle={subtitle}
      onBack={handleBack}
    >
      <div className="space-y-6">
        {/* Add Story Button */}
        <div className="flex justify-start">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" size="lg">
                <Plus className="w-5 h-5" />
                Aggiungi storia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="dlg-desc-add-story">
              <DialogHeader>
                <DialogTitle>Nuova Storia</DialogTitle>
              </DialogHeader>
              <DialogDescription id="dlg-desc-add-story">
                Crea una nuova storia per la categoria {title}.
              </DialogDescription>
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
              <div className="space-y-2">
                {stories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nessuna storia presente. Clicca "Aggiungi storia" per iniziare.
                  </p>
                ) : (
                  stories.map((story) => (
                    <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(`/ag-story-detail-su/${story.id}`)}
                          className="text-left hover:underline font-semibold text-foreground truncate block w-full"
                        >
                          {story.title}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        {/* Books Icon */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setBooksDialogStory(story)}
                          title="Libri consigliati"
                        >
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </Button>

                        {/* TTS Icon */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTTSToggle(story.id)}
                          title={isPlaying && currentStoryId === story.id ? "Ferma lettura" : "Leggi"}
                        >
                          {isPlaying && currentStoryId === story.id ? (
                            <VolumeX className="w-5 h-5 text-red-600" />
                          ) : (
                            <Volume2 className="w-5 h-5 text-green-600" />
                          )}
                        </Button>

                        {/* Translation Icon */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Traduzione (in sviluppo)"
                          disabled
                        >
                          <Globe className="w-5 h-5 text-muted" />
                        </Button>

                        {/* Edit Icon */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(story)}
                          title="Modifica"
                        >
                          <Edit className="w-5 h-5 text-blue-600" />
                        </Button>

                        {/* Image Icon */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title={story.has_image ? "Immagine presente" : "Nessuna immagine"}
                          onClick={() => story.has_image && navigate(`/ag-story-detail-su/${story.id}`)}
                          disabled={!story.has_image}
                        >
                          <ImageIcon className={`w-5 h-5 ${story.has_image ? 'text-green-600' : 'text-red-600'}`} />
                        </Button>

                        {/* Delete Icon */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStory(story.id)}
                          title="Elimina"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
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
          <DialogContent className="max-w-2xl" aria-describedby="dlg-desc-edit-story">
            <DialogHeader>
              <DialogTitle>Modifica Storia</DialogTitle>
            </DialogHeader>
            <DialogDescription id="dlg-desc-edit-story">
              Modifica il titolo e il contenuto della storia esistente.
            </DialogDescription>
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