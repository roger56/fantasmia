import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Atom } from 'lucide-react';
import HomeButton from '@/components/HomeButton';
import ProfileIndicator from '@/components/shared/ProfileIndicator';

const SuperuserStoryTypeSelection = () => {
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

  if (!isAuthenticated) {
    return null;
  }

  const storyTypes = [
    {
      id: 'science-magic',
      title: 'Magia della Scienza',
      icon: Atom,
      description: 'Gestisci storie che mescolano scienza e fantasia',
      path: '/superuser-reading-stories-view'
    },
    {
      id: 'magic-stories',
      title: 'Storie Magiche',
      icon: Sparkles,
      description: 'Gestisci racconti di pura magia e fantasia',
      path: '/reading-stories/science'
    }
  ];

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
            <h1 className="text-2xl font-bold text-slate-800">📚 Gestione Storie da Leggere</h1>
          </div>

          {/* Subtitle */}
          <div className="text-center mb-8">
            <h2 className="text-lg text-slate-600">Scegli il tipo di storia da gestire</h2>
          </div>

          {/* Story Type Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {storyTypes.map(storyType => {
              const IconComponent = storyType.icon;
              return (
                <Card 
                  key={storyType.id} 
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-slate-300" 
                  onClick={() => navigate(storyType.path)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <IconComponent className="w-8 h-8 text-slate-700" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      {storyType.title}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {storyType.description}
                    </p>
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

export default SuperuserStoryTypeSelection;