import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AMStory, fantasMiaDB } from '@/utils/indexedDB';
import { useToast } from '@/hooks/use-toast';
import { AlbumPDFGenerator, generateAlbumZIP, calculatePagesAllocation, StoryForAlbum, AlbumGenerationConfig } from '@/utils/albumPdfGenerator';
import { Download, FileArchive, Loader2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

interface AlbumCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stories: AMStory[];
  config: AlbumGenerationConfig;
}

type SortOrder = 'title' | 'date' | 'manual';

const AlbumCreatorDialog: React.FC<AlbumCreatorDialogProps> = ({
  open,
  onOpenChange,
  stories: initialStories,
  config
}) => {
  const { toast } = useToast();
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumAuthor, setAlbumAuthor] = useState('Superuser');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date');
  const [stories, setStories] = useState(initialStories);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [generatedZipBlob, setGeneratedZipBlob] = useState<Blob | null>(null);

  React.useEffect(() => {
    // Sort stories based on sortOrder
    let sorted = [...initialStories];
    if (sortOrder === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'date') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    setStories(sorted);
  }, [sortOrder, initialStories]);

  const handleGenerateAlbum = async () => {
    if (!albumTitle.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un titolo per l'album",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage('Preparazione...');

    try {
      // Prepare stories with their media assets
      const storiesForAlbum: StoryForAlbum[] = [];
      
      for (const story of stories) {
        let mediaAsset;
        if (story.hasImage) {
          mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(story.id);
        }
        
        const pagesAlloc = calculatePagesAllocation(story.mode);
        storiesForAlbum.push({
          story,
          mediaAsset,
          pagesAlloc
        });
      }

      // Generate PDF
      const generator = new AlbumPDFGenerator(config);
      const pdfBlob = await generator.generateAlbum(
        albumTitle,
        albumAuthor,
        storiesForAlbum,
        (prog, msg) => {
          setProgress(prog);
          setProgressMessage(msg);
        }
      );

      setGeneratedPdfBlob(pdfBlob);

      // Generate ZIP
      setProgressMessage('Creazione archivio ZIP...');
      const albumData = {
        id: crypto.randomUUID(),
        title: albumTitle,
        author: albumAuthor,
        createdAt: new Date().toISOString(),
        stories: storiesForAlbum.map(item => ({
          storyId: item.story.id,
          title: item.story.title,
          type: item.story.mode,
          pagesAlloc: item.pagesAlloc,
          imageIdUsed: item.mediaAsset?.id
        })),
        pdfBlob,
        settingsSnapshot: config
      };

      const zipBlob = await generateAlbumZIP(albumData, pdfBlob, storiesForAlbum);
      setGeneratedZipBlob(zipBlob);

      // Save to IndexedDB
      await fantasMiaDB.saveAlbum(albumData);

      setProgress(100);
      setProgressMessage('Completato!');
      
      toast({
        title: "Album creato",
        description: "L'album è stato generato con successo"
      });

    } catch (error) {
      console.error('Error generating album:', error);
      toast({
        title: "Errore",
        description: "Errore durante la generazione dell'album",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedPdfBlob) return;
    
    const url = URL.createObjectURL(generatedPdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${albumTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download avviato",
      description: "Il PDF è stato scaricato"
    });
  };

  const handleDownloadZIP = () => {
    if (!generatedZipBlob) return;
    
    const url = URL.createObjectURL(generatedZipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${albumTitle.replace(/[^a-z0-9]/gi, '_')}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download avviato",
      description: "Lo ZIP è stato scaricato"
    });
  };

  const moveStory = (index: number, direction: 'up' | 'down') => {
    if (sortOrder !== 'manual') {
      setSortOrder('manual');
    }
    
    const newStories = [...stories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newStories.length) return;
    
    [newStories[index], newStories[targetIndex]] = [newStories[targetIndex], newStories[index]];
    setStories(newStories);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" aria-describedby="album-creator-desc">
        <DialogHeader>
          <DialogTitle>Crea Album Stampabile</DialogTitle>
          <DialogDescription id="album-creator-desc">
            Configura e genera un album PDF con le storie selezionate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Configuration section */}
          {!isGenerating && !generatedPdfBlob && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Titolo Album</Label>
                  <Input
                    placeholder="Inserisci titolo..."
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Autore</Label>
                  <Input
                    value={albumAuthor}
                    onChange={(e) => setAlbumAuthor(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ordinamento storie</Label>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Per titolo</SelectItem>
                    <SelectItem value="date">Per data (recenti prima)</SelectItem>
                    <SelectItem value="manual">Manuale (drag & drop)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stories preview */}
              <div className="space-y-2">
                <Label>Storie selezionate ({stories.length})</Label>
                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  <div className="space-y-2">
                    {stories.map((story, index) => {
                      const pagesAlloc = calculatePagesAllocation(story.mode);
                      return (
                        <div key={story.id} className="flex items-center justify-between p-3 border rounded bg-muted/30">
                          <div className="flex items-center gap-3 flex-1">
                            {sortOrder === 'manual' && (
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => moveStory(index, 'up')}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => moveStory(index, 'down')}
                                  disabled={index === stories.length - 1}
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{story.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {story.mode} • {pagesAlloc.text} pg testo + {pagesAlloc.image} pg immagine • {story.text.length} caratteri
                              </p>
                            </div>
                            
                            <div className={`text-xs px-2 py-1 rounded ${story.hasImage ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {story.hasImage ? '✓ Immagine' : '✗ No immagine'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <Button onClick={handleGenerateAlbum} className="w-full" size="lg">
                Genera Album PDF
              </Button>
            </>
          )}

          {/* Generation progress */}
          {isGenerating && (
            <div className="space-y-4 py-8">
              <div className="flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">{progressMessage}</p>
            </div>
          )}

          {/* Download section */}
          {generatedPdfBlob && !isGenerating && (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-green-600">✓ Album generato con successo!</p>
                <p className="text-sm text-muted-foreground">
                  L'album è stato salvato localmente e può essere scaricato
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleDownloadPDF} size="lg" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Scarica PDF
                </Button>
                
                {generatedZipBlob && (
                  <Button onClick={handleDownloadZIP} variant="outline" size="lg" className="w-full">
                    <FileArchive className="w-4 h-4 mr-2" />
                    Scarica ZIP
                  </Button>
                )}
              </div>

              <Button onClick={() => onOpenChange(false)} variant="secondary" className="w-full">
                Chiudi
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlbumCreatorDialog;
