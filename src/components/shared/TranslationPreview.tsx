import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Check, AlertTriangle } from 'lucide-react';

interface TranslationPreviewProps {
  isVisible: boolean;
  isTranslating: boolean;
  originalTitle: string;
  originalContent: string;
  translatedTitle: string;
  translatedContent: string;
  targetLanguage: 'italian' | 'english';
  onConfirm: () => void;
  onCancel: () => void;
}

const TranslationPreview: React.FC<TranslationPreviewProps> = ({
  isVisible,
  isTranslating,
  originalTitle,
  originalContent,
  translatedTitle,
  translatedContent,
  targetLanguage,
  onConfirm,
  onCancel
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              Anteprima traduzione in {targetLanguage === 'italian' ? 'Italiano' : 'Inglese'}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancel}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {targetLanguage === 'italian' 
                ? 'Permanent and irreversible operation. The current version will be replaced.'
                : 'Operazione permanente e irreversibile. La versione corrente sarà sostituita.'
              }
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isTranslating ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-600">Traduzione in corso...</p>
            </div>
          ) : (
            <>
              {/* Comparison View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    Versione originale ({targetLanguage === 'italian' ? 'Inglese' : 'Italiano'})
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Titolo:</label>
                      <div className="mt-1 p-3 bg-slate-50 rounded border text-sm">
                        {originalTitle}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Contenuto:</label>
                      <ScrollArea className="mt-1 h-48 p-3 bg-slate-50 rounded border">
                        <div className="text-sm whitespace-pre-wrap">
                          {originalContent}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
                
                {/* Translation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">
                    Traduzione ({targetLanguage === 'italian' ? 'Italiano' : 'Inglese'})
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Titolo:</label>
                      <div className="mt-1 p-3 bg-primary/5 rounded border-primary/20 border text-sm">
                        {translatedTitle}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Contenuto:</label>
                      <ScrollArea className="mt-1 h-48 w-full border border-primary/20 rounded bg-primary/5">
                        <div className="p-3 text-sm whitespace-pre-wrap">
                          {translatedContent || 'Traduzione in corso...'}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Annulla
                </Button>
                <Button 
                  onClick={onConfirm}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Conferma e salva traduzione
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationPreview;