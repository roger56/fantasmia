import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, ChevronDown, Sparkles, Loader2, Feather } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fantasMiaDB } from '@/utils/indexedDB';

interface ModifyMenuProps {
  storyContent: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onContentChange?: (content: string) => void;
  storyTitle?: string;
  storyId?: string;
  className?: string;
}

const ModifyMenu: React.FC<ModifyMenuProps> = ({
  storyContent,
  isEditing,
  onEditToggle,
  onContentChange,
  storyTitle = '',
  storyId: propStoryId,
  className = ""
}) => {
  const { toast } = useToast();
  const { id: routeId } = useParams<{ id: string }>();
  
  // Dialog states
  const [showTextConfirm, setShowTextConfirm] = useState(false);
  const [showPoetryConfirm, setShowPoetryConfirm] = useState(false);
  const [showPoetryResult, setShowPoetryResult] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  
  // Style states
  const [selectedTextStyle, setSelectedTextStyle] = useState<"ironico" | "fantasy" | "semplice" | "fantasioso">("ironico");
  const [selectedPoetryStyle, setSelectedPoetryStyle] = useState<string>("lirica");
  
  // Loading and result states
  const [isImproving, setIsImproving] = useState(false);
  const [isGeneratingPoetry, setIsGeneratingPoetry] = useState(false);
  const [improvedText, setImprovedText] = useState("");
  const [generatedPoetry, setGeneratedPoetry] = useState("");

  const getReliableStoryId = (): string | null => {
    if (routeId) {
      const SID = String(routeId).trim();
      if (SID) return SID;
    }
    if (propStoryId) {
      const SID = String(propStoryId).trim();
      if (SID) return SID;
    }
    return null;
  };

  const handleEditClick = () => {
    onEditToggle();
  };

  const handleImproveTextClick = (style: "ironico" | "fantasy" | "semplice" | "fantasioso") => {
    setSelectedTextStyle(style);
    setShowTextConfirm(true);
  };

  const handlePoetryClick = (style: string) => {
    setSelectedPoetryStyle(style);
    setShowPoetryConfirm(true);
  };

  const improveText = async () => {
    setShowTextConfirm(false);
    setIsImproving(true);

    try {
      const apiUrl = import.meta.env.VITE_OPENAI_API_URL?.replace("/image", "/improve-text") || "https://fantasmia-ai.vercel.app/api/openai/improve-text";
      
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
          style: selectedTextStyle,
          language: "it",
          min_lines: 5,
          max_lines: 35,
          title: storyTitle,
          temperature: 0.7,
          user_id: "local-user",
        }),
        signal: controller.signal,
        mode: "cors",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI-IMPROVE: API error response:", errorText);
        throw new Error(`Errore API: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const improved = data.improvedText || data.text || data.result;

      if (improved) {
        setImprovedText(improved);
        setShowReplaceConfirm(true);
      } else {
        throw new Error("Nessun testo migliorato ricevuto");
      }
    } catch (error) {
      console.error("AI-IMPROVE: Error:", error);
      toast({
        title: "Errore",
        description: "Non è stato possibile migliorare il testo. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsImproving(false);
    }
  };

  const confirmReplace = async () => {
    try {
      const storyIdToUse = getReliableStoryId();
      
      if (storyIdToUse) {
        const existingStory = await fantasMiaDB.getAMStoryById(storyIdToUse);

        if (existingStory) {
          existingStory.text = improvedText;
          await fantasMiaDB.saveAMStory(existingStory);
        }
      }

      if (onContentChange) {
        onContentChange(improvedText);
      }

      toast({
        title: "Testo aggiornato",
        description: "Il testo è stato sostituito con la versione migliorata.",
      });

      setShowReplaceConfirm(false);
      setImprovedText("");
    } catch (error) {
      console.error("Error replacing text:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il testo migliorato.",
        variant: "destructive",
      });
    }
  };

  const generatePoetry = async () => {
    setShowPoetryConfirm(false);
    
    if (!storyContent || !storyContent.trim()) {
      toast({
        title: "Testo mancante",
        description: "Scrivi prima una storia per poter generare una poesia.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPoetry(true);

    try {
      const theme = storyTitle?.trim() ? `${storyTitle.trim()} – ${storyContent}` : storyContent;

      const response = await fetch("https://fantasmia-ai.vercel.app/api/openai/poetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme,
          style: selectedPoetryStyle,
        }),
      });

      if (!response.ok) {
        console.error("Poetry API HTTP error:", response.status, response.statusText);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.poetry) {
        setGeneratedPoetry(data.poetry);
        setShowPoetryResult(true);
        toast({
          title: "Successo",
          description: "Poesia generata con successo!",
        });
      } else {
        console.error("Poetry API: risposta senza poesia valida", data);
        throw new Error("Nessuna poesia ricevuta");
      }
    } catch (error) {
      console.error("Error generating poetry:", error);
      toast({
        title: "Errore",
        description: "Non è stato possibile generare la poesia. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPoetry(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {/* Pulsante Modifica */}
        <Button variant="outline" size="sm" className="h-8" onClick={handleEditClick}>
          <Edit className="w-4 h-4 mr-1" />
          Modifica
        </Button>

        {/* Menu AI con submenu a due livelli */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Sparkles className="w-4 h-4 mr-1" />
              AI
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[200px] bg-background border shadow-lg z-50" align="start">
            {/* Submenu Miglioramento testo */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                Miglioramento testo
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-background border shadow-lg">
                <DropdownMenuItem onClick={() => handleImproveTextClick("ironico")} className="cursor-pointer">
                  Ironico
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImproveTextClick("fantasy")} className="cursor-pointer">
                  Fantasy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImproveTextClick("semplice")} className="cursor-pointer">
                  Semplice e leggero
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImproveTextClick("fantasioso")} className="cursor-pointer">
                  Fantasioso
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Submenu Poesia */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                Poesia
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-background border shadow-lg">
                <DropdownMenuItem onClick={() => handlePoetryClick("lirica")} className="cursor-pointer">
                  Lirica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePoetryClick("romantica")} className="cursor-pointer">
                  Romantica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePoetryClick("epica")} className="cursor-pointer">
                  Epica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePoetryClick("sonetto")} className="cursor-pointer">
                  Sonetto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePoetryClick("libera")} className="cursor-pointer">
                  Libera
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialog: Conferma miglioramento testo */}
      <Dialog open={showTextConfirm} onOpenChange={setShowTextConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confermi miglioramento testo AI?</DialogTitle>
            <DialogDescription>
              Vuoi migliorare il testo nello stile "{selectedTextStyle}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTextConfirm(false)}>
              Annulla
            </Button>
            <Button onClick={improveText} disabled={isImproving}>
              {isImproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generazione...
                </>
              ) : (
                'Conferma'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Conferma sostituzione testo migliorato */}
      <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Testo migliorato pronto</AlertDialogTitle>
            <AlertDialogDescription>
              Vuoi sostituire il testo originale con quello migliorato?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ScrollArea className="max-h-64 w-full border rounded-md p-4 my-4">
            <div className="whitespace-pre-wrap text-sm">{improvedText}</div>
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setImprovedText(""); }}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplace}>
              Sostituisci
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Conferma generazione poesia */}
      <Dialog open={showPoetryConfirm} onOpenChange={setShowPoetryConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confermi generazione poesia?</DialogTitle>
            <DialogDescription>
              Vuoi generare una poesia in forma "{selectedPoetryStyle}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPoetryConfirm(false)}>
              Annulla
            </Button>
            <Button onClick={generatePoetry} disabled={isGeneratingPoetry}>
              {isGeneratingPoetry ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generazione...
                </>
              ) : (
                'Conferma'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Risultato poesia */}
      <Dialog open={showPoetryResult} onOpenChange={setShowPoetryResult}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Feather className="w-5 h-5" />
              Poesia generata - {selectedPoetryStyle.charAt(0).toUpperCase() + selectedPoetryStyle.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-64 w-full border rounded-md p-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed italic">{generatedPoetry}</div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPoetryResult(false); setGeneratedPoetry(""); }}>
              Chiudi
            </Button>
            <Button onClick={() => { setShowPoetryResult(false); setGeneratedPoetry(""); setShowPoetryConfirm(true); }}>
              <Feather className="w-4 h-4 mr-2" />
              Genera nuova
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModifyMenu;