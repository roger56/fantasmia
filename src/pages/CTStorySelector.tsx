import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Clock, Sparkles } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';
import { AuthBridge } from '@/utils/authBridge';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';
import { getLastLine } from '@/lib/groupStoryManager';

interface GroupStoryPreview {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  lastLine: string | null;
  contributionCount: number;
  uniqueUsers: number;
}

const CTStorySelector = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [openStories, setOpenStories] = useState<GroupStoryPreview[]>([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const auth = await AuthBridge.isAuthenticated();
        if (!auth.authenticated) {
          navigate('/');
          return;
        }

        await loadOpenStories();
      } catch (error) {
        console.error('Error initializing:', error);
        toast({
          title: 'Errore',
          description: 'Errore durante il caricamento',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [navigate, toast]);

  const loadOpenStories = async () => {
    try {
      const inProgressStories = await fantasMiaDB.getGroupStoriesByStatus('in_progress');
      
      const storiesWithDetails: GroupStoryPreview[] = [];
      
      for (const story of inProgressStories) {
        const contributions = await fantasMiaDB.getContributionsByGroupStoryId(story.id);
        const lastLine = await getLastLine(story.id);
        
        storiesWithDetails.push({
          id: story.id,
          title: story.title,
          createdAt: story.createdAt,
          updatedAt: story.updatedAt,
          lastLine,
          contributionCount: contributions.length,
          uniqueUsers: new Set(contributions.map(c => c.userId)).size
        });
      }
      
      // Sort by most recently updated
      storiesWithDetails.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setOpenStories(storiesWithDetails);
    } catch (error) {
      console.error('Error loading open stories:', error);
    }
  };

  const handleSelectStory = (storyId: string) => {
    // Navigate to editor with selected story ID
    navigate('/group-story', { state: { storyId, showIntro: false } });
  };

  const handleStartNewStory = () => {
    // Navigate to editor with flag to show intro and create new story
    navigate('/group-story', { state: { createNew: true, showIntro: true } });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateLastLine = (line: string | null, maxLength: number = 60) => {
    if (!line) return null;
    if (line.length <= maxLength) return line;
    return line.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <StoryLayout
        title="Continua Tu..."
        subtitle="Caricamento..."
        onBack={() => navigate('/dashboard')}
        showHomeButton
      >
        <div className="flex items-center justify-center p-12">
          <div className="text-lg text-muted-foreground">Caricamento...</div>
        </div>
      </StoryLayout>
    );
  }

  return (
    <StoryLayout
      title="Continua Tu..."
      subtitle="Seleziona una storia da continuare o iniziane una nuova"
      onBack={() => navigate('/dashboard')}
      showHomeButton
      backgroundColor="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50"
    >
      <div className="space-y-6">
        {/* New Story Button */}
        <Card className="border-2 border-dashed border-violet-300 hover:border-violet-500 transition-colors cursor-pointer"
              onClick={handleStartNewStory}>
          <CardContent className="p-6 flex items-center justify-center gap-3">
            <Plus className="w-6 h-6 text-violet-600" />
            <span className="text-lg font-medium text-violet-700">Inizia una nuova storia</span>
          </CardContent>
        </Card>

        {/* Open Stories List */}
        {openStories.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              Storie aperte ({openStories.length})
            </h2>
            
            <div className="space-y-3">
              {openStories.map((story) => (
                <Card 
                  key={story.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSelectStory(story.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">
                        {story.title || `Storia #${story.id.slice(-6)}`}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(story.updatedAt)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Last line preview */}
                    {story.lastLine && (
                      <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-lg mb-3">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                          <p className="italic text-pink-800 text-sm leading-relaxed">
                            "{truncateLastLine(story.lastLine)}"
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{story.contributionCount} contributi</span>
                      <span>•</span>
                      <span>{story.uniqueUsers} autori</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {openStories.length === 0 && (
          <Card className="bg-muted/30">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Non ci sono storie aperte al momento.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Inizia una nuova storia collaborativa!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </StoryLayout>
  );
};

export default CTStorySelector;
