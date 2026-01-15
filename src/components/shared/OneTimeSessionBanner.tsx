import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { getRemainingTimeMs, getOneTimeSession } from '@/utils/oneTimeTokenManager';

const OneTimeSessionBanner = () => {
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [session, setSession] = useState(getOneTimeSession());

  useEffect(() => {
    // Initial check
    setSession(getOneTimeSession());

    const updateRemaining = () => {
      const currentSession = getOneTimeSession();
      setSession(currentSession);
      
      if (currentSession) {
        const ms = getRemainingTimeMs();
        setRemainingMinutes(Math.max(0, Math.ceil(ms / 1000 / 60)));
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 30000); // Aggiorna ogni 30s

    return () => clearInterval(interval);
  }, []);

  if (!session) return null;

  const isUrgent = remainingMinutes <= 15;
  const hoursRemaining = Math.floor(remainingMinutes / 60);
  const minutesOnly = remainingMinutes % 60;

  const timeDisplay = hoursRemaining > 0 
    ? `${hoursRemaining}h ${minutesOnly}m` 
    : `${remainingMinutes} min`;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-colors ${
      isUrgent 
        ? 'bg-red-500 text-white' 
        : 'bg-amber-400 text-amber-900'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {isUrgent ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        <span>
          Sessione temporanea — {timeDisplay} {remainingMinutes === 1 ? 'rimanente' : 'rimasti'}
        </span>
      </div>
    </div>
  );
};

export default OneTimeSessionBanner;
