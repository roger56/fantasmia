import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Home, Volume2, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { AMStory, fantasMiaDB } from '@/utils/indexedDB';
import { useTTS } from '@/hooks/useTTS';
import { useTranslation } from '@/hooks/useTranslation';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import ImageViewerDialog from '@/components/shared/ImageViewerDialog';
import ShareMenu from '@/components/shared/ShareMenu';
import MediaMenu from '@/components/shared/MediaMenu';
import ModifyMenu from '@/components/shared/ModifyMenu';
import EditTextDialog from '@/components/shared/EditTextDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const SuperuserUserStoryViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<AMStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaAsset, setMediaAsset] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { speak, stop, isPlaying, getButtonText } = useTTS();
  const { translateContent, getButtonText: getTranslationButtonText, getCurrentLanguage, isTranslating } = useTranslation();
  const { toast } = useToast();

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
      
      await fantasMiaDB.init();
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
      const asset = await fantasMiaDB.getLatestMediaAssetByStoryId(storyId);
      if (asset && asset.data) {
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
    navigate('/superuser-am-archive');
  };

  const handleHome = () => {
    navigate('/superuser');
  };

  const handleReadStory = () => {
    if (!story) return;
    
    const textToRead = `${story.title || 'Storia senza titolo'}. ${story.text || 'Contenuto non disponibile'}`;
    
    if (isPlaying) {
      stop();
    } else {
      speak(textToRead, getCurrentLanguage());
    }
  };

  const handleTranslate = async () => {
    if (!story) return;
    
    await translateContent(
      story.text || '',
      story.title || '',
      (newContent) => {
        setStory(prev => prev ? { ...prev, text: newContent } : null);
      },
      (newTitle) => {
        setStory(prev => prev ? { ...prev, title: newTitle } : null);
      }
    );
  };

  const handleMediaClick = () => {
    if (mediaAsset) {
      setShowImageViewer(true);
    } else {
      toast({
        title: "Nessuna immagine associata",
        description: "Non ci sono immagini associate a questa storia",
        variant: "default"
      });
    }
  };

  const handleMediaUpdate = () => {
    // Reload media asset after update
    if (id) {
      loadMediaAsset(id);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await fantasMiaDB.deleteAMStory(id);
      // Also delete associated media
      const mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(id);
      if (mediaAsset) {
        await fantasMiaDB.deleteMediaAsset(mediaAsset.id);
      }
      
      toast({
        title: "Storia eliminata",
        description: "La storia è stata eliminata con successo"
      });
      
      handleBack();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione",
        variant: "destructive"
      });
    }
  };

  const handleSaveText = async (newText: string) => {
    if (!story || !id) return;
    
    try {
      const updatedStory = { ...story, text: newText };
      await fantasMiaDB.saveAMStory(updatedStory);
      setStory(updatedStory);
      
      // Emit update event for real-time UI updates
      window.dispatchEvent(new CustomEvent('am-story-updated', { 
        detail: { storyId: story.id, action: 'modified' } 
      }));
      
      toast({
        title: "Testo salvato",
        description: "Le modifiche sono state salvate con successo"
      });
    } catch (error) {
      console.error('Error saving story:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio",
        variant: "destructive"
      });
    }
  };

  const handleContentChange = (content: string) => {
    setStory(prev => prev ? { ...prev, text: content } : null);
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
            
            <h1 className="text-xl font-bold text-slate-800">Superuser - Storia AM</h1>
            
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
                  Torna a /superuser-am-archive
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
          
          <h1 className="text-xl font-bold text-slate-800">Superuser - Storia AM</h1>
          
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
        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            variant="outline"
            onClick={handleReadStory}
            className="flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            {getButtonText()}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleTranslate}
            disabled={isTranslating}
            className="flex items-center gap-2"
          >
            {getTranslationButtonText()}
          </Button>
          
          <ShareMenu 
            storyContent={storyText}
            storyTitle={storyTitle}
          />
          
          <MediaMenu
            storyId={id!}
            storyTitle={storyTitle}
            storyContent={storyText}
            isSuperuser={true}
            onMediaUpdate={handleMediaUpdate}
          />

          <Button
            variant="outline"
            onClick={() => setShowEditDialog(true)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifica
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Elimina
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                <AlertDialogDescription>
                  Sei sicuro di voler eliminare questa storia? Questa azione non può essere annullata.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Story Content */}
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-slate-800">
              {storyTitle}
            </h1>
            
            <ScrollArea className="max-h-96">
              <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                {storyText}
              </p>
            </ScrollArea>
            
            {/* Poetry section if available */}
            {story?.poem && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h2 className="text-xl font-semibold mb-4 text-slate-800">
                  Poesia ispirata alla storia
                </h2>
                <ScrollArea className="max-h-48">
                  <p className="text-base leading-relaxed text-slate-600 whitespace-pre-wrap italic">
                    {story.poem}
                  </p>
                </ScrollArea>
              </div>
            )}
            
            {/* Story Metadata */}
            <div className="mt-6 pt-6 border-t border-slate-200 text-sm text-slate-500">
              <div>Modalità: {story.mode}</div>
              <div>Creata: {new Date(story.createdAt).toLocaleString('it-IT')}</div>
              <div>ID: {story.id}</div>
              <div>Proprietario: {story.ownerProfileId}</div>
            </div>
          </CardContent>
        </Card>

        {/* Modify Menu */}
        <ModifyMenu
          storyContent={storyText}
          storyTitle={storyTitle}
          isEditing={false}
          onEditToggle={() => setShowEditDialog(true)}
          onContentChange={handleContentChange}
        />

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

      {/* Edit Text Dialog */}
      <EditTextDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        initialText={storyText}
        onSave={handleSaveText}
        title="Modifica Testo Storia"
      />
    </div>
  );
};

export default SuperuserUserStoryViewer;