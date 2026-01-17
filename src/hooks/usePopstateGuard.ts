import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSuperUser } from '@/utils/profileManager';
import { getOneTimeSession, isOneTimeSessionActive } from '@/utils/oneTimeTokenManager';
import { toast } from '@/hooks/use-toast';

/**
 * Rotte che richiedono ruolo SUPERUSER
 */
const SUPERUSER_ONLY_ROUTES = [
  '/superuser',
  '/superuser-users',
  '/superuser-settings',
  '/superuser-password-change',
  '/superuser-payment-settings',
  '/superuser-nsu-management',
  '/superuser-daily-stories',
  '/superuser-story-type-selection',
  '/superuser-archive',
  '/superuser-am-archive',
  '/superuser-reading-stories-management',
  '/superuser-reading-stories-view',
  '/superuser-science-stories-management',
  '/superuser-greek-myths-management',
  '/superuser-nordic-myths-management',
  '/superuser-explorers-management',
  '/superuser-user-story-viewer',
  '/ct-management',
  '/group-story'
];

/**
 * Rotte bloccate in OT mode
 */
const BLOCKED_ROUTES_IN_OT = [
  '/profiles',
  '/change-password',
  '/new-profile'
];

/**
 * Hook che intercetta il tasto Back/Forward del browser.
 * Blocca l'accesso a rotte protette quando l'utente non è autorizzato.
 */
export function usePopstateGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopstate = () => {
      const currentPath = window.location.pathname;
      const isSU = isSuperUser();
      const otSession = getOneTimeSession();
      const isOT = otSession && isOneTimeSessionActive();
      
      // Check se è una rotta superuser
      const isSuperuserRoute = SUPERUSER_ONLY_ROUTES.some(route => 
        currentPath === route || currentPath.startsWith(route + '/')
      );

      // Se NSU tenta di tornare su rotta superuser
      if (isSuperuserRoute && !isSU) {
        console.log('🚫 Popstate guard: blocking NSU access to', currentPath);
        
        // Redirect immediato
        navigate('/', { replace: true });
        window.history.replaceState(null, '', '/');
        
        toast({
          title: "Accesso negato",
          description: "Non puoi tornare a questa pagina",
          variant: "destructive"
        });
        return;
      }

      // Se OT tenta di tornare su rotta bloccata
      if (isOT) {
        const isBlockedForOT = [...BLOCKED_ROUTES_IN_OT, ...SUPERUSER_ONLY_ROUTES].some(route =>
          currentPath === route || currentPath.startsWith(route + '/')
        );
        
        if (isBlockedForOT) {
          console.log('🚫 Popstate guard: blocking OT access to', currentPath);
          navigate('/dashboard', { replace: true });
          window.history.replaceState(null, '', '/dashboard');
          
          toast({
            title: "Accesso non consentito",
            description: "Non puoi tornare a questa pagina",
            variant: "destructive"
          });
        }
      }
    };

    window.addEventListener('popstate', handlePopstate);
    
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [navigate]);
}

export default usePopstateGuard;