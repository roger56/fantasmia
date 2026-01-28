import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { claimRoom, disableOTSessionIfRoomActive } from '@/utils/roomSessionManager';

const JoinRoom: React.FC = () => {
  const { room } = useParams<{ room: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!room || !token) {
      setStatus('error');
      setErrorMessage('Link non valido. Manca il codice stanza o il token.');
      return;
    }

    const doJoin = async () => {
      setStatus('loading');
      
      const result = await claimRoom(room, token);
      
      if (result.success && result.session) {
        // Disabilita eventuali sessioni OT attive
        disableOTSessionIfRoomActive();
        
        setRoomName(result.session.room_name);
        setStatus('success');
        
        // Redirect alla classroom dopo 1.5 secondi
        setTimeout(() => {
          navigate(`/classroom/${room}`, { replace: true });
        }, 1500);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Errore durante l\'accesso alla stanza.');
      }
    };

    doJoin();
  }, [room, searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-8 pb-8">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-emerald-900">
                Accesso alla stanza...
              </h2>
              <p className="text-emerald-600">
                Verifica delle credenziali in corso
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <DoorOpen className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-green-900">
                Benvenuto!
              </h2>
              <p className="text-green-700">
                Sei entrato nella stanza <strong>{roomName || room}</strong>
              </p>
              <p className="text-sm text-green-600">
                Reindirizzamento in corso...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-900">
                Accesso non riuscito
              </h2>
              <p className="text-red-700">
                {errorMessage}
              </p>
              <Button 
                onClick={() => navigate('/', { replace: true })}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                Torna alla Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinRoom;
