import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, Clock, LogOut, Pencil, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  getRoomSession, 
  isRoomSessionActive, 
  getRoomRemainingTimeMs,
  getTurnRemainingTimeMs,
  isTurnActive,
  clearRoomSession,
  refreshRoomState,
  getPollingInterval
} from '@/utils/roomSessionManager';

const RoomBanner: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(getRoomSession());
  const [roomCountdown, setRoomCountdown] = useState('');
  const [turnCountdown, setTurnCountdown] = useState('');
  const [turnIsActive, setTurnIsActive] = useState(false);

  // Polling per sincronizzazione stato stanza
  useEffect(() => {
    if (!session) return;

    const pollState = async () => {
      const currentSession = getRoomSession();
      if (!currentSession) {
        setSession(null);
        return;
      }

      // Verifica scadenza stanza
      if (currentSession.expires_at <= Date.now()) {
        clearRoomSession();
        setSession(null);
        navigate('/', { replace: true });
        return;
      }

      // Refresh stato da API
      const newState = await refreshRoomState(currentSession);
      if (newState) {
        setSession({ ...currentSession, roomState: newState });
      }
    };

    // Polling ogni 3 secondi
    const interval = setInterval(pollState, getPollingInterval());
    
    return () => clearInterval(interval);
  }, [session?.room, navigate]);

  // Aggiornamento countdown ogni secondo
  useEffect(() => {
    const updateCountdowns = () => {
      const currentSession = getRoomSession();
      if (!currentSession) {
        setSession(null);
        return;
      }

      // Countdown scadenza stanza
      const roomMs = getRoomRemainingTimeMs();
      if (roomMs <= 0) {
        clearRoomSession();
        setSession(null);
        navigate('/', { replace: true });
        return;
      }

      const roomMinutes = Math.floor(roomMs / 1000 / 60);
      const roomHours = Math.floor(roomMinutes / 60);
      const roomMinsOnly = roomMinutes % 60;
      
      if (roomHours > 0) {
        setRoomCountdown(`${roomHours}h ${roomMinsOnly}m`);
      } else {
        setRoomCountdown(`${roomMinutes} min`);
      }

      // Countdown turno
      const turnMs = getTurnRemainingTimeMs();
      const turnActive = isTurnActive();
      setTurnIsActive(turnActive);
      
      if (turnActive && turnMs > 0) {
        const turnSeconds = Math.ceil(turnMs / 1000);
        const turnMins = Math.floor(turnSeconds / 60);
        const turnSecs = turnSeconds % 60;
        setTurnCountdown(`${turnMins}:${turnSecs.toString().padStart(2, '0')}`);
      } else {
        setTurnCountdown('');
      }

      // Sincronizza sessione locale
      setSession(currentSession);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const handleExit = () => {
    clearRoomSession();
    setSession(null);
    navigate('/', { replace: true });
  };

  // Non mostrare se non c'è sessione attiva
  if (!session || !isRoomSessionActive()) {
    return null;
  }

  const isNSU = session.roleFromClaim === 'NSU_SESSION';
  const canEdit = !isNSU || turnIsActive;
  const isUrgent = getRoomRemainingTimeMs() <= 15 * 60 * 1000; // Meno di 15 minuti

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg z-[9998]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Info stanza */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4" />
              <span className="font-semibold text-sm">
                STANZA: {session.room_name}
              </span>
            </div>
            
            <span className="opacity-50">|</span>
            
            <div className="flex items-center gap-1.5">
              {isUrgent ? (
                <AlertCircle className="w-4 h-4 text-amber-300" />
              ) : (
                <Clock className="w-4 h-4 opacity-70" />
              )}
              <span className={`text-sm ${isUrgent ? 'text-amber-300 font-medium' : 'opacity-90'}`}>
                Scade: {roomCountdown}
              </span>
            </div>

            {/* Badge ruolo */}
            <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
              {session.roleFromClaim === 'SU' ? 'Moderatore' : 'Partecipante'}
            </span>
          </div>

          {/* Stato turno (se NSU) */}
          {isNSU && (
            <div className="flex items-center gap-2">
              {turnIsActive ? (
                <div className="flex items-center gap-2 bg-green-500/30 px-3 py-1 rounded-full">
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">
                    Turno attivo: {turnCountdown}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-500/30 px-3 py-1 rounded-full">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-sm">
                    In attesa del turno
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pulsante Esci */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="text-white hover:bg-white/20 gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Esci</span>
          </Button>
        </div>

        {/* Spunto comune (se presente) */}
        {session.roomState.promptSeed && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <p className="text-sm opacity-90">
              <span className="font-medium">Spunto comune:</span>{' '}
              <span className="italic">"{session.roomState.promptSeed}"</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomBanner;
