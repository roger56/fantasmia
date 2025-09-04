import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  storyTitle: string;
  style: string;
}

const ImageViewerDialog: React.FC<ImageViewerDialogProps> = ({
  open,
  onOpenChange,
  imageUrl,
  storyTitle,
  style
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${storyTitle}-${style}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Immagine della Storia</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <img 
              src={imageUrl} 
              alt={`Immagine per ${storyTitle}`}
              className="max-w-full h-auto rounded-lg border"
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Stile: {style}
            </p>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Scarica
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewerDialog;