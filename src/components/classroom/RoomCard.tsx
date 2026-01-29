import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, SkipForward, Pause, Play, Square, BookOpen, Sparkles, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nextTurn, pauseTurn, resumeTurn, stopTurn, type RoomListItem } from '@/utils/roomSessionManager';

interface RoomCardProps {
  roomData: RoomListItem;
  adminJwt: string;
  defaultTurnS: number;
  onSessionExpired: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ 
  roomData, 
  adminJwt, 
  defaultTurnS,
  onSessionExpired 
}) => {
  const { toast } = useToast();
  const { room, room_state } = roomData;
  const [timerDisplay, setTimerDisplay] = useState('--:--');

  // Countdown timer che si aggiorna ogni secondo
  useEffect(() => {
    // Se in pausa, mostra tempo residuo fisso
    if (room_state.turn_paused) {
      if (room_state.turn_remaining_ms != null) {
        const mins = Math.floor(room_state.turn_remaining_ms / 60000);
        const secs = Math.floor((room_state.turn_remaining_ms % 60000) / 1000);
        setTimerDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
      } else {
        setTimerDisplay('IN PAUSA');
      }
      return;
    }

    // Se nessun turno attivo
    if (!room_state.turn_ends_at) {
      setTimerDisplay('--:--');
      return;
    }

    // Countdown normale - aggiorna ogni secondo
    const updateTimer = () => {
      const remaining = Math.max(0, room_state.turn_ends_at! - Date.now());
      if (remaining <= 0) {
        setTimerDisplay('00:00');
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimerDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [room_state.turn_ends_at, room_state.turn_paused, room_state.turn_remaining_ms]);

  // Calcola countdown scadenza stanza
  const getExpiresIn = () => {
    if (!room_state.expires_at) return '--';
    const remaining = room_state.expires_at - Date.now();
    if (remaining <= 0) return 'Scaduta';
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleCopyLink = () => {
    const link = `https://fantasmia.it/join/${encodeURIComponent(room)}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiato negli appunti!' });
  };

  const handleNextTurn = async () => {
    const result = await nextTurn(room, adminJwt, defaultTurnS);
    if (result.success) {
      toast({ title: 'Turno avanzato!' });
    } else {
      if (result.error?.includes('scaduta')) onSessionExpired();
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
    }
  };

  const handlePauseTurn = async () => {
    const result = await pauseTurn(room, adminJwt);
    if (result.success) {
      toast({ title: 'Turno in pausa' });
    } else {
      if (result.error?.includes('scaduta')) onSessionExpired();
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
    }
  };

  const handleResumeTurn = async () => {
    const result = await resumeTurn(room, adminJwt);
    if (result.success) {
      toast({ title: 'Turno ripreso!' });
    } else {
      if (result.error?.includes('scaduta')) onSessionExpired();
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
    }
  };

  const handleStopTurn = async () => {
    const result = await stopTurn(room, adminJwt);
    if (result.success) {
      toast({ title: 'Turno fermato' });
    } else {
      if (result.error?.includes('scaduta')) onSessionExpired();
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
    }
  };

  const currentWriter = room_state.writers[room_state.current_writer_index] || 'Nessuno';
  const isTurnActiveAndNotPaused = room_state.turn_ends_at && room_state.turn_ends_at > Date.now() && !room_state.turn_paused;

  return (
    <Card className="border-2 border-primary/20 bg-card">
      {/* Header con info stanza */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{room_state.room_name}</CardTitle>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {room_state.activity_title}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {room_state.room_mode}
              </Badge>
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getExpiresIn()}
              </Badge>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">{room}</code>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Writers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <Users className="w-4 h-4" />
              Partecipanti ({room_state.writers.length})
            </span>
            {room_state.turn_paused ? (
              <Badge variant="secondary" className="bg-amber-500 text-white text-xs">
                IN PAUSA
              </Badge>
            ) : isTurnActiveAndNotPaused ? (
              <Badge variant="default" className="bg-green-500 text-xs">
                ATTIVO
              </Badge>
            ) : null}
          </div>
          
          {room_state.writers.length === 0 ? (
            <p className="text-xs text-muted-foreground">In attesa di partecipanti...</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {room_state.writers.map((writer, index) => (
                <Badge
                  key={writer}
                  variant={index === room_state.current_writer_index ? 'default' : 'outline'}
                  className={`text-xs ${index === room_state.current_writer_index ? 'bg-emerald-600' : ''}`}
                >
                  {writer}
                  {index === room_state.current_writer_index && <span className="ml-1">✍️</span>}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Timer e controlli */}
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
          <div className="text-center min-w-[70px]">
            <p className={`text-2xl font-mono font-bold ${room_state.turn_paused ? 'text-amber-600' : 'text-primary'}`}>
              {room_state.turn_paused ? 'PAUSA' : timerDisplay}
            </p>
            {room_state.turn_paused && room_state.turn_remaining_ms != null && (
              <p className="text-[10px] text-muted-foreground">
                Residuo: {timerDisplay}
              </p>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-xs">
              <strong>Scrive:</strong> {currentWriter}
            </p>
            
            {/* Bottoni controllo */}
            <div className="flex gap-1 flex-wrap">
              <Button 
                size="sm" 
                variant="default"
                onClick={handleNextTurn}
                disabled={room_state.writers.length === 0}
                className="h-7 text-xs"
              >
                <SkipForward className="w-3 h-3 mr-1" />
                Prossimo
              </Button>

              {room_state.turn_paused ? (
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handleResumeTurn}
                  className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Riprendi
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handlePauseTurn}
                  disabled={!isTurnActiveAndNotPaused}
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Pausa
                </Button>
              )}

              <Button 
                size="sm" 
                variant="outline"
                onClick={handleStopTurn}
                disabled={!room_state.turn_ends_at && !room_state.turn_paused}
                className="h-7 text-xs"
              >
                <Square className="w-3 h-3 mr-1" />
                Stop
              </Button>
            </div>
          </div>
        </div>

        {/* Storia finora (collassata) */}
        {room_state.story_so_far && (
          <details className="text-xs">
            <summary className="cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <BookOpen className="w-3 h-3" />
              Storia finora ({room_state.story_so_far.length} caratteri)
            </summary>
            <div className="mt-2 p-2 bg-background border rounded max-h-24 overflow-auto">
              <p className="whitespace-pre-wrap text-xs">{room_state.story_so_far}</p>
            </div>
          </details>
        )}

        {/* Prompt seed (se presente) */}
        {room_state.prompt_seed && (
          <div className="text-xs p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded flex items-start gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-amber-800 dark:text-amber-200 line-clamp-2">{room_state.prompt_seed}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
