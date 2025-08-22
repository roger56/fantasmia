import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wand2, Microscope } from 'lucide-react';
import HomeButton from '@/components/HomeButton';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const SuperuserStoryManagementSelection = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated as superuser
    const authToken = localStorage.getItem('superuser-session');
    const authExpiry = localStorage.getItem('superuser-session-expiry');
    
    if (authToken && authExpiry && Date.now() < parseInt(authExpiry)) {
      setIsAuthenticated(true);
    } else {
      navigate('/superuser');
    }
  }, [navigate]);

  const storyTypes = [
    {
      id: 'magic',
      title: 'Storie Magiche',
      subtitle: 'racconti fantastici',
      icon: Wand2,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      path: '/superuser-reading-stories-view'
    },
    {
      id: 'science',
      title: 'Magia della Scienza',
      subtitle: 'brevi storielle che spiegano fenomeni naturali',
      icon: Microscope,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      path: '/superuser-science-stories-view'
    }
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <ProfileIndicator />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <HomeButton />
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6 pt-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/superuser')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">📖 Gestione Storie da Leggere</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Scegli il tipo di storie da gestire
            </h2>
            <p className="text-slate-600">
              Seleziona il tipo di storie che vuoi visualizzare e gestire
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storyTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-all duration-200 border-2 hover:border-slate-300 hover:shadow-lg ${type.bgColor} ${type.hoverColor}`}
                  onClick={() => navigate(type.path)}
                >
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 ${type.bgColor} rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
                      <IconComponent className={`w-8 h-8 ${type.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{type.title}</h3>
                    <p className="text-slate-600 text-sm italic">{type.subtitle}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperuserStoryManagementSelection;