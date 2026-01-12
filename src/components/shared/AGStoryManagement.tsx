import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Volume2, VolumeX, Volume1, Globe, Edit, ImageIcon, Trash2, Plus, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB, ASStory } from '@/utils/indexedDB';
import { copyAGtoAS, createASStory, listASStoriesByCategory, deleteASStory, updateASStory } from '@/lib/storiesRepo';
import RecommendedBooksDialog from './RecommendedBooksDialog';
import ImageViewerDialog from './ImageViewerDialog';
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
  source?: 'manual' | 'seed';
}

// Tipo unificato per la vista combinata
interface UnifiedStory {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  has_image: boolean;
  language?: string;
  archiveType: 'ag' | 'as';
  source?: string;
}

type ArchiveFilter = 'all' | 'ag' | 'as';

const AGStoryManagement: React.FC<AGStoryManagementProps> = ({ category, title, subtitle }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Storie AG (seed - read only) e AS (locale - CRUD completo)
  const [agStories, setAgStories] = useState<AGStory[]>([]);
  const [asStories, setAsStories] = useState<ASStory[]>([]);
  
  // Filtro archivio
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all');
  
  // Dialog per creazione/modifica AS
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<ASStory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', content: '' });
  
  // Dialog per visualizzazione
  const [booksDialogStory, setBooksDialogStory] = useState<UnifiedStory | null>(null);
  const [imageDialogStory, setImageDialogStory] = useState<UnifiedStory | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageStyle, setSelectedImageStyle] = useState<string>("Generato da AI");
  
  const { isPlaying, isPaused, speak, stop, pause, currentStoryId } = useUnifiedTTS();

  useEffect(() => {
    loadStories();

    // Listen for story update events
    const handleStoriesChanged = () => {
      loadStories();
    };

    window.addEventListener('storyImageSaved', handleStoriesChanged);
    window.addEventListener('as:changed', handleStoriesChanged);
    window.addEventListener('ag:changed', handleStoriesChanged);
    
    return () => {
      window.removeEventListener('storyImageSaved', handleStoriesChanged);
      window.removeEventListener('as:changed', handleStoriesChanged);
      window.removeEventListener('ag:changed', handleStoriesChanged);
    };
  }, [category]);

  const loadStories = async () => {
    try {
      // Carica storie AG (seed)
      const ag = await fantasMiaDB.getAGStoriesByCategory(category);
      setAgStories(ag);
      
      // Carica storie AS (locali)
      const as = await listASStoriesByCategory(category);
      setAsStories(as);
      
      console.log('📚 Loaded stories:', { category, ag: ag.length, as: as.length });
    } catch (error) {
      console.error('❌ Error loading stories:', error);
    }
  };

  // Combina e filtra storie per la vista
  const getFilteredStories = (): UnifiedStory[] => {
    const agUnified: UnifiedStory[] = agStories.map(s => ({
      ...s,
      archiveType: 'ag' as const,
      source: s.source
    }));
    
    const asUnified: UnifiedStory[] = asStories.map(s => ({
      ...s,
      archiveType: 'as' as const,
      source: 'local'
    }));
    
    let combined: UnifiedStory[] = [];
    
    switch (archiveFilter) {
      case 'ag':
        combined = agUnified;
        break;
      case 'as':
        combined = asUnified;
        break;
      default:
        combined = [...agUnified, ...asUnified];
    }
    
    // Ordina per data creazione (più recenti prima)
    return combined.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  // ============= OPERAZIONI AS (CRUD completo) =============

  const handleAddASStory = async () => {
    if (!newStory.title.trim() || !newStory.content.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci titolo e contenuto",
        variant: "destructive",
      });
      return;
    }

    try {
      await createASStory('superuser', {
        title: newStory.title,
        text: newStory.content,
        category,
        hasImage: false
      });
      
      setNewStory({ title: '', content: '' });
      setIsAddDialogOpen(false);
      loadStories();
      
      toast({
        title: "Storia creata",
        description: "La storia è stata salvata nel tuo Archivio Personale (AS)",
      });
    } catch (error) {
      console.error('❌ Error saving AS story:', error);
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio",
        variant: "destructive",
      });
    }
  };

  const handleEditASStory = async () => {
    if (!editingStory || !editingStory.title.trim() || !editingStory.content.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci titolo e contenuto",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateASStory(editingStory.id, {
        title: editingStory.title,
        content: editingStory.content
      });
      
      setEditingStory(null);
      setIsEditDialogOpen(false);
      loadStories();
      
      toast({
        title: "Storia aggiornata",
        description: "Le modifiche sono state salvate",
      });
    } catch (error) {
      console.error('❌ Error updating AS story:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    }
  };

  const handleDeleteASStory = async (storyId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa storia dal tuo Archivio Personale?')) return;

    try {
      await deleteASStory(storyId);
      loadStories();
      
      toast({
        title: "Storia eliminata",
        description: "La storia è stata rimossa dal tuo Archivio Personale",
      });
    } catch (error) {
      console.error('❌ Error deleting AS story:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione",
        variant: "destructive",
      });
    }
  };

  // ============= COPIA DA AG A AS =============

  const handleCopyToAS = async (agStoryId: string) => {
    try {
      const newId = await copyAGtoAS(agStoryId, 'superuser');
      loadStories();
      
      toast({
        title: "Storia copiata",
        description: "La storia è stata copiata nel tuo Archivio Personale. Ora puoi modificarla.",
      });
      
      // Passa al filtro AS per mostrare la nuova storia
      setArchiveFilter('as');
    } catch (error) {
      console.error('❌ Error copying AG to AS:', error);
      toast({
        title: "Errore",
        description: "Errore durante la copia",
        variant: "destructive",
      });
    }
  };

  // ============= TTS e VIEW =============

  const handleTTSToggle = (story: UnifiedStory) => {
    if (isPlaying && currentStoryId === story.id) {
      if (isPaused) {
        speak(story.content, 'italian', story.id);
      } else {
        pause();
      }
    } else {
      speak(story.content, 'italian', story.id);
    }
  };

  const handleImageIconClick = async (story: UnifiedStory) => {
    if (!story.has_image) return;
    
    try {
      const mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(story.id);
      if (mediaAsset && mediaAsset.data) {
        const url = URL.createObjectURL(mediaAsset.data);
        setSelectedImageUrl(url);
        setImageDialogStory(story);
        const style = mediaAsset.metadata?.style || "Generato da AI";
        setSelectedImageStyle(style.charAt(0).toUpperCase() + style.slice(1));
      } else {
        toast({
          title: "Errore",
          description: "Impossibile caricare l'immagine"
        });
      }
    } catch (error) {
      console.error('Error loading image:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare l'immagine",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (story: UnifiedStory) => {
    // Solo storie AS possono essere modificate
    if (story.archiveType !== 'as') return;
    
    const asStory = asStories.find(s => s.id === story.id);
    if (asStory) {
      setEditingStory({ ...asStory });
      setIsEditDialogOpen(true);
    }
  };

  const handleBack = () => {
    navigate('/superuser-story-type-selection');
  };

  const filteredStories = getFilteredStories();

  return (
    <StoryLayout
      title={title}
      subtitle={subtitle}
      onBack={handleBack}
    >
      <div className="space-y-6">
        {/* Header con Filtro e Pulsante Aggiungi */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Filtro Archivio */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Mostra:</span>
            <Select value={archiveFilter} onValueChange={(v) => setArchiveFilter(v as ArchiveFilter)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti ({agStories.length + asStories.length})</SelectItem>
                <SelectItem value="ag">Archivio Generale ({agStories.length})</SelectItem>
                <SelectItem value="as">Archivio Personale ({asStories.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Pulsante Aggiungi (crea in AS) */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" size="lg">
                <Plus className="w-5 h-5" />
                Crea storia personale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="dlg-desc-add-story">
              <DialogHeader>
                <DialogTitle>Nuova Storia Personale</DialogTitle>
              </DialogHeader>
              <DialogDescription id="dlg-desc-add-story">
                Crea una nuova storia nel tuo Archivio Personale (AS).
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
                  <Button onClick={handleAddASStory}>
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
                {filteredStories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {archiveFilter === 'as' 
                      ? 'Nessuna storia nel tuo Archivio Personale. Clicca "Crea storia personale" per iniziare.'
                      : 'Nessuna storia presente.'}
                  </p>
                ) : (
                  filteredStories.map((story) => (
                    <div 
                      key={story.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {/* Badge AG/AS */}
                          <Badge 
                            variant={story.archiveType === 'ag' ? 'default' : 'secondary'}
                            className={story.archiveType === 'ag' ? 'bg-blue-600' : 'bg-emerald-600'}
                          >
                            {story.archiveType === 'ag' ? 'AG' : 'AS'}
                          </Badge>
                          <button
                            onClick={() => navigate(`/ag-story-detail-su/${story.id}`)}
                            className={`text-left hover:underline text-foreground truncate block ${
                              story.archiveType === 'ag' ? 'font-bold' : 'font-medium'
                            }`}
                          >
                            {story.title}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                          {new Date(story.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-0.5 sm:gap-1 ml-2 sm:ml-4 flex-shrink-0">
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
                          onClick={() => handleTTSToggle(story)}
                          title={
                            isPlaying && currentStoryId === story.id 
                              ? (isPaused ? "Riprendi" : "Pausa") 
                              : "Leggi"
                          }
                        >
                          {isPlaying && currentStoryId === story.id ? (
                            isPaused ? (
                              <Volume1 className="w-5 h-5 text-orange-600" />
                            ) : (
                              <VolumeX className="w-5 h-5 text-red-600" />
                            )
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

                        {/* Copy to AS (solo per AG) */}
                        {story.archiveType === 'ag' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyToAS(story.id)}
                            title="Copia in Archivio Personale"
                          >
                            <Copy className="w-5 h-5 text-purple-600" />
                          </Button>
                        )}

                        {/* Edit Icon (solo per AS) */}
                        {story.archiveType === 'as' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(story)}
                            title="Modifica"
                          >
                            <Edit className="w-5 h-5 text-blue-600" />
                          </Button>
                        )}

                        {/* Image Icon */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title={story.has_image ? "Visualizza immagine" : "Nessuna immagine"}
                          onClick={() => story.has_image && handleImageIconClick(story)}
                          disabled={!story.has_image}
                        >
                          <ImageIcon className={`w-5 h-5 ${story.has_image ? 'text-green-600' : 'text-red-600'}`} />
                        </Button>

                        {/* Delete Icon (solo per AS) */}
                        {story.archiveType === 'as' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteASStory(story.id)}
                            title="Elimina"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Edit Dialog (solo per AS) */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl" aria-describedby="dlg-desc-edit-story">
            <DialogHeader>
              <DialogTitle>Modifica Storia Personale</DialogTitle>
            </DialogHeader>
            <DialogDescription id="dlg-desc-edit-story">
              Modifica il titolo e il contenuto della storia.
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
                  <Button onClick={handleEditASStory}>
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

        {/* Image Viewer Dialog */}
        {imageDialogStory && selectedImageUrl && (
          <ImageViewerDialog
            open={!!imageDialogStory}
            onOpenChange={(open) => {
              if (!open) {
                setImageDialogStory(null);
                if (selectedImageUrl) {
                  URL.revokeObjectURL(selectedImageUrl);
                  setSelectedImageUrl(null);
                }
              }
            }}
            imageUrl={selectedImageUrl}
            storyTitle={imageDialogStory.title}
            storyId={imageDialogStory.id}
            style={selectedImageStyle}
          />
        )}
      </div>
    </StoryLayout>
  );
};

export default AGStoryManagement;
