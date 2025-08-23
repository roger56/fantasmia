import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, FileText, Clock, User } from 'lucide-react';
import { getAllStoriesForSuperuser, Story } from '@/utils/userStorage';
import { AuthBridge } from '@/utils/authBridge';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const Archive = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadStories = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      
      setIsAuthenticated(true);
      
      try {
        const allStories = await getAllStoriesForSuperuser();
        setStories(allStories);
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadStories();
  }, [navigate]);

  const handleStoryClick = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Caricamento archivio...</div>
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
        title="Archivio Globale"
        subtitle="Tutte le storie create dagli utenti"
        onBack={() => {
          // Check if user is Superuser
          const authToken = localStorage.getItem('superuser-session');
          const authExpiry = localStorage.getItem('superuser-session-expiry');
          const isSuperuser = authToken && authExpiry && Date.now() < parseInt(authExpiry);
          
          if (isSuperuser) {
            navigate('/superuser');
          } else {
            navigate('/dashboard');
          }
        }}
        showHomeButton={true}
      >
        <div className="max-w-4xl mx-auto">
          {stories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessuna storia trovata
                </h3>
                <p className="text-gray-500">
                  Non ci sono ancora storie nell'archivio.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <Card 
                  key={story.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleStoryClick(story.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="flex-1">{story.title}</span>
                      <span className="text-sm font-normal text-gray-500 ml-4">
                        {story.mode}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {story.content && (
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {story.content.substring(0, 150)}
                          {story.content.length > 150 && '...'}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{story.authorName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(story.lastModified).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          story.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : story.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {story.status === 'completed' ? 'Completata' : 
                           story.status === 'in-progress' ? 'In corso' : 'Sospesa'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </StoryLayout>
    </>
  );
};

export default Archive;