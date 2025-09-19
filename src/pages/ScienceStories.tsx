import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';
import StoryImageIcon from '@/components/shared/StoryImageIcon';
import { fantasMiaDB, AGStory } from '@/utils/indexedDB';

const ScienceStories = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<AGStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScienceStories();
    
    // Listen for media updates to refresh the list
    const handleMediaUpdate = () => {
      loadScienceStories();
    };
    
    window.addEventListener('media:updated', handleMediaUpdate);
    
    return () => {
      window.removeEventListener('media:updated', handleMediaUpdate);
    };
  }, []);

  const loadScienceStories = async () => {
    try {
      const scienceStories = await fantasMiaDB.getAGStoriesByCategory('science');
      setStories(scienceStories);
    } catch (error) {
      console.error('Error loading science stories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StoryLayout
        title="Storie di Scienza"
        subtitle="Caricamento..."
        onBack={() => navigate('/dashboard')}
      >
        <div className="text-center">Caricamento storie di scienza...</div>
      </StoryLayout>
    );
  }

  return (
    <StoryLayout
      title="Storie di Scienza"
      subtitle="Archivio Generale (AG) - Storie Scientifiche"
      onBack={() => navigate('/dashboard')}
    >
      <div className="space-y-6">
        {stories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FlaskConical className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Nessuna storia di scienza disponibile</h3>
              <p className="text-gray-600">
                Il SuperUser non ha ancora creato storie scientifiche.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-primary" />
                    <span className="truncate">{story.title}</span>
                    <StoryImageIcon storyId={story.id} hasImage={story.has_image} />
                  </CardTitle>
                  <CardDescription>
                    Categoria: Scienza • {new Date(story.updated_at).toLocaleDateString('it-IT')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {story.content.substring(0, 100)}...
                  </p>
                  <Button 
                    onClick={() => navigate(`/science-story-viewer/${story.id}`)}
                    size="sm"
                    className="w-full"
                  >
                    Leggi Storia
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StoryLayout>
  );
};

export default ScienceStories;