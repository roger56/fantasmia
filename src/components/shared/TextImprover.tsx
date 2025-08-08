import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PenTool, Laugh, Wand2, Heart, Sparkles, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CopyrightWarningDialog from '@/components/shared/CopyrightWarningDialog';

interface TextImproverProps {
  storyContent: string;
  onContentChange: (newContent: string) => void;
  className?: string;
}

const TextImprover: React.FC<TextImproverProps> = ({
  storyContent,
  onContentChange,
  className = ""
}) => {
  const [isImproving, setIsImproving] = useState(false);
  const [improvedText, setImprovedText] = useState('');
  const [showImprovedText, setShowImprovedText] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCopyrightWarning, setShowCopyrightWarning] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('');
  const { toast } = useToast();

  const improveText = async (style: 'ironico' | 'fantasy' | 'semplice' | 'fantasioso') => {
    setSelectedStyle(style);
    setShowCopyrightWarning(true);
  };

  const handleProceedWithImprovement = async () => {
    setShowCopyrightWarning(false);
    setIsImproving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('improve-text', {
        body: {
          storyContent: storyContent,
          style: selectedStyle
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const improvedContent = response.data.improvedText;
      setImprovedText(improvedContent);
      setShowImprovedText(true);

      toast({
        title: "Testo migliorato",
        description: `Il testo è stato rielaborato in stile ${selectedStyle}`,
      });

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

  const handleReplace = () => {
    setShowReplaceDialog(true);
  };

  const confirmReplace = () => {
    onContentChange(improvedText);
    setShowImprovedText(false);
    setImprovedText('');
    setShowReplaceDialog(false);
    
    toast({
      title: "Testo sostituito",
      description: "La storia originale è stata sostituita con quella migliorata",
    });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setImprovedText('');
    setShowImprovedText(false);
    setShowDeleteDialog(false);
    
    toast({
      title: "Testo eliminato",
      description: "Il testo migliorato è stato eliminato",
    });
  };

  return (
    <TooltipProvider>
      <Card className={`mb-6 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PenTool className="w-5 h-5" />
            Migliora Testo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => improveText('ironico')}
                  disabled={isImproving}
                  className="w-full justify-start"
                >
                  <Laugh className="w-4 h-4 mr-2" />
                  Ironico
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rende la storia divertente e spiritosa</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => improveText('fantasy')}
                  disabled={isImproving}
                  className="w-full justify-start"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Fantasy
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Trasforma in un racconto fantasy epico</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => improveText('semplice')}
                  disabled={isImproving}
                  className="w-full justify-start"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Semplice
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rende il linguaggio semplice e adatto ai bambini</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => improveText('fantasioso')}
                  disabled={isImproving}
                  className="w-full justify-start"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Fantasioso
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Arricchisce con elementi creativi e coloriti</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {isImproving && (
            <div className="text-center text-muted-foreground">
              Miglioramento del testo in corso...
            </div>
          )}

          {showImprovedText && (
            <div className="mt-4 space-y-4">
              <h4 className="font-medium">Testo Migliorato:</h4>
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-48">
                    <div className="whitespace-pre-wrap text-sm">
                      {improvedText}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Elimina
                </Button>
                <Button
                  size="sm"
                  onClick={handleReplace}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Sostituisci
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

      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Sostituzione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler sostituire la storia originale con quella migliorata? 
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il testo migliorato?
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
    </TooltipProvider>
  );
};

export default TextImprover;