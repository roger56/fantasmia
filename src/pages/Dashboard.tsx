import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookOpen, Plus, Settings, BookText, Users, AlertTriangle, Clock } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';
import { getPendingApprovalCount, getInProgressCount } from '@/lib/groupStoryManager';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [pendingCTCount, setPendingCTCount] = useState(0);
  const [inProgressCTCount, setInProgressCTCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      
      setIsAuthenticated(true);
      const isSU = authStatus.userName === 'superuser' || authStatus.userName === 'Superuser';
      setIsSuperuser(isSU);
      
      // Load CT stats for superuser
      if (isSU) {
        try {
          const pending = await getPendingApprovalCount();
          const inProgress = await getInProgressCount();
          setPendingCTCount(pending);
          setInProgressCTCount(inProgress);
        } catch (error) {
          console.error('Error loading CT stats:', error);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const dashboardOptions = [
    {
      id: 'create-story',
      title: 'Crea la tua storia',
      icon: Plus,
      description: 'Inizia a creare una nuova storia interattiva',
      path: '/create-story'
    },
    {
      id: 'reading-stories',
      title: 'LETTURA STORIE DEL MONDO',
      icon: BookText,
      description: 'quante cose si dicono e si scoprono nel mondo',
      path: '/story-type-selection'
    },
    {
      id: 'archive-complete',
      title: 'ARCHIVIO',
      icon: BookOpen,
      description: isSuperuser ? 'Visualizza tutte le storie create dagli utenti' : 'Visualizza tutte le tue storie',
      path: isSuperuser ? '/superuser-archive' : '/user-archive'
    }
  ];

  // Add the "strange fact" option for non-superusers
  if (!isSuperuser) {
    dashboardOptions.splice(1, 0, {
      id: 'strange-fact',
      title: 'Crea la storia di un fatto strano che ti è capitato',
      icon: Plus,
      description: 'Racconta un fatto reale in modo semplice e coinvolgente',
      path: '/create-story?mode=strange-fact'
    });
  }

  // Add superuser management option for superuser
  if (isSuperuser) {
    dashboardOptions.push({
      id: 'superuser-management',
      title: 'Gestione Sistema',
      icon: Settings,
      description: 'Accedi alle funzionalità di amministrazione',
      path: '/superuser'
    });
  }

  return (
    <StoryLayout
      title="Fantas-Mia V2"
      subtitle="Dashboard unificata - AM/AG"
      onBack={() => navigate('/profiles')}
      showHomeButton={true}
      backgroundColor="bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50"
    >
      {/* Dashboard V2 - Archivi Separati */}
      <div className="space-y-8">
        
        {/* CT Notification Banners for Superuser */}
        {isSuperuser && (pendingCTCount > 0 || inProgressCTCount > 0) && (
          <div className="space-y-3">
            {pendingCTCount > 0 && (
              <Alert className="bg-amber-50 border-amber-300 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => navigate('/ct-management')}>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-800">Storie CT in attesa di approvazione</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Hai <strong>{pendingCTCount}</strong> storia/e "Continua Tu..." da approvare prima della pubblicazione.
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-3 border-amber-400 text-amber-700 hover:bg-amber-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/ct-management');
                    }}
                  >
                    Gestisci approvazioni
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {inProgressCTCount > 0 && (
              <Alert className="bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => navigate('/ct-management')}>
                <Clock className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-800">Storie CT in corso</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Ci sono <strong>{inProgressCTCount}</strong> storia/e "Continua Tu..." in fase di scrittura collaborativa.
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-3 border-blue-400 text-blue-700 hover:bg-blue-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/ct-management');
                    }}
                  >
                    Visualizza dettagli
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {/* Sezione Creazione Storie */}
        <section className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Creazione Storie
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Story Creation */}
            <Card 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20" 
              onClick={() => navigate('/create-story')}
            >
              <CardContent className="p-4 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                  Crea la tua storia
                </h3>
                <p className="text-slate-600 text-sm">
                  Inizia a creare una nuova storia interattiva (7 modalità disponibili)
                </p>
              </CardContent>
            </Card>

            {/* Group Story Creation */}
            <Card 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50" 
              onClick={() => navigate('/group-story')}
            >
              <CardContent className="p-4 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className="text-yellow-500">⭐</span>
                  ))}
                </div>
                <h3 className="text-lg font-semibold text-violet-800 mb-1">
                  Storia di Gruppo
                </h3>
                <p className="text-violet-600 text-sm">
                  Scrivi una storia insieme agli altri utenti - Modalità collaborativa
                </p>
                {isSuperuser && (
                  <p className="text-violet-500 text-xs mt-2 italic">
                    Anche tu puoi partecipare come contributore!
                  </p>
                )}
              </CardContent>
            </Card>

          </div>
        </section>

        {/* Sezione Archivi AM/AG */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* AM - Archivio Magico */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
            <h2 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              AM - Archivio Magico
            </h2>
            <p className="text-purple-600 text-sm mb-4">Le tue storie personali</p>
            <Card 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-purple-300" 
              onClick={() => navigate('/user-archive')}
            >
              <CardContent className="p-4 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-purple-800 mb-1">
                  ARCHIVIO PERSONALE
                </h3>
                <p className="text-purple-600 text-xs">
                  {isSuperuser ? 'Visualizza archivio utenti' : 'Visualizza le tue storie create'}
                </p>
              </CardContent>
            </Card>
            
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/debug-indexeddb')}
                >
                  🔍 Debug IndexedDB
                </Button>
              </div>
            )}
          </div>

          {/* AG - Archivio Generale */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <BookText className="w-5 h-5" />
              AG - Archivio Generale
            </h2>
            <p className="text-blue-600 text-sm mb-4">Storie condivise dal mondo</p>
            <Card 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-300" 
              onClick={() => navigate('/story-type-selection')}
            >
              <CardContent className="p-4 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookText className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-blue-800 mb-1">
                  LETTURA STORIE DEL MONDO
                </h3>
                <p className="text-blue-600 text-xs">
                  Scopri storie e contenuti condivisi
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Gestione Sistema (Solo Superuser) */}
        {isSuperuser && (
          <section className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gestione Sistema
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300" 
                onClick={() => navigate('/superuser')}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <Settings className="w-6 h-6 text-slate-700" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    Gestione Sistema
                  </h3>
                  <p className="text-slate-600 text-xs">
                    Accedi alle funzionalità di amministrazione
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50" 
                onClick={() => navigate('/ct-management')}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-violet-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-violet-800 mb-1">
                    Gestione Storie CT
                  </h3>
                  <p className="text-violet-600 text-xs">
                    Approva e gestisci le storie collaborative
                  </p>
                  {pendingCTCount > 0 && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {pendingCTCount} in attesa
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </div>
    </StoryLayout>
  );
};

export default Dashboard;
