import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sparkles, Loader2, RefreshCw, X, Check } from 'lucide-react';
import CopyrightWarningDialog from './CopyrightWarningDialog';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';

interface TextImproverProps {
  storyContent: string;
  onContentChange: (newContent: string) => void;
  storyTitle?: string;
  onSave?: (content: string, title: string) => void;
  storyId?: string;
  className?: string;
}

const TextImprover: React.FC<TextImproverProps> = ({
  storyContent,
  onContentChange,
  storyTitle = '',
  onSave,
  storyId: propStoryId,
  className = ''
}) => {
  const [isImproving, setIsImproving] = useState(false);
  const [improvedText, setImprovedText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'ironico' | 'fantasy' | 'semplice' | 'fantasioso' | null>(null);
  const [showCopyrightWarning, setShowCopyrightWarning] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const { id: routeId } = useParams<{ id: string }>();

  // Reliable storyId getter following the requirements
  const getReliableStoryId = (): string | null => {
    // a) dal param del route (/story/[id])
    if (routeId) {
      const SID = String(routeId).trim();
      if (SID) return SID;
    }
    
    // b) dal prop storyId (props.story?.id)
    if (propStoryId) {
      const SID = String(propStoryId).trim();
      if (SID) return SID;
    }
    
    // c) dallo stato globale (currentStoryId) - TODO: implement if needed
    // For now, return null if neither route nor prop provided
    return null;
  };

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
      console.log('AI-IMPROVE: Starting text improvement with style:', selectedStyle);
      
      const apiUrl = import.meta.env.VITE_OPENAI_API_URL?.replace('/image', '/improve-text') 
        || "https://fantasmia-ai.vercel.app/api/openai/improve-text";
      
      console.log('AI-IMPROVE: Calling endpoint:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          input_text: storyContent,
          style: selectedStyle,
          language: 'it',
          min_lines: 5,
          max_lines: 35,
          title: storyTitle,
          temperature: 0.7,
          user_id: 'local-user'
        }),
        signal: controller.signal,
        mode: "cors",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI-IMPROVE: API error response:', errorText);
        throw new Error(`Errore API: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('AI-IMPROVE: Response received:', data);
      
      const improved = data.improvedText || data.text || data.result;
      
      if (improved) {
        setImprovedText(improved);
        toast({
          title: "Successo",
          description: "Testo migliorato con successo!",
        });
      } else {
        console.error('AI-IMPROVE: No improved text in response:', data);
        throw new Error('Nessun testo migliorato ricevuto dalla risposta');
      }
    } catch (error) {
      console.error('AI-IMPROVE: Error improving text:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante il miglioramento del testo",
        variant: "destructive"
      });
    } finally {
      setIsImproving(false);
    }
  };

  const confirmReplace = async () => {
    const SID = getReliableStoryId();
    
    // Requirement 1: Validate storyId
    if (!SID) {
      toast({
        title: "Errore: storia non selezionata",
        description: "Impossibile salvare il testo migliorato senza un ID storia valido",
        variant: "destructive"
      });
      return; // ABORT
    }
    
    // Requirement 4: Telemetry before save
    console.info('AI-IMPROVE: save-start', { 
      storyId: SID, 
      titleLen: storyTitle?.length, 
      contentLen: improvedText?.length 
    });
    
    try {
      // Requirement 2: Atomic update in IndexedDB
      await fantasMiaDB.init();
      
      return new Promise<void>((resolve, reject) => {
        const tx = fantasMiaDB['db']!.transaction(['am_stories'], 'readwrite');
        const store = tx.objectStore('am_stories');
        const getRequest = store.get(SID);
        
        getRequest.onsuccess = () => {
          const currentStory = getRequest.result;
          
          if (!currentStory) {
            // Story not found in AM
            toast({
              title: "Storia non trovata (AM)",
              description: "La storia non è stata trovata nell'archivio utente",
              variant: "destructive"
            });
            reject(new Error('Story not found in AM store'));
            return; // ABORT
          }
          
          // Extract title if it was improved (first line detection)
          const lines = improvedText.split('\n');
          const firstLine = lines[0]?.trim();
          let newTitle = currentStory.title;
          let newContent = improvedText;
          
          // Check if first line looks like a title
          if (firstLine && firstLine.length < 100 && !firstLine.includes('.') && firstLine !== currentStory.title) {
            newTitle = firstLine;
            newContent = lines.slice(1).join('\n').trim(); // Remove title from content
          }
          
          // Update story fields (keeping invariant fields)
          const updatedStory = {
            ...currentStory,
            title: newTitle,
            text: newContent,
            content: newContent, // Fallback field name
            updatedAt: new Date().toISOString()
            // Keep invariant: id, ownerProfileId, createdAt, media fields
          };
          
          // Atomic put operation
          const putRequest = store.put(updatedStory);
          
          putRequest.onsuccess = () => {
            // Requirement 4: Telemetry after save
            console.info('AI-IMPROVE: save-done', { storyId: SID });
            
            // Requirement 3: UI refresh event
            window.dispatchEvent(new CustomEvent('story:updated', { 
              detail: { storyId: SID } 
            }));
            
            // Update local UI immediately
            onContentChange(newContent);
            
            toast({
              title: "Successo",
              description: "Storia sostituita con il testo migliorato e salvata nell'archivio",
            });
            
            setImprovedText('');
            setSelectedStyle(null);
            setShowReplaceConfirm(false);
            
            resolve();
          };
          
          putRequest.onerror = () => {
            console.error('❌ AI-IMPROVE: IndexedDB put failed:', putRequest.error);
            toast({
              title: "Errore",
              description: "Errore nel salvare la storia nell'archivio",
              variant: "destructive"
            });
            reject(putRequest.error);
          };
        };
        
        getRequest.onerror = () => {
          console.error('❌ AI-IMPROVE: IndexedDB get failed:', getRequest.error);
          toast({
            title: "Errore",
            description: "Errore nel caricare la storia per l'aggiornamento",
            variant: "destructive"
          });
          reject(getRequest.error);
        };
        
        tx.onerror = () => {
          console.error('❌ AI-IMPROVE: Transaction failed:', tx.error);
          reject(tx.error);
        };
      });
      
    } catch (error) {
      console.error('❌ AI-IMPROVE: General error:', error);
      toast({
        title: "Errore",
        description: "Errore nel salvare la storia nell'archivio",
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(improvedText, storyTitle);
      toast({
        title: "Successo",
        description: "Storia estesa salvata con successo",
      });
    }
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
                {onSave && (
                  <Button
                    variant="default"
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    Salva
                  </Button>
                )}
                
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
        onConfirm={handleProceedWithImprovement}
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