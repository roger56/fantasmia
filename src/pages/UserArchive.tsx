import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Archive, Eye, Trash2, Image, ImageOff } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';
import ImageViewerDialog from '@/components/shared/ImageViewerDialog';
import { AMStory } from '@/utils/indexedDB';
import { getCurrentUserStories } from '@/utils/storyManager';
import { getCurrentProfileId, getCurrentProfile } from '@/utils/profileManager';

const UserArchive = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<AMStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [currentImageBlob, setCurrentImageBlob] = useState<Blob | null>(null);
  const [selectedStoryTitle, setSelectedStoryTitle] = useState('');

  useEffect(() => {
    loadUserStories();
    
    // Listen for user story saved events to refresh
    const handleStoryUpdate = (event: CustomEvent) => {
      console.log('🔄 USER-ARCHIVE: Rilevato salvataggio storia', event.detail);
      if (event.detail?.storyId) {
        reloadRow(event.detail.storyId);
      } else {
        loadUserStories(); // Fallback to full reload
      }
    };

    // REQUISITO: Listener per eventi am:changed
    const handleAMChanged = () => {
      console.log('🔄 USER-ARCHIVE: Rilevato am:changed');
      loadUserStories();
    };
    
    // Listen for multiple events that might indicate story changes
    window.addEventListener('user-story-saved', handleStoryUpdate);
    window.addEventListener('am-story-updated', handleStoryUpdate);
    window.addEventListener('media:updated', handleStoryUpdate);
    window.addEventListener('story:updated', handleStoryUpdate); // AI improvement updates
    window.addEventListener('am:changed', handleAMChanged); // REQUISITO: Lista reattiva
    
    return () => {
      window.removeEventListener('user-story-saved', handleStoryUpdate);
      window.removeEventListener('am-story-updated', handleStoryUpdate);
      window.removeEventListener('media:updated', handleStoryUpdate);
      window.removeEventListener('story:updated', handleStoryUpdate);
      window.removeEventListener('am:changed', handleAMChanged);
    };
  }, []);

  const loadUserStories = async () => {
    try {
      const userStories = await getCurrentUserStories();
      setStories(userStories);
      
      // Show hint if no stories but user has profile
      if (userStories.length === 0) {
        const profileId = getCurrentProfileId();
        if (profileId) {
          console.log('💡 HINT: Nessuna storia per profilo', profileId, '. Controlla ownerProfileId.');
        }
      }
    } catch (error) {
      console.error('Error loading user stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const reloadRow = async (storyId: string) => {
    try {
      console.log('🔄 USER-ARCHIVE: Ricarico riga specifica', storyId);
      const { fantasMiaDB } = await import('@/utils/indexedDB');
      const updatedStory = await fantasMiaDB.getAMStoryById(storyId);
      
      if (updatedStory) {
        setStories(prev => prev.map(story => 
          story.id === storyId ? updatedStory : story
        ));
      } else {
        // Story was deleted, remove from list
        setStories(prev => prev.filter(story => story.id !== storyId));
      }
    } catch (error) {
      console.error('Error reloading story row:', error);
      // Fallback to full reload on error
      loadUserStories();
    }
  };

  const handleDeleteStory = async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Sei sicuro di voler eliminare questa storia?')) {
      try {
        const { fantasMiaDB } = await import('@/utils/indexedDB');
        
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
        window.dispatchEvent(new CustomEvent('am:changed')); // REQUISITO: Lista reattiva
        
        // Update local state immediately
        setStories(prev => prev.filter(story => story.id !== storyId));
      } catch (error) {
        console.error('Error deleting story:', error);
      }
    }
  };

  const handleImageClick = async (storyId: string, storyTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { fantasMiaDB } = await import('@/utils/indexedDB');
      const mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(storyId);
      
      if (mediaAsset && mediaAsset.data) {
        const imageBlob = new Blob([mediaAsset.data], { type: 'image/webp' });
        const url = URL.createObjectURL(imageBlob);
        setImageUrl(url);
        setCurrentImageBlob(imageBlob);
        setSelectedStoryTitle(storyTitle);
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
  };

  if (loading) {
    return (
      <StoryLayout
        title="Archivio Magico (AM)"
        subtitle="Caricamento..."
        onBack={() => navigate('/dashboard')}
      >
        <div className="text-center">Caricamento storie...</div>
      </StoryLayout>
    );
  }

  const currentProfile = getCurrentProfile();
  const profileName = currentProfile?.name || 'Utente';

  return (
    <>
      <StoryLayout
        title="Archivio Magico (AM)"
        subtitle="Le tue storie personali"
        onBack={() => navigate('/dashboard')}
      >
        <div className="space-y-4">
          {stories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Non hai ancora creato storie</h3>
                <p className="text-muted-foreground">
                  Non hai ancora creato nessuna storia nel tuo Archivio Magico.
                </p>
                <Button 
                  onClick={() => navigate('/create-story')}
                  className="mt-4"
                >
                  Crea la tua prima storia
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="divide-y divide-border">
                    {stories.map((story) => (
                      <div
                        key={story.id}
                        className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          console.log({ action: "open-user-viewer", id: story.id });
                          navigate(`/user-story-viewer/${story.id}`);
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Title */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {story.title}
                            </h3>
                          </div>

                          {/* Created by */}
                          <div className="text-sm text-muted-foreground min-w-0 max-w-[120px]">
                            <span className="truncate block">{profileName}</span>
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
                                onClick={(e) => handleImageClick(story.id, story.title, e)}
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
                                console.log({ action: "open-user-viewer", id: story.id });
                                navigate(`/user-story-viewer/${story.id}`);
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
        style=""
      />
    </>
  );
};

export default UserArchive;