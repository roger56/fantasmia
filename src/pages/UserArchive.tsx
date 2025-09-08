import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Eye, Image, Trash2 } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import { getStories, getStoriesForUser, getStoryImage } from '@/utils/userStorage';
import StoryImageIndicator from '@/components/shared/StoryImageIndicator';
import ImageViewerDialog from '@/components/shared/ImageViewerDialog';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const UserArchive = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageData, setSelectedImageData] = useState<{url: string, title: string, style: string} | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      
      setIsAuthenticated(true);
      setUserName(authStatus.userName);
      
      // Load user's stories from personal archive
      const userStories = getStoriesForUser(authStatus.userId);
      
      // Also check main stories list for backward compatibility
      const mainStories = getStories().filter(story => 
        story.authorName === authStatus.userName || 
        story.authorId === authStatus.userId
      );
      
      // Merge and deduplicate
      const allUserStories = [...userStories];
      mainStories.forEach(story => {
        if (!allUserStories.find(existing => existing.id === story.id)) {
          allUserStories.push(story);
        }
      });
      
      setStories(allUserStories);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleViewImage = (storyId: string, storyTitle: string) => {
    const storyImage = getStoryImage(storyId);
    if (storyImage) {
      setSelectedImageData({
        url: storyImage.imageUrl,
        title: storyTitle,
        style: storyImage.style
      });
      setShowImageViewer(true);
    }
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
                          onClick={() => navigate(`/story-viewer/${story.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <StoryImageIndicator storyId={story.id} />
                                  <h4 className="font-semibold text-slate-800 truncate">
                                    {story.title}
                                  </h4>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">
                                  {story.mode} • {new Date(story.lastModified).toLocaleDateString('it-IT')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const storyImage = getStoryImage(story.id);
                                    if (storyImage) {
                                      handleViewImage(story.id, story.title);
                                    }
                                  }}
                                  title="Visualizza immagine"
                                  disabled={!getStoryImage(story.id)}
                                >
                                  <Image className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/story-viewer/${story.id}`);
                                  }}
                                  className="ml-2"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Sei sicuro di voler eliminare questa storia? Questa azione non può essere annullata.')) {
                                      // Import deleteStory function and remove story
                                      import('@/utils/userStorage').then(({ deleteStory }) => {
                                        if (deleteStory(story.id)) {
                                          // Reload stories
                                          window.location.reload();
                                        }
                                      });
                                    }
                                  }}
                                  className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Elimina storia"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
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
      
      {selectedImageData && (
        <ImageViewerDialog
          open={showImageViewer}
          onOpenChange={setShowImageViewer}
          imageUrl={selectedImageData.url}
          storyTitle={selectedImageData.title}
          style={selectedImageData.style}
        />
      )}
    </>
  );
};

export default UserArchive;