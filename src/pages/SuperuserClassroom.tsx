import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, School, Play, Square, SkipForward, Copy, Users, Clock, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';
import { useSuperuserGuard } from '@/hooks/useSuperuserGuard';
import { RoomState } from '@/utils/roomSessionManager';

const SuperuserClassroom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isChecking, isAuthorized } = useSuperuserGuard();

  // Room creation
  const [roomName, setRoomName] = useState('');
  const [turnDuration, setTurnDuration] = useState(300); // 5 min default
  const [promptSeed, setPromptSeed] = useState('');
  
  // Active room state (simulated - will connect to API)
  const [activeRoom, setActiveRoom] = useState<{
    token: string;
    room: string;
    roomName: string;
    expiresAt: number;
    participants: number;
    state: RoomState;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  // Generate room token
  const generateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Create new room
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({ title: 'Inserisci un nome per la stanza', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const token = generateToken();
      const roomId = `room_${Date.now()}`;
      const expiresAt = Date.now() + (8 * 60 * 60 * 1000); // 8 ore

      // TODO: Call API to create room
      // await fetch('/api/rooms', { method: 'POST', body: ... })

      setActiveRoom({
        token,
        room: roomId,
        roomName: roomName.trim(),
        expiresAt,
        participants: 0,
        state: {
          turnActive: false,
          turnEndsAt: null,
          promptSeed: promptSeed.trim() || null
        }
      });

      toast({ title: 'Stanza creata!', description: `Token: ${token}` });
    } catch (e) {
      toast({ title: 'Errore nella creazione', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy join link
  const handleCopyLink = () => {
    if (!activeRoom) return;
    const link = `${window.location.origin}/join/${activeRoom.room}?token=${activeRoom.token}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiato negli appunti!' });
  };

  // Start turn
  const handleStartTurn = async () => {
    if (!activeRoom) return;
    setActiveRoom(prev => prev ? {
      ...prev,
      state: {
        ...prev.state,
        turnActive: true,
        turnEndsAt: Date.now() + (turnDuration * 1000)
      }
    } : null);
    toast({ title: 'Turno avviato!' });
    // TODO: Call API action="turn" start=true
  };

  // Stop turn
  const handleStopTurn = async () => {
    if (!activeRoom) return;
    setActiveRoom(prev => prev ? {
      ...prev,
      state: {
        ...prev.state,
        turnActive: false,
        turnEndsAt: null
      }
    } : null);
    toast({ title: 'Turno terminato' });
    // TODO: Call API action="turn" start=false
  };

  // Next turn
  const handleNextTurn = async () => {
    if (!activeRoom) return;
    setActiveRoom(prev => prev ? {
      ...prev,
      state: {
        ...prev.state,
        turnActive: true,
        turnEndsAt: Date.now() + (turnDuration * 1000)
      }
    } : null);
    toast({ title: 'Nuovo turno avviato!' });
    // TODO: Call API action="turn" next=true
  };

  // Update prompt
  const handleUpdatePrompt = async () => {
    if (!activeRoom) return;
    setActiveRoom(prev => prev ? {
      ...prev,
      state: {
        ...prev.state,
        promptSeed: promptSeed.trim() || null
      }
    } : null);
    toast({ title: 'Spunto aggiornato!' });
    // TODO: Call API action="room_patch" promptSeed=...
  };

  // Close room
  const handleCloseRoom = () => {
    setActiveRoom(null);
    setRoomName('');
    setPromptSeed('');
    toast({ title: 'Stanza chiusa' });
  };

  // Format time remaining
  const formatTimeRemaining = (endsAt: number | null) => {
    if (!endsAt) return '--:--';
    const remaining = Math.max(0, endsAt - Date.now());
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Security check
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
                />
              </div>

              <div>
                <Label htmlFor="turnDuration">Durata turno (secondi)</Label>
                <Input
                  id="turnDuration"
                  type="number"
                  min={60}
                  max={1800}
                  value={turnDuration}
                  onChange={(e) => setTurnDuration(parseInt(e.target.value) || 300)}
                  className="mt-1 w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.floor(turnDuration / 60)} minuti e {turnDuration % 60} secondi
                </p>
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
                  onChange={(e) => setPromptSeed(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleCreateRoom} 
                disabled={isLoading || !roomName.trim()}
                className="w-full"
                size="lg"
              >
                <School className="w-5 h-5 mr-2" />
                {isLoading ? 'Creazione...' : 'Crea Stanza'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* ACTIVE ROOM MANAGEMENT */
          <div className="space-y-4">
            {/* Room Info */}
            <Card className="border-2 border-emerald-500/30 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-emerald-800">{activeRoom.roomName}</h2>
                    <p className="text-sm text-emerald-600">Token: <code className="bg-emerald-100 px-2 py-0.5 rounded">{activeRoom.token}</code></p>
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

            {/* Turn Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Controllo Turni
                  </span>
                  {activeRoom.state.turnActive && (
                    <Badge variant="default" className="bg-green-500">
                      TURNO ATTIVO
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-4xl font-mono font-bold text-primary">
                      {formatTimeRemaining(activeRoom.state.turnEndsAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">Tempo rimanente</p>
                  </div>
                  <div className="flex-1 flex gap-2">
                    {!activeRoom.state.turnActive ? (
                      <Button onClick={handleStartTurn} className="flex-1 bg-green-600 hover:bg-green-700">
                        <Play className="w-4 h-4 mr-1" />
                        Avvia Turno
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleStopTurn} variant="destructive" className="flex-1">
                          <Square className="w-4 h-4 mr-1" />
                          Stop
                        </Button>
                        <Button onClick={handleNextTurn} variant="outline" className="flex-1">
                          <SkipForward className="w-4 h-4 mr-1" />
                          Prossimo
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{activeRoom.participants} partecipanti connessi</span>
                </div>
              </CardContent>
            </Card>

            {/* Prompt Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Spunto Comune
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={promptSeed}
                  onChange={(e) => setPromptSeed(e.target.value)}
                  placeholder="Inserisci lo spunto per tutti i partecipanti..."
                  rows={3}
                />
                <Button onClick={handleUpdatePrompt} className="mt-3" variant="secondary">
                  Aggiorna spunto
                </Button>
                {activeRoom.state.promptSeed && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Spunto attivo:</strong> {activeRoom.state.promptSeed}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperuserClassroom;
