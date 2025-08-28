import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Eye } from 'lucide-react';
import { getScienceStories, ScienceStory } from '@/utils/userStorage';
import { AuthBridge } from '@/utils/authBridge';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const ScienceStories = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<ScienceStory[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoadStories = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      
      setIsAuthenticated(true);
      loadStories();
      setLoading(false);
    };

    checkAuthAndLoadStories();
  }, [navigate]);

  const loadStories = async () => {
    const scienceStories = await getScienceStories();
    // Sort alphabetically by title
    setStories(scienceStories.sort((a, b) => a.title.localeCompare(b.title)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <ProfileIndicator />
      <StoryLayout
        title="Magia della Scienza"
        subtitle="Brevi storielle che spiegano fenomeni naturali"
        onBack={() => navigate('/story-type-selection')}
        showHomeButton={true}
      >
        <div className="max-w-4xl mx-auto">
          {stories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  Nessuna storia scientifica disponibile
                </h3>
                <p className="text-slate-500">
                  Le storie scientifiche verranno pubblicate presto!
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {stories.map((story) => (
                  <Card key={story.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-slate-800">
                          {story.title}
                        </CardTitle>
                        <Button
                          onClick={() => navigate(`/science-story-viewer/${story.id}`)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Leggi
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-slate-600">
                        <p className="line-clamp-2">
                          {story.content.substring(0, 150)}...
                        </p>
                        <div className="mt-2 pt-2 border-t text-xs text-slate-500">
                          Pubblicata il {new Date(story.created_at).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </StoryLayout>
    </>
  );
};

export default ScienceStories;