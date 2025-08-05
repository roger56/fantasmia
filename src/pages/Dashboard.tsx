import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Settings } from 'lucide-react';
import { AuthBridge } from '@/utils/authBridge';
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
        navigate('/home');
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
      id: 'archive-complete',
      title: 'Archivio Globale',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 px-[12px] py-[12px]">
      <ProfileIndicator />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8 py-[12px]">
          <h1 className="text-4xl font-bold mb-2 text-red-500">FANTAS(m)IA</h1>
          <p className="text-lg text-sky-600">Dashboard Principale</p>
        </div>

        {/* Back to Profiles Button */}
        <div className="mb-6 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/profiles')}
            className="mb-4"
          >
            Cambia Profilo
          </Button>
        </div>

        {/* Dashboard Options Grid */}
        <div className="grid grid-cols-1 gap-6 max-w-lg mx-auto">
          {dashboardOptions.map(option => {
            const IconComponent = option.icon;
            return (
              <Card 
                key={option.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300" 
                onClick={() => navigate(option.path)}
              >
                <CardContent className="p-8 text-center py-[18px] px-[18px]">
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-slate-700" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {option.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;