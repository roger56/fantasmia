import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSuperUser } from '@/utils/profileManager';
import { toast } from '@/hooks/use-toast';

/**
 * Hook che verifica l'autorizzazione superuser.
 * Usare in tutte le pagine /superuser* per bloccare l'accesso NSU.
 * 
 * @returns { isChecking, isAuthorized } - Stati per gestire rendering condizionale
 * 
 * Esempio:
 * const { isChecking, isAuthorized } = useSuperuserGuard();
 * if (isChecking || !isAuthorized) {
 *   return <LoadingSpinner />;
 * }
 */
export function useSuperuserGuard() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      const isSU = isSuperUser();
      
      if (!isSU) {
        console.log('🚫 useSuperuserGuard: access denied for non-superuser');
        toast({
          title: "Accesso negato",
          description: "Devi essere Superuser per accedere a questa sezione",
          variant: "destructive"
        });
        navigate('/', { replace: true });
        window.history.replaceState(null, '', '/');
        return;
      }
      
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAccess();
  }, [navigate]);

  return { isChecking, isAuthorized };
}

export default useSuperuserGuard;