/**
 * Overlay per "Conosci la parola?"
 * Mostra la parola e chiede se l'utente la conosce
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, Check, X } from 'lucide-react';

interface ConosciLaParolaOverlayProps {
  isOpen: boolean;
  word: string;
  definition: string;
  showDefinition: boolean;
  onYes: () => void;
  onNo: () => void;
  onClose: () => void;
}

const ConosciLaParolaOverlay: React.FC<ConosciLaParolaOverlayProps> = ({
  isOpen,
  word,
  definition,
  showDefinition,
  onYes,
  onNo,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-6 h-6 text-primary" />
            Conosci la parola?
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          {/* Word Display */}
          <div className="text-center mb-6">
            <p className="text-lg text-muted-foreground mb-2">
              Conosci la parola...
            </p>
            <p className="text-3xl font-bold text-primary uppercase tracking-wide">
              "{word}"
            </p>
          </div>
          
          {/* Definition (shown after clicking NO) */}
          {showDefinition && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 animate-fade-in">
              <p className="text-sm text-muted-foreground mb-1">Definizione:</p>
              <p className="text-foreground font-medium">
                {definition}
              </p>
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex justify-center gap-4">
            {!showDefinition ? (
              <>
                <Button
                  variant="default"
                  size="lg"
                  onClick={onYes}
                  className="min-w-24 gap-2"
                >
                  <Check className="w-5 h-5" />
                  SÌ
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onNo}
                  className="min-w-24 gap-2"
                >
                  <X className="w-5 h-5" />
                  NO
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="lg"
                onClick={onClose}
                className="min-w-32"
              >
                Ho capito!
              </Button>
            )}
          </div>
        </div>
        
        <DialogDescription className="text-center text-xs text-muted-foreground">
          Ogni giorno una nuova parola da scoprire
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default ConosciLaParolaOverlay;
