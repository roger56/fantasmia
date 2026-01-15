import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertTriangle, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { claimOneTimeToken } from '@/utils/oneTimeTokenManager';
import { AuthBridge } from '@/utils/authBridge';

type ClaimState = 'loading' | 'success' | 'error_missing' | 'error_expired' | 'error_invalid' | 'error_network';

const OneTimeAccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ClaimState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    const claim = async () => {
      if (!token) {
        setState('error_missing');
        setErrorMessage('Token mancante o link non valido');
        return;
      }

      const result = await claimOneTimeToken(token);

      if (result.success && result.session) {
        // Crea sessione locale per compatibilita app
        AuthBridge.createLocalSupabaseSession({
          id: result.session.profileId,
          name: result.session.username,
          password: '', // Nessuna password per one-time
          age: 10
        });

        setState('success');
        
        // Rimuovi token da URL (sicurezza: non deve restare in cronologia)
        window.history.replaceState({}, '', '/');
        
        // Redirect a dashboard dopo breve delay
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        // Mappa errori a stati UI
        switch (result.errorCode) {
          case 'TOKEN_MISSING':
            setState('error_missing');
            break;
          case 'TOKEN_EXPIRED':
            setState('error_expired');
            break;
          case 'TOKEN_INVALID':
            setState('error_invalid');
            break;
          default:
            setState('error_network');
        }
        setErrorMessage(result.error || 'Errore sconosciuto');
      }
    };

    claim();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {state === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-purple-600 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-purple-900">Accesso in corso...</h2>
              <p className="text-purple-600 mt-2">Verifica del link in corso</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-xl font-semibold text-green-900">Accesso riuscito!</h2>
              <p className="text-green-600 mt-2">Reindirizzamento...</p>
            </>
          )}

          {state.startsWith('error') && (
            <>
              <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">
                {state === 'error_expired' ? 'Link scaduto' : 'Accesso non disponibile'}
              </h2>
              <p className="text-gray-600 mt-2">{errorMessage}</p>
              {state === 'error_expired' && (
                <p className="text-sm text-gray-500 mt-4">
                  Questo link di invito non è più valido. Richiedi un nuovo link.
                </p>
              )}
              <Button 
                className="mt-6" 
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Torna alla home
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OneTimeAccess;
