import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { getOneTimeSession, isOneTimeSessionActive } from '@/utils/oneTimeTokenManager';

/**
 * Hook centralizzato per gestire le restrizioni OT (One-Time) mode.
 * Blocca navigazione a /profiles e operazioni non permesse.
 */
export function useOTModeGuard() {
  const navigate = useNavigate();
  
  // Verifica se siamo in OT mode (sessione one-time attiva)
  const isOTMode = !!getOneTimeSession() && isOneTimeSessionActive();
  
  /**
   * Blocca un'azione se siamo in OT mode.
   * Mostra un toast e ritorna true se bloccato.
   */
  const blockIfOTMode = useCallback((action: string): boolean => {
    if (isOTMode) {
      toast({
        title: "Operazione non disponibile",
        description: `"${action}" non è disponibile in accesso temporaneo`,
        variant: "destructive"
      });
      return true; // blocked
    }
    return false;
  }, [isOTMode]);
  
  /**
   * Navigazione sicura "indietro" - in OT mode rimane in dashboard.
   */
  const safeNavigateBack = useCallback(() => {
    if (isOTMode) {
      // In OT mode, non permettere di tornare a /profiles
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/profiles');
    }
  }, [isOTMode, navigate]);
  
  /**
   * Navigazione sicura "home" - in OT mode rimane in dashboard.
   */
  const safeNavigateHome = useCallback(() => {
    if (isOTMode) {
      // In OT mode, non permettere di andare a /profiles
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/profiles');
    }
  }, [isOTMode, navigate]);
  
  return { 
    isOTMode, 
    blockIfOTMode, 
    safeNavigateBack, 
    safeNavigateHome 
  };
}
