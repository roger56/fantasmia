import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Check, Eye, Trash2, BookOpen, PenLine } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';
import { AuthBridge } from '@/utils/authBridge';
import { useToast } from '@/hooks/use-toast';
import {
  getAllGroupStoriesWithDetails,
  approveAndPublish,
  rejectGroupStory,
  getGroupStoryFullContent
} from '@/lib/groupStoryManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSuperuserGuard } from '@/hooks/useSuperuserGuard';

interface GroupStoryWithDetails {
  id: string;
  title?: string;
  status: 'in_progress' | 'pending_approval' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  finalAGStoryId?: string;
  contributionCount: number;
  uniqueUsers: number;
  contributors: string[];
  lastContributor?: string;
}

const CTManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isChecking, isAuthorized } = useSuperuserGuard();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<GroupStoryWithDetails[]>([]);
  const [selectedStory, setSelectedStory] = useState<GroupStoryWithDetails | null>(null);
  const [fullContent, setFullContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const auth = await AuthBridge.isAuthenticated();
        if (!auth.authenticated || (auth.userName !== 'superuser' && auth.userName !== 'Superuser')) {
          navigate('/superuser');
          return;
        }

        await loadStories();
      } catch (error) {
        console.error('Error initializing:', error);
        toast({
          title: 'Errore',
          description: 'Errore durante il caricamento',
          variant: 'destructive'
        });
      }
    };

    initialize();
  }, [navigate, toast]);

  const loadStories = async () => {
    setLoading(true);
    try {
      const allStories = await getAllGroupStoriesWithDetails();
      setStories(allStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (story: GroupStoryWithDetails) => {
    setSelectedStory(story);
    try {
      const content = await getGroupStoryFullContent(story.id);
      setFullContent(content);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare il contenuto della storia',
        variant: 'destructive'
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedStory) return;
    
    setProcessing(true);
    try {
      const agStoryId = await approveAndPublish(selectedStory.id, 'superuser');
      toast({
        title: '✅ Storia Approvata',
        description: 'La storia è stata pubblicata in AG - Storie di Lettura',
        duration: 4000
      });
      setShowPreview(false);
      await loadStories();
      
      // Navigate to the published story
      setTimeout(() => {
        navigate(`/ag-story-detail-su/${agStoryId}`);
      }, 1500);
    } catch (error) {
      console.error('Error approving:', error);
      toast({
        title: 'Errore',
        description: 'Errore durante la pubblicazione',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedStory) return;
    
    setProcessing(true);
    try {
      await rejectGroupStory(selectedStory.id);
      toast({
        title: 'Storia Rifiutata',
        description: 'La storia è stata rimossa',
        duration: 3000
      });
      setShowRejectConfirm(false);
      setShowPreview(false);
      await loadStories();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast({
        title: 'Errore',
        description: 'Errore durante il rifiuto',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Corso</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Attesa</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const inProgressStories = stories.filter(s => s.status === 'in_progress');
  const pendingStories = stories.filter(s => s.status === 'pending_approval');
  const completedStories = stories.filter(s => s.status === 'completed');

  // 🛡️ SECURITY: Spinner durante check autorizzazione
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <StoryLayout
        title="Gestione Storie CT"
        subtitle="Caricamento..."
        onBack={() => navigate('/superuser')}
        showHomeButton
      >
        <div className="flex items-center justify-center p-12">
          <div className="text-lg text-muted-foreground">Caricamento...</div>
        </div>
      </StoryLayout>
    );
  }

  const renderStoryCard = (story: GroupStoryWithDetails, showApproveButton: boolean = false) => (
    <Card key={story.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">
            {story.title || `Storia #${story.id.slice(-6)}`}
          </CardTitle>
          {getStatusBadge(story.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{story.uniqueUsers} autori • {story.contributionCount} contributi</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Creata: {formatDate(story.createdAt)}</span>
          </div>
          {story.contributors.length > 0 && (
            <div className="text-xs">
              Contributori: {story.contributors.slice(0, 3).join(', ')}
              {story.contributors.length > 3 && ` +${story.contributors.length - 3}`}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreview(story)}
            className="gap-1"
          >
            <Eye className="w-3 h-3" />
            Anteprima
          </Button>
          
          {showApproveButton && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedStory(story);
                  handlePreview(story);
                }}
                className="gap-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-3 h-3" />
                Approva
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedStory(story);
                  setShowRejectConfirm(true);
                }}
                className="gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Rifiuta
              </Button>
            </>
          )}
          
          {story.finalAGStoryId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/ag-story-detail-su/${story.finalAGStoryId}`)}
              className="gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Vedi in AG
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <StoryLayout
        title="Gestione Storie CT"
        subtitle="Continua Tu... - Pannello Superuser"
        onBack={() => navigate('/superuser')}
        showHomeButton
        backgroundColor="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50"
      >
        {/* Button to participate in active story */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => navigate('/group-story')}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <PenLine className="w-4 h-4" />
            Partecipa alla storia attiva
          </Button>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              In Attesa
              {pendingStories.length > 0 && (
                <Badge variant="destructive" className="ml-1">{pendingStories.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Corso ({inProgressStories.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completate ({completedStories.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingStories.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nessuna storia in attesa di approvazione
                </CardContent>
              </Card>
            ) : (
              pendingStories.map(story => renderStoryCard(story, true))
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            {inProgressStories.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nessuna storia in corso
                </CardContent>
              </Card>
            ) : (
              inProgressStories.map(story => renderStoryCard(story))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedStories.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nessuna storia completata
                </CardContent>
              </Card>
            ) : (
              completedStories.map(story => renderStoryCard(story))
            )}
          </TabsContent>
        </Tabs>
      </StoryLayout>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              {selectedStory?.title || `Storia #${selectedStory?.id.slice(-6)}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{selectedStory?.uniqueUsers} autori</span>
              <span>•</span>
              <span>{selectedStory?.contributionCount} contributi</span>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed max-h-[400px] overflow-y-auto">
              {fullContent || 'Caricamento...'}
            </div>
            
            {selectedStory?.status === 'pending_approval' && (
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  disabled={processing}
                >
                  Chiudi
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowPreview(false);
                    setShowRejectConfirm(true);
                  }}
                  disabled={processing}
                >
                  Rifiuta
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing ? 'Pubblicazione...' : 'Approva e Pubblica'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rifiutare questa storia?</AlertDialogTitle>
            <AlertDialogDescription>
              La storia verrà eliminata e non potrà essere recuperata. 
              Tutti i contributi degli utenti andranno persi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={processing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processing ? 'Eliminazione...' : 'Sì, Rifiuta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CTManagement;
