import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Pencil, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}) => {
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sketch generation states
  const [isGeneratingSketch, setIsGeneratingSketch] = useState(false);
  const [sketchResult, setSketchResult] = useState<string | null>(null);
  const [showSketchPreview, setShowSketchPreview] = useState(false);

  useEffect(() => {
    if (open) {
      setImageLoaded(false);
      setImageError(false);
      setSketchResult(null);
      setShowSketchPreview(false);
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

  // dentro ImageViewerDialog.tsx

  const handleCreateSketch = async () => {
  setIsGeneratingSketch(true);

  try {
    if (!imageUrl && !imageBlob) {
      throw new Error("Nessuna immagine disponibile per generare lo sketch.");
    }

    const sketchUrl =
      import.meta.env.VITE_OPENAI_IMAGE2SKETCH_URL ||
      "https://fantasmia-ai.vercel.app/api/openai/image2sketch";

    // 1) Prepara payload: se l'immagine è blob: (browser-only) -> invia imageBase64
    let payloadToSend: any = { storyId };

    const isBlobUrl = typeof imageUrl === "string" && imageUrl.startsWith("blob:");
    const isDataUrl = typeof imageUrl === "string" && imageUrl.startsWith("data:");

    if (imageBlob) {
      // Caso migliore: abbiamo già il Blob
      const imageBase64 = await blobToDataUrl(imageBlob);
      payloadToSend.imageBase64 = imageBase64;
      console.log("🖍 Using imageBlob -> imageBase64", { storyId, size: imageBlob.size, mime: imageBlob.type });
    } else if (isBlobUrl) {
      // blob: URL -> fetch locale nel browser, poi converti a base64
      const r = await fetch(imageUrl);
      if (!r.ok) throw new Error(`Impossibile leggere l'immagine locale (status ${r.status})`);
      const b = await r.blob();
      const imageBase64 = await blobToDataUrl(b);
      payloadToSend.imageBase64 = imageBase64;
      console.log("🖍 Using blob URL -> imageBase64", { storyId, size: b.size, mime: b.type });
    } else if (isDataUrl) {
      // già base64: mandiamo come imageBase64 (più coerente)
      payloadToSend.imageBase64 = imageUrl;
      console.log("🖍 Using data URL as imageBase64", { storyId });
    } else {
      // http/https pubblico: mandiamo URL e la API lo convertirà in base64
      payloadToSend.imageUrl = imageUrl;
      console.log("🖍 Using public imageUrl", { storyId, imageUrl });
    }

    // (facoltativo) guardrail: se base64 enorme, meglio avvisare
    if (payloadToSend.imageBase64 && typeof payloadToSend.imageBase64 === "string") {
      const len = payloadToSend.imageBase64.length;
      if (len > 3_500_000) {
        console.warn("⚠️ imageBase64 very large:", len);
      }
    }

    const response = await fetch(sketchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payloadToSend),
      // mode: "cors", // puoi lasciarlo o rimuoverlo: di default è già CORS
    });

    console.log("📥 image2sketch status:", response.status);

    const raw = await response.text();
    let payload: any = null;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const serverMsg =
        payload?.error ||
        payload?.detail ||
        (typeof raw === "string" && raw.trim() ? raw : null) ||
        `Generazione sketch fallita (status ${response.status})`;

      console.error("❌ image2sketch HTTP error:", response.status, payload ?? raw);

      if (response.status === 422) {
        throw new Error(`Richiesta non valida: ${serverMsg}`);
      }
      throw new Error(serverMsg);
    }

    const base64 = payload?.base64;
    if (!base64 || typeof base64 !== "string") {
      console.error("❌ image2sketch: no base64 in response", payload ?? raw);
      throw new Error("La risposta del server non contiene lo sketch (base64 mancante).");
    }

    console.log("✅ Sketch generated successfully");
    setSketchResult(base64);
    setShowSketchPreview(true);

    toast({
      title: "Sketch generato",
      description: "Ora puoi scaricare lo schizzo da colorare.",
    });
  } catch (error) {
    console.error("❌ Sketch generation error:", error);
    toast({
      title: "Errore",
      description: error instanceof Error ? error.message : "Impossibile generare lo sketch",
      variant: "destructive",
    });
  } finally {
    setIsGeneratingSketch(false);
  }
};


  const handleDownloadSketch = () => {
    if (!sketchResult) return;

    const link = document.createElement("a");
    link.href = sketchResult;
    link.download = `${createSafeFilename(storyTitle)}-sketch.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download completato",
      description: "Sketch salvato con successo",
    });
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

  // If showing sketch preview
  if (showSketchPreview && sketchResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" aria-describedby="dlg-desc-sketch-preview">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>🖍️ Schizzo da Colorare</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowSketchPreview(false)} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <DialogDescription id="dlg-desc-sketch-preview">
            Schizzo generato dall'immagine. Scaricalo per stamparlo e colorarlo.
          </DialogDescription>

          <div className="space-y-4">
            <div className="text-center">
              <img
                src={sketchResult}
                alt="Schizzo da colorare"
                className="max-w-full max-h-[60vh] w-auto h-auto mx-auto rounded-lg border bg-white"
                style={{ objectFit: "contain" }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowSketchPreview(false)}>
                Indietro
              </Button>
              <Button onClick={handleDownloadSketch}>
                <Download className="w-4 h-4 mr-2" />
                Scarica Sketch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" aria-describedby="dlg-desc-image-viewer">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Immagine della Storia</DialogTitle>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <DialogDescription id="dlg-desc-image-viewer">
          Visualizza l'immagine associata alla storia. Puoi scaricarla o convertirla in schizzo da colorare.
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
              {/* Show "Crea schizzo" button only if not already a sketch */}
              {!isSketch && (
                <Button variant="outline" onClick={handleCreateSketch} disabled={imageError || isGeneratingSketch}>
                  {isGeneratingSketch ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generazione...
                    </>
                  ) : (
                    <>
                      <Pencil className="w-4 h-4 mr-2" />
                      Crea schizzo
                    </>
                  )}
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
  );
};

export default ImageViewerDialog;
