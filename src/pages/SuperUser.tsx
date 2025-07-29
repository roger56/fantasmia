import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Shield, Users, BookOpen, Settings, MessageSquare } from 'lucide-react';
import { getUsers, sendMessage } from '@/utils/userStorage';
import { sanitizeInput, rateLimiter } from '@/utils/authSecurity';
import { useToast } from '@/hooks/use-toast';
import HomeButton from '@/components/HomeButton';

const SuperUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showMessaging, setShowMessaging] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Check if already authenticated with secure session
  useEffect(() => {
    const authToken = localStorage.getItem('superuser-session');
    const authExpiry = localStorage.getItem('superuser-session-expiry');
    
    if (authToken && authExpiry && Date.now() < parseInt(authExpiry)) {
      setIsAuthenticated(true);
    } else {
      // Clear expired session
      localStorage.removeItem('superuser-session');
      localStorage.removeItem('superuser-session-expiry');
      localStorage.removeItem('fantasmia_superuser_authenticated'); // Clean old session
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setUsers(getUsers());
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (!password.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci la password",
        variant: "destructive",
      });
      return;
    }

    // Check rate limiting
    if (rateLimiter.isBlocked('superuser')) {
      toast({
        title: "Account Bloccato",
        description: "Troppi tentativi falliti. Riprova tra 15 minuti.",
        variant: "destructive",
      });
      return;
    }

    // Secure password check (TODO: Replace with proper Supabase authentication)
    const isValidPassword = password === "ssss";
    
    if (isValidPassword) {
      // Generate secure session
      const sessionToken = crypto.getRandomValues(new Uint8Array(32));
      const sessionString = Array.from(sessionToken, byte => byte.toString(16).padStart(2, '0')).join('');
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      localStorage.setItem('superuser-session', sessionString);
      localStorage.setItem('superuser-session-expiry', expiryTime.toString());
      
      setIsAuthenticated(true);
      rateLimiter.recordAttempt('superuser', true);
      toast({
        title: "Accesso Effettuato",
        description: "Benvenuto nel pannello amministratore",
      });
    } else {
      rateLimiter.recordAttempt('superuser', false);
      const remainingAttempts = rateLimiter.getRemainingAttempts('superuser');
      
      toast({
        title: "Errore",
        description: `Password non corretta. Tentativi rimasti: ${remainingAttempts}`,
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = (isBroadcast: boolean = false) => {
    const sanitizedMessage = sanitizeInput(messageContent);
    
    if (!sanitizedMessage.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un messaggio valido",
        variant: "destructive",
      });
      return;
    }

    const targetUsers = isBroadcast ? users.map(u => u.id) : selectedUsers;
    
    if (!isBroadcast && targetUsers.length === 0) {
      toast({
        title: "Errore",
        description: "Seleziona almeno un utente",
        variant: "destructive",
      });
      return;
    }

    sendMessage('superuser', targetUsers, sanitizedMessage, isBroadcast);
    
    toast({
      title: "Messaggio Inviato",
      description: `Messaggio inviato ${isBroadcast ? 'a tutti gli utenti' : `a ${targetUsers.length} utente/i`}`,
    });
    
    setMessageContent('');
    setSelectedUsers([]);
    setShowMessaging(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const dashboardOptions = [
    {
      title: 'Gestione Utenti',
      description: 'Visualizza e gestisci tutti gli utenti',
      icon: Users,
      action: () => navigate('/superuser-users')
    },
    {
      title: 'Archivio Completo',
      description: 'Tutte le storie con categorie e autori',
      icon: BookOpen,
      action: () => navigate('/superuser-archive')
    },
    {
      title: 'Invia Messaggi',
      description: 'Invia messaggi agli utenti',
      icon: MessageSquare,
      action: () => setShowMessaging(true)
    },
    {
      title: 'Impostazioni',
      description: 'Configurazioni di sistema',
      icon: Settings,
      action: () => navigate('/superuser/settings')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <HomeButton />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Superuser</h1>
        </div>

        {!isAuthenticated ? (
          /* Login Form */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Accesso Amministratore
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password Amministratore
                </label>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button 
                onClick={handleLogin}
                disabled={!password.trim()}
                className="w-full"
              >
                Accedi
              </Button>
            </CardContent>
          </Card>
        ) : showMessaging ? (
          /* Messaging Interface */
          <Card>
            <CardHeader>
              <CardTitle>Invia Messaggi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seleziona Utenti
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded"
                      />
                      <span>{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Messaggio
                </label>
                <Input
                  type="text"
                  placeholder="Scrivi il messaggio..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowMessaging(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button 
                  onClick={() => handleSendMessage(true)}
                  variant="secondary"
                  className="flex-1"
                >
                  Invia a Tutti
                </Button>
                <Button 
                  onClick={() => handleSendMessage(false)}
                  className="flex-1"
                >
                  Invia Selezionati
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Dashboard */
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  Dashboard Amministratore
                </h2>
                <p className="text-slate-600">
                  Benvenuto nel pannello di controllo di Fantasmia
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {dashboardOptions.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-slate-300"
                    onClick={option.action}
                  >
                    <CardContent className="p-6 flex items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                        <IconComponent className="w-6 h-6 text-slate-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-800">{option.title}</h3>
                        <p className="text-slate-600 text-sm">{option.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperUser;
