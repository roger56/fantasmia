import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Eye } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import { getStories } from '@/utils/userStorage';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const UserArchive = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      
      setIsAuthenticated(true);
      setUserName(authStatus.userName);
      
      // Load user's stories
      const userStories = getStories().filter(story => story.authorName === authStatus.userName);
      setStories(userStories);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

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
        title="TUTTE LE TUE STORIE"
        subtitle="Hai molta Fantas-Mia"
        onBack={() => navigate('/dashboard')}
        showHomeButton={true}
      >
        <div className="max-w-4xl mx-auto">
          {stories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Nessuna storia trovata
                </h3>
                <p className="text-slate-600">
                  Non hai ancora creato nessuna storia. Inizia a creare la tua prima storia!
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Le tue storie ({stories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {stories.map((story, index) => (
                      <Card 
                        key={story.id || index}
                        className="hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-slate-300"
                        onClick={() => navigate(`/story/${story.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-800 truncate">
                                {story.title}
                              </h4>
                              <p className="text-sm text-slate-600 mt-1">
                                {story.mode} • {new Date(story.lastModified).toLocaleDateString('it-IT')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/story/${story.id}`);
                              }}
                              className="ml-4"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </StoryLayout>
    </>
  );
};

export default UserArchive;