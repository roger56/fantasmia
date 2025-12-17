import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, Eye, Trash2, Image, ImageOff, BookPlus } from 'lucide-react';
import { AMStory, fantasMiaDB } from '@/utils/indexedDB';
import { useToast } from '@/hooks/use-toast';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import ImageViewerDialog from '@/components/shared/ImageViewerDialog';
import StoryLayout from '@/components/shared/StoryLayout';
import AlbumCreatorDialog from '@/components/superuser/AlbumCreatorDialog';
import { AlbumGenerationConfig } from '@/utils/albumPdfGenerator';

const SuperuserAMArchive = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<AMStory[]>([]);
  const [filteredStories, setFilteredStories] = useState<AMStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [currentImageBlob, setCurrentImageBlob] = useState<Blob | null>(null);
  const [selectedStoryTitle, setSelectedStoryTitle] = useState('');
  const [selectedStoryContent, setSelectedStoryContent] = useState('');
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStories();
    
    // Listen for story changes to refresh superuser archive
    const handleStoryUpdate = (event: CustomEvent) => {
      console.log('🔄 SUPERUSER-AM-ARCHIVE: Rilevato aggiornamento storia', event.detail);
      loadStories();
    };
    
    window.addEventListener('user-story-saved', handleStoryUpdate);
    window.addEventListener('am-story-updated', handleStoryUpdate);
    window.addEventListener('media:updated', handleStoryUpdate);
    window.addEventListener('story:updated', handleStoryUpdate); // AI improvement updates
    
    return () => {
      window.removeEventListener('user-story-saved', handleStoryUpdate);
      window.removeEventListener('am-story-updated', handleStoryUpdate);
      window.removeEventListener('media:updated', handleStoryUpdate);
      window.removeEventListener('story:updated', handleStoryUpdate);
    };
  }, []);

  useEffect(() => {
    // Filter stories based on search term
    if (searchTerm.trim() === '') {
      setFilteredStories(stories);
    } else {
      const filtered = stories.filter(story => {
        const searchLower = searchTerm.toLowerCase();
        const profileName = profileNames[story.ownerProfileId] || story.ownerProfileId;
        
        return (
          story.title?.toLowerCase().includes(searchLower) ||
          story.text?.toLowerCase().includes(searchLower) ||
          story.ownerProfileId?.toLowerCase().includes(searchLower) ||
          story.mode?.toLowerCase().includes(searchLower) ||
          profileName.toLowerCase().includes(searchLower)
        );
      });
      setFilteredStories(filtered);
    }
  }, [searchTerm, stories, profileNames]);

  const loadStories = async () => {
    try {
      await fantasMiaDB.init();
      
      // Get all AM stories
      const transaction = fantasMiaDB['db']!.transaction(['am_stories', 'profiles'], 'readonly');
      const storyStore = transaction.objectStore('am_stories');
      const profileStore = transaction.objectStore('profiles');
      
      const storyRequest = storyStore.getAll();
      const profileRequest = profileStore.getAll();

      Promise.all([
        new Promise<AMStory[]>((resolve, reject) => {
          storyRequest.onsuccess = () => resolve(storyRequest.result || []);
          storyRequest.onerror = () => reject(storyRequest.error);
        }),
        new Promise<any[]>((resolve, reject) => {
          profileRequest.onsuccess = () => resolve(profileRequest.result || []);
          profileRequest.onerror = () => reject(profileRequest.error);
        })
      ]).then(([allStories, allProfiles]) => {
        console.log('=== DEBUG SuperuserAMArchive ===');
        console.log('Stories loaded:', allStories.length);
        console.log('First few stories:', allStories.slice(0, 3).map(s => ({ id: s.id, title: s.title, ownerProfileId: s.ownerProfileId })));
        console.log('Profiles loaded:', allProfiles.length);
        console.log('All profiles:', allProfiles.map(p => ({ id: p.id, name: p.name })));
        
        setStories(allStories);
        
        // Create profile name mapping
        const nameMap: Record<string, string> = {};
        allProfiles.forEach(profile => {
          nameMap[profile.id] = profile.name || profile.id;
        });
        
        console.log('Profile mapping created:', nameMap);
        
        // Check which stories have missing profile mappings
        const missingProfiles = allStories.filter(story => !nameMap[story.ownerProfileId]);
        if (missingProfiles.length > 0) {
          console.warn('Stories with missing profile mappings:', missingProfiles.map(s => ({ 
            storyId: s.id, 
            title: s.title, 
            ownerProfileId: s.ownerProfileId 
          })));
        }
        
        setProfileNames(nameMap);
        setLoading(false);
      }).catch(error => {
        console.error('Error loading data:', error);
        toast({
          title: "Errore",
          description: "Errore durante il caricamento delle storie",
          variant: "destructive"
        });
        setLoading(false);
      });
    } catch (error) {
      console.error('Error accessing IndexedDB:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'accesso al database",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Sei sicuro di voler eliminare questa storia?')) {
      try {
        // Delete media assets first
        const mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(storyId);
        if (mediaAsset) {
          await fantasMiaDB.deleteMediaAsset(mediaAsset.id);
        }
        
        // Delete the story
        await fantasMiaDB.deleteAMStory(storyId);
        
        // Emit update event for real-time UI updates
        window.dispatchEvent(new CustomEvent('am-story-updated', { 
          detail: { storyId, action: 'deleted' } 
        }));
        window.dispatchEvent(new CustomEvent('am:changed'));
        
        // Update local state immediately
        setStories(prev => prev.filter(story => story.id !== storyId));
        
        toast({
          title: "Storia eliminata",
          description: "La storia è stata eliminata con successo"
        });
      } catch (error) {
        console.error('Error deleting story:', error);
        toast({
          title: "Errore",
          description: "Errore durante l'eliminazione della storia",
          variant: "destructive"
        });
      }
    }
  };

  const handleImageClick = async (storyId: string, storyTitle: string, storyText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(storyId);
      
      if (mediaAsset && mediaAsset.data) {
        const imageBlob = new Blob([mediaAsset.data], { type: 'image/webp' });
        const url = URL.createObjectURL(imageBlob);
        setImageUrl(url);
        setCurrentImageBlob(imageBlob);
        setSelectedStoryTitle(storyTitle);
        setSelectedStoryContent(storyText);
        setSelectedStoryId(storyId);
        setImageViewerOpen(true);
      }
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  const handleViewerClose = () => {
    setImageViewerOpen(false);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl('');
    }
    setCurrentImageBlob(null);
    setSelectedStoryTitle('');
    setSelectedStoryContent('');
    setSelectedStoryId('');
  };

  const toggleStorySelection = (storyId: string) => {
    const newSelection = new Set(selectedStories);
    if (newSelection.has(storyId)) {
      newSelection.delete(storyId);
    } else {
      newSelection.add(storyId);
    }
    setSelectedStories(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedStories.size === filteredStories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(filteredStories.map(s => s.id)));
    }
  };

  const handleCreateAlbum = async () => {
    // Get email settings from IndexedDB
    const emailSettings = await fantasMiaDB.getSystemSettings();

    // Check min/max stories requirement
    if (selectedStories.size < emailSettings.minStoriesForEmail || selectedStories.size > emailSettings.maxStoriesForEmail) {
      toast({
        title: "Selezione non valida",
        description: `Devi selezionare tra ${emailSettings.minStoriesForEmail} e ${emailSettings.maxStoriesForEmail} storie per l'invio`,
        variant: "destructive"
      });
      return;
    }

    setAlbumDialogOpen(true);
  };

  const selectedStoriesArray = filteredStories.filter(s => selectedStories.has(s.id));

  if (loading) {
    return (
      <StoryLayout
        title="Archivio Utenti (AM)"
        subtitle="Caricamento..."
        onBack={() => navigate('/superuser')}
      >
        <div className="text-center">Caricamento archivio AM...</div>
      </StoryLayout>
    );
  }

  return (
    <>
      <StoryLayout
        title="Archivio Utenti (AM)"
        subtitle={`${filteredStories.length} storie totali${selectedStories.size > 0 ? ` • ${selectedStories.size} selezionate` : ''}`}
        onBack={() => navigate('/superuser')}
      >
        <div className="space-y-4">
          {/* Selection toolbar */}
          {selectedStories.size > 0 && (
            <Card className="bg-primary/10 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {selectedStories.size} {selectedStories.size === 1 ? 'storia selezionata' : 'storie selezionate'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStories(new Set())}
                    >
                      Deseleziona tutto
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateAlbum}
                      className="gap-2"
                    >
                      <BookPlus className="w-4 h-4" />
                      Crea Album
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cerca per titolo, contenuto, utente o modalità..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stories List */}
          {filteredStories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  {stories.length === 0 ? 'Nessuna storia trovata nell\'archivio AM' : 'Nessuna storia corrisponde ai criteri di ricerca'}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="divide-y divide-border">
                    {/* Select All row */}
                    <div className="p-4 bg-muted/30 sticky top-0 z-10">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedStories.size === filteredStories.length && filteredStories.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-sm font-medium">Seleziona tutto</span>
                      </div>
                    </div>

                    {/* Story rows */}
                    {filteredStories.map((story) => (
                      <div
                        key={story.id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Checkbox */}
                          <div className="flex items-center">
                            <Checkbox
                              checked={selectedStories.has(story.id)}
                              onCheckedChange={() => toggleStorySelection(story.id)}
                            />
                          </div>

                          {/* Title */}
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/superuser-user-story-viewer/${story.id}`)}>
                            <h3 className="font-semibold text-foreground truncate">
                              {story.title || 'Storia senza titolo'}
                            </h3>
                          </div>

                          {/* Created by */}
                          <div className="text-sm text-muted-foreground min-w-0 max-w-[120px]">
                            <span className="truncate block">
                              {profileNames[story.ownerProfileId] || `Utente ${story.ownerProfileId.slice(0, 8)}...`}
                            </span>
                          </div>

                          {/* Creation date */}
                          <div className="text-sm text-muted-foreground min-w-[130px]">
                            {new Date(story.createdAt).toLocaleString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>

                          {/* Image icon */}
                          <div className="flex items-center">
                            {story.hasImage ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => handleImageClick(story.id, story.title, story.text || '', e)}
                              >
                                <Image className="w-4 h-4 text-green-600" />
                              </Button>
                            ) : (
                              <div className="h-8 w-8 flex items-center justify-center">
                                <ImageOff className="w-4 h-4 text-red-600" />
                              </div>
                            )}
                          </div>

                          {/* Delete button */}
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={(e) => handleDeleteStory(story.id, e)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* View button */}
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log({ action: "open-superuser-viewer", id: story.id });
                                navigate(`/superuser-user-story-viewer/${story.id}`);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </StoryLayout>

      <ImageViewerDialog
        open={imageViewerOpen}
        onOpenChange={handleViewerClose}
        imageUrl={imageUrl}
        imageBlob={currentImageBlob}
        storyTitle={selectedStoryTitle}
        storyContent={selectedStoryContent}
        userId="superuser"
        canGenerateSketch={true}
        onSketchSaved={loadStories}
      />

      {albumDialogOpen && (
        <AlbumCreatorDialog
          open={albumDialogOpen}
          onOpenChange={setAlbumDialogOpen}
          stories={selectedStoriesArray}
          config={{
            pageSize: 'A4-portrait',
            margins: 20,
            fontFamily: 'Arial',
            fontSizeBody: 12,
            fontSizeTitles: 18,
            imageStyleDefault: 'fotografico'
          }}
        />
      )}
    </>
  );
};

export default SuperuserAMArchive;