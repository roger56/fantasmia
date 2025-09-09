import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, Eye, Trash2 } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';
import StoryImageIcon from '@/components/shared/StoryImageIcon';
import { fantasMiaDB, AMStory } from '@/utils/indexedDB';

const UserArchive = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<AMStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStories();
  }, []);

  const loadUserStories = async () => {
    try {
      // Get current user from localStorage (simulated for demo)
      const currentUserId = localStorage.getItem('current_user_id') || 'demo-user';
      const userStories = await fantasMiaDB.getAMStoriesByUser(currentUserId);
      setStories(userStories);
    } catch (error) {
      console.error('Error loading user stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa storia?')) {
      try {
        await fantasMiaDB.deleteAMStory(storyId);
        await loadUserStories(); // Reload stories
      } catch (error) {
        console.error('Error deleting story:', error);
      }
    }
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

  return (
    <StoryLayout
      title="Archivio Magico (AM)"
      subtitle="Le tue storie personali"
      onBack={() => navigate('/dashboard')}
    >
      <div className="space-y-6">
        {stories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Archive className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Nessuna storia trovata</h3>
              <p className="text-gray-600">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="w-5 h-5 text-green-600" />
                    <span className="truncate">{story.title}</span>
                    <StoryImageIcon storyId={story.id} hasImage={story.has_image} />
                  </CardTitle>
                  <CardDescription>
                    {story.mode} • {new Date(story.updated_at).toLocaleDateString('it-IT')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {story.content.substring(0, 100)}...
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/story-viewer/${story.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizza
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteStory(story.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StoryLayout>
  );
};

export default UserArchive;