import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Globe, Volume2, VolumeX, Trash2, Upload, Wand2, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import StoryLayout from '@/components/shared/StoryLayout';

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

const AGStoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [story, setStory] = useState<AGStory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedStory, setEditedStory] = useState<{ title: string; content: string }>({ title: '', content: '' });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (id) {
      loadStory(id);
    }
  }, [id]);

  const loadStory = async (storyId: string) => {
    try {
      const agStory = await fantasMiaDB.getAGStoryById(storyId);
      if (agStory) {
        setStory(agStory);
        setEditedStory({ title: agStory.title, content: agStory.content });
        console.log('📖 Loaded AG story:', { id: storyId, title: agStory.title });
      } else {
        toast({
          title: "Errore",
          description: "Storia non trovata",
          variant: "destructive",
        });
        navigate('/superuser-story-type-selection');
      }
    } catch (error) {
      console.error('❌ Error loading AG story:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento della storia",
        variant: "destructive",
      });
    }
  };

  const handleEditSave = async () => {
    if (!story || !editedStory.title.trim() || !editedStory.content.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci titolo e contenuto",
        variant: "destructive",
      });
      return;
    }

    const updatedStory = {
      ...story,
      title: editedStory.title,
      content: editedStory.content,
      updated_at: new Date().toISOString()
    };

    try {
      await fantasMiaDB.saveAGStory(updatedStory);
      setStory(updatedStory);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Storia aggiornata",
        description: "Le modifiche sono state salvate",
      });
      
      console.log('✅ AG story updated:', { id: story.id, title: updatedStory.title });
    } catch (error) {
      console.error('❌ Error updating AG story:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!story || !confirm('Sei sicuro di voler eliminare questa storia?')) return;

    try {
      await fantasMiaDB.deleteAGStory(story.id);
      
      toast({
        title: "Storia eliminata",
        description: "La storia è stata rimossa",
      });
      
      console.log('🗑️ AG story deleted:', story.id);
      navigate('/superuser-story-type-selection');
    } catch (error) {
      console.error('❌ Error deleting AG story:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione",
        variant: "destructive",
      });
    }
  };

  const handleTTSToggle = () => {
    if (!story) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(story.content);
      utterance.lang = 'it-IT';
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const openEditDialog = () => {
    if (story) {
      setEditedStory({ title: story.title, content: story.content });
      setIsEditDialogOpen(true);
    }
  };

  if (!story) {
    return (
      <StoryLayout
        title="Caricamento..."
        subtitle="Caricamento storia in corso"
        onBack={() => navigate('/superuser-story-type-selection')}
      >
        <div className="text-center py-8">
          <p>Caricamento storia...</p>
        </div>
      </StoryLayout>
    );
  }

  return (
    <StoryLayout
      title={story.title}
      subtitle="Dettaglio storia pubblica"
      onBack={() => navigate('/superuser-story-type-selection')}
    >
      <div className="space-y-6">
        {/* Action Menu */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {/* Media Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Media
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Upload className="w-4 h-4 mr-2" />
                  Carica da PC
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Disegno AI
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Video className="w-4 h-4 mr-2" />
                  Filmato AI (placeholder)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Translation */}
            <Button variant="outline" disabled title="Traduzione (in sviluppo)">
              <Globe className="w-4 h-4 mr-2" />
              Traduzione
            </Button>

            {/* TTS */}
            <Button variant="outline" onClick={handleTTSToggle}>
              {isPlaying ? (
                <>
                  <VolumeX className="w-4 h-4 mr-2" />
                  Ferma
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Leggi
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={openEditDialog}>
              Modifica
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina
            </Button>
          </div>
        </div>

        {/* Story Content */}
        <Card>
          <CardContent className="p-6">
            <ScrollArea className="h-[600px]">
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold mb-4">{story.title}</h2>
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {story.content}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Modifica Storia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Titolo storia"
                value={editedStory.title}
                onChange={(e) => setEditedStory(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Contenuto storia"
                value={editedStory.content}
                onChange={(e) => setEditedStory(prev => ({ ...prev, content: e.target.value }))}
                rows={15}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleEditSave}>
                  Salva modifiche
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StoryLayout>
  );
};

export default AGStoryDetail;