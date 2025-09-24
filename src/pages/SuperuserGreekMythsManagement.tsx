import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoryLayout from '@/components/shared/StoryLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Palette, Upload, Loader2 } from 'lucide-react';
import { fantasMiaDB } from '@/utils/indexedDB';
import MediaGenerationDialog from '@/components/shared/MediaGenerationDialog';
import FileUploadDialog from '@/components/shared/FileUploadDialog';

const SuperuserGreekMythsManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Titolo e contenuto sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await fantasMiaDB.init();
      
      const storyId = crypto.randomUUID();
      const story = {
        id: storyId,
        title: title.trim(),
        content: content.trim(),
        category: 'greek_myths' as const,
        created_by: 'superuser' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        has_image: hasImage
      };

      await fantasMiaDB.saveAGStory(story);
      
      toast({
        title: "Mito salvato",
        description: "Il mito greco è stato salvato con successo"
      });

      // Dispatch events for UI updates
      window.dispatchEvent(new CustomEvent('story:updated'));
      if (hasImage) {
        window.dispatchEvent(new CustomEvent('media:updated'));
      }

      // Navigate back
      navigate('/superuser-reading-stories-view');
      
    } catch (error) {
      console.error('Error saving greek myth:', error);
      toast({
        title: "Errore",
        description: "Errore nel salvataggio del mito",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrawingClick = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Salva prima il mito",
        description: "Inserisci titolo e contenuto prima di aggiungere un'immagine",
        variant: "destructive"
      });
      return;
    }

    // Create temporary story ID for image generation
    const tempStoryId = crypto.randomUUID();
    setCurrentStoryId(tempStoryId);
    setShowMediaDialog(true);
  };

  const handleUploadClick = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Salva prima il mito",
        description: "Inserisci titolo e contenuto prima di aggiungere un'immagine",
        variant: "destructive"
      });
      return;
    }

    const tempStoryId = crypto.randomUUID();
    setCurrentStoryId(tempStoryId);
    setShowUploadDialog(true);
  };

  const handleImageSaved = () => {
    setHasImage(true);
    toast({
      title: "Immagine aggiunta",
      description: "L'immagine è stata associata al mito"
    });
  };

  useEffect(() => {
    const handleMediaUpdate = () => {
      setHasImage(true);
    };

    window.addEventListener('media:updated', handleMediaUpdate);
    
    return () => {
      window.removeEventListener('media:updated', handleMediaUpdate);
    };
  }, []);

  return (
    <StoryLayout
      title="Aggiungi Mito Greco"
      subtitle="Area Superuser - Crea nuovo mito greco"
      onBack={() => navigate('/superuser-reading-stories-view')}
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titolo *
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Inserisci il titolo del mito greco..."
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Contenuto *
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Scrivi la narrazione del mito greco..."
                  rows={10}
                  className="w-full"
                />
              </div>

              {/* Drawing/Upload Section */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Immagine</h3>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleDrawingClick}
                    className="flex items-center gap-2"
                  >
                    <Palette className="w-4 h-4" />
                    Disegno (AI)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleUploadClick}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Carica da PC
                  </Button>
                </div>
                
                {hasImage && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ Immagine aggiunta al mito
                  </div>
                )}
              </div>

              {/* Preview Section */}
              {previewImageUrl && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Anteprima Immagine</h3>
                  <img 
                    src={previewImageUrl} 
                    alt="Preview" 
                    className="max-w-xs rounded border"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Conferma & Salva
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/superuser-reading-stories-view')}
                >
                  Annulla
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Media Generation Dialog */}
      {currentStoryId && (
        <MediaGenerationDialog
          open={showMediaDialog}
          onOpenChange={setShowMediaDialog}
          storyContent={content}
          storyTitle={title}
          storyId={currentStoryId}
          userId="superuser"
        />
      )}

      {/* File Upload Dialog */}
      {currentStoryId && (
        <FileUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          storyId={currentStoryId}
          storyTitle={title}
          userId="superuser"
        />
      )}
    </StoryLayout>
  );
};

export default SuperuserGreekMythsManagement;