import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOneTimeSession, isOneTimeSessionActive } from '@/utils/oneTimeTokenManager';
import { toast } from '@/hooks/use-toast';

/**
 * Rotte bloccate quando si è in OT (One-Time) mode.
 * L'utente OT non deve mai accedere a queste pagine.
 */
const BLOCKED_ROUTES_IN_OT = [
  '/profiles',
  '/change-password',
  '/new-profile',
  '/superuser',
  '/superuser-users',
  '/superuser-settings',
  '/superuser-password-change',
  '/superuser-nsu-management'
];

interface OTRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Componente wrapper che blocca l'accesso a rotte specifiche in OT mode.
 * Se l'utente tenta di accedere a una rotta bloccata, viene reindirizzato
 * a /dashboard con un messaggio toast.
 */
export function OTRouteGuard({ children }: OTRouteGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const otSession = getOneTimeSession();
    
    if (otSession && isOneTimeSessionActive()) {
      const isBlocked = BLOCKED_ROUTES_IN_OT.some(route => 
        location.pathname === route || location.pathname.startsWith(route + '/')
      );
      
      if (isBlocked) {
        console.log('🛡️ OTRouteGuard: blocking access to', location.pathname);
        
        toast({
          title: "Accesso non consentito",
          description: "Questa sezione non è disponibile in accesso temporaneo",
          variant: "destructive"
        });
        
        navigate('/dashboard', { replace: true });
      }
    }
  }, [location.pathname, navigate]);
  
  return <>{children}</>;
}

export default OTRouteGuard;
