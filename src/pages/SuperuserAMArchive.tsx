import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Eye } from 'lucide-react';
import { AMStory, fantasMiaDB } from '@/utils/indexedDB';
import { useToast } from '@/hooks/use-toast';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import StoryImageIcon from '@/components/shared/StoryImageIcon';

const SuperuserAMArchive = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<AMStory[]>([]);
  const [filteredStories, setFilteredStories] = useState<AMStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageStatuses, setImageStatuses] = useState<Record<string, boolean>>({});
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
      const filtered = stories.filter(story => 
        story.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.ownerProfileId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.mode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStories(filtered);
    }
  }, [searchTerm, stories]);

  const loadStories = async () => {
    try {
      await fantasMiaDB.init();
      
      // Get all AM stories
      const transaction = fantasMiaDB['db']!.transaction(['am_stories'], 'readonly');
      const store = transaction.objectStore('am_stories');
      const request = store.getAll();

      request.onsuccess = async () => {
        const allStories = request.result || [];
        setStories(allStories);
        
        // Check image status for each story
        const statuses: Record<string, boolean> = {};
        for (const story of allStories) {
          const hasImage = await fantasMiaDB.hasImageForStory(story.id);
          statuses[story.id] = hasImage;
        }
        setImageStatuses(statuses);
        setLoading(false);
      };

      request.onerror = () => {
        console.error('Error loading stories:', request.error);
        toast({
          title: "Errore",
          description: "Errore durante il caricamento delle storie",
          variant: "destructive"
        });
        setLoading(false);
      };
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

  const handleBack = () => {
    navigate('/superuser');
  };

  const handleViewStory = (storyId: string) => {
    console.log({ action: "open-superuser-viewer", id: storyId });
    navigate(`/superuser-user-story-viewer/${storyId}`);
  };

  const getModeBadgeVariant = (mode: string) => {
    switch (mode) {
      case 'PROPP': return 'default';
      case 'GHOST': return 'secondary';
      case 'CAMPBELL': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center pt-20">Caricamento archivio AM...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <ProfileIndicator />
      
      {/* Fixed Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </Button>
          
          <h1 className="text-xl font-bold text-slate-800">Archivio Utenti (AM)</h1>
          
          <div className="text-sm text-slate-600">
            {filteredStories.length} storie
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto pt-20 space-y-6">
        
        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Cerca per titolo, contenuto, utente o modalità..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-slate-500">
                {stories.length === 0 ? 'Nessuna storia trovata nell\'archivio AM' : 'Nessuna storia corrisponde ai criteri di ricerca'}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {story.title || 'Storia senza titolo'}
                    </CardTitle>
                    <div className="flex items-center gap-2 ml-2">
                      <StoryImageIcon 
                        storyId={story.id} 
                        hasImage={story.hasImage} 
                        storyTitle={story.title}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getModeBadgeVariant(story.mode)}>
                      {story.mode}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                    {story.text || 'Nessun contenuto disponibile'}
                  </p>
                  
                  <div className="space-y-2 text-xs text-slate-500">
                    <div>Utente: {story.ownerProfileId}</div>
                    <div>Creata: {new Date(story.createdAt).toLocaleDateString('it-IT')}</div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStory(story.id)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizza
                    </Button>
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

export default SuperuserAMArchive;