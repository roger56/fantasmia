import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOneTimeSession, isOneTimeSessionActive } from '@/utils/oneTimeTokenManager';
import { isSuperUser } from '@/utils/profileManager';
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
  '/new-profile',
  ...SUPERUSER_ONLY_ROUTES
];

interface ProtectedRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Guard unificato per:
 * 1. Bloccare accesso OT a rotte proibite
 * 2. Bloccare accesso NSU a rotte superuser
 * 
 * CRITICO: Mostra solo spinner durante il check per non rivelare mai UI protette
 */
export function ProtectedRouteGuard({ children }: ProtectedRouteGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = () => {
      const otSession = getOneTimeSession();
      const isOT = otSession && isOneTimeSessionActive();
      const isSU = isSuperUser();
      
      // 1. Controllo OT mode
      if (isOT) {
        const isBlockedForOT = BLOCKED_ROUTES_IN_OT.some(route => 
          location.pathname === route || location.pathname.startsWith(route + '/')
        );
        
        if (isBlockedForOT) {
          console.log('🛡️ ProtectedRouteGuard: OT user blocked from', location.pathname);
          toast({
            title: "Accesso non consentito",
            description: "Questa sezione non è disponibile in accesso temporaneo",
            variant: "destructive"
          });
          navigate('/dashboard', { replace: true });
          window.history.replaceState(null, '', '/dashboard');
          return false;
        }
      }
      
      // 2. Controllo rotte SUPERUSER (solo se non OT, perché OT già bloccato sopra)
      const isSuperuserRoute = SUPERUSER_ONLY_ROUTES.some(route => 
        location.pathname === route || location.pathname.startsWith(route + '/')
      );
      
      if (isSuperuserRoute && !isSU) {
        console.log('🛡️ ProtectedRouteGuard: NSU trying to access superuser route', location.pathname);
        toast({
          title: "Accesso negato",
          description: "Non hai i permessi per accedere a questa sezione",
          variant: "destructive"
        });
        navigate('/', { replace: true });
        // Pulisci anche la history per evitare back
        window.history.replaceState(null, '', '/');
        return false;
      }
      
      return true;
    };

    const authorized = checkAuthorization();
    setIsAuthorized(authorized);
    setIsChecking(false);
  }, [location.pathname, navigate]);

  // Mostra spinner durante il check (CRITICO: non mostrare mai la UI protetta)
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Non renderizzare nulla se non autorizzato
  }

  return <>{children}</>;
}

export default ProtectedRouteGuard;