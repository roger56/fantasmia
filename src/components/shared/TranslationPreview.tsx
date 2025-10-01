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
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col" aria-describedby="translation-preview-desc">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Anteprima Traduzione ({isToEnglish ? 'Inglese' : 'Italiano'})
          </DialogTitle>
          <DialogDescription id="translation-preview-desc">
            Confronta la versione originale con quella tradotta prima di salvare.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Original */}
          <div className="border rounded-lg p-4 flex flex-col min-h-0">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground flex-shrink-0">
              {isToEnglish ? 'Originale (Italiano)' : 'Originale (Inglese)'}
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="flex-shrink-0">
                <p className="font-medium text-sm mb-1">Titolo:</p>
                <div className="text-sm bg-muted p-2 rounded break-words">
                  {originalTitle}
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <p className="font-medium text-sm mb-1">Contenuto:</p>
                <div className="whitespace-pre-wrap break-words leading-relaxed min-h-[320px] max-h-[50vh] overflow-y-auto p-3 rounded-md border bg-muted">
                  {originalContent}
                </div>
              </div>
            </div>
          </div>

          {/* Translated */}
          <div className="border rounded-lg p-4 flex flex-col min-h-0">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground flex-shrink-0">
              {isToEnglish ? 'Tradotto (Inglese)' : 'Tradotto (Italiano)'}
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="flex-shrink-0">
                <p className="font-medium text-sm mb-1">Titolo:</p>
                <div className="text-sm bg-primary/10 p-2 rounded break-words">
                  {translatedTitle}
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <p className="font-medium text-sm mb-1">Contenuto:</p>
                <div className="whitespace-pre-wrap break-words leading-relaxed min-h-[320px] max-h-[50vh] overflow-y-auto p-3 rounded-md border bg-primary/10">
                  {translatedContent}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onCancel}>
            Mantieni Originale
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!translatedTitle || !translatedContent}
          >
            Salva Traduzione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TranslationPreview;