import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  storyTitle: string;
  onImageUploaded: (imageUrl: string) => void;
  onAIGeneration: () => void;
}

export const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({
  isOpen,
  onClose,
  storyId,
  storyTitle,
  onImageUploaded,
  onAIGeneration
}) => {
  const { toast } = useToast();

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Save directly to fantasmiaDB
          const { fantasmiaDB } = await import('@/utils/imageStorage');
          await fantasmiaDB.saveImage(storyId, file);
          
          const imageUrl = URL.createObjectURL(file);
          onImageUploaded(imageUrl);
          
          toast({
            title: "Immagine caricata",
            description: "L'immagine è stata associata alla storia con successo",
            variant: "default"
          });
          
          onClose();
        } catch (error) {
          console.error('Error uploading image:', error);
          toast({
            title: "Errore",
            description: "Impossibile caricare l'immagine",
            variant: "destructive"
          });
        }
      }
    };
    input.click();
  };

  const handleAIGeneration = () => {
    console.log('AI generation clicked for story:', storyId);
    onAIGeneration();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crea immagine per la storia</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Scegli come associare un'immagine a questa storia:
          </p>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleAIGeneration}
              className="flex items-center gap-2 h-12"
              variant="default"
            >
              <Sparkles className="w-5 h-5" />
              Crea immagine con AI
            </Button>
            
            <Button
              onClick={handleFileUpload}
              className="flex items-center gap-2 h-12"
              variant="outline"
            >
              <Upload className="w-5 h-5" />
              Carica immagine da PC
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadDialog;