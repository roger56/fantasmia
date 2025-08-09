import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sparkles, Loader2, RefreshCw, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CopyrightWarningDialog from './CopyrightWarningDialog';
import { useToast } from '@/hooks/use-toast';

interface TextImproverProps {
  storyContent: string;
  onContentChange: (newContent: string) => void;
  storyTitle?: string;
  className?: string;
}

const TextImprover: React.FC<TextImproverProps> = ({
  storyContent,
  onContentChange,
  storyTitle = '',
  className = ''
}) => {
  const [isImproving, setIsImproving] = useState(false);
  const [improvedText, setImprovedText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'ironico' | 'fantasy' | 'semplice' | 'fantasioso' | null>(null);
  const [showCopyrightWarning, setShowCopyrightWarning] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const styleOptions = [
    { value: 'ironico' as const, label: 'Ironico', description: 'Tono ironico e divertente' },
    { value: 'fantasy' as const, label: 'Fantasy', description: 'Stile fantasy e magico' },
    { value: 'semplice' as const, label: 'Semplice e leggero', description: 'Linguaggio semplice e scorrevole' },
    { value: 'fantasioso' as const, label: 'Fantasioso', description: 'Ricco di fantasia e creatività' }
  ];

  const improveText = (style: typeof selectedStyle) => {
    setSelectedStyle(style);
    setShowCopyrightWarning(true);
  };

  const handleProceedWithImprovement = async () => {
    if (!selectedStyle) return;
    
    setShowCopyrightWarning(false);
    setIsImproving(true);

    try {
      const { data, error } = await supabase.functions.invoke('improve-text', {
        body: {
          input_text: storyContent,
          style: selectedStyle,
          language: 'it',
          min_lines: 5,
          max_lines: 35,
          title: storyTitle,
          temperature: 0.7,
          seed: null,
          user_id: (await supabase.auth.getUser()).data.user?.id || 'anonymous'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.improvedText) {
        setImprovedText(data.improvedText);
        toast({
          title: "Successo",
          description: "Testo migliorato con successo!",
        });
      } else {
        throw new Error('Nessun testo migliorato ricevuto');
      }
    } catch (error) {
      console.error('Error improving text:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile migliorare il testo. Riprova più tardi.",
        variant: "destructive"
      });
    } finally {
      setIsImproving(false);
    }
  };

  const confirmReplace = () => {
    onContentChange(improvedText);
    setImprovedText('');
    setSelectedStyle(null);
    setShowReplaceConfirm(false);
    toast({
      title: "Successo",
      description: "Storia sostituita con il testo migliorato",
    });
  };

  const confirmDelete = () => {
    setImprovedText('');
    setSelectedStyle(null);
    setShowDeleteConfirm(false);
    toast({
      title: "Testo eliminato",
      description: "Il testo migliorato è stato eliminato",
    });
  };

  const handleChangeStyle = () => {
    setImprovedText('');
    setSelectedStyle(null);
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Migliora testo (AI)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!improvedText ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Seleziona uno stile per migliorare il tuo testo:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {styleOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    onClick={() => improveText(option.value)}
                    disabled={isImproving}
                    className="flex flex-col items-start p-4 h-auto text-left"
                  >
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </Button>
                ))}
              </div>
              
              {isImproving && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Migliorando il testo...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">Testo migliorato - Stile: {selectedStyle}</h4>
              </div>
              
              <ScrollArea className="h-64 w-full border rounded-md p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {improvedText}
                </div>
              </ScrollArea>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  onClick={() => setShowReplaceConfirm(true)}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Sostituisci storia originale
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleChangeStyle}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Cambia tipologia
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                  Elimina storia estesa
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CopyrightWarningDialog
        open={showCopyrightWarning}
        onOpenChange={setShowCopyrightWarning}
        onModify={() => setShowCopyrightWarning(false)}
        onProceed={handleProceedWithImprovement}
      />

      <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sostituisci storia originale</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler sostituire la storia originale con il testo migliorato? 
              La storia originale verrà eliminata e la nuova storia verrà salvata nell'archivio globale al posto della precedente.
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplace}>
              Sostituisci
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina testo migliorato</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il testo migliorato? La storia originale rimarrà invariata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TextImprover;