import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, School, Sparkles, Loader2, Lock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';
import { useSuperuserGuard } from '@/hooks/useSuperuserGuard';
import { listRooms, type RoomListItem } from '@/utils/roomSessionManager';
import { getAdminToken, adminLogin, adminCheck } from '@/lib/adminAuth';
import { RoomCard } from '@/components/classroom/RoomCard';

// API Endpoint
const ROOMS_API_URL = 'https://fantasmia-ai.vercel.app/api/admin/rooms';

function getAdminJwt(): string | null {
  return getAdminToken();
}

const SuperuserClassroom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isChecking, isAuthorized } = useSuperuserGuard();

  // API Authentication state
  const [isApiAuthenticated, setIsApiAuthenticated] = useState<boolean | null>(null);
  const [apiPassword, setApiPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Room creation form
  const [roomName, setRoomName] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [turnDuration, setTurnDuration] = useState(180); // 3 min default (in secondi)
  const [promptSeed, setPromptSeed] = useState('');
  const [ttlHours, setTtlHours] = useState(4); // 4 ore default
  const [isCreating, setIsCreating] = useState(false);
  
  // Dashboard state - MULTI-ROOM
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Verifica se esiste già un JWT valido all'avvio
  useEffect(() => {
    const checkApiAuth = async () => {
      const token = getAdminToken();
      if (token) {
        const isValid = await adminCheck();
        setIsApiAuthenticated(isValid);
      } else {
        setIsApiAuthenticated(false);
      }
    };
    
    if (isAuthorized) {
      checkApiAuth();
    }
  }, [isAuthorized]);

  // Handler per autenticazione API
  const handleApiLogin = async () => {
    if (!apiPassword.trim()) {
      toast({ title: 'Inserisci la password API', variant: 'destructive' });
      return;
    }

    setIsAuthenticating(true);
    try {
      await adminLogin(apiPassword);
      setIsApiAuthenticated(true);
      setApiPassword('');
      toast({ title: 'Autenticazione completata!' });
    } catch (error) {
      toast({ 
        title: 'Errore autenticazione', 
        description: error instanceof Error ? error.message : 'Password non valida',
        variant: 'destructive' 
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Fetch rooms list
  const fetchRooms = useCallback(async () => {
    const adminJwt = getAdminJwt();
    if (!adminJwt) return;

    try {
      const result = await listRooms(adminJwt);
      if (result.success && result.rooms) {
        setRooms(result.rooms);
        setLastRefresh(new Date());
      } else if (result.error?.includes('scaduta')) {
        setIsApiAuthenticated(false);
        toast({ title: 'Sessione scaduta, rifai login', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, [toast]);

  // Polling rooms every 3 seconds
  useEffect(() => {
    if (!isApiAuthenticated) return;

    // Fetch iniziale
    setIsLoadingRooms(true);
    fetchRooms().finally(() => setIsLoadingRooms(false));

    // Polling ogni 3 secondi
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, [isApiAuthenticated, fetchRooms]);

  // CREATE ROOM - API call action="create"
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({ title: 'Inserisci un nome per la stanza', variant: 'destructive' });
      return;
    }

    const adminJwt = getAdminJwt();
    if (!adminJwt) {
      toast({ title: 'Sessione scaduta, effettua nuovamente il login', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(ROOMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminJwt}`
        },
        body: JSON.stringify({
          action: 'create',
          room_name: roomName.trim(),
          activity_title: activityTitle.trim() || roomName.trim(),
          room_mode: 'CONTINUA_TU',
          turn_s: turnDuration,
          ttl_h: ttlHours,
          prompt_seed: promptSeed.trim() || undefined
        })
      });

      if (response.status === 401) {
        setIsApiAuthenticated(false);
        toast({ title: 'Sessione scaduta, rifai login', variant: 'destructive' });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Errore ${response.status}`);
      }

      const data = await response.json();
      
      // Reset form
      setRoomName('');
      setActivityTitle('');
      setPromptSeed('');
      
      toast({ 
        title: 'Stanza creata!', 
        description: `Room: ${data.room} - Il polling aggiornerà la lista`
      });

      // Forza refresh immediato
      fetchRooms();

    } catch (error) {
      console.error('Create room error:', error);
      toast({ 
        title: 'Errore nella creazione', 
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
        variant: 'destructive' 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSessionExpired = () => {
    setIsApiAuthenticated(false);
    toast({ title: 'Sessione scaduta, rifai login', variant: 'destructive' });
  };

  // Security check
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // API Authentication check
  if (isApiAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isApiAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <HomeButton />
        <div className="max-w-md mx-auto pt-20">
          <Card className="border-2 border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                Autenticazione API richiesta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Per gestire le Classroom è necessario autenticarsi con la password API.
              </p>
              <div>
                <Label htmlFor="apiPassword">Password API</Label>
                <Input
                  id="apiPassword"
                  type="password"
                  placeholder="Inserisci password API..."
                  value={apiPassword}
                  onChange={(e) => setApiPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleApiLogin()}
                  className="mt-1"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/superuser-settings')}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Indietro
                </Button>
                <Button 
                  onClick={handleApiLogin} 
                  disabled={isAuthenticating || !apiPassword.trim()}
                  className="flex-1"
                >
                  {isAuthenticating ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4 mr-1" />
                  )}
                  Autentica
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <HomeButton />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/superuser-settings')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <School className="w-6 h-6 text-primary" />
                Dashboard Classroom
              </h1>
              <p className="text-muted-foreground">
                Gestisci tutte le stanze attive • {rooms.length} stanze
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRooms}
              disabled={isLoadingRooms}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingRooms ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna sinistra: Form creazione */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-primary/20 sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <School className="w-5 h-5" />
                  Crea nuova stanza
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="roomName">Nome stanza *</Label>
                  <Input
                    id="roomName"
                    placeholder="Es: Classe 3B"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <Label htmlFor="activityTitle">Titolo attività</Label>
                  <Input
                    id="activityTitle"
                    placeholder="Es: Cosa succede se..."
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="turnDuration" className="text-xs">Turno (sec)</Label>
                    <Input
                      id="turnDuration"
                      type="number"
                      min={15}
                      max={600}
                      value={turnDuration}
                      onChange={(e) => setTurnDuration(Math.max(15, Math.min(600, parseInt(e.target.value) || 180)))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ttlHours" className="text-xs">Durata (ore)</Label>
                    <Input
                      id="ttlHours"
                      type="number"
                      min={1}
                      max={24}
                      value={ttlHours}
                      onChange={(e) => setTtlHours(Math.max(1, Math.min(24, parseInt(e.target.value) || 4)))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="promptSeed" className="flex items-center gap-1">
                    <span>Spunto</span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </Label>
                  <Textarea
                    id="promptSeed"
                    placeholder="Opzionale..."
                    value={promptSeed}
                    onChange={(e) => setPromptSeed(e.target.value.slice(0, 600))}
                    className="mt-1"
                    rows={2}
                    maxLength={600}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {promptSeed.length}/600
                  </p>
                </div>

                <Button 
                  onClick={handleCreateRoom} 
                  disabled={isCreating || !roomName.trim()}
                  className="w-full"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <School className="w-4 h-4 mr-2" />
                  )}
                  {isCreating ? 'Creazione...' : 'Crea Stanza'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Colonna destra: Lista stanze */}
          <div className="lg:col-span-2">
            {isLoadingRooms && rooms.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : rooms.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <School className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    Nessuna stanza attiva
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crea una nuova stanza per iniziare
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pr-4">
                  {rooms.map((roomData) => (
                    <RoomCard
                      key={roomData.room}
                      roomData={roomData}
                      adminJwt={getAdminJwt() || ''}
                      defaultTurnS={turnDuration}
                      onSessionExpired={handleSessionExpired}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperuserClassroom;
