import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Palette, Loader2, Download, Bug, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CLOUD_ENABLED } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthBridge } from "@/utils/authBridge";
import CopyrightWarningDialog from "./CopyrightWarningDialog";

export interface MediaButtonProps {
  storyContent: string;
  storyTitle?: string;
  storyId?: string;
  className?: string;
  userId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MediaButton: React.FC<MediaButtonProps> = ({
  storyContent,
  storyTitle,
  storyId,
  className = "",
  userId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [userComment, setUserComment] = useState("");
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showCopyrightWarning, setShowCopyrightWarning] = useState(false);
  const [showStyleSelection, setShowStyleSelection] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Sync external open state with internal state
  useEffect(() => {
    if (externalOpen !== undefined && externalOpen === true) {
      // When externally opened, trigger the style selection dialog first
      setShowStyleSelection(true);
    } else if (externalOpen === false) {
      // When externally closed, reset all dialogs
      setShowStyleSelection(false);
      setShowCopyrightWarning(false);
      setShowCommentDialog(false);
      setShowImageDialog(false);
      setShowAuthWarning(false);
    }
  }, [externalOpen]);

  // Helper functions to handle dialog state changes with external callback
  const handleCloseDialog = (setterFn: (value: boolean) => void, value: boolean) => {
    setterFn(value);
    if (!value && externalOnOpenChange) {
      externalOnOpenChange(false);
    }
  };

  // Handler for style selection from external trigger
  const handleStyleSelected = (style: string) => {
    setSelectedStyle(style.toLowerCase());
    setShowStyleSelection(false);
    setShowCopyrightWarning(true);
  };

  // Reset state when story changes
  useEffect(() => {
    console.log("MediaButton: Story changed, resetting state");
    console.log("MediaButton: New storyId:", storyId);
    console.log("MediaButton: New storyContent preview:", storyContent?.substring(0, 100) + "...");

    setUserComment("");
    setDebugInfo(null);
    setGeneratedImage(null);
    setShowImageDialog(false);
  }, [storyContent, storyId]);

  // Check if user is in Superuser mode and authentication status
  useEffect(() => {
    const currentPath = window.location.pathname;
    setIsDebugMode(currentPath.includes("superuser"));

    // Check authentication status using AuthBridge
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      setIsAuthenticated(authStatus.authenticated);
      setCurrentUserId(authStatus.userId || null);
    };

    checkAuth();

    // Listen for auth changes using localStorage events (AuthBridge compatibility)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "fantasmia_user") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleMediaAction = async (type: string, subtype: string) => {
    // Check if user is authenticated using AuthBridge
    const authStatus = await AuthBridge.isAuthenticated();
    if (!authStatus.authenticated) {
      setShowAuthWarning(true);
      return;
    }

    if (type === "Disegno") {
      setSelectedStyle(subtype.toLowerCase());
      setShowCopyrightWarning(true);
    } else {
      toast({
        title: "Funzione in sviluppo",
        description: `${type} - ${subtype} sarà presto disponibile`,
        variant: "default",
      });
    }
  };

  const handleGenerateWithComment = async () => {
    setShowCommentDialog(false);
    await handleImageGeneration(selectedStyle);
  };

  const handleCopyrightModify = () => {
    setShowCopyrightWarning(false);
    externalOnOpenChange?.(false);
  };

  const handleCopyrightProceed = () => {
    setShowCopyrightWarning(false);
    setShowCommentDialog(true);
  };

  // Handler specifico per copyright warning che NON chiude il dialog parent
  const handleCopyrightWarningChange = (open: boolean) => {
    setShowCopyrightWarning(open);
    // NON chiamare externalOnOpenChange per permettere il passaggio al comment dialog
  };

  const handleImageGeneration = async (style: string) => {
    try {
      console.log("🚀 Starting image generation...");
      setIsGenerating(true);

      // Validation before sending
      if (!storyContent || storyContent.trim().length === 0) {
        console.error("❌ No story content available for image generation");
        toast({
          title: "Errore",
          description: "Nessun contenuto della storia disponibile",
          variant: "destructive",
        });
        return;
      }

      // Use userId prop or get from state (set by AuthBridge)
      const userIdToUse = userId || currentUserId;
      if (!userIdToUse) {
        throw new Error("User ID is required");
      }

      // Create enhanced prompt with user comment and NO TEXT policy
      const noTextPolicy = "IMPORTANTE: L'immagine non deve contenere testi, parole, scritte o frasi visibili di alcun tipo.";
      const enhancedPrompt = userComment 
        ? `${storyContent}\n\nNote aggiuntive: ${userComment}\n\n${noTextPolicy}` 
        : `${storyContent}\n\n${noTextPolicy}`;

      const requestBody = {
        prompt: enhancedPrompt,
        style: style,
      };

      console.log("🔍 Current state:", {
        prompt: enhancedPrompt.substring(0, 100) + "...",
        style: style,
        storyId: storyId,
        isGenerating: isGenerating,
      });

      console.log("📤 Sending request to API:", requestBody);

      if (!enhancedPrompt || !enhancedPrompt.trim()) {
        console.error("❌ Prompt is empty!");
        toast({
          title: "Errore",
          description: "Inserisci un prompt valido",
          variant: "destructive",
        });
        return;
      }

      if (!style) {
        console.error("❌ No style selected!");
        toast({
          title: "Errore",
          description: "Seleziona uno stile",
          variant: "destructive",
        });
        return;
      }

      // Show informative message during generation
      toast({
        title: "Generazione in corso...",
        description: "Sto creando l'immagine. Attendere circa 10-15 secondi.",
        variant: "default",
      });

      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondi

      // CHIAMATA API VERCEL
      // CHIAMATA API VERCEL - usando variabile d'ambiente
      const openAiImageUrl = import.meta.env.VITE_OPENAI_API_URL || "https://fantasmia-ai.vercel.app/api/openai/image";
      const response = await fetch(openAiImageUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        mode: "cors",
      });

      clearTimeout(timeoutId);

      console.log("📥 Response status:", response.status);
      console.log("📋 Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ HTTP error:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ API response received:", {
        keys: Object.keys(data),
        hasImageBase64: !!data.image_base64,
        imageBase64Length: data.image_base64?.length,
        hasImageUrl: !!data.image_url,
        style: data.style,
        error: data.error,
      });

      // Store debug information for Superuser mode
      if (isDebugMode) {
        setDebugInfo(
          JSON.stringify(
            {
              response: data,
              prompt: enhancedPrompt.substring(0, 200) + "...",
              style: style,
              timestamp: new Date().toISOString(),
              statusCode: response.status,
            },
            null,
            2,
          ),
        );
      }

      // Gestione della risposta - PRIMA base64, POI url come fallback
      if (data.image_base64) {
        console.log("🎨 Creating image from base64...");
        const base64Image = `data:image/png;base64,${data.image_base64}`;
        setGeneratedImage(base64Image);
        setShowImageDialog(true);
        setUserComment(""); // Reset comment after generation
        console.log("✅ Image set successfully from base64");

        // SAVE TO INDEXEDDB AUTOMATICALLY
        await handleSaveImage(base64Image);

        toast({
          title: "Immagine generata e salvata!",
          description: "Immagine creata e associata alla storia",
          variant: "default",
        });
      } else if (data.image_url) {
        console.log("🔗 Using image URL as fallback...");
        setGeneratedImage(data.image_url);
        setShowImageDialog(true);
        setUserComment("");
        console.log("✅ Image set successfully from URL");

        // SAVE TO INDEXEDDB AUTOMATICALLY
        await handleSaveImage(data.image_url);

        toast({
          title: "Immagine generata e salvata!",
          description: "Immagine creata e associata alla storia",
          variant: "default",
        });
      } else if (data.error) {
        console.error("❌ API returned error:", data.error);

        const errorMessage =
          data.error?.includes("content policy") || data.detail?.includes("safety system")
            ? "❌ Il contenuto della storia contiene parole non adatte per la generazione di immagini.\n\n🔧 Suggerimenti:\n• Evita riferimenti a violenza, armi o morte\n• Rimuovi parole come 'battaglia', 'guerra', 'sangue'\n• Riformula il testo con termini più neutri"
            : data.error?.includes("Prompt too long")
              ? "❌ Il testo della storia è troppo lungo per generare un'immagine.\n\n🔧 Suggerimenti:\n• Riduci la lunghezza del testo\n• Seleziona solo la parte più importante della storia"
              : data.error || "Errore nella generazione dell'immagine";

        throw new Error(errorMessage);
      } else {
        console.error("❌ No image data in response:", data);
        throw new Error("No image data received from API");
      }
    } catch (error) {
      console.error("💥 Error generating image:", error);

      // Show error in toast
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nella generazione dell'immagine",
        variant: "destructive",
      });

