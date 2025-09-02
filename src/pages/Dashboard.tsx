import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Settings, BookText } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
import StoryLayout from '@/components/shared/StoryLayout';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthBridge.isAuthenticated();
      if (!authStatus.authenticated) {
        navigate('/');
        return;
      }
      
      setIsAuthenticated(true);
      setIsSuperuser(authStatus.userName === 'superuser');
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
      path: '/reading-story-type-selection'
    },
    {
      id: 'archive-complete',
      title: 'ARCHIVIO',
      icon: BookOpen,
      description: 'Visualizza tutte le storie create dagli utenti',
      path: '/superuser-archive'
    }
  ];

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
    <>
      <ProfileIndicator />
      <StoryLayout
      title="FANTAS(m)IA"
      subtitle="Dashboard Principale"
      onBack={() => navigate('/profiles')}
      showHomeButton={true}
    >
      {/* Dashboard Options Grid */}
      <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
        {dashboardOptions.map(option => {
          const IconComponent = option.icon;
          return (
            <Card 
              key={option.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300" 
              onClick={() => navigate(option.path)}
            >
              <CardContent className="p-4 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-slate-700" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                  {option.title}
                </h3>
                <p className="text-slate-600 text-xs">
                  {option.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </StoryLayout>
    </>
  );
};

export default Dashboard;