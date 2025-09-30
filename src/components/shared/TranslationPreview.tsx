import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe } from 'lucide-react';

interface TranslationPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalTitle: string;
  originalContent: string;
  translatedTitle: string;
  translatedContent: string;
  language: 'italian' | 'english';
  onConfirm: () => void;
  onCancel: () => void;
}

const TranslationPreview: React.FC<TranslationPreviewProps> = ({
  open,
  onOpenChange,
  originalTitle,
  originalContent,
  translatedTitle,
  translatedContent,
  language,
  onConfirm,
  onCancel
}) => {
  const isToEnglish = language === 'english';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]" aria-describedby="translation-preview-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Anteprima Traduzione ({isToEnglish ? 'Inglese' : 'Italiano'})
          </DialogTitle>
        </DialogHeader>
        <DialogDescription id="translation-preview-desc">
          Confronta la versione originale con quella tradotta prima di salvare.
        </DialogDescription>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[60vh]">
          {/* Original */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
              {isToEnglish ? 'Originale (Italiano)' : 'Originale (Inglese)'}
            </h3>
            <ScrollArea className="h-full">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm mb-1">Titolo:</p>
                  <p className="text-sm bg-muted p-2 rounded">{originalTitle}</p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Contenuto:</p>
                  <div className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">
                    {originalContent}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Translated */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
              {isToEnglish ? 'Tradotto (Inglese)' : 'Tradotto (Italiano)'}
            </h3>
            <ScrollArea className="h-full">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm mb-1">Titolo:</p>
                  <p className="text-sm bg-primary/10 p-2 rounded">{translatedTitle}</p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Contenuto:</p>
                  <div className="text-sm bg-primary/10 p-2 rounded whitespace-pre-wrap">
                    {translatedContent}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Mantieni Originale
          </Button>
          <Button onClick={onConfirm}>
            Salva Traduzione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TranslationPreview;