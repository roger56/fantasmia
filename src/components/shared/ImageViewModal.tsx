import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { X, Share2, Copy, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  storyTitle?: string;
}

export const ImageViewModal: React.FC<ImageViewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  storyTitle
}) => {
  const { toast } = useToast();
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      // Check if browser supports clipboard write
      if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API non supportata');
      }
      
      // Fetch the image and convert to blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Impossibile scaricare l\'immagine');
      }
      
      const blob = await response.blob();
      
      // Create ClipboardItem with the image blob
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      
      toast({
        title: "Immagine copiata",
        description: "L'immagine è stata copiata negli appunti",
        variant: "default"
      });
      
      setShowShareMenu(false);
    } catch (error) {
      console.error('Errore nella copia:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile copiare l'immagine negli appunti",
        variant: "destructive"
      });
    }
  };

  const handleSendByEmail = () => {
    toast({
      title: "Funzione in sviluppo",
      description: "La funzione di invio via email sarà disponibile presto",
      variant: "default"
    });
    setShowShareMenu(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header with buttons */}
        <div className="flex justify-between items-center p-4 border-b bg-background">
          <h2 className="text-lg font-semibold">
            {storyTitle ? `Immagine - ${storyTitle}` : 'Visualizzazione Immagine'}
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Share button with dropdown */}
            <DropdownMenu open={showShareMenu} onOpenChange={setShowShareMenu}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Condividi
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyToClipboard} className="cursor-pointer">
                  <Copy className="w-4 h-4 mr-2" />
                  Copia immagine negli appunti
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendByEmail} className="cursor-pointer">
                  <Mail className="w-4 h-4 mr-2" />
                  Invia via mail
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Exit button */}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="flex-1 p-4 flex items-center justify-center bg-muted/10">
          <img
            src={imageUrl}
            alt="Immagine storia"
            className="max-w-full max-h-[calc(90vh-120px)] object-contain rounded-lg shadow-lg"
            onError={(e) => {
              console.error('Errore nel caricamento immagine:', e);
              toast({
                title: "Errore",
                description: "Impossibile caricare l'immagine",
                variant: "destructive"
              });
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewModal;