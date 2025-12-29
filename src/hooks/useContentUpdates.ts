import { useState, useEffect, useCallback } from 'react';
import { 
  checkContentUpdates, 
  ContentUpdate, 
  ContentUpdateResult 
} from '@/utils/contentUpdateManager';
import { AuthBridge } from '@/utils/authBridge';

interface UseContentUpdatesResult {
  showUpdateOverlay: boolean;
  updates: ContentUpdate[];
  isChecking: boolean;
  dismissOverlay: () => void;
}

/**
 * Hook per gestire il check degli aggiornamenti dei contenuti
 * Mostra overlay solo per NSU (non per SU)
 */
export const useContentUpdates = (): UseContentUpdatesResult => {
  const [showUpdateOverlay, setShowUpdateOverlay] = useState(false);
  const [updates, setUpdates] = useState<ContentUpdate[]>([]);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const performCheck = async () => {
      try {
        console.log('useContentUpdates: Starting content check...');
        
        // Verifica se SU - non mostrare overlay per SU
        const authStatus = await AuthBridge.isAuthenticated();
        const isSU = authStatus.userName === 'superuser' || authStatus.userName === 'Superuser';
        
        if (isSU) {
          console.log('useContentUpdates: SU detected, skipping update overlay');
          setIsChecking(false);
          return;
        }
        
        // Check aggiornamenti
        const result: ContentUpdateResult = await checkContentUpdates();
        
        if (result.hasUpdates) {
          console.log('useContentUpdates: Updates available:', result.updates);
          setUpdates(result.updates);
          setShowUpdateOverlay(true);
        } else {
          console.log('useContentUpdates: No updates available');
        }
      } catch (error) {
        console.error('useContentUpdates: Error checking updates:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Esegui check con piccolo delay per non bloccare il rendering iniziale
    const timeoutId = setTimeout(performCheck, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const dismissOverlay = useCallback(() => {
    // NON salvare le versioni - l'overlay ricomparirà al prossimo avvio
    setShowUpdateOverlay(false);
  }, []);

  return {
    showUpdateOverlay,
    updates,
    isChecking,
    dismissOverlay
  };
};
