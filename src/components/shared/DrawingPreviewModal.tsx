import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DrawingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  storyTitle: string;
  storyId: string;
  onAccept: (imageUrl: string) => void;
  onRegenerate: () => void;
  isGenerating?: boolean;
}

export const DrawingPreviewModal: React.FC<DrawingPreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  storyTitle,
  storyId,
  onAccept,
  onRegenerate,
  isGenerating = false
}) => {
  const { toast } = useToast();

  const handleAccept = () => {
    if (imageUrl) {
      onAccept(imageUrl);
      toast({
        title: "Disegno accettato",
        description: "Il disegno è stato associato alla storia",
        variant: "default"
      });
      onClose();
    }
  };

  const handleReject = () => {
    onClose();
  };

  const handleRegenerate = () => {
    onRegenerate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-lg">
            Anteprima Disegno - {storyTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Generazione del disegno in corso...</p>
            </div>
          ) : imageUrl ? (
            <>
              {/* Image container */}
              <div className="flex items-center justify-center bg-muted/10 rounded-lg p-4 mb-6">
                <img
                  src={imageUrl}
                  alt="Anteprima disegno"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('Errore nel caricamento immagine:', e);
                  }}
                />
              </div>

              {/* Instructions */}
              <div className="text-center mb-6">
                <p className="text-muted-foreground mb-2">
                  Ti piace questo disegno? Puoi accettarlo per associarlo alla storia o rigenerarne uno nuovo.
                </p>
                <p className="text-sm text-amber-600 font-medium">
                  ⚠️ Una volta accettato, non sarà possibile richiedere un nuovo disegno per questa storia.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Rigenera
                </Button>
                
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Chiudi
                </Button>

                <Button
                  onClick={handleAccept}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Accetta e Associa
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Errore nel caricamento del disegno</p>
              <Button onClick={onClose} className="mt-4">
                Chiudi
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DrawingPreviewModal;