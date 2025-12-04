import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Sparkles, AlertCircle, Volume2, VolumeX, Square } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';
import { AuthBridge } from '@/utils/authBridge';
import { useToast } from '@/hooks/use-toast';
import {
  getOrCreateActiveGroupStory,
  addContribution,
  getLastLine,
  getGroupStoryStats,
  checkCompletionConditions
} from '@/lib/groupStoryManager';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUnifiedTTS } from '@/hooks/useUnifiedTTS';

const GroupStoryEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [groupStoryId, setGroupStoryId] = useState<string>('');
  const [lastLine, setLastLine] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [stats, setStats] = useState<{ totalContributions: number; uniqueUsers: number; lastContributor: string | null }>({
    totalContributions: 0,
    uniqueUsers: 0,
    lastContributor: null
  });
  const [showIntro, setShowIntro] = useState(true);

  // TTS hook per leggere l'ultima riga
  const tts = useUnifiedTTS();

  useEffect(() => {
    const initialize = async () => {
      try {
        const auth = await AuthBridge.isAuthenticated();
        if (!auth.authenticated) {
          navigate('/');
          return;
        }

        setUserId(auth.userId);
        setUserName(auth.userName);
        setIsSuperuser(auth.userName === 'superuser' || auth.userName === 'Superuser');

        // Get or create active group story
        const activeStory = await getOrCreateActiveGroupStory();
        setGroupStoryId(activeStory.id);

        // Load last line if contributions exist
        const line = await getLastLine(activeStory.id);
        setLastLine(line);

        // Load stats
        const storyStats = await getGroupStoryStats(activeStory.id);
        setStats(storyStats);

        setLoading(false);
      } catch (error) {
        console.error('Error initializing:', error);
        toast({
          title: 'Errore',
          description: 'Errore durante il caricamento della storia di gruppo',
          variant: 'destructive'
        });
        navigate('/dashboard');
      }
    };

    initialize();
  }, [navigate, toast]);

  // Stop TTS when unmounting
  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, []);

  const handleTTSClick = () => {
    const textToRead = lastLine || content || 'Nessun testo da leggere';
    
    if (tts.isPlaying && !tts.isPaused) {
      tts.pause();
    } else {
      // Both resume from pause and new playback use speak()
      tts.speak(textToRead, 'italian');
    }
  };

  const handleStopTTS = () => {
    tts.stop();
  };

  const getTTSButtonText = () => {
    if (tts.isPlaying) return 'Pausa';
    if (tts.isPaused) return 'Riprendi';
    return 'Leggi';
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: 'Attenzione',
        description: 'Scrivi almeno tre righe prima di salvare',
        variant: 'destructive'
      });
      return;
    }

    // Validate at least 3 lines
    const lines = content.trim().split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 3) {
      toast({
        title: 'Attenzione',
        description: 'Il tuo contributo deve contenere almeno 3 righe',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);

    try {
      const result = await addContribution(groupStoryId, userId, userName, content.trim());

      if (!result.success) {
        toast({
          title: 'Errore',
          description: result.error || 'Errore durante il salvataggio',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      if (result.pendingApproval) {
        // Story completed but waiting for SU approval
        toast({
          title: '📝 Storia Inviata!',
          description: 'La storia è stata inviata per l\'approvazione del Superuser. Riceverai una notifica quando sarà pubblicata.',
          duration: 6000
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 2500);
      } else if (result.completed && result.agStoryId) {
        // Story completed and published (legacy - should not happen with new flow)
        toast({
          title: '🎉 Storia Completata!',
          description: 'La storia di gruppo è stata completata e archiviata in AG - Storie di Lettura',
          duration: 5000
        });

        setTimeout(() => {
          navigate(`/ag-story-detail/${result.agStoryId}`);
        }, 2000);
      } else {
        // Contribution saved, waiting for more
        toast({
          title: 'Contributo salvato!',
          description: 'Il tuo contributo è stato aggiunto. Attendi che un altro utente continui la storia.',
          duration: 4000
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving contribution:', error);
      toast({
        title: 'Errore',
        description: 'Errore durante il salvataggio del contributo',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StoryLayout
        title="Storia di Gruppo"
        subtitle="Caricamento..."
        onBack={() => navigate('/dashboard')}
        showHomeButton
      >
        <div className="flex items-center justify-center p-12">
          <div className="text-lg text-muted-foreground">Caricamento...</div>
        </div>
      </StoryLayout>
    );
  }

  return (
    <>
      <StoryLayout
        title="Storia di Gruppo"
        subtitle="Scrivi insieme agli altri - Modalità collaborativa"
        onBack={() => navigate('/dashboard')}
        showHomeButton
        backgroundColor="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50"
      >
        <div className="space-y-6">
          {/* Writing Area - Unico card con statistiche integrate */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Il tuo contributo (3 righe)</CardTitle>
                  
                  {/* Stats integrate nel header */}
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-purple-700">{stats.totalContributions}</div>
                      <div className="text-xs text-muted-foreground">Contributi</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-700">{stats.uniqueUsers}</div>
                      <div className="text-xs text-muted-foreground">Autori</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-700">
                        {lastLine ? '✅' : '🆕'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lastLine ? 'In corso' : 'Nuova'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last Line Preview - integrato nel header */}
                {lastLine && (
                  <div className="p-3 bg-pink-50/50 border border-pink-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm text-pink-900 flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4" />
                          <span className="font-semibold">
                            Ultima riga scritta{stats.lastContributor && ` da ${stats.lastContributor}`}:
                          </span>
                        </div>
                        <p className="italic text-pink-800 text-sm leading-relaxed">
                          "{lastLine}"
                        </p>
                      </div>
                      
                      {/* TTS Buttons */}
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleTTSClick}
                          className="gap-1 text-pink-700 hover:text-pink-900 hover:bg-pink-100"
                        >
                          {tts.isPlaying ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                          <span className="text-xs">{getTTSButtonText()}</span>
                        </Button>
                        {(tts.isPlaying || tts.isPaused) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleStopTTS}
                            className="text-pink-700 hover:text-pink-900 hover:bg-pink-100"
                          >
                            <Square className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Scrivi qui le tue tre righe per continuare la storia...&#10;&#10;Ricorda: solo 3 righe!&#10;&#10;Scrivi 'felici e contenti/e' per concludere (se ci sono almeno 3 contributi e 2 utenti)."
                className="min-h-[200px] text-base leading-relaxed"
                disabled={saving}
              />

              {stats.lastContributor === userName && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Hai scritto l'ultimo contributo. Attendi che un altro utente continui la storia prima di poter scrivere di nuovo.
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={saving}
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || stats.lastContributor === userName}
                  className="gap-2"
                >
                  {saving ? (
                    <>Salvataggio...</>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Contribuisci
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </StoryLayout>

      {/* Introduction Dialog */}
      <AlertDialog open={showIntro} onOpenChange={setShowIntro}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Users className="w-6 h-6 text-violet-600" />
              Benvenuto nella Storia di Gruppo!
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-left pt-4">
              <p className="text-base">
                Questa è una modalità <strong>collaborativa</strong> dove tutti gli utenti contribuiscono a creare una storia insieme.
              </p>
              
              {isSuperuser && (
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                  <p className="text-sm text-violet-800">
                    <strong>Nota per il Superuser:</strong> Durante la scrittura collaborativa partecipi come un utente normale 
                    (3 righe per volta). I tuoi privilegi di approvazione e MEDIA(AI) saranno disponibili solo dopo la chiusura della storia.
                  </p>
                </div>
              )}
              
              <div className="space-y-2 pt-2">
                <p className="font-semibold text-foreground">Come funziona:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Ogni utente scrive <strong>solo 3 righe, terminate con il tasto A CAPO</strong></li>
                  <li>Vedi solo l'ultima riga del contributo precedente</li>
                  <li>Non puoi scrivere due volte consecutive</li>
                  <li>La storia termina quando qualcuno scrive "<strong>felici e contenti/e</strong>"</li>
                  <li>Servono almeno <strong>3 contributi</strong> e <strong>2 utenti diversi</strong></li>
                  <li>La storia verrà approvata dal <strong>Superuser</strong> prima della pubblicazione</li>
                </ul>
              </div>

              <p className="text-base pt-2">
                Al termine, la storia completa viene salvata in <strong>AG - Storie di Lettura</strong> con autore "il gruppo".
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowIntro(false)} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Inizia a scrivere
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GroupStoryEditor;
