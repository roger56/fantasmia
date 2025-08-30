import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { X, Share2, Copy, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
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
    if (!imageUrl) return;
    
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

  const handleUploadImage = () => {
    // Solo per Superuser
    const isAuthenticated = localStorage.getItem('userType') === 'superuser';
    if (!isAuthenticated) {
      toast({
        title: "Accesso limitato",
        description: "Il caricamento da PC è disponibile solo per i Superuser",
        variant: "destructive"
      });
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Handle file upload logic here
        console.log('File selected:', file);
      }
    };
    input.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {/* No image case */}
        {!imageUrl && (
          <div className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">Nessuna immagine associata</h2>
            <p className="text-muted-foreground mb-6">
              Questa storia non ha ancora un'immagine associata. 
              Puoi caricarne una dal tuo computer o generarne una con l'intelligenza artificiale.
            </p>
            <div className="flex justify-center gap-4">
              {/* Check if user is superuser (authenticated) */}
              {(() => {
                const isAuthenticated = localStorage.getItem('userType') === 'superuser';
                return isAuthenticated && (
                  <Button
                    onClick={handleUploadImage}
                    className="mr-2"
                  >
                    Carica da PC
                  </Button>
                );
              })()}
              <Button
                onClick={() => {
                  // Qui andrà la logica per aprire il MediaButton per generazione AI
                  onClose();
                }}
                variant="outline"
              >
                Genera con AI
              </Button>
            </div>
          </div>
        )}

        {/* Image exists case */}
        {imageUrl && (
          <>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewModal;