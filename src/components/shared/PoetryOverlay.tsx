import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Mail, Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PoetryOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyContent: string;
  storyTitle?: string;
}

const PoetryOverlay: React.FC<PoetryOverlayProps> = ({ open, onOpenChange, storyContent, storyTitle = "" }) => {
  const [poetry, setPoetry] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [poetryStyle, setPoetryStyle] = useState<string>("lirica");
  const { toast } = useToast();

  const generatePoetry = async () => {
    if (!storyContent.trim()) {
      toast({
        title: "Contenuto mancante",
        description: "È necessario un testo della storia per generare la poesia",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Generating poetry for story content...");

      // Costruiamo il tema combinando titolo e contenuto (come per il componente principale)
      const theme = storyTitle?.trim() ? `${storyTitle.trim()} – ${storyContent}` : storyContent;

      const response = await fetch("https://fantasmia-ai.vercel.app/api/openai/poetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme,
          style: poetryStyle,
        }),
      });

      if (!response.ok) {
        console.error("Poetry API HTTP error:", response.status, response.statusText);
        throw new Error(`Errore HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.poetry) {
        setPoetry(data.poetry);
        toast({
          title: "Poesia generata!",
          description: "La poesia è stata creata con successo",
        });
      } else {
        console.error("Poetry API: nessuna poesia valida nella risposta", data);
        throw new Error("Nessuna poesia ricevuta dal servizio");
      }
    } catch (error) {
      console.error("Poetry generation error:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante la generazione della poesia",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!poetry) return;

    try {
      const textToCopy = `${storyTitle ? `${storyTitle}\n\n` : ""}${poetry}`;
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Copiato!",
        description: "La poesia è stata copiata negli appunti",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile copiare negli appunti",
        variant: "destructive",
      });
    }
  };

  const handleEmailShare = () => {
    if (!poetry) return;

    const subject = encodeURIComponent(`Poesia: ${storyTitle || "Storia"}`);
    const body = encodeURIComponent(`${storyTitle ? `${storyTitle}\n\n` : ""}${poetry}`);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;

    window.open(mailtoUrl, "_blank");
  };

  const handleReset = () => {
    setPoetry("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]" aria-describedby="poetry-overlay-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Poesia AI - {storyTitle || "Storia"}
          </DialogTitle>
          <DialogDescription id="poetry-overlay-desc">Genera una poesia ispirata alla tua storia</DialogDescription>
        </DialogHeader>

        {!poetry ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Genera una Poesia</h3>
                  <p className="text-muted-foreground">Crea una poesia in rima ispirata alla tua storia</p>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium">Forma poetica</label>
                  <Select value={poetryStyle} onValueChange={setPoetryStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona forma poetica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lirica">Lirica</SelectItem>
                      <SelectItem value="romantica">Romantica</SelectItem>
                      <SelectItem value="epica">Epica</SelectItem>
                      <SelectItem value="sonetto">Sonetto</SelectItem>
                      <SelectItem value="libera">Libera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={generatePoetry} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generazione in corso...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Genera Poesia
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Poesia Generata</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToClipboard}
                      className="flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copia
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleEmailShare} className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </Button>
                  </div>
                </div>

                <ScrollArea className="max-h-64 border rounded-md p-4">
                  <div className="whitespace-pre-wrap text-base leading-relaxed italic">{poetry}</div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Genera Nuova Poesia
              </Button>

              <Button onClick={() => onOpenChange(false)}>Chiudi</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PoetryOverlay;
