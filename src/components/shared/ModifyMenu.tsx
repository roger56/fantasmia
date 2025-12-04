import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, ChevronDown, Sparkles, Loader2, Feather, Palette, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAILoading } from '@/hooks/useAILoading';
import { fantasMiaDB } from '@/utils/indexedDB';
import MediaGenerationDialog from './MediaGenerationDialog';
import ImageViewerDialog from './ImageViewerDialog';
import SketchGenerationDialog from './SketchGenerationDialog';
import { getStoryImage } from '@/utils/userStorage';
interface ModifyMenuProps {
  storyContent: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onContentChange?: (content: string) => void;
  storyTitle?: string;
  storyId?: string;
  className?: string;
  userRole?: 'superuser' | 'user' | 'Superuser';
  userId?: string;
  onMediaUpdate?: () => void;
  showEditButton?: boolean;
  onUploadClick?: () => void;
  onViewImageClick?: () => void;
}

const ModifyMenu: React.FC<ModifyMenuProps> = ({
  storyContent,
  isEditing,
  onEditToggle,
  onContentChange,
  storyTitle = '',
  storyId: propStoryId,
  className = "",
  userRole = 'user',
  userId,
  onMediaUpdate,
  showEditButton = true,
  onUploadClick,
  onViewImageClick
}) => {
  const { toast } = useToast();
  const { showLoading, hideLoading } = useAILoading();
  const { id: routeId } = useParams<{ id: string }>();
  
  // Dialog states
  const [showTextConfirm, setShowTextConfirm] = useState(false);
  const [showPoetryConfirm, setShowPoetryConfirm] = useState(false);
  const [showPoetryResult, setShowPoetryResult] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  
  // Style states
  const [selectedTextStyle, setSelectedTextStyle] = useState<"ironico" | "fantasy" | "semplice" | "fantasioso">("ironico");
  const [selectedPoetryStyle, setSelectedPoetryStyle] = useState<string>("lirica");
  const [selectedDrawingStyle, setSelectedDrawingStyle] = useState<string>("");
  const [showSketchDialog, setShowSketchDialog] = useState(false);
  const [selectedSketchLevel, setSelectedSketchLevel] = useState<1 | 2>(1);
  
  // Loading and result states
  const [isImproving, setIsImproving] = useState(false);
  const [isGeneratingPoetry, setIsGeneratingPoetry] = useState(false);
  const [improvedText, setImprovedText] = useState("");
  const [generatedPoetry, setGeneratedPoetry] = useState("");
  const [existingImage, setExistingImage] = useState<any>(null);

  useEffect(() => {
    const storyIdToUse = getReliableStoryId();
    if (storyIdToUse) {
      const image = getStoryImage(storyIdToUse);
      setExistingImage(image);
    }
  }, [propStoryId, routeId]);

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

  const handleDrawingClick = async (style: string) => {
    setSelectedDrawingStyle(style);
    const storyIdToUse = getReliableStoryId();
    
    if (!storyIdToUse) {
      toast({
        title: "Errore",
        description: "ID storia non valido"
      });
      return;
    }

    // Check if user owns this story
    try {
      const amStory = await fantasMiaDB.getAMStoryById(storyIdToUse);
      const agStory = !amStory ? await fantasMiaDB.getAGStoryById(storyIdToUse) : null;

      if (!amStory && !agStory) {
        toast({
          title: "Errore",
          description: "Storia non trovata"
        });
        return;
      }

      const isSuperuser = userRole === 'superuser' || userRole === 'Superuser';
      
      // For AG stories: ONLY superuser can generate drawings
      // For AM stories: owner OR superuser can generate drawings
      if (agStory) {
        // AG stories: only superuser
        if (isSuperuser) {
          setShowMediaDialog(true);
        } else {
          toast({
            title: "Accesso negato",
            description: "Solo il Superuser può generare disegni per le storie AG"
          });
        }
      } else if (amStory) {
        // AM stories: owner or superuser
        const ownsStory = amStory.ownerProfileId === userId;
        if (isSuperuser || ownsStory) {
          setShowMediaDialog(true);
        } else {
          toast({
            title: "Accesso negato",
            description: "Puoi generare disegni solo per le tue storie"
          });
        }
      }
    } catch (error) {
      console.error("Error checking story ownership:", error);
      toast({
        title: "Errore",
        description: "Impossibile verificare i permessi"
      });
    }
  };

  const handleSketchClick = async (level: 1 | 2) => {
    console.log("🖍️ handleSketchClick called with level:", level);
    setSelectedSketchLevel(level);
    const storyIdToUse = getReliableStoryId();
    console.log("🖍️ storyIdToUse:", storyIdToUse);
    
    if (!storyIdToUse) {
      toast({
        title: "Errore",
        description: "ID storia non valido"
      });
      return;
    }

    // Check permissions (same as handleDrawingClick)
    try {
      const amStory = await fantasMiaDB.getAMStoryById(storyIdToUse);
      const agStory = !amStory ? await fantasMiaDB.getAGStoryById(storyIdToUse) : null;
      console.log("🖍️ amStory:", !!amStory, "agStory:", !!agStory);

      if (!amStory && !agStory) {
        toast({
          title: "Errore",
          description: "Storia non trovata"
        });
        return;
      }

      const isSuperuser = userRole === 'superuser' || userRole === 'Superuser';
      console.log("🖍️ isSuperuser:", isSuperuser, "userRole:", userRole);
      
      if (agStory) {
        if (isSuperuser) {
          console.log("🖍️ Opening SketchDialog for AG story (superuser)");
          setShowSketchDialog(true);
        } else {
          toast({
            title: "Accesso negato",
            description: "Solo il Superuser può generare schizzi per le storie AG"
          });
        }
      } else if (amStory) {
        const ownsStory = amStory.ownerProfileId === userId;
        if (isSuperuser || ownsStory) {
          console.log("🖍️ Opening SketchDialog for AM story");
          setShowSketchDialog(true);
        } else {
          toast({
            title: "Accesso negato",
            description: "Puoi generare schizzi solo per le tue storie"
          });
        }
      }
    } catch (error) {
      console.error("Error checking story ownership:", error);
      toast({
        title: "Errore",
        description: "Impossibile verificare i permessi"
      });
    }
  };

  const handleViewImage = () => {
    if (onViewImageClick) {
      onViewImageClick();
    } else if (existingImage) {
      setShowImageViewer(true);
    } else {
      toast({
        title: "Nessuna immagine",
        description: "Non è presente alcuna immagine per questa storia"
      });
    }
  };

  const handleUploadClick = () => {
    if (onUploadClick) {
      onUploadClick();
    } else {
      toast({
        title: "Funzione non disponibile",
        description: "Upload non configurato"
      });
    }
  };

  const handleFilmClick = (type: string) => {
    toast({ 
      title: "In sviluppo", 
      description: `Funzione filmato ${type} in fase di sviluppo` 
    });
  };

  const handleVoiceClick = (type: string) => {
    toast({ 
      title: "In sviluppo", 
      description: `Funzione voce ${type} in fase di sviluppo` 
    });
  };

  const improveText = async () => {
    setShowTextConfirm(false);
    setIsImproving(true);
    showLoading("Miglioramento testo in corso...");

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
      let improved = data.improvedText || data.text || data.result;

      if (improved) {
        // Remove leading and trailing quotes/apostrophes
        improved = improved.trim().replace(/^["']|["']$/g, '');
        
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
      hideLoading();
    }
  };

  const confirmReplace = async () => {
    try {
      const storyIdToUse = getReliableStoryId();
      
      if (storyIdToUse) {
        // Try AM story first
        const existingAMStory = await fantasMiaDB.getAMStoryById(storyIdToUse);

        if (existingAMStory) {
          existingAMStory.text = improvedText;
          await fantasMiaDB.saveAMStory(existingAMStory);
        } else {
          // Try AG story
          const existingAGStory = await fantasMiaDB.getAGStoryById(storyIdToUse);
          
          if (existingAGStory) {
            existingAGStory.content = improvedText;
            existingAGStory.updated_at = new Date().toISOString();
            await fantasMiaDB.saveAGStory(existingAGStory);
          }
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
    showLoading("Generazione poesia in corso...");

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
      hideLoading();
    }
  };

  return (
    <TooltipProvider>
      <div className={className}>
        <div className="flex items-center gap-2">
          {/* Pulsante Modifica */}
          {showEditButton && (
            <Button variant="outline" size="sm" className="h-8" onClick={handleEditClick}>
              <Edit className="w-4 h-4 mr-1" />
              Modifica
            </Button>
          )}

          {/* Menu MEDIA(AI) unificato con submenu a due livelli */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Palette className="w-4 h-4 mr-1" />
                MEDIA(AI)
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[200px] bg-background border shadow-lg z-50" align="start">
              {/* Submenu DISEGNO */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  DISEGNO
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background border shadow-lg">
                  <DropdownMenuItem onClick={handleViewImage} className="cursor-pointer">
                    Vedi disegno associato
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDrawingClick("fumetto")} className="cursor-pointer">
                    Fumetto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDrawingClick("fotografico")} className="cursor-pointer">
                    Fotografico
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDrawingClick("astratto")} className="cursor-pointer">
                    Astratto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDrawingClick("manga")} className="cursor-pointer">
                    Manga
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDrawingClick("acquarello")} className="cursor-pointer">
                    Acquarello
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDrawingClick("carboncino")} className="cursor-pointer">
                    Carboncino
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Submenu Da colorare */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      <Pencil className="w-4 h-4 mr-2" />
                      Da colorare
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-background border shadow-lg">
                      <DropdownMenuItem onClick={() => handleSketchClick(1)} className="cursor-pointer">
                        Livello 1 - Linee spesse (semplice)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSketchClick(2)} className="cursor-pointer">
                        Livello 2 - Linee sottili (dettagliato)
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Submenu MIGLIORA TESTO */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  MIGLIORA TESTO
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
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Submenu POESIA con tooltip */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  POESIA
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background border shadow-lg">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={() => handlePoetryClick("lirica")} className="cursor-pointer">
                        Lirica
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Poesia emozionale, centrata sui sentimenti</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={() => handlePoetryClick("romantica")} className="cursor-pointer">
                        Romantica
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tema d'amore, tono dolce e ispirato</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={() => handlePoetryClick("epica")} className="cursor-pointer">
                        Epica
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stile narrativo eroico, avventura e grandezza</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={() => handlePoetryClick("sonetto")} className="cursor-pointer">
                        Sonetto
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Metrica classica con rime strutturate</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={() => handlePoetryClick("libera")} className="cursor-pointer">
                        Libera
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Versi senza schema fisso o rime</p>
                    </TooltipContent>
                  </Tooltip>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Submenu FILMATO */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  FILMATO
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background border shadow-lg">
                  <DropdownMenuItem onClick={() => handleFilmClick("futuristico")} className="cursor-pointer">
                    Futuristico
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilmClick("storico")} className="cursor-pointer">
                    Storico
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilmClick("oggi")} className="cursor-pointer">
                    Oggi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilmClick("fantasy")} className="cursor-pointer">
                    Fantasy
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Submenu VOCI */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  VOCI
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background border shadow-lg">
                  <DropdownMenuItem onClick={() => handleVoiceClick("uomo")} className="cursor-pointer">
                    Uomo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleVoiceClick("donna")} className="cursor-pointer">
                    Donna
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleVoiceClick("bambino")} className="cursor-pointer">
                    Bambino
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleVoiceClick("bambina")} className="cursor-pointer">
                    Bambina
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Carica da PC - solo per superuser */}
              {(userRole === 'superuser' || userRole === 'Superuser') && onUploadClick && (
                <>
                  <DropdownMenuItem onClick={handleUploadClick} className="cursor-pointer">
                    Carica da PC
                  </DropdownMenuItem>
                </>
              )}
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

      {/* Media Generation Dialog - available for story owners */}
      {getReliableStoryId() && (
        <>
          <MediaGenerationDialog
            open={showMediaDialog}
            onOpenChange={(open) => {
              setShowMediaDialog(open);
              if (!open) {
                setSelectedDrawingStyle(""); // Reset style when closing
                if (onMediaUpdate) {
                  onMediaUpdate();
                }
              }
            }}
            storyContent={storyContent}
            storyTitle={storyTitle}
            storyId={getReliableStoryId() || ''}
            userId={userId || (userRole === 'Superuser' ? 'Superuser' : 'superuser')}
            showTrigger={false}
            initialStyle={selectedDrawingStyle}
          />
          
          {existingImage && (
            <ImageViewerDialog
              open={showImageViewer}
              onOpenChange={setShowImageViewer}
              imageUrl={existingImage.imageUrl}
              storyTitle={storyTitle}
              style={existingImage.style}
            />
          )}
          
          {/* Sketch Generation Dialog */}
          <SketchGenerationDialog
            open={showSketchDialog}
            onOpenChange={(open) => {
              setShowSketchDialog(open);
              if (!open && onMediaUpdate) {
                onMediaUpdate();
              }
            }}
            storyContent={storyContent}
            storyTitle={storyTitle}
            storyId={getReliableStoryId() || ''}
            userId={userId || (userRole === 'Superuser' ? 'Superuser' : 'superuser')}
            initialDetailLevel={selectedSketchLevel}
            onSketchSaved={onMediaUpdate}
          />
        </>
      )}
      </div>
    </TooltipProvider>
  );
};

export default ModifyMenu;