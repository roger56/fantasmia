import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Home, Volume2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { AMStory } from '@/utils/indexedDB';
import { useTTS } from '@/hooks/useTTS';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import ImageViewerDialog from '@/components/shared/ImageViewerDialog';

const UserStoryViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<AMStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaAsset, setMediaAsset] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const { speak, stop, isPlaying } = useTTS();

  useEffect(() => {
    loadStory();
  }, [id]);

  const loadStory = async () => {
    if (!id) {
      console.log({ action: "load-am-story", id: "missing", found: false });
      setLoading(false);
      return;
    }

    try {
      console.log({ action: "load-am-story", id, found: "loading" });
      
      const { fantasMiaDB } = await import('@/utils/indexedDB');
      await fantasMiaDB.init();

      // Read from am_stories using direct IndexedDB access
      const transaction = fantasMiaDB['db']!.transaction(['am_stories'], 'readonly');
      const store = transaction.objectStore('am_stories');
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log({ action: "load-am-story", id, found: true, story: result });
          setStory(result);
          loadMediaAsset(id);
        } else {
          console.log({ action: "load-am-story", id, found: false });
          setStory(null);
        }
        setLoading(false);
      };

      request.onerror = () => {
        console.error('Error loading story:', request.error);
        console.log({ action: "load-am-story", id, found: false, error: request.error });
        setStory(null);
        setLoading(false);
      };
    } catch (error) {
      console.error('Error accessing IndexedDB:', error);
      console.log({ action: "load-am-story", id, found: false, error });
      setStory(null);
      setLoading(false);
    }
  };

  const loadMediaAsset = async (storyId: string) => {
    try {
      const { fantasMiaDB } = await import('@/utils/indexedDB');
      const asset = await fantasMiaDB.getMediaAssetByStoryId(storyId);
      if (asset && asset.data) {
        // Convert Blob to base64 for display
        const reader = new FileReader();
        reader.onload = () => {
          setMediaAsset(reader.result as string);
        };
        reader.readAsDataURL(asset.data);
      }
    } catch (error) {
      console.error('Error loading media asset:', error);
    }
  };

  const handleBack = () => {
    navigate('/user-archive');
  };

  const handleHome = () => {
    navigate('/profiles');
  };

  const handleReadStory = () => {
    if (!story) return;
    
    const textToRead = `${story.title || 'Storia senza titolo'}. ${story.text || 'Contenuto non disponibile'}`;
    
    if (isPlaying) {
      stop();
    } else {
      speak(textToRead);
    }
  };

  const handleMediaClick = () => {
    if (mediaAsset) {
      setShowImageViewer(true);
    }
  };

  // Get story title and text with fallbacks
  const storyTitle = story?.title || 'Storia senza titolo';
  const storyText = story?.text || 'Contenuto non disponibile';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center pt-20">Caricamento storia...</div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <ProfileIndicator />
        
        {/* Fixed Top Navigation Bar */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Indietro
            </Button>
            
            <h1 className="text-xl font-bold text-slate-800">Visualizza Storia</h1>
            
            <Button 
              variant="ghost" 
              onClick={handleHome}
              className="flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Home
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto pt-20 space-y-6">
          <Alert className="border-red-500 bg-red-50">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <div><strong>Storia non trovata in AM</strong></div>
                <div>ID: {id || 'non specificato'}</div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBack}
                  className="border-red-500 text-red-700 hover:bg-red-100"
                >
                  Torna a /user-archive
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <ProfileIndicator />
      
      {/* Fixed Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </Button>
          
          <h1 className="text-xl font-bold text-slate-800">Visualizza Storia</h1>
          
          <Button 
            variant="ghost" 
            onClick={handleHome}
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto pt-20 space-y-6">
        
        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            onClick={handleReadStory}
            className="flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            {isPlaying ? 'Stop' : 'Leggi'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleMediaClick}
            className="flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            MEDIA
          </Button>
        </div>

        {/* Story Content */}
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-slate-800">
              {storyTitle}
            </h1>
            
            <div className="max-h-96 overflow-y-auto">
              <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                {storyText}
              </p>
            </div>
            
            {/* Story Metadata */}
            <div className="mt-6 pt-6 border-t border-slate-200 text-sm text-slate-500">
              <div>Modalità: {story.mode}</div>
              <div>Creata: {new Date(story.createdAt).toLocaleString('it-IT')}</div>
              <div>ID: {story.id}</div>
            </div>
          </CardContent>
        </Card>

        {/* Media Status */}
        {!mediaAsset && (
          <div className="text-center text-slate-500 text-sm">
            Nessuna immagine associata
          </div>
        )}
      </div>

      {/* Image Viewer Dialog */}
      {showImageViewer && mediaAsset && (
        <ImageViewerDialog
          open={showImageViewer}
          onOpenChange={setShowImageViewer}
          imageUrl={mediaAsset}
          storyTitle={storyTitle}
          style="user-generated"
        />
      )}
    </div>
  );
};

export default UserStoryViewer;