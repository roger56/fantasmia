import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
  userId: string;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onOpenChange,
  storyId,
  storyTitle,
  userId
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
      // Use the common media pipeline
      await fantasMiaDB.saveMediaFromPreview({
        storyId,
        ownerProfileId: userId,
        previewUrl: previewUrl,
        type: 'image',
        source: 'upload',
        filename: selectedFile.name
      });

      // Event is emitted automatically by saveMediaFromPreview

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
      <DialogContent className="max-w-md" aria-describedby="dlg-desc-file-upload">
        <DialogHeader>
          <DialogTitle>Carica Immagine da PC</DialogTitle>
        </DialogHeader>
        <DialogDescription id="dlg-desc-file-upload">
          Seleziona e carica un'immagine dal tuo dispositivo per associarla alla storia.
        </DialogDescription>

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