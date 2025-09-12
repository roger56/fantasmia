import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyTitle: string;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onOpenChange,
  storyId,
  storyTitle
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      toast({
        title: "File non valido",
        description: "Seleziona un file immagine valido",
        variant: "destructive"
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Save to IndexedDB
      const mediaAsset = {
        id: `${storyId}-upload-${Date.now()}`,
        storyId,
        story_id: storyId, // legacy field
        type: 'image' as const,
        source: 'upload' as const,
        data: selectedFile,
        metadata: { filename: selectedFile.name, content_type: selectedFile.type, size: selectedFile.size },
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString() // legacy field
      };

      await fantasMiaDB.saveMediaAsset(mediaAsset);
      await fantasMiaDB.updateStoryImageStatus(storyId, 'am', true);
      
      // Emit event for UI synchronization
      window.dispatchEvent(new CustomEvent('am-story-updated', { 
        detail: { storyId, hasImage: true } 
      }));

      toast({
        title: "Immagine caricata!",
        description: "L'immagine è stata associata alla storia"
      });
      
      onOpenChange(false);
      resetDialog();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Errore",
        description: "Errore durante il caricamento dell'immagine",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setIsUploading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Carica Immagine da PC</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Seleziona immagine</Label>
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-2"
            />
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label>Anteprima</Label>
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Anteprima" 
                  className="max-w-full h-auto rounded-lg border max-h-48 object-contain"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl('');
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Caricando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Carica
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;