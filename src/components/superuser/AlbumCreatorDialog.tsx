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
import { Download, FileArchive, Loader2 } from 'lucide-react';
import StoryPreviewItem from './StoryPreviewItem';

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
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [isCalculatingSize, setIsCalculatingSize] = useState(false);
  const [albumEmail, setAlbumEmail] = useState('quando.ruggero@gmail.com');

  // Load email setting from IndexedDB
  React.useEffect(() => {
    const loadEmailSetting = async () => {
      try {
        await fantasMiaDB.init();
        const settings = await fantasMiaDB.getSystemSettings();
        if (settings.album_default_email) {
          setAlbumEmail(settings.album_default_email);
          console.log('album-email loaded:', settings.album_default_email);
        }
      } catch (e) {
        console.warn('Error loading email settings, using default', e);
      }
    };
    loadEmailSetting();
  }, []);

  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  // Calculate estimated size when stories change
  React.useEffect(() => {
    const calculateSize = async () => {
      setIsCalculatingSize(true);
      let totalSize = 0;

      for (const story of stories) {
        // Estimate text size
        const txtContent = `Titolo: ${story.title}\nAutore: ${albumAuthor}\n\nTesto:\n${story.text}`;
        totalSize += new Blob([txtContent]).size;

        // Add image size if present
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

      setEstimatedSize(totalSize);
      setIsCalculatingSize(false);
    };

    if (stories.length > 0) {
      calculateSize();
    } else {
      setEstimatedSize(0);
    }
  }, [stories, albumAuthor]);

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

    console.log('📘 AlbumBuilder - storie selezionate:', stories.map(s => ({ id: s.id, title: s.title, mode: s.mode })));

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage('Preparazione...');

    try {
      // Prepare stories with their media assets
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

      console.log('📄 Storie preparate per album:', storiesForAlbum.length);

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

      console.log('🧾 PDF generato, size:', (pdfBlob.size / 1024 / 1024).toFixed(2), 'MB');
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
      
      console.log('📦 ZIP creato con', storiesForAlbum.length, 'file, dimensione:', (zipBlob.size / 1024 / 1024).toFixed(2), 'MB');

      // Save to IndexedDB
      await fantasMiaDB.saveAlbum(albumData);
      console.log('💾 Album salvato in IndexedDB');

      setProgress(100);
      setProgressMessage('Completato!');
      
      toast({
        title: "Album creato",
        description: "L'album è stato generato con successo"
      });

    } catch (error) {
      console.error('❌ Errore generazione album:', error);
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
    
    console.log('⬇️ Download ZIP avviato, dimensione:', (generatedZipBlob.size / 1024 / 1024).toFixed(2), 'MB');
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
      console.log('✉️ Invio email iniziato...');
      
      // Convert blobs to base64
      const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Remove data:mime;base64, prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

      setProgressMessage('Preparazione file...');
      const attachments = [];
      let totalSize = 0;

      // For each story, send only TXT and IMAGE (if present)
      for (const story of stories) {
        // Create TXT file for story
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
        console.log(`📄 File testo preparato: ${safeFilename}.txt`);

        // Add image if present
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
            console.log(`🖼️ Immagine preparata: ${safeFilename}.${imageExt}`);
          }
        }
      }

      // Check total size (10 MB limit)
      const MAX_SIZE = 10 * 1024 * 1024; // 10 MB in bytes
      if (totalSize > MAX_SIZE) {
        const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
        console.error(`❌ File troppo grande: ${sizeMB} MB (limite: 10 MB)`);
        
        setIsGenerating(false);
        toast({
          title: "Errore",
          description: `Il file supera il limite massimo di 10 MB (dimensione: ${sizeMB} MB). Riduci il numero o la dimensione delle immagini prima di procedere.`,
          variant: "destructive"
        });
        return;
      }

      console.log(`✅ Dimensione totale: ${(totalSize / 1024 / 1024).toFixed(2)} MB (entro il limite)`);

      console.log(`album-send to=${albumEmail}`);
      const payload = {
        to: albumEmail,
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

      console.log('➡️ Payload:', {
        subject: payload.subject,
        to: payload.to,
        attachmentsCount: attachments.length,
        attachmentSizes: attachments.map(a => `${a.filename}: ${(a.content.length / 1024).toFixed(2)}KB`)
      });

      setProgressMessage('Invio in corso...');
      
      // Add timeout with AbortController (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('⏰ Request timeout after 30 seconds');
      }, 30000);

      try {
        const response = await fetch('https://fantasmia-ai.vercel.app/api/openai/send_email_ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('📬 Risposta API status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error:', errorText);
          throw new Error(`Errore API: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ API Response:', result);

        setProgressMessage('Completato!');
        setProgress(100);

        toast({
          title: "✅ Email inviata",
          description: "La richiesta di stampa è stata inviata con successo al centro raccolta"
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('❌ Request aborted due to timeout');
          toast({
            title: "Timeout",
            description: "La richiesta ha impiegato troppo tempo. Riprova più tardi o riduci il numero di storie.",
            variant: "destructive"
          });
        } else {
          throw fetchError; // Re-throw to be caught by outer catch
        }
      }
    } catch (error) {
      console.error('❌ Errore invio email:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'invio dell'email",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
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

              {/* Size indicator */}
              <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Dimensione stimata album</Label>
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
                    ⚠️ Limite superato! Rimuovi alcune storie o immagini per procedere.
                  </p>
                )}
                {estimatedSize > MAX_SIZE_BYTES * 0.8 && estimatedSize <= MAX_SIZE_BYTES && (
                  <p className="text-xs text-amber-600">
                    ⚡ Attenzione: vicino al limite massimo
                  </p>
                )}
              </div>

              {/* Stories preview */}
              <div className="space-y-2">
                <Label>Storie selezionate ({stories.length})</Label>
                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  <div className="space-y-2">
                    {stories.map((story, index) => (
                      <StoryPreviewItem
                        key={story.id}
                        story={story}
                        index={index}
                        sortOrder={sortOrder}
                        storiesLength={stories.length}
                        onMoveUp={(i) => moveStory(i, 'up')}
                        onMoveDown={(i) => moveStory(i, 'down')}
                      />
                    ))}
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

          {/* Send to print section - available before PDF generation */}
          {!isGenerating && albumTitle && stories.length > 0 && (
            <div className="pt-4 border-t">
              <Button 
                onClick={handleSendToPrint} 
                size="lg" 
                className={`w-full ${estimatedSize > MAX_SIZE_BYTES ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}
                disabled={isGenerating || estimatedSize > MAX_SIZE_BYTES || isCalculatingSize}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : estimatedSize > MAX_SIZE_BYTES ? (
                  <>⚠️ Dimensione eccessiva</>
                ) : (
                  <>👉 INVIA ALLA STAMPA</>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                {estimatedSize > MAX_SIZE_BYTES 
                  ? 'Riduci la dimensione dell\'album per procedere'
                  : 'Invia le storie selezionate al centro stampa (solo testi e immagini)'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlbumCreatorDialog;
