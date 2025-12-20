import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { AMStory, fantasMiaDB } from '@/utils/indexedDB';
import { useToast } from '@/hooks/use-toast';
import { AlbumPDFGenerator, generateAlbumZIP, calculatePagesAllocation, StoryForAlbum, AlbumGenerationConfig } from '@/utils/albumPdfGenerator';
import { Download, FileArchive, Loader2, ArrowLeft, Home, Image, ImageOff } from 'lucide-react';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const AlbumCreator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get stories from navigation state
  const storyIds = (location.state?.storyIds as string[]) || [];

  const [stories, setStories] = useState<AMStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumAuthor, setAlbumAuthor] = useState('Superuser');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [generatedZipBlob, setGeneratedZipBlob] = useState<Blob | null>(null);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [isCalculatingSize, setIsCalculatingSize] = useState(false);
  const [mediaInfoMap, setMediaInfoMap] = useState<Record<string, { isSketch: boolean }>>({});

  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const config: AlbumGenerationConfig = {
    pageSize: 'A4',
    margins: 20,
    fontFamily: 'Helvetica',
    fontSizeBody: 12,
    fontSizeTitles: 24,
    imageStyleDefault: 'contain'
  };

  // Load stories on mount
  useEffect(() => {
    const loadStories = async () => {
      if (storyIds.length === 0) {
        toast({
          title: "Nessuna storia selezionata",
          description: "Torna all'archivio e seleziona le storie",
          variant: "destructive"
        });
        navigate('/superuser-am-archive');
        return;
      }

      try {
        await fantasMiaDB.init();
        
        // Get all AM stories via transaction
        const transaction = (fantasMiaDB as any).db!.transaction(['am_stories'], 'readonly');
        const store = transaction.objectStore('am_stories');
        const request = store.getAll();
        
        const allStories: AMStory[] = await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
        
        // Filter and sort by creation date (most recent first)
        const selectedStories = allStories
          .filter(s => storyIds.includes(s.id))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setStories(selectedStories);
        
        // Load media info for each story
        const mediaInfo: Record<string, { isSketch: boolean }> = {};
        for (const story of selectedStories) {
          if (story.hasImage) {
            try {
              const media = await fantasMiaDB.getLatestMediaAssetByStoryId(story.id);
              mediaInfo[story.id] = { isSketch: media?.metadata?.isSketch ?? false };
            } catch (error) {
              console.error('Error loading media info:', error);
              mediaInfo[story.id] = { isSketch: false };
            }
          }
        }
        setMediaInfoMap(mediaInfo);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading stories:', error);
        toast({
          title: "Errore",
          description: "Errore durante il caricamento delle storie",
          variant: "destructive"
        });
        navigate('/superuser-am-archive');
      }
    };

    loadStories();
  }, [storyIds, navigate, toast]);

  // Calculate estimated size when stories change
  useEffect(() => {
    const calculateSize = async () => {
      setIsCalculatingSize(true);
      let totalSize = 0;

      try {
        for (const story of stories) {
          const txtContent = `Titolo: ${story.title}\nAutore: ${albumAuthor}\n\nTesto:\n${story.text}`;
          totalSize += new Blob([txtContent]).size;

          if (story.hasImage) {
            try {
              const mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(story.id);
              if (mediaAsset?.data) {
                totalSize += mediaAsset.data.size;
              }
            } catch (error) {
              console.error('Error loading media for size calculation:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error calculating size:', error);
      } finally {
        setEstimatedSize(totalSize);
        setIsCalculatingSize(false);
      }
    };

    if (stories.length > 0) {
      calculateSize();
    } else {
      setEstimatedSize(0);
    }
  }, [stories, albumAuthor]);

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
      const storiesForAlbum: StoryForAlbum[] = [];
      
      for (const story of stories) {
        let mediaAsset: any = undefined;
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
      
      await fantasMiaDB.saveAlbum(albumData);

      setProgress(100);
      setProgressMessage('Completato!');
      
      toast({
        title: "Album creato",
        description: "L'album è stato generato con successo"
      });

    } catch (error) {
      console.error('Errore generazione album:', error);
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

  const handleSendToPrint = async () => {
    if (!albumTitle) return;

    const confirmed = window.confirm(
      "Vuoi inviare le storie selezionate al centro raccolta per la stampa? Riceverai conferma via email."
    );

    if (!confirmed) return;

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage('Preparazione invio...');

    try {
      const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

      setProgressMessage('Preparazione file...');
      const attachments = [];
      let totalSize = 0;

      for (const story of stories) {
        const txtContent = `Titolo: ${story.title}\nAutore: ${albumAuthor}\n\nTesto:\n${story.text}`;
        const txtBlob = new Blob([txtContent], { type: 'text/plain' });
        const txtBase64 = await blobToBase64(txtBlob);
        
        const safeFilename = story.title.replace(/[^a-z0-9]/gi, '_');
        attachments.push({
          filename: `${safeFilename}.txt`,
          content: txtBase64,
          contentType: 'text/plain'
        });

        totalSize += txtBlob.size;

        if (story.hasImage) {
          const mediaAsset = await fantasMiaDB.getLatestMediaAssetByStoryId(story.id);
          if (mediaAsset && mediaAsset.data) {
            const imageBase64 = await blobToBase64(mediaAsset.data);
            const imageExt = mediaAsset.mime.split('/')[1] || 'png';
            attachments.push({
              filename: `${safeFilename}.${imageExt}`,
              content: imageBase64,
              contentType: mediaAsset.mime
            });
            totalSize += mediaAsset.data.size;
          }
        }
      }

      if (totalSize > MAX_SIZE_BYTES) {
        const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
        setIsGenerating(false);
        toast({
          title: "Errore",
          description: `Il file supera il limite massimo di 10 MB (dimensione: ${sizeMB} MB).`,
          variant: "destructive"
        });
        return;
      }

      const payload = {
        to: 'roger56@fantasmia.it',
        subject: `FANTASMIA – Richiesta stampa album: ${albumTitle}`,
        html: `
          <h1>Richiesta stampa album</h1>
          <p><strong>Album:</strong> ${albumTitle}</p>
          <p><strong>Autore:</strong> ${albumAuthor}</p>
          <p><strong>Storie incluse:</strong> ${stories.length}</p>
          <p><strong>Data richiesta:</strong> ${new Date().toLocaleString('it-IT')}</p>
          <hr>
          <p>In allegato trovi i file delle storie (testi e immagini).</p>
        `,
        text: `Richiesta stampa album "${albumTitle}" di ${albumAuthor}. ${stories.length} storie incluse.`,
        attachments
      };

      setProgressMessage('Invio in corso...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch('https://fantasmia-ai.vercel.app/api/openai/send_email_ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Errore API: ${response.status} - ${errorText}`);
        }

        setProgressMessage('Completato!');
        setProgress(100);

        toast({
          title: "✅ Email inviata",
          description: "La richiesta di stampa è stata inviata con successo"
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          toast({
            title: "Timeout",
            description: "La richiesta ha impiegato troppo tempo. Riprova più tardi.",
            variant: "destructive"
          });
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Errore invio email:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'invio",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Fixed top */}
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          <h1 className="text-lg font-semibold">Crea Album</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profiles')}>
            <Home className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main content - Scrollable */}
      <main className="flex-1 overflow-auto p-4 pb-32">
        <div className="max-w-4xl mx-auto space-y-6">
          <ProfileIndicator />

          {/* Configuration */}
          {!isGenerating && !generatedPdfBlob && (
            <>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* Size indicator */}
                  <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Dimensione stimata</Label>
                      <span className={`text-sm font-semibold ${
                        estimatedSize > MAX_SIZE_BYTES 
                          ? 'text-red-600' 
                          : estimatedSize > MAX_SIZE_BYTES * 0.8 
                            ? 'text-amber-600' 
                            : 'text-green-600'
                      }`}>
                        {isCalculatingSize ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Calcolo...
                          </span>
                        ) : (
                          `${(estimatedSize / 1024 / 1024).toFixed(2)} MB / ${MAX_SIZE_MB} MB`
                        )}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min((estimatedSize / MAX_SIZE_BYTES) * 100, 100)} 
                      className={`h-2 ${
                        estimatedSize > MAX_SIZE_BYTES 
                          ? '[&>div]:bg-red-500' 
                          : estimatedSize > MAX_SIZE_BYTES * 0.8 
                            ? '[&>div]:bg-amber-500' 
                            : '[&>div]:bg-green-500'
                      }`}
                    />
                    {estimatedSize > MAX_SIZE_BYTES && (
                      <p className="text-xs text-red-600 font-medium">
                        ⚠️ Limite superato! Rimuovi alcune storie per procedere.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stories list - Scrollable box */}
              <Card>
                <CardContent className="p-4">
                  <Label className="mb-3 block">Storie selezionate ({stories.length})</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[400px] overflow-y-auto">
                      <div className="divide-y divide-border">
                        {stories.map((story) => {
                          const pagesAlloc = calculatePagesAllocation(story.mode);
                          const mediaInfo = mediaInfoMap[story.id];
                          
                          return (
                            <div key={story.id} className="p-3 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{story.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {story.mode}
                                    <span className="hidden sm:inline"> • {pagesAlloc.text}pg + {pagesAlloc.image}pg img</span>
                                  </p>
                                  <p className="text-xs text-muted-foreground hidden sm:block">
                                    {new Date(story.createdAt).toLocaleDateString('it-IT')}
                                  </p>
                                </div>
                                
                                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                  story.hasImage 
                                    ? mediaInfo?.isSketch 
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {story.hasImage ? (
                                    <>
                                      <Image className="w-3 h-3" />
                                      {mediaInfo?.isSketch ? 'Schizzo' : 'Immagine'}
                                    </>
                                  ) : (
                                    <>
                                      <ImageOff className="w-3 h-3" />
                                      No img
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Generation progress */}
          {isGenerating && (
            <Card>
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground">{progressMessage}</p>
              </CardContent>
            </Card>
          )}

          {/* Download section */}
          {generatedPdfBlob && !isGenerating && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-green-600">✓ Album generato con successo!</p>
                  <p className="text-sm text-muted-foreground">
                    L'album è stato salvato e può essere scaricato
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <Button onClick={() => navigate('/superuser-am-archive')} variant="secondary" className="w-full">
                  Torna all'archivio
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Fixed bottom buttons */}
      {!isGenerating && !generatedPdfBlob && (
        <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
          <div className="max-w-4xl mx-auto space-y-3">
            <Button 
              onClick={handleGenerateAlbum} 
              className="w-full" 
              size="lg"
              disabled={!albumTitle.trim() || isCalculatingSize}
            >
              Genera Album PDF
            </Button>
            
            {albumTitle && stories.length > 0 && (
              <Button 
                onClick={handleSendToPrint} 
                size="lg" 
                className={`w-full ${
                  estimatedSize > MAX_SIZE_BYTES 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={isGenerating || estimatedSize > MAX_SIZE_BYTES || isCalculatingSize}
              >
                {estimatedSize > MAX_SIZE_BYTES ? (
                  <>⚠️ Dimensione eccessiva</>
                ) : (
                  <>👉 INVIA ALLA STAMPA</>
                )}
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};

export default AlbumCreator;
