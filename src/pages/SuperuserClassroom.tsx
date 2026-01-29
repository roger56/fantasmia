import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, School, SkipForward, Copy, Users, Sparkles, Loader2, Lock, BookOpen, Pause, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';
import { useSuperuserGuard } from '@/hooks/useSuperuserGuard';
import { nextTurn, pauseTurn, resumeTurn, type RoomState } from '@/utils/roomSessionManager';
import { getAdminToken, adminLogin, adminCheck } from '@/lib/adminAuth';

// API Endpoint
const ROOMS_API_URL = 'https://fantasmia-ai.vercel.app/api/admin/rooms';

function getAdminJwt(): string | null {
  return getAdminToken();
}

// API V2 Room State interface (for SU management)
interface SUActiveRoom {
  room: string;
  roomName: string;
  activityTitle: string;
  roomMode: 'CONTINUA_TU' | 'CAMPBELL' | 'PROPP';
  expiresAt: number;
  turnS: number;
  promptSeed: string;
  storySoFar: string;
  writers: string[];
  currentWriterIndex: number;
  turnEndsAt: number | null;
  turnPaused: boolean;
  turnRemainingMs: number | null;
}

const SuperuserClassroom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isChecking, isAuthorized } = useSuperuserGuard();

  // API Authentication state
  const [isApiAuthenticated, setIsApiAuthenticated] = useState<boolean | null>(null);
  const [apiPassword, setApiPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Room creation
  const [roomName, setRoomName] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [turnDuration, setTurnDuration] = useState(180); // 3 min default (in secondi)
  const [promptSeed, setPromptSeed] = useState('');
  const [ttlHours, setTtlHours] = useState(4); // 4 ore default
  
  // Active room state
  const [activeRoom, setActiveRoom] = useState<SUActiveRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState('--:--');

  // Verifica se esiste già un JWT valido all'avvio
  useEffect(() => {
    const checkApiAuth = async () => {
      const token = getAdminToken();
      if (token) {
        const isValid = await adminCheck();
        setIsApiAuthenticated(isValid);
      } else {
        setIsApiAuthenticated(false);
      }
    };
    
    if (isAuthorized) {
      checkApiAuth();
    }
  }, [isAuthorized]);

  // Handler per autenticazione API
  const handleApiLogin = async () => {
    if (!apiPassword.trim()) {
      toast({ title: 'Inserisci la password API', variant: 'destructive' });
      return;
    }

    setIsAuthenticating(true);
    try {
      await adminLogin(apiPassword);
      setIsApiAuthenticated(true);
      setApiPassword('');
      toast({ title: 'Autenticazione completata!' });
    } catch (error) {
      toast({ 
        title: 'Errore autenticazione', 
        description: error instanceof Error ? error.message : 'Password non valida',
        variant: 'destructive' 
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Aggiorna il timer ogni secondo - basato su room_state
  useEffect(() => {
    if (!activeRoom) {
      setTimerDisplay('--:--');
      return;
    }

    // Se in pausa, mostra tempo residuo fisso
    if (activeRoom.turnPaused) {
      if (activeRoom.turnRemainingMs != null) {
        const mins = Math.floor(activeRoom.turnRemainingMs / 60000);
        const secs = Math.floor((activeRoom.turnRemainingMs % 60000) / 1000);
        setTimerDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
      } else {
        setTimerDisplay('IN PAUSA');
      }
      return;
    }

    // Se nessun turno attivo
    if (!activeRoom.turnEndsAt) {
      setTimerDisplay('--:--');
      return;
    }

    // Countdown normale
    const interval = setInterval(() => {
      const remaining = Math.max(0, activeRoom.turnEndsAt! - Date.now());
      if (remaining <= 0) {
        setTimerDisplay('00:00');
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimerDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRoom?.turnEndsAt, activeRoom?.turnPaused, activeRoom?.turnRemainingMs]);

  // Helper per aggiornare activeRoom da room_state
  const updateActiveRoomFromState = useCallback((rs: RoomState) => {
    setActiveRoom(prev => prev ? {
      ...prev,
      storySoFar: rs.story_so_far || '',
      writers: rs.writers || [],
      currentWriterIndex: rs.current_writer_index ?? 0,
      turnEndsAt: rs.turn_ends_at ?? null,
      turnPaused: rs.turn_paused ?? false,
      turnRemainingMs: rs.turn_remaining_ms ?? null,
      promptSeed: rs.prompt_seed || ''
    } : null);
  }, []);

  // Polling room state every 3s when active
  useEffect(() => {
    if (!activeRoom) return;

    const pollState = async () => {
      try {
        const response = await fetch(ROOMS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_state', room: activeRoom.room })
        });

        if (!response.ok) return;

        const data = await response.json();
        const rs = data.room_state;
        
        if (rs) {
          updateActiveRoomFromState(rs);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const interval = setInterval(pollState, 3000);
    return () => clearInterval(interval);
  }, [activeRoom?.room, updateActiveRoomFromState]);

  // CREATE ROOM - API call action="create"
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({ title: 'Inserisci un nome per la stanza', variant: 'destructive' });
      return;
    }

    const adminJwt = getAdminJwt();
    if (!adminJwt) {
      toast({ title: 'Sessione scaduta, effettua nuovamente il login', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(ROOMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminJwt}`
        },
        body: JSON.stringify({
          action: 'create',
          room_name: roomName.trim(),
          activity_title: activityTitle.trim() || roomName.trim(),
          room_mode: 'CONTINUA_TU',
          turn_s: turnDuration,
          ttl_h: ttlHours,
          prompt_seed: promptSeed.trim() || undefined
        })
      });

      if (response.status === 401) {
        setIsApiAuthenticated(false);
        toast({ title: 'Sessione scaduta, rifai login', variant: 'destructive' });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Errore ${response.status}`);
      }

      const data = await response.json();
      
      setActiveRoom({
        room: data.room,
        roomName: data.room_name || roomName.trim(),
        activityTitle: activityTitle.trim() || roomName.trim(),
        roomMode: 'CONTINUA_TU',
        expiresAt: data.expires_at,
        turnS: data.turn_s || turnDuration,
        promptSeed: promptSeed.trim(),
        storySoFar: '',
        writers: [],
        currentWriterIndex: 0,
        turnEndsAt: null,
        turnPaused: false,
        turnRemainingMs: null
      });

      toast({ 
        title: 'Stanza creata!', 
        description: `Room: ${data.room} - Link pronto per la condivisione`
      });

    } catch (error) {
      console.error('Create room error:', error);
      toast({ 
        title: 'Errore nella creazione', 
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy join link - NO TOKEN, solo room
  const handleCopyLink = useCallback(() => {
    if (!activeRoom) return;
    const baseUrl = 'https://fantasmia.it';
    const link = `${baseUrl}/join/${encodeURIComponent(activeRoom.room)}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiato negli appunti!' });
  }, [activeRoom, toast]);

  // Next turn
  const handleNextTurn = async () => {
    if (!activeRoom) return;
    const adminJwt = getAdminJwt();
    if (!adminJwt) {
      toast({ title: 'Sessione scaduta', variant: 'destructive' });
      return;
    }

    const result = await nextTurn(activeRoom.room, adminJwt, activeRoom.turnS);
    if (result.success && result.roomState) {
      updateActiveRoomFromState(result.roomState);
      toast({ title: 'Turno avanzato!' });
    } else {
      toast({ 
        title: 'Errore avanzamento turno', 
        description: result.error || 'Errore sconosciuto',
        variant: 'destructive' 
      });
    }
  };

  // Pause turn
  const handlePauseTurn = async () => {
    if (!activeRoom) return;
    const adminJwt = getAdminJwt();
    if (!adminJwt) {
      toast({ title: 'Sessione scaduta', variant: 'destructive' });
      return;
    }

    const result = await pauseTurn(activeRoom.room, adminJwt);
    if (result.success && result.roomState) {
      updateActiveRoomFromState(result.roomState);
      toast({ title: 'Turno in pausa' });
    } else {
      toast({ 
        title: 'Errore pausa', 
        description: result.error || 'Errore sconosciuto',
        variant: 'destructive' 
      });
    }
  };

  // Resume turn
  const handleResumeTurn = async () => {
    if (!activeRoom) return;
    const adminJwt = getAdminJwt();
    if (!adminJwt) {
      toast({ title: 'Sessione scaduta', variant: 'destructive' });
      return;
    }

    const result = await resumeTurn(activeRoom.room, adminJwt);
    if (result.success && result.roomState) {
      updateActiveRoomFromState(result.roomState);
      toast({ title: 'Turno ripreso!' });
    } else {
      toast({ 
        title: 'Errore ripresa', 
        description: result.error || 'Errore sconosciuto',
        variant: 'destructive' 
      });
    }
  };

  // Close room
  const handleCloseRoom = () => {
    setActiveRoom(null);
    setRoomName('');
    setActivityTitle('');
    setPromptSeed('');
    toast({ title: 'Stanza chiusa localmente', description: 'La room scadrà automaticamente sul server' });
  };

  // Security check
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // API Authentication check
  if (isApiAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isApiAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <HomeButton />
        <div className="max-w-md mx-auto pt-20">
          <Card className="border-2 border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                Autenticazione API richiesta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Per gestire le Classroom è necessario autenticarsi con la password API.
              </p>
              <div>
                <Label htmlFor="apiPassword">Password API</Label>
                <Input
                  id="apiPassword"
                  type="password"
                  placeholder="Inserisci password API..."
                  value={apiPassword}
                  onChange={(e) => setApiPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleApiLogin()}
                  className="mt-1"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/superuser-settings')}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Indietro
                </Button>
                <Button 
                  onClick={handleApiLogin} 
                  disabled={isAuthenticating || !apiPassword.trim()}
                  className="flex-1"
                >
                  {isAuthenticating ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4 mr-1" />
                  )}
                  Autentica
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentWriter = activeRoom?.writers[activeRoom.currentWriterIndex] || 'Nessuno';
  const isTurnActiveAndNotPaused = activeRoom?.turnEndsAt && activeRoom.turnEndsAt > Date.now() && !activeRoom.turnPaused;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/superuser-settings')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <School className="w-6 h-6 text-primary" />
                Gestione Classroom
              </h1>
              <p className="text-slate-600">Crea e gestisci stanze collaborative</p>
            </div>
          </div>
        </div>

        {!activeRoom ? (
          /* CREATE ROOM FORM */
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5" />
                Crea nuova stanza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="roomName">Nome stanza *</Label>
                <Input
                  id="roomName"
                  placeholder="Es: Classe 3B - Laboratorio Storie"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="mt-1"
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor="activityTitle">Titolo attività *</Label>
                <Input
                  id="activityTitle"
                  placeholder="Es: Cosa succede se... scoppia la ridarola?"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  className="mt-1"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Questo titolo sarà visibile a tutti i partecipanti
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="turnDuration">Durata turno (secondi)</Label>
                  <Input
                    id="turnDuration"
                    type="number"
                    min={15}
                    max={600}
                    value={turnDuration}
                    onChange={(e) => setTurnDuration(Math.max(15, Math.min(600, parseInt(e.target.value) || 180)))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor(turnDuration / 60)}m {turnDuration % 60}s (min 15s, max 10m)
                  </p>
                </div>
                <div>
                  <Label htmlFor="ttlHours">Durata stanza (ore)</Label>
                  <Input
                    id="ttlHours"
                    type="number"
                    min={1}
                    max={24}
                    value={ttlHours}
                    onChange={(e) => setTtlHours(Math.max(1, Math.min(24, parseInt(e.target.value) || 4)))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    La stanza scade dopo {ttlHours} ore
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="promptSeed">
                  Spunto comune (opzionale)
                  <Sparkles className="w-4 h-4 inline ml-1 text-amber-500" />
                </Label>
                <Textarea
                  id="promptSeed"
                  placeholder="Es: Scrivi una storia che inizia con 'Era una notte tempestosa...'"
                  value={promptSeed}
                  onChange={(e) => setPromptSeed(e.target.value.slice(0, 600))}
                  className="mt-1"
                  rows={3}
                  maxLength={600}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {promptSeed.length}/600 caratteri
                </p>
              </div>

              <Button 
                onClick={handleCreateRoom} 
                disabled={isLoading || !roomName.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <School className="w-5 h-5 mr-2" />
                )}
                {isLoading ? 'Creazione in corso...' : 'Crea Stanza'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* ACTIVE ROOM MANAGEMENT */
          <div className="space-y-4">
            {/* Room Info */}
            <Card className="border-2 border-emerald-500/30 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-emerald-800">{activeRoom.activityTitle}</h2>
                    <p className="text-sm text-emerald-600">
                      Stanza: <code className="bg-emerald-100 px-2 py-0.5 rounded">{activeRoom.room}</code>
                    </p>
                    <p className="text-xs text-emerald-500 mt-1">
                      Scade: {new Date(activeRoom.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copia link
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleCloseRoom}>
                      Chiudi stanza
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Writers & Turn Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Partecipanti ({activeRoom.writers.length})
                  </span>
                  {activeRoom.turnPaused ? (
                    <Badge variant="secondary" className="bg-amber-500 text-white">
                      IN PAUSA
                    </Badge>
                  ) : isTurnActiveAndNotPaused ? (
                    <Badge variant="default" className="bg-green-500">
                      TURNO ATTIVO
                    </Badge>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeRoom.writers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    In attesa che i partecipanti si uniscano...
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeRoom.writers.map((writer, index) => (
                      <Badge
                        key={writer}
                        variant={index === activeRoom.currentWriterIndex ? 'default' : 'outline'}
                        className={index === activeRoom.currentWriterIndex ? 'bg-emerald-600' : ''}
                      >
                        {writer}
                        {index === activeRoom.currentWriterIndex && <span className="ml-1">✍️</span>}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[100px]">
                    <p className={`text-4xl font-mono font-bold ${activeRoom.turnPaused ? 'text-amber-600' : 'text-primary'}`}>
                      {activeRoom.turnPaused ? 'PAUSA' : timerDisplay}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeRoom.turnPaused ? `Residuo: ${timerDisplay}` : 'Tempo rimanente'}
                    </p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm">
                      <strong>Ora scrive:</strong> {currentWriter}
                    </p>
                    
                    {/* Controlli turno */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleNextTurn} 
                        className="flex-1"
                        disabled={activeRoom.writers.length === 0}
                      >
                        <SkipForward className="w-4 h-4 mr-1" />
                        Prossimo Turno
                      </Button>
                      
                      {/* Pulsante Pausa/Riprendi */}
                      {activeRoom.turnPaused ? (
                        <Button 
                          onClick={handleResumeTurn} 
                          variant="secondary"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Riprendi
                        </Button>
                      ) : (
                        <Button 
                          onClick={handlePauseTurn} 
                          variant="secondary"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          disabled={!isTurnActiveAndNotPaused}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pausa
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Durata turno: {Math.floor(activeRoom.turnS / 60)}m {activeRoom.turnS % 60}s
                </p>
              </CardContent>
            </Card>

            {/* Story So Far */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Storia finora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-4 min-h-32 max-h-64 overflow-auto">
                  {activeRoom.storySoFar ? (
                    <p className="whitespace-pre-wrap">{activeRoom.storySoFar}</p>
                  ) : (
                    <p className="text-muted-foreground italic">La storia non è ancora iniziata...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prompt Display (read-only, set at creation) */}
            {activeRoom.promptSeed && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Spunto Comune
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      {activeRoom.promptSeed}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperuserClassroom;
