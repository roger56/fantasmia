import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { 
  getOneTimeSession, 
  isOneTimeSessionActive, 
  getRemainingTimeMs,
  clearOneTimeSession 
} from '@/utils/oneTimeTokenManager';

export function useOneTimeSessionCheck() {
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSessionExpiry = useCallback(async () => {
    console.log('⏰ One-time session expired');
    
    // Mostra toast
    toast({
      title: "Sessione scaduta",
      description: "Questa sessione temporanea è terminata. Serve un nuovo link.",
      variant: "destructive",
      duration: 5000
    });

    // Pulisci sessione e dati
    await clearOneTimeSession();

    // Redirect a home
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const session = getOneTimeSession();
    
    // Se non c'è sessione one-time, non fare nulla
    if (!session) return;

    // Controllo iniziale
    if (!isOneTimeSessionActive()) {
      handleSessionExpiry();
      return;
    }

    // Imposta timeout preciso per scadenza
    const remainingMs = getRemainingTimeMs();
    console.log(`⏱️ One-time session expires in ${Math.round(remainingMs / 1000 / 60)} minutes`);

    timeoutRef.current = setTimeout(handleSessionExpiry, remainingMs);

    // Controllo periodico ogni 60 secondi (backup)
    intervalRef.current = setInterval(() => {
      if (!isOneTimeSessionActive()) {
        handleSessionExpiry();
      }
    }, 60000);

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleSessionExpiry]);

  return { 
    isOneTimeSession: !!getOneTimeSession(),
    session: getOneTimeSession(),
    remainingMs: getRemainingTimeMs()
  };
}
