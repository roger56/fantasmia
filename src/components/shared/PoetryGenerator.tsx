import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Feather, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PoetryGeneratorProps {
  storyContent: string;
  storyTitle?: string;
  className?: string;
}

const PoetryGenerator: React.FC<PoetryGeneratorProps> = ({
  storyContent,
  storyTitle = '',
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPoetry, setGeneratedPoetry] = useState('');
  const { toast } = useToast();

  const handleGeneratePoetry = async () => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-poetry', {
        body: {
          storyContent,
          storyTitle,
          language: 'it',
          maxLines: 10
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.poetry) {
        setGeneratedPoetry(data.poetry);
        toast({
          title: "Successo",
          description: "Poesia generata con successo!",
        });
      } else {
        throw new Error('Nessuna poesia ricevuta');
      }
    } catch (error) {
      console.error('Error generating poetry:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile generare la poesia. Riprova più tardi.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedPoetry('');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Feather className="w-5 h-5" />
          Genera Poesia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!generatedPoetry ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Genera una poesia in rima di massimo 10 righe ispirata alla tua storia:
            </p>
            
            <Button
              onClick={handleGeneratePoetry}
              disabled={isGenerating}
              className="w-full"
            >
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
            
            <ScrollArea className="h-64 w-full border rounded-md p-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed italic">
                {generatedPoetry}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
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