import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Clock, Send, Users, BookOpen, AlertCircle, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  getRoomSession, 
  refreshRoomState, 
  submitText, 
  getPollingInterval,
  clearRoomSession,
  RoomSession,
  RoomState
} from '@/utils/roomSessionManager';

const Classroom: React.FC = () => {
  const { room } = useParams<{ room: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<RoomSession | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contribution, setContribution] = useState('');
  const [countdown, setCountdown] = useState('--:--');
  const [roomCountdown, setRoomCountdown] = useState('');

  // Load session on mount
  useEffect(() => {
    const storedSession = getRoomSession();
    if (!storedSession || storedSession.room !== room) {
      // Session not found or mismatch, redirect to join
      navigate(`/join/${room}`, { replace: true });
      return;
    }
    setSession(storedSession);
    setRoomState(storedSession.roomState);
    setLoading(false);
  }, [room, navigate]);

  // Polling for state updates
  useEffect(() => {
    if (!session) return;

    const pollState = async () => {
      const newState = await refreshRoomState(session);
      if (newState) {
        setRoomState(newState);
        // Update session reference
        const updatedSession = getRoomSession();
        if (updatedSession) setSession(updatedSession);
      }
    };

    const interval = setInterval(pollState, getPollingInterval());
    return () => clearInterval(interval);
  }, [session]);

  // Turn countdown timer - gestisce anche lo stato di pausa
  useEffect(() => {
    if (!roomState) {
      setCountdown('--:--');
      return;
    }

    // Se in pausa, mostra il tempo residuo fisso
    if (roomState.turn_paused) {
      if (roomState.turn_remaining_ms != null) {
        const mins = Math.floor(roomState.turn_remaining_ms / 60000);
        const secs = Math.floor((roomState.turn_remaining_ms % 60000) / 1000);
        setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      } else {
        setCountdown('PAUSA');
      }
      return;
    }

    // Se nessun turno attivo
    if (!roomState.turn_ends_at) {
      setCountdown('--:--');
      return;
    }

    // Countdown normale
    const updateCountdown = () => {
      const remaining = Math.max(0, roomState.turn_ends_at! - Date.now());
      if (remaining <= 0) {
        setCountdown('00:00');
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [roomState?.turn_ends_at, roomState?.turn_paused, roomState?.turn_remaining_ms]);

  // Room expiry countdown
  useEffect(() => {
    if (!roomState?.expires_at) return;

    const updateRoomCountdown = () => {
      const remaining = Math.max(0, roomState.expires_at - Date.now());
      if (remaining <= 0) {
        setRoomCountdown('Scaduta');
        clearRoomSession();
        navigate('/', { replace: true });
      } else {
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        setRoomCountdown(`${hours}h ${mins}m`);
      }
    };

    updateRoomCountdown();
    const interval = setInterval(updateRoomCountdown, 60000);
    return () => clearInterval(interval);
  }, [roomState?.expires_at, navigate]);

  // Handle text submission
  const handleSubmit = useCallback(async () => {
    if (!session || !contribution.trim()) return;
    
    setSubmitting(true);
    const result = await submitText(session, contribution.trim());
    setSubmitting(false);

    if (result.success) {
      setContribution('');
      if (result.roomState) {
        setRoomState(result.roomState);
      }
      toast({ title: 'Contributo inviato!' });
    } else {
      toast({ 
        title: 'Errore', 
        description: result.error || 'Impossibile inviare il contributo',
        variant: 'destructive' 
      });
    }
  }, [session, contribution, toast]);

  // Computed values
  const isMyTurn = session && roomState 
    ? roomState.current_writer_index === session.writer_index 
    : false;
  
  const currentWriter = roomState?.writers[roomState.current_writer_index] || 'Nessuno';
  const turnPaused = roomState?.turn_paused ?? false;
  const turnActive = roomState?.turn_ends_at ? roomState.turn_ends_at > Date.now() : false;
  
  // NSU può scrivere solo se è il suo turno, turno attivo E NON in pausa
  const canWrite = isMyTurn && turnActive && !turnPaused;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
          <p className="text-emerald-700">Caricamento stanza...</p>
        </div>
      </div>
    );
  }

  if (!session || !roomState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold">Sessione non trovata</h2>
            <p className="text-muted-foreground">
              La sessione è scaduta o non valida.
            </p>
            <Button onClick={() => navigate('/', { replace: true })}>
              Torna alla Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col">
      {/* Header con titolo attività */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-emerald-900 text-center">
            {roomState.activity_title || 'Classroom'}
          </h1>
        </div>
      </header>

      {/* Info bar */}
      <div className="bg-emerald-600 text-white py-2 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {session.room_name}
            </Badge>
            <span className="text-emerald-100">|</span>
            <span className="text-emerald-100 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Scade tra {roomCountdown}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{roomState.writers.length} partecipanti</span>
            <span className="text-emerald-100">|</span>
            <span className="font-medium">{session.writer_id}</span>
          </div>
        </div>
      </div>

      {/* Pausa banner - visibile a tutti quando il turno è in pausa */}
      {turnPaused && (
        <div className="bg-amber-500 text-white py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <Pause className="w-5 h-5" />
            <span className="font-medium">TURNO IN PAUSA</span>
            <span className="text-amber-100">- L'insegnante ha messo in pausa l'attività</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Spunto comune */}
          {roomState.prompt_seed && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Spunto comune
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-emerald-900 italic">{roomState.prompt_seed}</p>
              </CardContent>
            </Card>
          )}

          {/* Storia finora */}
          <Card className="border-emerald-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-emerald-800">
                Storia finora
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-48 md:h-64 rounded-md border p-3 bg-white">
                {roomState.story_so_far ? (
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {roomState.story_so_far}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">
                    La storia non è ancora iniziata. Attendi il tuo turno per scrivere!
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Area di scrittura */}
          <Card className={`border-2 transition-colors ${
            turnPaused
              ? 'border-amber-400 bg-amber-50'
              : canWrite 
                ? 'border-emerald-500 bg-white shadow-lg' 
                : 'border-slate-200 bg-slate-50'
          }`}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {turnPaused 
                    ? 'Turno in pausa...'
                    : canWrite 
                      ? 'È il tuo turno! Scrivi...' 
                      : 'Il tuo contributo'
                  }
                </CardTitle>
                <div className="flex items-center gap-2">
                  {turnPaused ? (
                    <Badge variant="secondary" className="bg-amber-500 text-white">
                      <Pause className="w-3 h-3 mr-1" />
                      PAUSA
                    </Badge>
                  ) : turnActive ? (
                    <Badge 
                      variant={isMyTurn ? 'default' : 'secondary'}
                      className={isMyTurn ? 'bg-emerald-600' : ''}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {countdown}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {turnPaused ? (
                <div className="text-center py-8 text-amber-700">
                  <Pause className="w-8 h-8 mx-auto mb-2 opacity-70" />
                  <p className="font-medium">Attività in pausa</p>
                  <p className="text-sm mt-1 text-amber-600">
                    Tempo residuo: <strong>{countdown}</strong>
                  </p>
                </div>
              ) : canWrite ? (
                <>
                  <Textarea
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                    placeholder="Continua la storia..."
                    className="min-h-32 resize-none focus:ring-emerald-500"
                    disabled={submitting}
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={!contribution.trim() || submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Invia contributo
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">In attesa del turno</p>
                  <p className="text-sm mt-1">
                    Ora scrive: <strong className="text-emerald-700">{currentWriter}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista writers */}
          <Card className="border-slate-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Partecipanti ({roomState.writers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {roomState.writers.map((writer, index) => (
                  <Badge
                    key={writer}
                    variant={index === roomState.current_writer_index ? 'default' : 'outline'}
                    className={`${
                      index === roomState.current_writer_index 
                        ? 'bg-emerald-600' 
                        : ''
                    } ${
                      writer === session.writer_id 
                        ? 'ring-2 ring-emerald-400 ring-offset-1' 
                        : ''
                    }`}
                  >
                    {writer}
                    {index === roomState.current_writer_index && (
                      <span className="ml-1">✍️</span>
                    )}
                    {writer === session.writer_id && (
                      <span className="ml-1">(tu)</span>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default Classroom;