      // In debug mode, still show the dialog with error info
      if (isDebugMode) {
        setShowImageDialog(true);
      }
    } finally {
      console.log("🏁 Image generation process completed");
      setIsGenerating(false);
    }
  };

  const handleSaveImage = async (imageDataUrl: string) => {
    if (!storyId) {
      console.warn("⚠️ No storyId provided, cannot save image");
      return;
    }

    try {
      console.log("💾 Saving image to IndexedDB for story:", storyId);

      // Import IndexedDB manager
      const { fantasMiaDB } = await import("@/utils/indexedDB");

      // Detect story type (am or ag)
      const storyType = await fantasMiaDB.detectStoryType(String(storyId));
      if (!storyType) {
        throw new Error('Story not found');
      }

      // Check if image already exists for this story
      const existingMedia = await fantasMiaDB.getLatestMediaAssetByStoryId(String(storyId));
      
      if (existingMedia) {
        // Show confirmation dialog
        const confirmReplace = confirm(
          '⚠️ Esiste già un disegno associato a questa storia.\n\n' +
          'Vuoi sostituirlo con quello nuovo?\n\n' +
          '✅ OK = Sostituisci il disegno precedente\n' +
          '❌ Annulla = Mantieni il disegno esistente'
        );
        
        if (!confirmReplace) {
          console.log('🚫 User cancelled image replacement');
          toast({
            title: "Operazione annullata",
            description: "Il disegno esistente è stato mantenuto",
          });
          return;
        }
        
        // Delete existing media asset
        await fantasMiaDB.deleteMediaAsset(existingMedia.id);
        console.log('🗑️ Existing image deleted:', existingMedia.id);
      }

      // Convert base64 to Blob
      const [header, base64Data] = imageDataUrl.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });

      // Create media asset with style metadata
      const assetId = `${storyId}-openai-${Date.now()}`;
      const asset = {
        id: assetId,
        storyId: String(storyId),
        ownerProfileId: userId || currentUserId || "superuser",
        type: 'image' as const,
        source: 'openai' as const,
        mime,
        size: blob.size,
        createdAt: new Date().toISOString(),
        data: blob,
        metadata: {
          style: selectedStyle, // Save the actual style name
        }
      };

      // Save media asset and update story flag atomically
      await fantasMiaDB.saveMediaAssetWithStoryUpdate(asset, String(storyId), storyType);

      console.log("✅ Image saved to IndexedDB with story update:", {
        assetId,
        storyId,
        storyType,
        style: selectedStyle,
      });

      // Dispatch custom event to trigger icon refresh
      window.dispatchEvent(
        new CustomEvent("storyImageSaved", {
          detail: { storyId, storyType },
        }),
      );
    } catch (error) {
      console.error("❌ Error saving image to IndexedDB:", error);
      toast({
        title: "Avviso",
        description: "Immagine generata ma non salvata automaticamente. Usa il pulsante Download.",
        variant: "default",
      });
    }
  };

  const handleDownloadImage = async () => {
    if (!generatedImage) return;

    try {
      // Use a proxy or different approach for CORS-protected images
      const response = await fetch(generatedImage, {
        mode: "cors",
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${storyTitle || "immagine"}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download completato",
        description: "L'immagine è stata scaricata sul tuo dispositivo",
        variant: "default",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Errore nel download",
        description:
          "Non è stato possibile scaricare l'immagine. Prova a cliccare destro sull'immagine e seleziona 'Salva immagine'.",
        variant: "destructive",
      });
    }
  };

  // Se il componente è controllato dall'esterno (tramite open/onOpenChange props),
  // non mostrare il DropdownMenu trigger ma solo il Dialog
  const isExternallyControlled = externalOpen !== undefined && externalOnOpenChange !== undefined;

  return (
    <>
      {!isExternallyControlled && (
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={`px-6 ${className}`} disabled={isGenerating}>
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Palette className="w-4 h-4 mr-2" />
                    )}
                    {isGenerating ? "Generando..." : "MEDIA"}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Queste funzioni prevedono un utilizzo estensivo di package AI e pagamenti relativi</p>
              </TooltipContent>

              <DropdownMenuContent className="w-56 bg-white border shadow-lg z-50">
              {/* Disegno */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">Disegno</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white border shadow-lg">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleMediaAction("Disegno", "Fumetto")}
                    disabled={isGenerating}
                  >
                    Fumetto
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleMediaAction("Disegno", "Fotografico")}
                    disabled={isGenerating}
                  >
                    Fotografico
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleMediaAction("Disegno", "Astratto")}
                    disabled={isGenerating}
                  >
                    Astratto
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleMediaAction("Disegno", "Manga")}
                    disabled={isGenerating}
                  >
                    Manga
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleMediaAction("Disegno", "Acquarello")}
                    disabled={isGenerating}
                  >
                    Acquarello
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleMediaAction("Disegno", "Carboncino")}
                    disabled={isGenerating}
                  >
                    Carboncino
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Filmato */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">Filmato</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white border shadow-lg">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleMediaAction("Filmato", "Ambientazione futuristica")}
                  >
                    Ambientazione futuristica
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleMediaAction("Filmato", "Ambientazione storica")}
                  >
                    Ambientazione storica
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleMediaAction("Filmato", "Ambientazione odierna")}
                  >
                    Ambientazione odierna
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleMediaAction("Filmato", "Ambientazione fantasy")}
                  >
                    Ambientazione fantasy
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Voci */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">Voci</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white border shadow-lg">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleMediaAction("Voci", "Uomo")}>
                    Uomo
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleMediaAction("Voci", "Donna")}>
                    Donna
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleMediaAction("Voci", "Bambino")}>
                    Bambino
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleMediaAction("Voci", "Bambina")}>
                    Bambina
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </Tooltip>
      </TooltipProvider>
      )}

      {/* Image Display Dialog */}
      <Dialog open={showImageDialog} onOpenChange={(open) => handleCloseDialog(setShowImageDialog, open)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Immagine Generata - {storyTitle}</DialogTitle>
            <DialogDescription>
              Visualizza l'immagine generata per la storia. Puoi scaricarla sul tuo dispositivo.
            </DialogDescription>
          </DialogHeader>

          {generatedImage ? (
            <div className="flex flex-col items-center space-y-4">
              <img
                src={generatedImage}
                alt="Immagine generata per la storia"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
              <div className="flex items-center gap-4">
                <Button onClick={handleDownloadImage} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Scarica Immagine
                </Button>
              </div>
              <div className="text-sm text-muted-foreground text-center">
                L'immagine è temporanea e verrà persa alla chiusura della pagina.
                <br />
                Usa il pulsante "Scarica" per salvarla sul tuo dispositivo (tasto destro per condividere).
              </div>
            </div>
          ) : (
            isDebugMode &&
            debugInfo && (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Generazione Fallita</h3>
                  <div className="text-sm text-red-700">
                    La generazione dell'immagine non è riuscita. Le informazioni di debug sono disponibili qui sotto per
                    identificare il problema.
                  </div>
                </div>
              </div>
            )
          )}

          {/* Debug section for Superuser */}
          {isDebugMode && debugInfo && (
            <div className="w-full mt-4 p-4 border rounded-lg bg-gray-50">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Debug Info (Superuser)
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">{debugInfo}</pre>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={(open) => handleCloseDialog(setShowCommentDialog, open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Genera Immagine</DialogTitle>
            <DialogDescription>
              Personalizza l'immagine aggiungendo specifiche o dettagli desiderati (opzionale).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mostra lo stile selezionato */}
            {selectedStyle && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-sm font-medium">
                  Stile selezionato: <span className="text-primary capitalize">{selectedStyle}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Note aggiuntive (opzionale)</label>
              <div className="text-xs text-muted-foreground mb-2">
                Aggiungi delle specifiche per personalizzare l'immagine
              </div>
              <Textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="es. 'in stile fiabesco', 'con ambientazione spaziale', 'con colori vivaci'..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleCloseDialog(setShowCommentDialog, false)}>
                Annulla
              </Button>
              <Button onClick={handleGenerateWithComment} className="gap-2">
                <Palette className="w-4 h-4" />
                Genera Immagine
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Authentication Warning Dialog */}
      <Dialog open={showAuthWarning} onOpenChange={(open) => handleCloseDialog(setShowAuthWarning, open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Accesso Richiesto
            </DialogTitle>
            <DialogDescription>I servizi media richiedono l'autenticazione utente per funzionare.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                I servizi media (Disegno, Filmato, Voci) sono disponibili solo per utenti autenticati.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Per utilizzare questi servizi è necessario:</div>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                <li>Effettuare il login con email e password</li>
                <li>Accedere alle storie dal proprio profilo utente</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleCloseDialog(setShowAuthWarning, false)}>
                Ho capito
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Style Selection Dialog - Shown when opened externally */}
      <Dialog open={showStyleSelection} onOpenChange={(open) => handleCloseDialog(setShowStyleSelection, open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Seleziona Stile Artistico</DialogTitle>
            <DialogDescription>Scegli uno stile per la generazione dell'immagine della storia</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {[
              { name: "Fumetto", style: "fumetto" },
              { name: "Fotografico", style: "fotografico" },
              { name: "Astratto", style: "astratto" },
              { name: "Manga", style: "manga" },
              { name: "Acquarello", style: "acquarello" },
              { name: "Carboncino", style: "carboncino" },
            ].map(({ name, style }) => (
              <Button
                key={style}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary transition-colors"
                onClick={() => handleStyleSelected(style)}
              >
                <Palette className="w-6 h-6" />
                <span className="font-medium">{name}</span>
              </Button>
            ))}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => handleCloseDialog(setShowStyleSelection, false)}>
              Annulla
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Copyright Warning Dialog */}
      <CopyrightWarningDialog
        open={showCopyrightWarning}
        onOpenChange={handleCopyrightWarningChange}
        onConfirm={handleCopyrightProceed}
        selectedStyle={selectedStyle}
      />
    </>
  );
};

export default MediaButton;
