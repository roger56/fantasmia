import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Feather, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PoetryGeneratorProps {
  storyContent: string;
  storyTitle?: string;
  className?: string;
  initialStyle?: string;
}

const PoetryGenerator: React.FC<PoetryGeneratorProps> = ({ storyContent, storyTitle = "", className = "", initialStyle = "lirica" }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPoetry, setGeneratedPoetry] = useState("");
  const [poetryStyle, setPoetryStyle] = useState<string>(initialStyle);
  const { toast } = useToast();

  const handleGeneratePoetry = async () => {
    // Niente più CLOUD_ENABLED / supabase: chiamiamo direttamente Vercel
    if (!storyContent || !storyContent.trim()) {
      toast({
        title: "Testo mancante",
        description: "Scrivi prima una storia per poter generare una poesia.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Costruiamo un tema: se c’è il titolo lo includiamo, altrimenti solo il contenuto
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
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.poetry) {
        setGeneratedPoetry(data.poetry);
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
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedPoetry("");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Feather className="w-5 h-5" />
          Genera Poesia - {poetryStyle.charAt(0).toUpperCase() + poetryStyle.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!generatedPoetry ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">Genera una poesia in forma "{poetryStyle}" ispirata alla tua storia:</p>

            <Button onClick={handleGeneratePoetry} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generando poesia...
                </>
              ) : (
                <>
                  <Feather className="w-4 h-4 mr-2" />
                  Genera Poesia
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Poesia generata</h4>
            </div>

            <ScrollArea className="max-h-64 w-full border rounded-md p-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed italic">{generatedPoetry}</div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                <Feather className="w-4 h-4" />
                Genera nuova poesia
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PoetryGenerator;
