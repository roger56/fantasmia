import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SketchGenerationDialog from "./SketchGenerationDialog";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  storyTitle?: string;
  style?: string;
  imageBlob?: Blob;
  storyId?: string;
  /** Whether the current image is already a sketch */
  isSketch?: boolean;
  /** Story content text for sketch generation */
  storyContent?: string;
  /** User ID for saving sketches */
  userId?: string;
  /** Whether user can generate sketches (SU only for AG stories) */
  canGenerateSketch?: boolean;
  /** Callback when sketch is saved */
  onSketchSaved?: () => void;
}

const ImageViewerDialog: React.FC<ImageViewerDialogProps> = ({
  open,
  onOpenChange,
  imageUrl,
  storyTitle = "Storia",
  style = "AI Generated",
  imageBlob,
  storyId,
  isSketch = false,
  storyContent,
  userId,
  canGenerateSketch = false,
  onSketchSaved,
}) => {
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showSketchDialog, setShowSketchDialog] = useState(false);

  useEffect(() => {
    if (open) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [open, imageUrl]);

  const getFileExtension = (blob: Blob): string => {
    const mime = blob.type;
    switch (mime) {
      case "image/webp":
        return ".webp";
      case "image/png":
        return ".png";
      case "image/jpeg":
        return ".jpg";
      case "image/jpg":
        return ".jpg";
      default:
        return ".img";
    }
  };

  const createSafeFilename = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);
  };

  const handleDownload = async () => {
    try {
      let blobToDownload = imageBlob;

      if (!blobToDownload) {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error("Failed to fetch image for download");
        blobToDownload = await response.blob();
      }

      if (!blobToDownload || blobToDownload.size === 0) {
        console.error("❌ Download failed:", { action: "download-empty", storyId, blobSize: blobToDownload?.size });
        toast({
          title: "Errore Download",
          description: "File vuoto o non valido",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(blobToDownload);
      const extension = getFileExtension(blobToDownload);
      const filename = `${createSafeFilename(storyTitle)}${extension}`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("✅ Download completed:", { action: "download-success", filename, size: blobToDownload.size });

      toast({
        title: "Download completato",
        description: `Immagine salvata come ${filename}`,
      });
    } catch (error) {
      console.error("❌ Download error:", { action: "download-error", error, storyId });
      toast({
        title: "Errore Download",
        description: "Impossibile scaricare l'immagine",
        variant: "destructive",
      });
    }
  };

  const handleImageLoad = () => {
    console.log("✅ Immagine caricata con successo", {
      action: "image-loaded",
      storyId,
      urlPrefix: imageUrl.substring(0, 50),
    });
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e: any) => {
    setImageError(true);
    setImageLoaded(false);
    console.error("❌ Errore caricamento immagine:", {
      action: "media-render-error",
      storyId,
      error: e?.type || "unknown",
      imageUrl: imageUrl.substring(0, 100),
      isDataUrl: imageUrl.startsWith("data:"),
      isBlobUrl: imageUrl.startsWith("blob:"),
    });
    toast({
      title: "Errore Visualizzazione",
      description: "Impossibile visualizzare l'immagine. Verifica la connessione o riprova.",
      variant: "destructive",
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleOpenSketchDialog = () => {
    setShowSketchDialog(true);
  };

  const handleSketchSaved = () => {
    onSketchSaved?.();
    // Close the image viewer after sketch is saved
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" aria-describedby="dlg-desc-image-viewer">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Immagine della Storia</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <DialogDescription id="dlg-desc-image-viewer">
            Visualizza l'immagine associata alla storia.
          </DialogDescription>

          <div className="space-y-4">
            <div className="relative">
              <div className="text-center">
                {!imageLoaded && !imageError && (
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}

                {imageError && (
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Impossibile caricare l'immagine</p>
                  </div>
                )}

                <img
                  src={imageUrl}
                  alt={`Immagine per ${storyTitle}`}
                  className={`max-w-full max-h-[60vh] w-auto h-auto mx-auto rounded-lg border transition-opacity duration-300 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{
                    display: imageError ? "none" : "block",
                    objectFit: "contain",
                    touchAction: "pinch-zoom",
                  }}
                  loading="eager"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm font-medium">{storyTitle}</p>
                <p className="text-xs text-muted-foreground">{isSketch ? "🖍️ Schizzo da colorare" : `Stile: ${style}`}</p>
              </div>

              <div className="flex gap-2">
                {/* Show "Da colorare" button only if not already a sketch, has story content, and user can generate */}
                {!isSketch && storyContent && canGenerateSketch && (
                  <Button variant="outline" onClick={handleOpenSketchDialog} disabled={imageError}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Da colorare
                  </Button>
                )}

                <Button variant="outline" onClick={handleDownload} disabled={imageError}>
                  <Download className="w-4 h-4 mr-2" />
                  Scarica
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sketch Generation Dialog - uses text-based API */}
      {storyContent && (
        <SketchGenerationDialog
          open={showSketchDialog}
          onOpenChange={setShowSketchDialog}
          storyContent={storyContent}
          storyTitle={storyTitle}
          storyId={storyId}
          userId={userId}
          onSketchSaved={handleSketchSaved}
        />
      )}
    </>
  );
};

export default ImageViewerDialog;
